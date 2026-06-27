import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api/errors";
import { requireAdmin, requireSessionUser } from "@/lib/auth/session";
import {
  createProductSchema,
  listProductsQuerySchema,
} from "@/lib/validations/product";
import { productService } from "@/services/product.service";
import { toProductResponse } from "@/types/product-api";

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = listProductsQuerySchema.parse(params);
    const products = await productService.listProducts(user, query);

    return NextResponse.json({
      products: products.map(toProductResponse),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = createProductSchema.parse(await request.json());
    const product = await productService.createProduct(user, body);

    return NextResponse.json(
      { product: toProductResponse(product) },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
