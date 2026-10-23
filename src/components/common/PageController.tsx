import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '../../utils/pagination';

export interface PageControllerProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  rangeLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
  className?: string;
}

export const PageController: React.FC<PageControllerProps> = ({
  page,
  totalPages,
  pageSize,
  totalItems,
  rangeLabel,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className = '',
}) => {
  if (totalItems === 0) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2 border-t border-slate-200 bg-slate-50/80 text-xs text-slate-600 ${className}`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="tabular-nums font-medium text-slate-700">{rangeLabel}</span>
        <span className="hidden sm:inline text-slate-400">·</span>
        <label className="inline-flex items-center gap-1.5">
          <span className="text-slate-500">Rows</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0176d3] focus:ring-1 focus:ring-[#0176d3] cursor-pointer"
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] text-slate-500 tabular-nums mr-1 hidden md:inline">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
