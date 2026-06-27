import "server-only";

import type { SessionUser } from "@/lib/auth/session";
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "@/lib/validations/product";
import { productRepository } from "@/repositories/product.repository";
import type { Product } from "@/types/product";
import type { ProductSummaryResponse } from "@/types/product-api";

export class ProductService {
  async listProducts(
    user: SessionUser,
    query: ListProductsQuery,
  ): Promise<Product[]> {
    void user;
    return productRepository.findAll(query);
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
}

export const productService = new ProductService();
