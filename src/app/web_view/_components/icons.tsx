/**
 * Icons load real Flutter SVG files from `/public/webview/icons/*.svg` via
 * CSS `mask-image`, so `currentColor` (Tailwind `text-…`) tints them — the
 * same effect Flutter gets from `SvgPicture.asset` + `ColorFilter.mode(…,
 * BlendMode.srcIn)`.
 *
 * Multi-colour brand assets (the ARA logo) load through a plain `<img>` so
 * their original fills survive.
 */
import type { CSSProperties, HTMLAttributes } from 'react';

const ICON_BASE = '/webview/icons';
const IMAGE_BASE = '/webview/images';

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

/* =========================================================================
 * AraLogo — `assets/images/logo.svg` copied to `/public/webview/images/araLogo.svg`.
 * Brand colours preserved.
 * ========================================================================= */
export function AraLogo({
    width = 68,
    height = 37,
    className,
    style,
}: {
    width?: number;
    height?: number;
    className?: string;
    style?: CSSProperties;
}) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={`${IMAGE_BASE}/araLogo.svg`}
            alt="ARA"
            width={width}
            height={height}
            className={className}
            style={style}
            draggable={false}
        />
    );
}

/* =========================================================================
 * Bottom-nav icons (32 × 32 native — scaled to 36 in BottomTabBar).
 * ========================================================================= */
export function HomeIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/home.svg`} fallback={32} {...p} />;
}
export function PostListIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/post_list.svg`} fallback={32} {...p} />;
}
export function NotificationIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/notification.svg`} fallback={32} {...p} />;
}
export function MemberIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/member.svg`} fallback={32} {...p} />;
}

/* =========================================================================
 * Vote / engagement icons.
 * ========================================================================= */
export function LikeIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/like.svg`} fallback={12} {...p} />;
}
export function LikeFilledIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/like-filled.svg`} fallback={12} {...p} />;
}
export function DislikeIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/dislike.svg`} fallback={12} {...p} />;
}
export function DislikeFilledIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/dislike-filled.svg`} fallback={12} {...p} />;
}
export function CommentIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/comment.svg`} fallback={13} {...p} />;
}

/* =========================================================================
 * Chevrons / arrows.
 * ========================================================================= */
export function LeftChevronIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/left_chevron.svg`} fallback={20} {...p} />;
}
export function RightChevronIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/right_chevron.svg`} fallback={20} {...p} />;
}
export function RightArrow2Icon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/right_arrow_2.svg`} fallback={16} {...p} />;
}

/* =========================================================================
 * Toolbar / utility icons.
 * ========================================================================= */
export function SearchIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/search.svg`} fallback={20} {...p} />;
}
export function PostIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/post.svg`} fallback={32} {...p} />;
}
export function SettingIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/setting.svg`} fallback={24} {...p} />;
}
export function BookmarkIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/bookmark.svg`} fallback={20} {...p} />;
}
export function ShareIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/share.svg`} fallback={20} {...p} />;
}
export function ModifyIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/modify.svg`} fallback={20} {...p} />;
}
export function DeleteIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/delete.svg`} fallback={20} {...p} />;
}
export function WarningIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/warning.svg`} fallback={20} {...p} />;
}
export function BarriorIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/barrior.svg`} fallback={20} {...p} />;
}
export function SendIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/send.svg`} fallback={24} {...p} />;
}
export function Close1Icon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/close-1.svg`} fallback={20} {...p} />;
}
export function Close2Icon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/close-2.svg`} fallback={20} {...p} />;
}
export function AddIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/add.svg`} fallback={20} {...p} />;
}
export function MenuIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/menu_1.svg`} fallback={32} {...p} />;
}
export function StarIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/star.svg`} fallback={32} {...p} />;
}
export function DownloadIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/download_2.svg`} fallback={32} {...p} />;
}
export function NotifyIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/notify.svg`} fallback={32} {...p} />;
}
export function InformationIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/information.svg`} fallback={50} {...p} />;
}
export function VerifiedIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/verified.svg`} fallback={16} {...p} />;
}
export function LanguageIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/language.svg`} fallback={24} {...p} />;
}

/* =========================================================================
 * Post-preview badges + meatballs menu.
 * ========================================================================= */
export function ImageBadgeIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/image.svg`} fallback={12} {...p} />;
}
export function ClipBadgeIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/clip.svg`} fallback={12} {...p} />;
}
export function MoreIcon(p: IconProps) {
    return <MaskIcon src={`${ICON_BASE}/more.svg`} fallback={20} {...p} />;
}
