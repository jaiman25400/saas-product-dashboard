import "server-only";

import {
  FieldValue,
  type Timestamp,
  type Query,
} from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "@/lib/validations/product";
import type { Product, ProductDocument } from "@/types/product";
import type { ProductSummaryResponse } from "@/types/product-api";

function mapDocToProduct(
  id: string,
  data: FirebaseFirestore.DocumentData,
): Product {
  return {
    id,
    name: data.name,
    category: data.category,
    price: data.price,
    status: data.status,
    createdAt: data.createdAt as Timestamp as Product["createdAt"],
    updatedAt: data.updatedAt as Timestamp as Product["updatedAt"],
    createdBy: data.createdBy,
    organizationId: data.organizationId,
  };
}

function compareProducts(
  a: Product,
  b: Product,
  sortBy: ListProductsQuery["sortBy"],
  sortOrder: ListProductsQuery["sortOrder"],
): number {
  let result = 0;

  if (sortBy === "name") {
    result = a.name.localeCompare(b.name);
  } else if (sortBy === "price") {
    result = a.price - b.price;
  } else {
    result = a.createdAt.toMillis() - b.createdAt.toMillis();
  }

  return sortOrder === "asc" ? result : -result;
}

export class ProductRepository {
  private collection() {
    return getAdminDb().collection(COLLECTIONS.products);
  }

  async create(
    input: CreateProductInput,
    createdBy: string,
  ): Promise<Product> {
    const now = FieldValue.serverTimestamp();
    const docRef = await this.collection().add({
      ...input,
      createdBy,
      createdAt: now,
      updatedAt: now,
    } satisfies Omit<ProductDocument, "createdAt" | "updatedAt"> & {
      createdAt: FieldValue;
      updatedAt: FieldValue;
    });

    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      throw new Error("Failed to create product");
    }

    return mapDocToProduct(snapshot.id, snapshot.data()!);
  }

  async findById(id: string): Promise<Product | null> {
    const snapshot = await this.collection().doc(id).get();

    if (!snapshot.exists) {
      return null;
    }

    return mapDocToProduct(snapshot.id, snapshot.data()!);
  }

  async findAll(query: ListProductsQuery): Promise<Product[]> {
    const { status, category, sortBy, sortOrder } = query;

    let firestoreQuery: Query = this.collection();
    let sortHandledByFirestore = false;

    if (status && sortBy === "createdAt") {
      firestoreQuery = firestoreQuery
        .where("status", "==", status)
        .orderBy("createdAt", sortOrder);
      sortHandledByFirestore = true;
    } else if (category && sortBy === "createdAt") {
      firestoreQuery = firestoreQuery
        .where("category", "==", category)
        .orderBy("createdAt", sortOrder);
      sortHandledByFirestore = true;
    } else if (status) {
      firestoreQuery = firestoreQuery.where("status", "==", status);
    } else if (category) {
      firestoreQuery = firestoreQuery.where("category", "==", category);
    } else {
      firestoreQuery = firestoreQuery.orderBy(sortBy, sortOrder);
      sortHandledByFirestore = true;
    }

    const snapshot = await firestoreQuery.get();
    let products = snapshot.docs.map((doc) =>
      mapDocToProduct(doc.id, doc.data()),
    );

    if (status && category) {
      products = products.filter((product) => product.category === category);
    }

    if (!sortHandledByFirestore) {
      products = [...products].sort((a, b) =>
        compareProducts(a, b, sortBy, sortOrder),
      );
    }

    return products;
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const docRef = this.collection().doc(id);
    const existing = await docRef.get();

    if (!existing.exists) {
      throw new Error("Product not found");
    }

    await docRef.update({
      ...input,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updated = await docRef.get();
    return mapDocToProduct(updated.id, updated.data()!);
  }

  async delete(id: string): Promise<void> {
    const docRef = this.collection().doc(id);
    const existing = await docRef.get();

    if (!existing.exists) {
      throw new Error("Product not found");
    }

    await docRef.delete();
  }

  async getSummary(): Promise<ProductSummaryResponse> {
    const snapshot = await this.collection().get();

    let activeCount = 0;
    let revenueTotal = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.status === "active") {
        activeCount += 1;
        revenueTotal += Number(data.price) || 0;
      }
    });

    return {
      totalProducts: snapshot.size,
      activeCount,
      revenueTotal,
    };
  }
}

export const productRepository = new ProductRepository();
