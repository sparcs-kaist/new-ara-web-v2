import Image from "next/image";

export default function NotFound() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <Image
                src="/ara_404.png"
                alt="404 - Ara Page Not Found"
                width={800}
                height={450}
                priority
                className="max-w-full h-auto"
            />
        </div>
    );
}