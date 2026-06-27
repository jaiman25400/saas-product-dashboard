type ProductPaginationProps = {
  count: number;
  hasMore: boolean;
  hasPrevious: boolean;
  loading: boolean;
  onNext: () => void;
  onPrevious: () => void;
};

export function ProductPagination({
  count,
  hasMore,
  hasPrevious,
  loading,
  onNext,
  onPrevious,
}: ProductPaginationProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-zinc-600">
        Showing <span className="font-medium text-zinc-900">{count}</span>{" "}
        product{count === 1 ? "" : "s"} on this page
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious || loading}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasMore || loading}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
