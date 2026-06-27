import { apiFetch } from "@/lib/api/client";
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "@/lib/validations/product";
import type {
  ProductListResponse,
  ProductResponse,
  ProductSummaryResponse,
} from "@/types/product-api";

function buildProductsUrl(query: ListProductsQuery) {
  const params = new URLSearchParams();

  if (query.status) params.set("status", query.status);
  if (query.category) params.set("category", query.category);
  if (query.search) params.set("search", query.search);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortOrder) params.set("sortOrder", query.sortOrder);
  if (query.limit) params.set("limit", String(query.limit));
  if (query.cursor) params.set("cursor", query.cursor);

  const queryString = params.toString();
  return queryString ? `/api/products?${queryString}` : "/api/products";
}

export async function fetchProductSummary(): Promise<ProductSummaryResponse> {
  return apiFetch<ProductSummaryResponse>("/api/products/summary");
}

export async function fetchProductsPage(
  query: ListProductsQuery,
): Promise<ProductListResponse> {
  return apiFetch<ProductListResponse>(buildProductsUrl(query));
}

export async function fetchProducts(
  query: ListProductsQuery,
): Promise<ProductResponse[]> {
  const data = await fetchProductsPage(query);
  return data.products;
}

export async function createProduct(
  input: CreateProductInput,
): Promise<ProductResponse> {
  const data = await apiFetch<{ product: ProductResponse }>("/api/products", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return data.product;
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<ProductResponse> {
  const data = await apiFetch<{ product: ProductResponse }>(
    `/api/products/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );

  return data.product;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<{ ok: true }>(`/api/products/${id}`, {
    method: "DELETE",
  });
}
