'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ChatRoomDetail from '@/app/chat/components/ChatRoomDetail';
import { fetchChatRoomList } from '@/lib/api/chat';
import { SocketUrl } from '@/lib/socket/setting';
import { chatSocket } from '@/lib/socket/chat';

type ChatRoom = {
    id: number;
    room_title: string;
    room_type: string;
    chat_name_type: string;
    picture: string;
    recent_message_at: string;
    recent_message: number;
    created_at?: string;
};

/**
 * Mobile chat room shell: one column sized by `--kb-visual-height`, so it
 * shrinks above the keyboard on every host (the visual-viewport height is
 * pan-invariant, unlike 100dvh−inset math), with ChatRoomDetail's in-flow
 * input riding the column bottom. Document scroll is locked while open;
 * the rAF-coalesced corrector resets the programmatic scroll/pan the UA
 * still applies to reveal a focused caret. It converges and cannot loop —
 * unlike the old per-visualViewport-event scrollTo(0,0), which fought the
 * OS mid-animation and caused the jump/side-slide artifacts.
 */
export default function WebViewChatRoomPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const roomId = useMemo(() => {
        const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
        return id ? parseInt(id, 10) : null;
    }, [params]);

    const [currentRoom, setCurrentRoom] = useState<ChatRoom | undefined>(undefined);

    // Lock document scrolling for the lifetime of the room. Restore the raw
    // inline values — writing back getComputedStyle() results (as before)
    // leaks a permanent inline `overflow` onto <html>/<body>.
    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const prevHtmlOverflow = html.style.overflow;
        const prevBodyOverflow = body.style.overflow;
        const prevHtmlOverscroll = html.style.overscrollBehavior;
        html.style.overflow = 'hidden';
        body.style.overflow = 'hidden';
        // Prevent iOS rubber-band pans up front instead of relying on the
        // corrector below to undo them a frame later.
        html.style.overscrollBehavior = 'none';
        return () => {
            html.style.overflow = prevHtmlOverflow;
            body.style.overflow = prevBodyOverflow;
            html.style.overscrollBehavior = prevHtmlOverscroll;
        };
    }, []);

    // Persistent scroll/pan corrector — see the component doc comment.
    useEffect(() => {
        let rafId = 0;
        const correct = () => {
            rafId = 0;
            const vv = window.visualViewport;
            const panned = vv ? vv.offsetTop > 0 || vv.offsetLeft > 0 : false;
            if (window.scrollX !== 0 || window.scrollY !== 0 || panned) {
                // On WebKit this also collapses a pure visual-viewport pan.
                window.scrollTo(0, 0);
            }
        };
        const schedule = () => {
            if (rafId === 0) rafId = requestAnimationFrame(correct);
        };
        window.addEventListener('scroll', schedule, { passive: true });
        window.visualViewport?.addEventListener('scroll', schedule);
        return () => {
            window.removeEventListener('scroll', schedule);
            window.visualViewport?.removeEventListener('scroll', schedule);
            if (rafId !== 0) cancelAnimationFrame(rafId);
        };
    }, []);

    useEffect(() => {
        if (roomId) {
            fetchChatRoomList().then((data) => {
                const room = data.results.find((r: ChatRoom) => r.id === roomId);
                setCurrentRoom(room);
            });
        }
    }, [roomId]);

    useEffect(() => {
        if (!roomId) return;

        chatSocket.connect(`${SocketUrl}chat/`);

        const joinRoom = () => {
            if (chatSocket.currentRoomId && chatSocket.currentRoomId !== roomId) {
                chatSocket.leave(chatSocket.currentRoomId);
            }
            chatSocket.join(roomId);
            chatSocket.currentRoomId = roomId;
        };

        if (chatSocket.isConnected()) {
            joinRoom();
        } else {
            chatSocket.on('connect', joinRoom);
        }

        return () => {
            chatSocket.off('connect', joinRoom);
            if (chatSocket.currentRoomId === roomId) {
                chatSocket.leave(roomId);
                chatSocket.currentRoomId = null;
            }
        };
    }, [roomId]);

    if (!roomId) {
        return <div>유효하지 않은 채팅방입니다.</div>;
    }

    return (
        <div
            className="relative flex w-full flex-col overflow-hidden bg-white"
            style={{
                // The lower of the two keyboard signals wins, so the column
                // is right on every host class: resize hosts shrink both
                // terms (inset ~0); non-resizing hosts with a bridge
                // override move --kb-inset (dvh stays full); newer System
                // WebViews that shrink the visual viewport themselves move
                // --kb-visual-height — never double-subtracted, min() picks
                // one.
                height: 'min(var(--kb-visual-height, 100dvh), calc(100dvh - var(--kb-inset, 0px)))',
                // Keep the room header out from under the fixed safe-top cap.
                paddingTop: 'var(--ara-safe-top, env(safe-area-inset-top, 0px))',
                // Home-indicator clearance, handed off continuously to the
                // keyboard (see StickyComposer's resting-offset rationale).
                // Both shrink terms: resize hosts move --ara-kb-shrink
                // (synchronous), overlay hosts move --kb-inset (same tracker
                // timing as the --kb-visual-height column height above) —
                // without the inset term the clearance never collapses under
                // an overlay keyboard and the input floats above it.
                paddingBottom:
                    'max(0px, calc(var(--ara-safe-bottom, env(safe-area-inset-bottom, 0px)) - var(--ara-kb-shrink, 0px) - var(--kb-inset, 0px)))',
            }}
        >
            <ChatRoomDetail
                roomId={roomId}
                room={currentRoom}
                exitTo="/web_view/Chat"
                onMenuClick={() => router.push('/web_view/Chat')}
            />
        </div>
    );
}
