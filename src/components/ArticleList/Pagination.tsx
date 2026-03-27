import Image from "next/image";

interface PaginationProps {
    onPageChange: (page: number) => void;
    currentPage: number;
    totalPages: number;
}

export const Pagination = ({ onPageChange, currentPage, totalPages }: PaginationProps) => {
    return (
        <div className="flex justify-center items-center gap-2 mt-4 select-none">
            <button
                className="px-2 py-1 rounded"
                onClick={() => onPageChange(Math.max(1, Math.floor((currentPage - 1) / 10) * 10))}
                disabled={currentPage <= 10}
                aria-label="이전 10페이지"
            >
                <Image
                    src="/Right_Chevron.svg"
                    alt="이전"
                    width={8}
                    height={8}
                    className={`rotate-180 transition
                        ${currentPage <= 10 ? 'grayscale brightness-100' : 'grayscale brightness-50'}`}
                />
            </button>

            {
                Array.from({ length: Math.min(10, totalPages - Math.floor((currentPage - 1) / 10) * 10) }).map((_, idx) => {
                    const page = Math.floor((currentPage - 1) / 10) * 10 + idx + 1;
                    return (
                        <button
                            key={page}
                            className={`px-2 py-1 text-lg rounded ${page === currentPage ? 'text-ara_red font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => onPageChange && onPageChange(page)}
                            disabled={page > totalPages}
                        >
                            {page}
                        </button>
                    );
                })
            }

            <button
                className="px-2 py-1 rounded"
                onClick={() => onPageChange(Math.min(totalPages, Math.floor((currentPage - 1) / 10 + 1) * 10 + 1))}
                disabled={Math.floor((currentPage - 1) / 10) * 10 + 10 >= totalPages}
                aria-label="다음 10페이지"
            >
                <Image
                    src="/Right_Chevron.svg"
                    alt="다음"
                    width={8}
                    height={8}
                    className={`transition
                        ${Math.floor((currentPage - 1) / 10) * 10 + 10 >= totalPages
                            ? 'grayscale brightness-100'
                            : 'grayscale brightness-50'
                        }`}
                />
            </button>
        </div >
    )
}