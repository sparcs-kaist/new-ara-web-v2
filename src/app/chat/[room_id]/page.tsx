'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import ChatRoomList from '../components/ChatRoomList';
import ChatRoomDetail from '../components/ChatRoomDetail';
import { fetchChatRoomList, fetchChatMessages } from '@/lib/api/chat';
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
};

export default function ChatRoomPage() {
  const params = useParams<{ room_id: string }>();
  const roomId = useMemo(() => {
    const id = Array.isArray(params?.room_id) ? params.room_id[0] : params?.room_id;
    return id ? parseInt(id, 10) : null;
  }, [params]);

  const pathname = usePathname(); // 소켓 처리를 위한 pathname 훅 사용

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


  // roomId 값이 변경될 때가 아니라 실제 pathname이 변경될 때만 채팅방 변경 처리
  useEffect(() => {
    if (!roomId) return;

    // 소켓 연결하기
    chatSocket.connect(`${SocketUrl}chat/`);

    // 연결 상태에서만 join 처리
    const joinRoom = () => {
      // 이전 채팅방이 있고 다르다면 떠나기
      if (chatSocket.currentRoomId && chatSocket.currentRoomId !== roomId) {
        console.log(`leave room ${chatSocket.currentRoomId}`);
        chatSocket.leave(chatSocket.currentRoomId);
      }

      // 새 채팅방 입장
      console.log(`join room ${roomId}`);
      chatSocket.join(roomId);
      chatSocket.currentRoomId = roomId;
    };

    // 이미 연결된 상태면 바로 처리, 아니면 연결 이벤트 기다림
    const handleConnect = () => {
      joinRoom();
    };
    chatSocket.on('connect', handleConnect);

    return () => {
      chatSocket.off('connect', handleConnect);
      chatSocket.disconnect();//소켓 연결 해제
    };
  }, [pathname, roomId]); // pathname이 변경될 때만 실행되도록 의존성 추가

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