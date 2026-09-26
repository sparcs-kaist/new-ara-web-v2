export type ChatPartner = { id: number; nickname: string; picture?: string | null };

type NamedRoom = { room_type: string; room_title: string; picture?: string | null };

const DEFAULT_ROOM_PICTURE = '/Chatroom_default1.png';

// partner undefined = not known (older list API, members not loaded yet), so the room's own title stays; null = deleted user.
export function displayRoomTitle(room: NamedRoom, partner: ChatPartner | null | undefined, myId?: number | null): string {
    if (room.room_type !== 'DM' || partner === undefined) return room.room_title;
    if (partner && partner.id === myId) return '나';
    return partner?.nickname || '알 수 없음';
}

export function displayRoomPicture(room: Omit<NamedRoom, 'room_title'> | undefined, partner: ChatPartner | null | undefined): string {
    const picture = room?.room_type === 'DM' && partner !== undefined ? partner?.picture : room?.picture;
    return picture || DEFAULT_ROOM_PICTURE;
}
