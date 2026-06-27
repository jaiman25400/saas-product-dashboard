import type { Product, ProductStatus } from "@/types/product";

export type ProductResponse = {
  id: string;
  name: string;
  category: string;
  price: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  organizationId?: string;
};

export type ProductSummaryResponse = {
  totalProducts: number;
  activeCount: number;
  revenueTotal: number;
};

export function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    status: product.status,
    createdAt: product.createdAt.toDate().toISOString(),
    updatedAt: product.updatedAt.toDate().toISOString(),
    createdBy: product.createdBy,
    organizationId: product.organizationId,
  };
}
