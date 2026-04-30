'use client';

import './Spinner.css';

interface SpinnerProps {
    /** Outer diameter in px. Default 32 — matches Flutter's default. */
    size?: number;
    /** Stroke width in px. Default scales with size. */
    thickness?: number;
    className?: string;
}

/**
 * The red rotating donut Flutter showed wherever a list was loading.
 * Use as a centered standalone spinner via `<CenteredSpinner />`.
 */
export function Spinner({ size = 32, thickness, className }: SpinnerProps) {
    const stroke = thickness ?? Math.max(2, Math.round(size / 11));
    return (
        <span
            className={['ara-donut', className ?? ''].filter(Boolean).join(' ')}
            style={{ width: size, height: size, borderWidth: stroke }}
            role="status"
            aria-label="불러오는 중"
        />
    );
}

interface CenteredSpinnerProps extends SpinnerProps {
    /** Vertical padding for the wrapper. Default 64px ≈ Flutter's centered loader. */
    padY?: number;
}

/** Flex-centered wrapper — the typical "list still loading" placement. */
export function CenteredSpinner({ padY = 64, ...rest }: CenteredSpinnerProps) {
    return (
        <div
            className="flex w-full items-center justify-center"
            style={{ paddingTop: padY, paddingBottom: padY }}
        >
            <Spinner {...rest} />
        </div>
    );
}
