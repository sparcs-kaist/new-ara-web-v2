import http from '@/lib/api/http';

// 채팅방 리스트 가져오기
export const fetchChatRoomList = async () => {
    const { data } = await http.get('chat/room/');
    return data;
}

// DM 생성 (userId: 상대방 user id)
export const createDM = async (userId: number) => {
    try {
        const { data } = await http.post('chat/dm/', { dm_to: userId });
        return data;
    } catch (error: any) {
        // 에러 처리
        if (error.response && error.response.data && error.response.data.detail) {
            throw new Error(error.response.data.detail);
        }
        // 기타 네트워크 에러 등
        throw new Error('DM 생성 중 오류가 발생했습니다.');
    }
}