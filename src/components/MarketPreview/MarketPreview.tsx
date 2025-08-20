'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchArticles } from '@/lib/api/board';

// API 응답에 기반한 타입 정의
interface MarketArticle {
    id: number;
    title: string;
    attachments: {
        file: string;
    }[];
    metadata?: {
        price?: number;
    };
}

const MarketPreview = () => {
    const [articles, setArticles] = useState<MarketArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getMarketData = async () => {
            try {
                // 장터 게시판(id: 4), 최신 3개 게시물
                const response = await fetchArticles({ boardId: 4, pageSize: 3 });
                setArticles(response.results);
            } catch (error) {
                console.error('Failed to fetch market articles:', error);
            } finally {
                setLoading(false);
            }
        };
        getMarketData();
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ko-KR').format(price);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500">
                장터 게시물을 불러오는 중...
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-3 h-full">
            {articles.map((article) => (
                <Link key={article.id} href={`/post/${article.id}`} className="group flex flex-col">
                    <div className="relative w-full aspect-square mb-2 overflow-hidden rounded-lg">
                        <Image
                            src={article.attachments[0]?.file || '/default-product-image.png'} // 기본 이미지 경로
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                            sizes="(max-width: 768px) 50vw, 25vw"
                        />
                    </div>
                    <h3 className="font-medium text-sm truncate group-hover:underline">{article.title}</h3>
                    <p className="font-bold text-sm text-[#ed3a3a]">
                        {article.metadata?.price ? `${formatPrice(article.metadata.price)}￦` : '가격 정보 없음'}
                    </p>
                </Link>
            ))}
        </div>
    );
};

export default MarketPreview;
