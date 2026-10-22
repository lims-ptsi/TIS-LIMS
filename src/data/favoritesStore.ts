const FAVORITES_KEY = 'labtis_screen_favorites_v1';

type FavoriteMap = Record<string, string[]>;

function readMap(): FavoriteMap {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as FavoriteMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function favoritesFor(username: string): string[] {
  const key = username.trim().toLowerCase();
  const list = readMap()[key];
  return Array.isArray(list) ? list.filter((id) => typeof id === 'string') : [];
}

export function saveFavorites(username: string, ids: string[]): void {
  const key = username.trim().toLowerCase();
  const map = readMap();
  map[key] = [...new Set(ids)];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(map));
}
