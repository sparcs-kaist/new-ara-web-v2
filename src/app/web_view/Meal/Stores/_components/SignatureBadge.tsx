export function SignatureBadge({ className = '' }: { className?: string }) {
    return (
        <span className={`inline-flex shrink-0 items-center rounded-[5px] bg-[#FFF0F0] px-1 py-[2px] text-[11px] font-bold leading-[13px] text-ara_red ${className}`}>
            대표
        </span>
    );
}
