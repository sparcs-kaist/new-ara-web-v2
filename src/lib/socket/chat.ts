export class ChatSocketClient3 {
    private socket: WebSocket | null = null;
    private eventListeners: Record<string, Function[]> = {};
    public currentRoomId: number | null = null;


    private emit(event: string, ...args: any[]) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                callback(...args);
            });
        }
    }
    connect(url: string) {
        // 이미 연결되어 있는 경우 중복 연결 방지
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log('WebSocket 이미 연결됨, 중복 연결 방지');
            return;
        }

        console.log('WebSocket 연결 시도:', url);
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log('WebSocket 연결 성공');
            this.emit('connect');
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket 연결 종료:', event.code, event.reason);
            this.emit('disconnect', event);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket 오류 발생:', error);
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WebSocket 메시지 수신:', data);
                this.emit(data.type, data);
            } catch (error) {
                console.error('WebSocket message parsing error:', error);
            }
        };
    }

    disconnect() {
        if (this.socket) {
            console.log('WebSocket 연결 해제');
            this.socket.close();
            this.socket = null;
        }
    }

    send(data: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log('WebSocket 메시지 전송:', data);
            this.socket.send(JSON.stringify(data));
        } else {
            console.error('WebSocket 연결 상태가 아니라 메시지를 보낼 수 없음:',
                this.socket ? this.socket.readyState : 'socket is null');
        }
    }

    on(event: string, callback: Function) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    off(event: string, callback: Function) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(fn => fn !== callback);
        }
    }

    join(roomId: number) {
        console.log(`채팅방 입장 요청: ${roomId}`);
        // 백엔드 스펙에 따라 'join' 사용
        this.send({ type: 'join', room_id: roomId });
    }

    leave(roomId: number) {
        console.log(`채팅방 퇴장 요청: ${roomId}`);
        // 백엔드 스펙에 따라 'leave' 사용
        this.send({ type: 'leave', room_id: roomId });
    }

    isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }

    // 백엔드 스펙에 맞는 메시지 전송 메소드
    sendMessage(roomId: number, messageId: number, content: string, userId: number | null) {
        console.log(`메시지 전송 요청: ${roomId}, ${messageId}`);
        this.send({
            type: 'message_new',
            message: {
                id: messageId,
                room_id: roomId,
                sender_id: userId,
                type: 'text',
                preview: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
                created_at: new Date().toISOString()
            }
        });
    }

    // 타이핑 알림 전송
    sendTypingStart() {
        if (this.currentRoomId) {
            console.log('타이핑 알림 전송');
            this.send({ type: 'typing_start' });
        }
    }
}

export const chatSocket = new ChatSocketClient3();