import { BoardBookmarkedArticlesList, BoardRecentArticleList } from "@/containers/ArticleList";

export default function Sidebar() {
    return (
        <div className="lg:w-1/3 xl:w-1/4">
            <div className="bg-white rounded-lg shadow-sm px-4 py-8 sticky top-8">
                <div className="mb-6">
                    <h2 className="text-base font-semibold text-gray-800 mb-2">최근 본 글</h2>
                    <BoardRecentArticleList />
                </div>
                <div className="mb-6">
                    <h2 className="text-base font-semibold text-gray-800 mb-2">담아둔 글</h2>
                    <BoardBookmarkedArticlesList />
                </div>
            </div>
        </div>
    )
}