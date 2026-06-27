import type { ProductSummaryResponse } from "@/types/product-api";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function MetricCards({
  summary,
  loading,
}: {
  summary: ProductSummaryResponse | null;
  loading: boolean;
}) {
  const cards = [
    {
      label: "Total products",
      value: summary ? String(summary.totalProducts) : "—",
    },
    {
      label: "Active products",
      value: summary ? String(summary.activeCount) : "—",
    },
    {
      label: "Revenue (active)",
      value: summary ? formatCurrency(summary.revenueTotal) : "—",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-zinc-500">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">
            {loading ? "..." : card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
