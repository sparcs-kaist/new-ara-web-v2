'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import ChatRoomList from '../components/ChatRoomList';
import ChatRoomDetail from '../components/ChatRoomDetail';
import { fetchChatRoomList, fetchChatMessages } from '@/lib/api/chat';
import { chatSocket } from '@/lib/socket/chat';

// ROOM 타입 정의
type ChatRoom = {
  id: number;
  room_title: string;
  room_type: string;
  chat_name_type: string;
  picture: string;
  recent_message_at: string;
  recent_message: number;
};

export default function ChatRoomPage() {
  const params = useParams<{ room_id: string }>();
  const roomId = useMemo(() => {
    const id = Array.isArray(params?.room_id) ? params.room_id[0] : params?.room_id;
    return id ? parseInt(id, 10) : null;
  }, [params]);

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | undefined>(undefined);

  // 채팅방 목록 및 현재 방 정보 로드
  useEffect(() => {
    fetchChatRoomList()
      .then((data) => {
        const sortedRooms = [...(data.results || [])].sort((a, b) => {
          const aTime = new Date(a.recent_message_at || a.created_at || 0).getTime();
          const bTime = new Date(b.recent_message_at || b.created_at || 0).getTime();
          return bTime - aTime;
        });
        setRooms(sortedRooms);

        // 현재 roomId에 해당하는 방 정보 찾기
        if (roomId) {
          const room = sortedRooms.find(r => r.id === roomId);
          setCurrentRoom(room);
        }
      });
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    // 소켓 연결
    chatSocket.connect('ws://your-server/ws/chat/');

    // 연결 성공 시 채팅방 join
    const handleConnect = () => {
      chatSocket.join(roomId);
      console.log('join room', roomId);
    };

    // 이벤트 리스너 등록
    chatSocket.on('connect', handleConnect);

    return () => {
      // 채팅방 떠날 때 정리
      chatSocket.leave(roomId);
      chatSocket.off('connect', handleConnect);
      chatSocket.disconnect();
      console.log('leave room', roomId);
    };
  }, [roomId]);

  if (!roomId) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-gray-500">
        잘못된 채팅방 ID입니다.
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-gray-100 flex px-20 py-8">
      {/* 왼쪽 박스 (채팅방 목록) */}
      <ChatRoomList selectedRoomId={roomId} />

      {/* 오른쪽 박스 (상세 채팅) */}
      <ChatRoomDetail roomId={roomId} room={currentRoom} />
    </div>
  );
}