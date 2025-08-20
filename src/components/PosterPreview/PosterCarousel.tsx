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
    // fallback by extension
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(att.file);
}

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

    // autoplay
    useEffect(() => {
        if (items.length <= 1) return;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setIndex(prev => prev + 1);
        }, AUTO_PLAY_MS);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [items.length]);

    // reset without animation when looping
    useEffect(() => {
        if (items.length === 0) return;
        const total = items.length;
        const maxIndex = total; // because we append clones
        if (index > maxIndex) {
            const el = trackRef.current;
            if (el) {
                el.style.transition = 'none';
                setIndex(0);
                requestAnimationFrame(() => {
                    el.style.transition = '';
                });
            } else {
                setIndex(0);
            }
        }
    }, [index, items.length]);

    const viewItems = useMemo(() => {
        if (items.length === 0) return [] as PosterArticle[];
        const clones = items.slice(0, Math.min(VISIBLE_COUNT, items.length));
        return items.concat(clones);
    }, [items]);

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
        return null;
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-[20px] font-bold">📌 포스터</h2>
                <Link href="/board/poster" className="text-sm text-gray-500 hover:underline">더보기</Link>
            </div>
            <div className="overflow-hidden">
                <div
                    ref={trackRef}
                    className="flex gap-3 transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${(index % (viewItems.length)) * (100 / VISIBLE_COUNT)}%)` }}
                >
                    {viewItems.map((a, idx) => {
                        const img = (a.attachments || []).find(isImage);
                        const href = `/post/${a.id}`;
                        const hasError = errorIdx.includes(idx);
                        return (
                            <Link key={`${a.id}-${idx}`} href={href} className="block basis-1/4 shrink-0">
                                <div className="w-full" style={{ aspectRatio: '210/297' }}>
                                    <div className="relative w-full h-full overflow-hidden rounded-lg border border-gray-200 bg-white flex items-center justify-center">
                                        {hasError || !img ? (
                                            <Image src="/Service_Logo_Simple.svg" alt="poster" fill className="object-contain p-6" sizes="(max-width: 768px) 50vw, 25vw" />
                                        ) : (
                                            <Image
                                                src={img.file}
                                                alt={a.title}
                                                fill
                                                className="object-contain bg-white"
                                                sizes="(max-width: 768px) 50vw, 25vw"
                                                onError={() => setErrorIdx(prev => prev.includes(idx) ? prev : [...prev, idx])}
                                            />
                                        )}
                                    </div>
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
