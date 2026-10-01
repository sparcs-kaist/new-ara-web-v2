'use client';

export function SectionEmpty({ text, action }: { text: string; action?: { label: string; onPress: () => void } }) {
    return (
        <div className="mt-2 flex flex-col items-center px-5">
            <p className="text-[14px] font-medium text-[#999999]">{text}</p>
            {action && (
                <button type="button" onClick={action.onPress} className="mt-1 px-2 py-1 text-[14px] font-semibold text-ara_red">
                    {action.label}
                </button>
            )}
        </div>
    );
}
