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
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            this.emit('connect');
        };

        this.socket.onclose = () => {
            this.emit('disconnect', event);
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit(data.type, data);
            } catch (error) {
                console.error('WebSocket message parsing error:', error);
            }
        };
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    send(data: any) {
        if (this.socket && this.socket.readyState == WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
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
        this.send({ type: 'join', room_id: roomId });
    }

    leave(roomId: number) {
        this.send({ type: 'leave', room_id: roomId });
    }

    isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }

}

export const chatSocket = new ChatSocketClient3();