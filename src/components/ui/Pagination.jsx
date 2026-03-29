export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
      <div className="text-[12px] text-gray-500">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex gap-1">
        {/* Previous Button */}
        <button
          className="px-3 py-1 text-[12px] rounded border border-gray-200 bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        {/* Page Numbers */}
        {pages.map(page => (
          <button
            key={page}
            className={`px-3 py-1 text-[12px] rounded border ${
              page === currentPage
                ? 'bg-navy-700 text-white border-navy-700'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        {/* Next Button */}
        <button
          className="px-3 py-1 text-[12px] rounded border border-gray-200 bg-white text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
