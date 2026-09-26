/**
 * 글쓰기 페이지 전용 아이콘. 공용 `_components/icons.tsx`와 같은 mask-image
 * 방식이라 `text-…`(currentColor)로 색이 입혀진다.
 */
import type { CSSProperties, HTMLAttributes } from 'react';

const ICON_BASE = '/webview/icons';

export type IconProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
    size?: number;
};

interface MaskIconProps extends IconProps {
    src: string;
    fallback: number;
}

function MaskIcon({ src, size, fallback, style, ...rest }: MaskIconProps) {
    const px = size ?? fallback;
    const merged: CSSProperties = {
        display: 'inline-block',
        width: px,
        height: px,
        backgroundColor: 'currentColor',
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        flexShrink: 0,
        ...style,
    };
    return <span aria-hidden {...rest} style={merged} />;
}

export { CheckIcon, ChevronDownIcon } from '@/app/web_view/_components/icons';
export function ChevronUpIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/chevron_up.svg`} fallback={20} {...p} />;
}
export function KeyboardDownIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/keyboard_down.svg`} fallback={36} {...p} />;
}
export function CloseCircleIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/close.svg`} fallback={30} {...p} />;
}
