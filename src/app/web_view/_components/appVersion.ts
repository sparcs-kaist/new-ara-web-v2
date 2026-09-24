export const MIN_APP_VERSION = { android: '1.2.5', ios: '1.2.4' } as const;

export const STORE_URL = {
    android: 'market://details?id=org.sparcs.newara',
    ios: 'https://apps.apple.com/kr/app/ara-for-kaist/id6457209147',
} as const;

// appVersion is '<version>+<buildNumber>'; only the version part is compared.
export function isBelow(version: string, min: string): boolean {
    const parse = (v: string) => v.split('+')[0].split('.').map((p) => Number(p) || 0);
    const a = parse(version);
    const b = parse(min);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const d = (a[i] ?? 0) - (b[i] ?? 0);
        if (d !== 0) return d < 0;
    }
    return false;
}
