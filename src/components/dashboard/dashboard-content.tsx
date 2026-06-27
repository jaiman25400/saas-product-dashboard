"use client";

import { useEffect, useState } from "react";

import { MetricCards } from "@/components/dashboard/metric-cards";
import { ProductFilters } from "@/components/dashboard/product-filters";
import { ProductFormModal } from "@/components/dashboard/product-form-modal";
import { ProductPagination } from "@/components/dashboard/product-pagination";
import { ProductTable } from "@/components/dashboard/product-table";
import { useAuth } from "@/contexts/auth-provider";
import {
  createProduct,
  deleteProduct,
  fetchProductsPage,
  fetchProductSummary,
  updateProduct,
} from "@/lib/api/products";
import type { ListProductsQuery } from "@/lib/validations/product";
import type {
  ProductPaginationResponse,
  ProductResponse,
  ProductSummaryResponse,
} from "@/types/product-api";
import type { CreateProductInput } from "@/lib/validations/product";
import type { Role } from "@/types/role";

const defaultFilters: ListProductsQuery = {
  sortBy: "createdAt",
  sortOrder: "desc",
  limit: 10,
};

type DashboardContentProps = {
  serverRole: Role;
};

export function DashboardContent({ serverRole }: DashboardContentProps) {
  const { role: clientRole } = useAuth();
  const role = clientRole ?? serverRole;
  const isAdmin = role === "admin";

  const [summary, setSummary] = useState<ProductSummaryResponse | null>(null);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [pagination, setPagination] = useState<ProductPaginationResponse>({
    limit: defaultFilters.limit,
    nextCursor: null,
    hasMore: false,
  });
  const [filters, setFilters] = useState<ListProductsQuery>(defaultFilters);
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    void fetchProductSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load summary",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSummary(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetchProductsPage({ ...filters, cursor })
      .then((data) => {
        if (!cancelled) {
          setProducts(data.products);
          setPagination(data.pagination);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load products",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, cursor]);

  function resetPagination() {
    setCursor(undefined);
    setCursorHistory([]);
  }

  function handleFiltersChange(newFilters: ListProductsQuery) {
    setLoadingProducts(true);
    resetPagination();
    setFilters(newFilters);
  }

  function handleNextPage() {
    if (!pagination.nextCursor) return;

    setLoadingProducts(true);
    setCursorHistory((history) => [...history, cursor ?? ""]);
    setCursor(pagination.nextCursor);
  }

  function handlePreviousPage() {
    if (cursorHistory.length === 0) return;

    setLoadingProducts(true);
    const history = [...cursorHistory];
    const previousCursor = history.pop() ?? "";
    setCursorHistory(history);
    setCursor(previousCursor || undefined);
  }

  async function refreshAll() {
    setLoadingSummary(true);
    setLoadingProducts(true);

    try {
      const [summaryData, productsData] = await Promise.all([
        fetchProductSummary(),
        fetchProductsPage({ ...filters, cursor }),
      ]);
      setSummary(summaryData);
      setProducts(productsData.products);
      setPagination(productsData.pagination);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh dashboard",
      );
    } finally {
      setLoadingSummary(false);
      setLoadingProducts(false);
    }
  }

  function openCreateModal() {
    setModalMode("create");
    setSelectedProduct(null);
    setModalOpen(true);
  }

  function openEditModal(product: ProductResponse) {
    setModalMode("edit");
    setSelectedProduct(product);
    setModalOpen(true);
  }

  async function handleSave(input: CreateProductInput) {
    setSubmitting(true);
    try {
      if (modalMode === "create") {
        await createProduct(input);
      } else if (selectedProduct) {
        await updateProduct(selectedProduct.id, input);
      }
      resetPagination();
      await refreshAll();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(product: ProductResponse) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await deleteProduct(product.id);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="mt-2 text-zinc-600">
            {isAdmin
              ? "Manage products, view metrics, and keep your catalog up to date."
              : "View products and dashboard metrics."}
          </p>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Add product
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <MetricCards summary={summary} loading={loadingSummary} />

      <ProductFilters filters={filters} onChange={handleFiltersChange} />

      <ProductTable
        products={products}
        loading={loadingProducts}
        isAdmin={isAdmin}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      <ProductPagination
        count={products.length}
        hasMore={pagination.hasMore}
        hasPrevious={cursorHistory.length > 0}
        loading={loadingProducts}
        onNext={handleNextPage}
        onPrevious={handlePreviousPage}
      />

      {modalOpen ? (
        <ProductFormModal
          key={`${modalMode}-${selectedProduct?.id ?? "new"}`}
          mode={modalMode}
          product={selectedProduct}
          submitting={submitting}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSave}
        />
      ) : null}
    </div>
  );
}
