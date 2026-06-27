"use client";

import { FormEvent, useState } from "react";

import { PRODUCT_STATUSES } from "@/types/product";
import type { ProductResponse } from "@/types/product-api";
import type { CreateProductInput } from "@/lib/validations/product";

type ProductFormModalProps = {
  mode: "create" | "edit";
  product: ProductResponse | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: CreateProductInput) => Promise<void>;
};

const emptyForm: CreateProductInput = {
  name: "",
  category: "",
  price: 0,
  status: "active",
};

function getInitialForm(
  mode: ProductFormModalProps["mode"],
  product: ProductResponse | null,
): CreateProductInput {
  if (mode === "edit" && product) {
    return {
      name: product.name,
      category: product.category,
      price: product.price,
      status: product.status,
    };
  }

  return emptyForm;
}

export function ProductFormModal({
  mode,
  product,
  submitting,
  onClose,
  onSubmit,
}: ProductFormModalProps) {
  const [form, setForm] = useState(() => getInitialForm(mode, product));
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">
            {mode === "create" ? "Create product" : "Edit product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            Close
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">Category</span>
            <input
              type="text"
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">Price</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.price || ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  price: Number(event.target.value),
                }))
              }
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700">Status</span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as CreateProductInput["status"],
                }))
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            >
              {PRODUCT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {submitting
                ? "Saving..."
                : mode === "create"
                  ? "Create product"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
