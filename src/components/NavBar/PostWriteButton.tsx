"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PostWriteButton() {
    const router = useRouter();

    return (
        <div
            className="w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
            onClick={() => router.push("/write")}
        >
            <Image width={20} height={20} src="/write_black.svg" alt="글쓰기" />
        </div>
    );
}
