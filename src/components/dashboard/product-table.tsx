import type { ProductResponse } from "@/types/product-api";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

type ProductTableProps = {
  products: ProductResponse[];
  loading: boolean;
  isAdmin: boolean;
  onEdit: (product: ProductResponse) => void;
  onDelete: (product: ProductResponse) => void;
};

export function ProductTable({
  products,
  loading,
  isAdmin,
  onEdit,
  onDelete,
}: ProductTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
        Loading products...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
        No products found. {isAdmin ? "Create your first product to get started." : ""}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              {isAdmin ? (
                <th className="px-4 py-3 font-medium">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {product.name}
                </td>
                <td className="px-4 py-3 text-zinc-700">{product.category}</td>
                <td className="px-4 py-3 text-zinc-700">
                  {formatCurrency(product.price)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium uppercase ${
                      product.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {formatDate(product.createdAt)}
                </td>
                {isAdmin ? (
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(product)}
                        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
