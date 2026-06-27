import { apiFetch } from "@/lib/api/client";
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "@/lib/validations/product";
import type {
  ProductResponse,
  ProductSummaryResponse,
} from "@/types/product-api";

function buildProductsUrl(query: ListProductsQuery = {} as ListProductsQuery) {
  const params = new URLSearchParams();

  if (query.status) params.set("status", query.status);
  if (query.category) params.set("category", query.category);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortOrder) params.set("sortOrder", query.sortOrder);

  const queryString = params.toString();
  return queryString ? `/api/products?${queryString}` : "/api/products";
}

export async function fetchProductSummary(): Promise<ProductSummaryResponse> {
  return apiFetch<ProductSummaryResponse>("/api/products/summary");
}

export async function fetchProducts(
  query: ListProductsQuery,
): Promise<ProductResponse[]> {
  const data = await apiFetch<{ products: ProductResponse[] }>(
    buildProductsUrl(query),
  );

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
