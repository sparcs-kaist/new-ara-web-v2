import { ImageBadgeIcon } from '@/app/web_view/_components';

export function EmptyState({ title, description, className = '' }: { title: string; description?: string; className?: string }) {
    return (
        <div className={`flex flex-col items-center text-center ${className}`}>
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#F0F0F0] text-[#BBBBBB]">
                <ImageBadgeIcon size={28} />
            </span>
            <p className="mt-5 text-[16px] font-bold text-[#222222]">{title}</p>
            {description && <p className="mt-1 text-[14px] text-[#646464]">{description}</p>}
        </div>
    );
}
