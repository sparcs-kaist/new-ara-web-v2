"use client";
import { useRouter } from "next/navigation";

export default function WriteButton({ href }: {href: string}) {
    const router = useRouter();
    return (
        <button
            className="border border-ara_red text-ara_red rounded-lg px-3 py-1 text-sm font-normal hover:bg-ara_red hover:text-white transition ml-2 mt-2 sm:mt-0 hidden sm:block"
            onClick={() => router.push(href)}
        >
            게시물 작성하기
        </button>
    )
}