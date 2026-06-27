/** Compatible with Firebase client and admin Timestamp objects. */
export type FirestoreTimestamp = {
  toDate(): Date;
  toMillis(): number;
};

/** Allowed product status values — stored as strings in Firestore. */
export const PRODUCT_STATUSES = ["active", "inactive"] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/**
 * Fields stored inside `products/{productId}`.
 * The document ID is not stored — we attach it as `id` when reading.
 */
export interface ProductDocument {
  name: string;
  category: string;
  price: number;
  status: ProductStatus;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  createdBy: string;
  organizationId?: string;
}

/**
 * Product as used in app/API code — includes the Firestore document ID.
 */
export interface Product extends ProductDocument {
  id: string;
}
