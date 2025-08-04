import Link from 'next/link';
import { MainPageNotificationPreview } from '@/containers/NotificationList';

interface NotiDetailProps {
  position?: string;
}

export default function NotiDetail({ position = "right-0" }: NotiDetailProps) {
    return (
        <div className={`absolute ${position} mt-2 w-100 bg-white shadow-lg rounded-[15px] border border-gray-100 z-50`}>
            <div className="px-4 py-2">
                <h3 className="text-lg font-semibold mb-2">알림</h3>
                <MainPageNotificationPreview />
            </div>
            <Link href="/notifications" className="p-2 block text-center text-[#ed3a3a] mt-2 font-medium
              hover:text-white hover:bg-[#ed3a3a] hover:rounded-b-[15px] transition-colors duration-200">
                알림 더 보기
            </Link>
        </div>
    )
}