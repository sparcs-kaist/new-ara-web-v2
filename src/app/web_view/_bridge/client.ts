/**
 * Bridge client. Lives on `window.AraBridge` after `installBridge()`.
 *
 * Usage:
 *   import { bridge } from '@/app/web_view/_bridge/client'
 *   bridge.send('exit')
 *   const { uri } = await bridge.request('pickImage', { source: 'gallery' })
 *   const off = bridge.on('back:pressed', () => router.back())
 *
 * In a browser (no Flutter host) every command is a no-op resolving with
 * `undefined` and `bridge.isNative` is `false`.
 */

import {
    CommandReq,
    CommandRes,
    CommandType,
    EventPayload,
    EventType,
    IncomingEnvelope,
    PROTOCOL_VERSION,
    RequestEnvelope,
} from './types';

type Listener<T extends EventType> = (payload: EventPayload<T>) => void;

interface FlutterChannelLike {
    postMessage: (msg: string) => void;
}

declare global {
    interface Window {
        FlutterChannel?: FlutterChannelLike;
        AraBridge?: AraBridge;
    }
}

const READY_TIMEOUT_MS = 800;

class AraBridge {
    private pending = new Map<
        string,
        { resolve: (v: unknown) => void; reject: (e: Error) => void; timeout: ReturnType<typeof setTimeout> }
    >();
    private listeners = new Map<EventType, Set<Listener<EventType>>>();
    private nextId = 0;
    private _isNative = false;
    private _capabilities: EventPayload<'bridge:ready'> | null = null;
    private _readyPromise: Promise<EventPayload<'bridge:ready'> | null>;

    constructor() {
        if (typeof window === 'undefined') {
            this._readyPromise = Promise.resolve(null);
            return;
        }

        window.addEventListener('flutter:message', this.handleIncoming as EventListener);

        this._readyPromise = new Promise((resolve) => {
            const off = this.on('bridge:ready', (cap) => {
                this._isNative = true;
                this._capabilities = cap;
                off();
                resolve(cap);
            });
            setTimeout(() => {
                if (!this._isNative) resolve(null);
            }, READY_TIMEOUT_MS);
        });
    }

    get isNative(): boolean {
        return this._isNative;
    }

    get capabilities(): EventPayload<'bridge:ready'> | null {
        return this._capabilities;
    }

    /** Resolves with capabilities once native says hello, or `null` after a timeout (browser mode). */
    ready(): Promise<EventPayload<'bridge:ready'> | null> {
        return this._readyPromise;
    }

    /** Fire-and-forget command. */
    send<T extends CommandType>(type: T, payload?: CommandReq<T>): void {
        this.post({ v: PROTOCOL_VERSION, type, payload } as RequestEnvelope<T>);
    }

    /** Request/response. Rejects with BridgeError on `:error` responses or timeout. */
    request<T extends CommandType>(type: T, payload?: CommandReq<T>, timeoutMs = 15000): Promise<CommandRes<T>> {
        if (!this.canPost()) {
            return Promise.reject(new Error(`bridge.${type}: not running inside native shell`));
        }
        const id = `req-${++this.nextId}`;
        return new Promise<CommandRes<T>>((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`bridge.${type}: timed out after ${timeoutMs}ms`));
            }, timeoutMs);
            this.pending.set(id, {
                resolve: resolve as (v: unknown) => void,
                reject,
                timeout,
            });
            this.post({ v: PROTOCOL_VERSION, id, type, payload } as RequestEnvelope<T>);
        });
    }

    /** Subscribe to a native event. Returns an `off()` function. */
    on<T extends EventType>(type: T, listener: Listener<T>): () => void {
        let set = this.listeners.get(type) as Set<Listener<T>> | undefined;
        if (!set) {
            set = new Set();
            this.listeners.set(type, set as unknown as Set<Listener<EventType>>);
        }
        set.add(listener);
        return () => set!.delete(listener);
    }

    private canPost(): boolean {
        return typeof window !== 'undefined' && typeof window.FlutterChannel?.postMessage === 'function';
    }

    private post(env: RequestEnvelope): void {
        if (!this.canPost()) return;
        try {
            window.FlutterChannel!.postMessage(JSON.stringify(env));
        } catch (e) {
            console.warn('[AraBridge] postMessage failed', e);
        }
    }

    private handleIncoming = (e: Event): void => {
        const ev = e as CustomEvent<IncomingEnvelope>;
        const env = ev.detail;
        if (!env || env.v !== PROTOCOL_VERSION) return;

        // Response correlation
        if (env.type.endsWith(':result') || env.type.endsWith(':error')) {
            if (!('id' in env) || !env.id) return;
            const slot = this.pending.get(env.id);
            if (!slot) return;
            this.pending.delete(env.id);
            clearTimeout(slot.timeout);
            if (env.type.endsWith(':error')) {
                const err = (env as { error?: { code: string; message: string } }).error;
                slot.reject(new Error(`[${err?.code ?? 'unknown'}] ${err?.message ?? 'bridge error'}`));
            } else {
                slot.resolve((env as { payload?: unknown }).payload);
            }
            return;
        }

        // Event dispatch
        const set = this.listeners.get(env.type as EventType);
        if (set) {
            for (const l of set) {
                try {
                    l((env as { payload?: unknown }).payload as EventPayload<EventType>);
                } catch (err) {
                    console.warn('[AraBridge] listener threw', err);
                }
            }
        }
    };
}

let _instance: AraBridge | null = null;

export function getBridge(): AraBridge {
    if (typeof window === 'undefined') {
        return new AraBridge();
    }
    if (!_instance) {
        _instance = new AraBridge();
        window.AraBridge = _instance;
        // After hydration, signal native that we're up.
        if (typeof document !== 'undefined') {
            const sendReady = () => {
                _instance!.send('ready', { route: window.location.pathname });
            };
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                queueMicrotask(sendReady);
            } else {
                document.addEventListener('DOMContentLoaded', sendReady, { once: true });
            }
        }
    }
    return _instance;
}

export const bridge = typeof window !== 'undefined' ? getBridge() : (null as unknown as AraBridge);

export type { AraBridge };
