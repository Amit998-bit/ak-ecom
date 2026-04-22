'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage:  number;
  totalPages:   number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const visiblePages = pages.filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2
  );

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {visiblePages.map((page, idx) => {
        const prev = visiblePages[idx - 1];
        return (
          <>
            {prev && page - prev > 1 && (
              <span key={'ellipsis-' + page} className="px-2 text-gray-400">...</span>
            )}
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={'w-10 h-10 rounded-xl text-sm font-semibold transition ' + (page === currentPage ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50')}
            >
              {page}
            </button>
          </>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
