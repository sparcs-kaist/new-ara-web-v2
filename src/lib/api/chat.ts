import http from '@/lib/api/http';
import { AxiosError } from 'axios'; // 추가
import { queryBuilder } from '@/lib/utils/queryBuilder';

// 채팅방 리스트 가져오기
export const fetchChatRoomList = async () => {
    const { data } = await http.get(`chat/room/`);
    return data;
}

//특정 채팅방의 세부 정보 가져오기
export const fetchChatRoomDetail = async (roomId: number) => {
    const { data } = await http.get(`chat/room/${roomId}/`);
    return data;
}

// 받은 초대장 목록 가져오기
export const fetchInvitationList = async () => {
    const { data } = await http.get('chat/invitation/');
    return data;
}

// 초대장 수락하기

// block한 채팅방 목록 가져오기
export const fetchBlockList = async () => {
    const { data } = await http.get('chat/block/');
    return data;
}

// 특정 채팅방에 메시지 목록 가져오기
export const fetchChatMessages = async (
    roomId: number,
    page: number = 1,
    pageSize: number = 100,
    ordering: string = '-created_at'
) => {
    const query = queryBuilder({
        chat_room: roomId,
        page,
        page_size: pageSize,
        ordering,
    });
    const { data } = await http.get(`chat/message/?${query}`);
    return data;
}

// DM 생성 (userId: 상대방 user id)
export const createDM = async (userId: number) => {
    try {
        const { data } = await http.post('chat/dm/', { dm_to: userId });
        return data;
    } catch (error) {
        const err = error as AxiosError<{ detail?: string }>;

        if (err.response && err.response.data && err.response.data.detail) {
            throw new Error(err.response.data.detail);
        }
        throw new Error('DM 생성 중 오류가 발생했습니다.');
    }
}

// 단체 채팅방 생성
export const createGroupDM = async (room_title: string, picture: File | null = null) => {
    const room_type = 'GROUP_DM';
    const chat_name_type = "NICKNAME";
    const formData = new FormData();
    formData.append("room_title", room_title);
    formData.append("room_type", room_type);
    formData.append("chat_name_type", chat_name_type);
    if (picture) {
        formData.append("picture", picture);
    }
    try {
        const { data } = await http.post('chat/room/', formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return data;
    } catch (error) {
        const err = error as AxiosError<{ detail?: string }>;
        if (err.response && err.response.data && err.response.data.detail) {
            throw new Error(err.response.data.detail);
        }
        throw new Error('단체 채팅방 생성 중 오류가 발생했습니다.');
    }
}

// 채팅방에 메시지 보내기
export const sendMessage = async (roomId: number, content: string) => {
    try {
        const { data } = await http.post(`chat/message/`, {
            message_type: 'TEXT',
            message_content: content,
            chat_room: roomId,
        });
        return data;
    } catch (error) {
        const err = error as AxiosError<{ detail?: string }>;

        if (err.response && err.response.data && err.response.data.detail) {
            throw new Error(err.response.data.detail);
        }
        throw new Error('메시지 전송 중 오류가 발생했습니다.');
    }
}

// 채팅방에서 하나의 메시지 가져오기 (Socket으로 업데이트 signal 받았을 때)
export const fetchRecentMessage = async (roomId: number) => {
    const query = queryBuilder({
        chat_room: roomId,
        page: 1,
        page_size: 1,
        ordering: '-created_at',
    });
    const { data } = await http.get(`chat/message/?${query}`);
    return data;
}

