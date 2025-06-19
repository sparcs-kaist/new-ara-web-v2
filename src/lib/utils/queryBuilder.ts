type QueryValue = string | number | boolean | null | undefined;
export function queryBuilder(params: Record<string, QueryValue>): string {
  return (Object.entries(params) as [string, QueryValue][])
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}