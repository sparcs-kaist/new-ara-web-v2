'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '@/app/web_view/_components';
import ChatRoomList from './components/ChatRoomList';

export default function WebViewChatListPage() {
    const router = useRouter();

    const handleRoomClick = (roomId: number) => {
        router.push(`/web_view/Chat/${roomId}`);
    };

    return (
        <Screen withTabBar="auto">
            <Suspense fallback={null}>
                <ChatRoomList onRoomClick={handleRoomClick} />
            </Suspense>
        </Screen>
    );
}
