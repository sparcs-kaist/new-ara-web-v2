// 컬러셋 상수
export const CAT_COLORS = {
    blackOlive: '#3E3B32',
    boyRed: '#77634E',
    camel: '#C39E6E',
    pearl: '#EEDDC6',
    alabaster: '#F6ECE1',
};

export type MessageTheme = 'ara' | 'classic' | 'cat' | 'gradient';

export interface BaseTheme {
    me: string;
    other: string;
    readStatusColor?: string; // 읽음 상태 컬러 추가
}

export interface CatTheme extends BaseTheme {
    character: string;
    characterOther: string;
}

export const messageThemes: Record<MessageTheme, BaseTheme | CatTheme> = {
    ara: {
        me: 'bg-[#E8443A] text-white',
        other: 'bg-gray-100 text-gray-900',
        readStatusColor: '#E8443A',
    },
    classic: {
        me: 'bg-blue-500 text-white',
        other: 'bg-gray-200 text-gray-800',
        readStatusColor: '#2563eb',
    },
    cat: {
        // 컬러셋 활용
        me: `bg-[#EEDDC6] text-black border-2 border-[#77634e] rounded-xl px-3 py-2 relative`,
        other: `bg-[#F6ECE1] text-black border-2 border-[#C39E6E] rounded-xl px-3 py-2 relative`,
        character: '/ChatTheme/Cat/mozzi_cat.png',
        characterOther: '/ChatTheme/Cat/mozzi_cat.png',
        readStatusColor: '#C39E6E',
    },
    gradient: {
        me: 'bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white rounded-xl px-3 py-2',
        other: 'bg-gradient-to-r from-gray-200 to-gray-400 text-gray-900 rounded-xl px-3 py-2',
        readStatusColor: '#a78bfa',
    },
};