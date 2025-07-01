'use client';

import React, { useEffect, useState } from 'react';

export default function WebSocketTest() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const socket = new WebSocket('wss://newara.dev.sparcs.org/api/ws');

    socket.onopen = () => {
      console.log('WebSocket 연결 성공');
      setMessages((msgs) => [...msgs, '서버와 연결됨']);
    };

    socket.onmessage = (event) => {
      console.log('받은 메시지:', event.data);
      setMessages((msgs) => [...msgs, `서버: ${event.data}`]);
    };

    socket.onerror = (error) => {
      console.error('WebSocket 에러:', error);
      setMessages((msgs) => [...msgs, 'WebSocket 에러 발생']);
    };

    socket.onclose = () => {
      console.log('WebSocket 연결 종료');
      setMessages((msgs) => [...msgs, '연결 종료']);
    };

    return () => {
      socket.close();
    };
  }, []);

  const sendMessage = () => {
    const socket = new WebSocket('wss://newara.dev.sparcs.org/api/ws/');
    socket.onopen = () => {
      socket.send(input);
      setMessages((msgs) => [...msgs, `나: ${input}`]);
      setInput('');
      socket.close();
    };
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
