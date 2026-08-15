interface SearchProps {
    searchInput: string;
    setSearchInput: (e: React.SetStateAction<string>) => void;
    handleSearch: () => void;
}

export default function Search({ searchInput, setSearchInput, handleSearch }: SearchProps) {
    return (
        <div className="relative">
            <input
                type="text"
                className="rounded-xl pl-8 pr-2 py-1.5 text-sm w-45 bg-gray-50 text-gray-700 font-medium"
                placeholder="검색어를 입력하세요"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleSearch();
                    }
                }}
            />
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                    <path d="M11.5 11.5L15 15M7 12A5 5 0 1 1 7 2a5 5 0 0 1 0 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </span>
        </div>
    )
}