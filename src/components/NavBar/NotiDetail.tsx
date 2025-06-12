import Link from 'next/link';

export default function NotiDetail () {
    return (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded p-2">
            <div className="text-center text-sm text-gray-700">알림이 없습니다.</div>
            <Link href="/notifications" className="block text-center text-blue-500 mt-2">
                알림 더 보기
            </Link>
        </div>
    )

}