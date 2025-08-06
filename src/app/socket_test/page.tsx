'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function WebSocketTest() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket('wss://newara.dev.sparcs.org/api/ws/'); // URL 확인 필요
    socketRef.current = socket;

    socket.onopen = () => setMessages(msgs => [...msgs, '서버와 연결됨']);
    socket.onmessage = (event) => setMessages(msgs => [...msgs, `서버: ${event.data}`]);
    socket.onerror = () => setMessages(msgs => [...msgs, 'WebSocket 에러 발생']);
    socket.onclose = () => setMessages(msgs => [...msgs, '연결 종료']);

    return () => socket.close();
  }, []);

  const sendMessage = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(input);
      setMessages(msgs => [...msgs, `나: ${input}`]);
      setInput('');
    } else {
      setMessages(msgs => [...msgs, '소켓이 연결되어 있지 않습니다.']);
    }
  };

  return (
    <div>
      <h2>WebSocket 테스트</h2>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="보낼 메시지 입력"
      />
      <button onClick={sendMessage}>전송</button>
      <div style={{ marginTop: 20 }}>
        <h4>메시지 로그</h4>
        <ul>
          {messages.map((msg, i) => (
            <li key={i} style={{ whiteSpace: 'pre-wrap' }}>
              {msg}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}