'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import './entrance.css';

const DURATION_MS = 240;
const STAGGER_MS = 40;
const STAGGERED_ROWS = 6;

// Only the rows painted when data first arrives animate; cached data (back-nav) is loaded on the first render, so nothing does.
export function useEntrance(loaded: boolean) {
    const ref = useRef({ pending: !loaded, keys: new Set<number>() });
    const first = ref.current.pending && loaded;
    useEffect(() => {
        if (!loaded) return;
        ref.current.pending = false;
        // Forget the keys once the run ends, or a row remounted by a zone switch would replay.
        const t = setTimeout(() => ref.current.keys.clear(), DURATION_MS + (STAGGERED_ROWS - 1) * STAGGER_MS);
        return () => clearTimeout(t);
    }, [loaded]);
    return (key: number, index: number): { className: string; style?: CSSProperties } => {
        if (first) ref.current.keys.add(key);
        if (!ref.current.keys.has(key)) return { className: '' };
        return { className: 'ara-enter', style: { animationDelay: `${Math.min(index, STAGGERED_ROWS - 1) * STAGGER_MS}ms` } };
    };
}
