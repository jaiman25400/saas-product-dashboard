import { z } from "zod";

import { PRODUCT_STATUSES } from "@/types/product";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  category: z.string().trim().min(1, "Category is required").max(100),
  price: z.number().positive("Price must be greater than 0"),
  status: z.enum(PRODUCT_STATUSES),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductsQuerySchema = z.object({
  status: z.enum(PRODUCT_STATUSES).optional(),
  category: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  sortBy: z.enum(["createdAt", "name", "price"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  cursor: z.string().trim().min(1).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
