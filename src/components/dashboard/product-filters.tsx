import { PRODUCT_STATUSES } from "@/types/product";
import type { ListProductsQuery } from "@/lib/validations/product";

type ProductFiltersProps = {
  filters: ListProductsQuery;
  onChange: (filters: ListProductsQuery) => void;
};

export function ProductFilters({ filters, onChange }: ProductFiltersProps) {
  return (
    <div className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-4">
      <label className="space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">Status</span>
        <select
          value={filters.status ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              status:
                event.target.value === ""
                  ? undefined
                  : (event.target.value as ListProductsQuery["status"]),
            })
          }
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        >
          <option value="">All</option>
          {PRODUCT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">Category</span>
        <input
          type="text"
          value={filters.category ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              category: event.target.value || undefined,
            })
          }
          placeholder="e.g. Electronics"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </label>

      <label className="space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">Sort by</span>
        <select
          value={filters.sortBy}
          onChange={(event) =>
            onChange({
              ...filters,
              sortBy: event.target.value as ListProductsQuery["sortBy"],
            })
          }
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        >
          <option value="createdAt">Created date</option>
          <option value="name">Name</option>
          <option value="price">Price</option>
        </select>
      </label>

      <label className="space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">Order</span>
        <select
          value={filters.sortOrder}
          onChange={(event) =>
            onChange({
              ...filters,
              sortOrder: event.target.value as ListProductsQuery["sortOrder"],
            })
          }
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </label>
    </div>
  );
}
