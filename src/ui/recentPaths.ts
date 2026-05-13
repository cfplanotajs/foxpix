export function pushRecentPath(list: string[] | undefined, value: string, max = 8): string[] {
  if (!value) return list ?? [];
  const next = [value, ...(list ?? []).filter((v) => v !== value)];
  return next.slice(0, max);
}

export function clearRecentPaths(): string[] {
  return [];
}
