// 컬러셋 상수
export const CAT_COLORS = {
    blackOlive: '#3E3B32',
    boyRed: '#77634E',
    camel: '#C39E6E',
    pearl: '#EEDDC6',
    alabaster: '#F6ECE1',
};

export type MessageTheme = 'ara' | 'default';

export interface BaseTheme {
    bubble: {
        me: string;       // 내 말풍선 배경/보더
        other: string;    // 상대 말풍선 배경/보더
        text: string;     // 텍스트 색
        radius: string;   // 둥근 모서리
        padding: string;  // 패딩
        shadow?: string;  // 그림자
    };
    readStatusColor: string;
}

export interface CatTheme extends BaseTheme {
    character: string;
}

export const messageThemes: Record<MessageTheme, BaseTheme | CatTheme> = {
    ara: {
        bubble: {
            me: 'bg-emerald-500 text-white',
            other: 'bg-gray-100 text-gray-900 border border-gray-200',
            text: 'text-inherit',
            radius: 'rounded-2xl',
            padding: 'px-3 py-2',
            shadow: 'shadow-sm',
        },
        readStatusColor: '#64748b',
    },
    default: {
        bubble: {
            me: 'bg-blue-500 text-white',
            other: 'bg-gray-200 text-gray-900',
            text: 'text-inherit',
            radius: 'rounded-xl',
            padding: 'px-3 py-2',
            shadow: 'shadow-sm',
        },
        readStatusColor: '#6b7280',
    },
};