import { useState } from "react";
import { MarketArticle } from "../MarketPreview/MarketPreview";
import Link from "next/link";
import Image from "next/image";
import { Pagination } from "./Pagination";

interface GridArticleListProps {
    posts: MarketArticle[];
    currentPage: number;
    totalPages: number;
    onPageChange: React.Dispatch<React.SetStateAction<number>>;
}

export const GridArticleList = ({ posts, currentPage, totalPages, onPageChange }: GridArticleListProps) => {
    const [errorIndexes, setErrorIndexes] = useState<number[]>([]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ko-KR').format(price);
    };

    return (
        <>
            <div className="grid gap-3 h-full [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
                {posts.map((article, idx) => (
                    <Link key={article.id} href={`/post/${article.id}`} className="group flex flex-col">
                        <div className="relative w-full aspect-square mb-2 overflow-hidden rounded-lg flex items-center justify-center bg-gray-100">
                            {errorIndexes.includes(idx) || !article.attachments[0]?.file ? (
                                <Image
                                    src="/Service_Logo_Simple.svg"
                                    alt="기본 이미지"
                                    fill
                                    className="object-contain p-8"
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                />
                            ) : (
                                <Image
                                    src={article.attachments[0].file}
                                    alt={article.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                    onError={() => setErrorIndexes(prev => [...prev, idx])}
                                />
                            )}
                        </div>
                        <h3 className="font-medium text-sm truncate group-hover:underline">{article.title}</h3>
                        <p className="font-bold text-sm text-[#ed3a3a]">
                            {article.metadata?.price ? `${formatPrice(article.metadata.price)}￦` : '가격 정보 없음'}
                        </p>
                    </Link>
                ))}
            </div>
            {totalPages > 1 && <Pagination onPageChange={onPageChange} currentPage={currentPage} totalPages={totalPages} />}
        </>
    )
}