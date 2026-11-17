import Link from 'next/link';
import { MainPageNotificationPreview } from '@/containers/NotificationList';

interface NotiDetailProps {
    position?: string;
    NotiData: [];
}

export default function NotiDetail({ position = "right-0", NotiData }: NotiDetailProps) {
    return (
        // w-100은 Tailwind 기본 클래스가 아니라 적용되지 않았다 → 내용 길이에 맞춰 줄어들던 문제. 너비를 고정한다.
        <div className={`absolute ${position} mt-2 w-[420px] max-w-[calc(100vw-2rem)] bg-white shadow-lg rounded-[15px] border border-gray-100 z-50`}>
            <div className="px-4 py-2">
                <h3 className="text-lg font-semibold mb-2">알림</h3>
                {NotiData && NotiData.length > 0 ? (
                    <MainPageNotificationPreview noti_data={NotiData} />
                ) : (
                    <p className="py-10 text-center text-sm text-gray-400">새로운 알림이 없습니다.</p>
                )}
            </div>
            <Link href="/notifications" className="p-2 block text-center text-[#ed3a3a] mt-2 font-medium
              hover:text-white hover:bg-[#ed3a3a] hover:rounded-b-[15px] transition-colors duration-200">
                알림 더 보기
            </Link>
        </div>
    )
}