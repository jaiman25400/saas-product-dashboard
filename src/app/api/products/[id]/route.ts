import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api/errors";
import { requireAdmin, requireSessionUser } from "@/lib/auth/session";
import { updateProductSchema } from "@/lib/validations/product";
import { productService } from "@/services/product.service";
import { toProductResponse } from "@/types/product-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireSessionUser();
    const { id } = await context.params;
    const product = await productService.getProduct(user, id);

    return NextResponse.json({ product: toProductResponse(product) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();
    const { id } = await context.params;
    const body = updateProductSchema.parse(await request.json());
    const product = await productService.updateProduct(user, id, body);

    return NextResponse.json({ product: toProductResponse(product) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAdmin();
    const { id } = await context.params;

    await productService.deleteProduct(user, id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
