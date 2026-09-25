import type { ReactNode } from 'react';

export default function NoticeLine({ children, className = 'text-sm' }: { children: ReactNode; className?: string }) {
    return (
        <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <div className={`px-3 text-gray-400 ${className}`}>{children}</div>
            <div className="flex-1 h-px bg-gray-200" />
        </div>
    );
}
