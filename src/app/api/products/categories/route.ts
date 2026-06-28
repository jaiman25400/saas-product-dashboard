import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api/errors";
import { requireSessionUser } from "@/lib/auth/session";
import { productService } from "@/services/product.service";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const categories = await productService.getCategories(user);

    return NextResponse.json({ categories });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
