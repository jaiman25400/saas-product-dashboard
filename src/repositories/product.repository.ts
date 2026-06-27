import "server-only";

import {
  FieldPath,
  FieldValue,
  type Timestamp,
  type Query,
} from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase/admin";
import {
  decodeProductCursor,
  encodeProductCursor,
} from "@/lib/pagination/cursor";
import { COLLECTIONS } from "@/lib/firestore/collections";
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "@/lib/validations/product";
import type { Product, ProductDocument } from "@/types/product";
import type { ProductSummaryResponse } from "@/types/product-api";

export type ProductPageResult = {
  products: Product[];
  nextCursor: string | null;
  hasMore: boolean;
};

const SEARCH_BATCH_MULTIPLIER = 3;
const MAX_SEARCH_BATCHES = 5;

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

function matchesSearch(product: Product, search?: string): boolean {
  if (!search) {
    return true;
  }

  const term = search.toLowerCase();

  return (
    product.name.toLowerCase().includes(term) ||
    product.category.toLowerCase().includes(term)
  );
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

  private buildOrderedQuery(query: ListProductsQuery): {
    firestoreQuery: Query;
    sortHandledByFirestore: boolean;
    categoryFilterInMemory: boolean;
  } {
    const { status, category, sortBy, sortOrder } = query;

    let firestoreQuery: Query = this.collection();
    let sortHandledByFirestore = false;
    let categoryFilterInMemory = false;

    if (status && sortBy === "createdAt") {
      firestoreQuery = firestoreQuery
        .where("status", "==", status)
        .orderBy("createdAt", sortOrder)
        .orderBy(FieldPath.documentId(), sortOrder);
      sortHandledByFirestore = true;
      categoryFilterInMemory = Boolean(category);
    } else if (category && sortBy === "createdAt") {
      firestoreQuery = firestoreQuery
        .where("category", "==", category)
        .orderBy("createdAt", sortOrder)
        .orderBy(FieldPath.documentId(), sortOrder);
      sortHandledByFirestore = true;
    } else if (status) {
      firestoreQuery = firestoreQuery.where("status", "==", status);
      categoryFilterInMemory = Boolean(category);
    } else if (category) {
      firestoreQuery = firestoreQuery.where("category", "==", category);
    } else {
      firestoreQuery = firestoreQuery
        .orderBy(sortBy, sortOrder)
        .orderBy(FieldPath.documentId(), sortOrder);
      sortHandledByFirestore = true;
    }

    return { firestoreQuery, sortHandledByFirestore, categoryFilterInMemory };
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

  async findPage(query: ListProductsQuery): Promise<ProductPageResult> {
    const { category, sortBy, sortOrder, search, limit, cursor } = query;

    const { firestoreQuery, sortHandledByFirestore, categoryFilterInMemory } =
      this.buildOrderedQuery(query);

    const pageLimit = limit;
    const collected: Product[] = [];
    let currentCursor = cursor;
    let firestoreHasMore = true;
    let batchesRead = 0;

    while (
      collected.length < pageLimit &&
      firestoreHasMore &&
      batchesRead < (search ? MAX_SEARCH_BATCHES : 1)
    ) {
      batchesRead += 1;

      let batchQuery: Query = firestoreQuery;

      if (currentCursor) {
        const cursorDoc = await this.collection()
          .doc(decodeProductCursor(currentCursor))
          .get();

        if (cursorDoc.exists) {
          batchQuery = batchQuery.startAfter(cursorDoc);
        }
      }

      const batchSize = search
        ? pageLimit * SEARCH_BATCH_MULTIPLIER
        : pageLimit + 1;

      const snapshot = await batchQuery.limit(batchSize).get();
      firestoreHasMore = snapshot.size === batchSize;

      let products = snapshot.docs.map((doc) =>
        mapDocToProduct(doc.id, doc.data()),
      );

      if (categoryFilterInMemory && category) {
        products = products.filter((product) => product.category === category);
      }

      if (!sortHandledByFirestore) {
        products = [...products].sort((a, b) =>
          compareProducts(a, b, sortBy, sortOrder),
        );
      }

      products = products.filter((product) => matchesSearch(product, search));

      for (const product of products) {
        if (collected.length >= pageLimit) {
          break;
        }

        collected.push(product);
      }

      if (!search) {
        const hasMore = snapshot.size > pageLimit;
        const pageProducts = hasMore
          ? collected.slice(0, pageLimit)
          : collected;

        return {
          products: pageProducts,
          nextCursor:
            hasMore && pageProducts.length > 0
              ? encodeProductCursor(pageProducts[pageProducts.length - 1]!.id)
              : null,
          hasMore,
        };
      }

      if (snapshot.docs.length > 0) {
        currentCursor = encodeProductCursor(
          snapshot.docs[snapshot.docs.length - 1]!.id,
        );
      } else {
        firestoreHasMore = false;
      }
    }

    const hasMore = firestoreHasMore && collected.length >= pageLimit;

    return {
      products: collected,
      nextCursor:
        hasMore && collected.length > 0
          ? encodeProductCursor(collected[collected.length - 1]!.id)
          : null,
      hasMore,
    };
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
