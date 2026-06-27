import { z } from "zod"; // Zod is a schema validation library for TypeScript that allows you to define schemas for your data. It is used to validate the data that is sent to the server.

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
  sortBy: z.enum(["createdAt", "name", "price"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
