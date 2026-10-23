import { useEffect, useMemo, useState } from 'react';

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100] as const;

export function totalPages(totalItems: number, pageSize: number): number {
  if (totalItems <= 0) return 1;
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function paginateSlice<T>(items: T[], page: number, pageSize: number): T[] {
  if (pageSize <= 0) return items;
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function pageRangeLabel(page: number, pageSize: number, totalItems: number): string {
  if (totalItems === 0) return '0 of 0';
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return `${start}–${end} of ${totalItems}`;
}

/** Keeps page in range and resets to page 1 when dependencies change (e.g. filters). */
export function usePagination(
  totalItems: number,
  resetDeps: readonly unknown[],
  initialPageSize: number = 15
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional filter/search reset
  }, [...resetDeps, pageSize]);

  const pages = useMemo(() => totalPages(totalItems, pageSize), [totalItems, pageSize]);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const safePage = Math.min(Math.max(1, page), pages);

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    totalPages: pages,
    rangeLabel: pageRangeLabel(safePage, pageSize, totalItems),
  };
}
