/**
 * Single source of truth for bridge message types.
 *
 * Keep in sync with `new-ara-app/lib/bridge/bridge_types.dart`.
 * See `./PROTOCOL.md` for the human-readable spec.
 */

export const PROTOCOL_VERSION = 1 as const;

export type Platform = 'ios' | 'android';
export type PushPlatform = 'fcm' | 'apns';
export type PermissionKind = 'camera' | 'photos' | 'notifications' | 'microphone';
export type PermissionStatus = 'granted' | 'denied' | 'permanentlyDenied';
export type StatusBarStyle = 'light' | 'dark';
export type HapticKind = 'light' | 'medium' | 'heavy' | 'selection';
export type AppLifecycleState = 'foreground' | 'background' | 'inactive';
export type NetworkType = 'wifi' | 'cellular';

export interface SafeAreaInsets {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export interface BridgeError {
    code:
        | 'unsupported'
        | 'denied'
        | 'cancelled'
        | 'invalid_payload'
        | 'unavailable'
        | 'internal';
    message: string;
}

/** Web → Native */
export type CommandMap = {
    ready: { req: { route: string }; res: void };
    log: { req: { level: 'debug' | 'info' | 'warn' | 'error'; message: string; data?: unknown }; res: void };
    goBack: { req: void; res: void };
    exit: { req: void; res: void };
    setStatusBar: { req: { color: string; style: StatusBarStyle }; res: void };
    setSafeArea: { req: SafeAreaInsets; res: void };
    openExternal: { req: { url: string }; res: void };
    share: { req: { title?: string; text?: string; url?: string }; res: { shared: boolean } };
    pickImage: {
        req: { source: 'gallery' | 'camera'; maxBytes?: number };
        res: { uri: string; mime: string; name: string; base64?: string };
    };
    pickFile: {
        req: { accept?: string[]; multiple?: boolean };
        res: { files: Array<{ uri: string; mime: string; name: string; size: number }> };
    };
    requestPermission: {
        req: { kind: PermissionKind };
        res: { granted: boolean; status: PermissionStatus };
    };
    getPushToken: { req: void; res: { token: string | null; platform: PushPlatform } };
    subscribeTopic: { req: { topic: string }; res: void };
    unsubscribeTopic: { req: { topic: string }; res: void };
    setBadgeCount: { req: { count: number }; res: void };
    haptic: { req: { kind: HapticKind }; res: void };
    clipboardWrite: { req: { text: string }; res: void };
    clipboardRead: { req: void; res: { text: string } };
    setSession: { req: { cookie: string }; res: void };
    clearSession: { req: void; res: void };
    reportHeight: { req: { height: number }; res: void };
    /** Tell the native shell that the pull-to-refresh refetch is finished
     *  so it can hide the native spinner. */
    refreshDone: { req: void; res: void };
};

export type CommandType = keyof CommandMap;
export type CommandReq<T extends CommandType> = CommandMap[T]['req'];
export type CommandRes<T extends CommandType> = CommandMap[T]['res'];

/** Native → Web events (not direct responses) */
export type EventMap = {
    'bridge:ready': {
        platform: Platform;
        osVersion: string;
        appVersion: string;
        locale: string;
        safeArea: SafeAreaInsets;
    };
    'back:pressed': void;
    'appstate:changed': { state: AppLifecycleState };
    'network:changed': { online: boolean; type?: NetworkType };
    'keyboard:changed': { height: number; visible: boolean };
    'push:received': { title?: string; body?: string; data?: Record<string, unknown>; foreground: boolean };
    'push:opened': { data: Record<string, unknown>; deepLink?: string };
    'deeplink:received': { url: string };
    'auth:expired': void;
    /** User pulled the WebView down past the threshold; web is expected to
     *  refetch and call `refresh:done` so the native spinner can dismiss. */
    'refresh:requested': void;
};

export type EventType = keyof EventMap;
export type EventPayload<T extends EventType> = EventMap[T];

/** Wire envelope. */
export interface RequestEnvelope<T extends CommandType = CommandType> {
    v: typeof PROTOCOL_VERSION;
    id?: string;
    type: T;
    payload?: CommandReq<T>;
}

export interface ResponseEnvelope<T extends CommandType = CommandType> {
    v: typeof PROTOCOL_VERSION;
    id?: string;
    type: `${T}:result` | `${T}:error`;
    payload?: CommandRes<T>;
    error?: BridgeError;
}

export interface EventEnvelope<T extends EventType = EventType> {
    v: typeof PROTOCOL_VERSION;
    type: T;
    payload?: EventPayload<T>;
}

export type IncomingEnvelope = ResponseEnvelope | EventEnvelope;
