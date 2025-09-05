//게시물 metadata 유틸

export type MarketState = 'onsale' | 'reserved' | 'soldout';

export interface ArticleMetadata {
    price?: number;
    price_currency?: 'KRW' | 'USD';
    state?: MarketState;
    [key: string]: unknown;
}

/**
 * 장터용 메타데이터 생성 (유효성 검사 포함)
 * price가 유효하지 않으면 필드에서 제외합니다.
 * state는 허용된 값만 반영합니다.
 */
export function makeMarketMetadata(params: {
    price?: unknown;                 // 문자열/콤마 포함 허용
    currency?: 'KRW' | 'USD';
    state?: MarketState;
}): ArticleMetadata | undefined {
    const out: ArticleMetadata = {};

    // price: 숫자만 추출 → number 변환 → 음수 방지 → 정수화
    if (params.price !== undefined && params.price !== null && String(params.price).trim() !== '') {
        const cleaned = String(params.price).replace(/[^\d]/g, '');
        if (cleaned !== '') {
            const n = Number(cleaned);
            if (Number.isFinite(n) && n >= 0) out.price = Math.floor(n);
        }
    }

    if (params.currency) out.price_currency = params.currency;

    if (params.state && (['onsale', 'reserved', 'soldout'] as const).includes(params.state)) {
        out.state = params.state;
    }

    return Object.keys(out).length ? out : undefined;
}

// 포스터 게시판용 metadata
export function makePosterMetadata(params: {
    expire_at: string // yyyy-mm-dd format
}): ArticleMetadata | undefined {
    const out: ArticleMetadata = {};

    if (params.expire_at) {
        out.expire_at = params.expire_at;
    }

    return Object.keys(out).length ? out : undefined;
}
