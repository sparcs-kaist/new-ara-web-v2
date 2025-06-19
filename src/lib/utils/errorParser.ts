export function errorParser(data: Record<string, unknown>): string {
  return Object.keys(data).reduce<string[]>((messages, key) => {
    const value = data[key];

    if (Array.isArray(value)) {
      messages.push(...value.map(String));
    } else if (typeof value === 'object' && value !== null) {
      messages.push(errorParser(value as Record<string, unknown>));
    } else {
      messages.push(String(value));
    }

    return messages;
  }, []).join('\n');
}