export const SocketUrl = (() => {
    if (process.env.NEXT_PUBLIC_SOCKET_HOST) {
        return process.env.NEXT_PUBLIC_SOCKET_HOST
    }

    const mode = process.env.NODE_ENV
    if (mode === 'production') return 'wss://newara.sparcs.org/api/ws/'
    if (mode === 'development') return 'wss://newara.dev.sparcs.org/api/ws/'
    throw new Error('Unknown NODE_ENV')
})()
