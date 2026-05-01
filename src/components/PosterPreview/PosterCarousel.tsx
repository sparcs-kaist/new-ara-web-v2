/* eslint-disable */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchArticles } from '@/lib/api/board';

type PosterArticle = {
    id: number;
    title: string;
    created_at: string;
    attachments?: { id: number; file: string; mimetype?: string }[];
    metadata?: { expire_at?: string | Date };
};

const BOARD_ID_POSTER = 19;
const PAGE_SIZE = 10;
const VISIBLE_COUNT = 4;
const AUTO_PLAY_MS = 3000;

function isImage(att?: { mimetype?: string; file: string }) {
    if (!att) return false;
    if (att.mimetype) return att.mimetype.startsWith('image');
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(att.file);
}

const DUMMY_IMAGE_URL =
    "https://newara.cdn.sparcs.org/files/260330_%EC%B9%B4%EC%9D%B4%EC%8A%A4%ED%8A%B8_%EC%9B%B9%ED%8F%AC%EC%8A%A4%ED%84%B0%EA%B2%BD%EC%98%81%EA%B3%B5%ED%95%99%EB%B6%80_%EC%84%9D%EB%B0%95%EC%82%AC%EA%B3%BC%EC%A0%95_%EC%B5%9C%EC%A2%85.png";

// const mockArticles: PosterArticle[] = [
//     { id: 1, title: "1", created_at: new Date().toISOString(), attachments: [{ id: 1, file: DUMMY_IMAGE_URL, mimetype: "image/png" }] },
//     { id: 2, title: "2", created_at: new Date().toISOString(), attachments: [{ id: 2, file: DUMMY_IMAGE_URL, mimetype: "image/png" }] },
//     { id: 3, title: "3", created_at: new Date().toISOString(), attachments: [{ id: 3, file: DUMMY_IMAGE_URL, mimetype: "image/png" }] },
//     { id: 4, title: "4", created_at: new Date().toISOString(), attachments: [{ id: 4, file: DUMMY_IMAGE_URL, mimetype: "image/png" }] },
//     { id: 5, title: "5", created_at: new Date().toISOString(), attachments: [{ id: 5, file: DUMMY_IMAGE_URL, mimetype: "image/png" }] },
// ];

function parseDate(val?: string | Date) {
    if (!val) return null;
    return val instanceof Date ? val : new Date(val);
}

export default function PosterCarousel() {
    const [items, setItems] = useState<PosterArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [errorIdx, setErrorIdx] = useState<number[]>([]);

    const [index, setIndex] = useState(0);
    const [transitionEnabled, setTransitionEnabled] = useState(true);

    const trackRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError(null);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 60);
            let page = 1;
            const acc: PosterArticle[] = [];
            try {
                while (true) {
                    const resp = await fetchArticles({ boardId: BOARD_ID_POSTER, page: page, pageSize: PAGE_SIZE, ordering: '-created_at' });
                    const results: PosterArticle[] = resp.results || [];
                    if (results.length === 0) break;

                    // stop condition: when we encounter an item older than cutoff
                    let shouldStop = false;
                    for (const r of results) {
                        const created = parseDate(r.created_at);
                        if (!created || created < cutoff) {
                            shouldStop = true;
                            break;
                        }
                        acc.push(r);
                    }
                    if (shouldStop) break;

                    // If server provides num_pages and we reached end, stop
                    if (resp.num_pages && page >= resp.num_pages) break;
                    page += 1;
                }

                // Filter: expire_at in the future and at least one image attachment
                const now = new Date();
                const filtered = acc.filter(a => {
                    const exp = parseDate(a.metadata?.expire_at);
                    if (!exp || exp <= now) return false;
                    const img = (a.attachments || []).find(isImage);
                    return !!img;
                });
                // Ensure created_at descending (most recent first)
                const sorted = filtered.sort((a, b) => {
                    const ta = parseDate(a.created_at)?.getTime() ?? 0;
                    const tb = parseDate(b.created_at)?.getTime() ?? 0;
                    return tb - ta;
                });

                if (!cancelled) setItems(sorted);
            } catch (e: any) {
                if (!cancelled) setError(e?.message || '포스터를 불러오지 못했습니다.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    // for test
    // useEffect(() => {
    //     setItems(mockArticles);
    // }, []);

    useEffect(() => {
        if (items.length <= VISIBLE_COUNT) return;

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setIndex(prev => prev + 1);
        }, AUTO_PLAY_MS);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [items.length]);

    // infinite용 배열
    const viewItems = useMemo(() => {
        if (items.length <= VISIBLE_COUNT) return items;
        return [...items, ...items.slice(0, VISIBLE_COUNT)];
    }, [items]);

    // 끝에서 리셋
    const handleTransitionEnd = () => {
        if (items.length <= VISIBLE_COUNT) return;

        if (index >= items.length) {
            setTransitionEnabled(false);
            setIndex(0);
        }
    };

    // transition 복구
    useEffect(() => {
        if (!transitionEnabled) {
            const raf = requestAnimationFrame(() => {
                setTransitionEnabled(true);
            });
            return () => cancelAnimationFrame(raf);
        }
    }, [transitionEnabled]);

    if (loading) {
        return (
            <div className="w-full p-4 text-center">포스터 불러오는 중…</div>
        );
    }
    if (error) {
        return (
            <div className="w-full p-4 text-center text-red-500">{error}</div>
        );
    }
    if (items.length === 0) {
        return (
            <div className="w-full">
                <Link href="/board?board=poster" className="flex items-center space-x-2 mb-[16px]">
                    <h2 className="text-[20px] font-bold">📌 포스터</h2>
                    <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
                </Link>
                <div className="w-full flex items-center justify-center bg-white text-gray-400" style={{ aspectRatio: '4/1.414' }}>
                    게시된 포스터가 없습니다.
                </div>
            </div>
        );
    }
    
    return (
        <div className="w-full">
            <Link href="/board?board=poster" className="flex items-center space-x-2 mb-[16px]">
                <h2 className="text-[20px] font-bold">📌 포스터</h2>
                <Image src="/Right_Chevron.svg" width={8.84} height={15} alt="arrow" />
            </Link>
            <div className="overflow-hidden">
                <div
                    ref={trackRef}
                    className="flex gap-3"
                    style={{
                        transform: `translateX(calc(-${index} * ((100% / ${VISIBLE_COUNT}) + 12px)))`,
                        transition: transitionEnabled
                            ? 'transform 0.5s ease-out'
                            : 'none',
                    }}
                    onTransitionEnd={handleTransitionEnd}
                >
                    {viewItems.map((a, idx) => {
                        const img = (a.attachments || []).find(isImage);
                        const hasError = errorIdx.includes(idx);

                        return (
                            <Link
                                key={`${a.id}-${idx}`}
                                href={`/post/${a.id}`}
                                className="block basis-1/4 shrink-0 min-w-0 overflow-hidden"
                            >
                                <div className="relative w-full h-full overflow-hidden rounded-lg border border-gray-200 bg-white flex items-center justify-center aspect-[210/297]">
                                    {hasError || !img ? (
                                            <Image src="/Service_Logo_Simple.svg" alt="poster" fill className="object-contain p-6" sizes="(max-width: 768px) 50vw, 25vw" />
                                        ) : (
                                            <Image
                                                src={img.file}
                                                alt={a.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 50vw, 25vw"
                                                onError={() => setErrorIdx(prev => prev.includes(idx) ? prev : [...prev, idx])}
                                            />
                                        )}
                                </div>
                                <div className="mt-2 text-sm font-medium truncate" title={a.title}>{a.title}</div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}