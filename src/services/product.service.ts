import "server-only";

import type { SessionUser } from "@/lib/auth/session";
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "@/lib/validations/product";
import { productRepository } from "@/repositories/product.repository";
import type { Product } from "@/types/product";
import type {
  ProductListResponse,
  ProductSummaryResponse,
} from "@/types/product-api";

export class ProductService {
  async listProducts(
    user: SessionUser,
    query: ListProductsQuery,
  ): Promise<Product[]> {
    void user;
    const page = await productRepository.findPage(query);
    return page.products;
  }

  async listProductsPage(
    user: SessionUser,
    query: ListProductsQuery,
  ): Promise<{
    products: Product[];
    pagination: ProductListResponse["pagination"];
  }> {
    void user;
    const page = await productRepository.findPage(query);

    return {
      products: page.products,
      pagination: {
        limit: query.limit,
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
      },
    };
  }

  async getProduct(user: SessionUser, id: string): Promise<Product> {
    void user;
    const product = await productRepository.findById(id);

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  }

  async createProduct(
    user: SessionUser,
    input: CreateProductInput,
  ): Promise<Product> {
    if (user.role !== "admin") {
      throw new Error("Forbidden");
    }

    return productRepository.create(input, user.uid);
  }

  async updateProduct(
    user: SessionUser,
    id: string,
    input: UpdateProductInput,
  ): Promise<Product> {
    if (user.role !== "admin") {
      throw new Error("Forbidden");
    }

    if (Object.keys(input).length === 0) {
      throw new Error("No fields provided to update");
    }

    return productRepository.update(id, input);
  }

  async deleteProduct(user: SessionUser, id: string): Promise<void> {
    if (user.role !== "admin") {
      throw new Error("Forbidden");
    }

    await productRepository.delete(id);
  }

  async getSummary(user: SessionUser): Promise<ProductSummaryResponse> {
    void user;
    return productRepository.getSummary();
  }

  async getCategories(user: SessionUser): Promise<string[]> {
    void user;
    return productRepository.getCategories();
  }
}

export const productService = new ProductService();
