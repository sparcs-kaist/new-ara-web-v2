'use client';

/**
 * Custom large header for the Board (게시판) tab root. Mirrors the home tab
 * header style — no back button.
 */
export function BoardHeader() {
    return (
        <header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 40,
                background: 'var(--ara-bg)',
                borderBottom: '1px solid var(--ara-divider)',
                padding: '12px var(--ara-spacing-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}
        >
            <h1
                style={{
                    margin: 0,
                    color: 'var(--ara-text-primary)',
                    fontSize: 22,
                    fontWeight: 700,
                }}
            >
                게시판
            </h1>
        </header>
    );
}
