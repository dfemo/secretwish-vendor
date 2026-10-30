"use client";

import { useParams } from "next/navigation";
import { useApi } from "@/shared/lib/api";
import { ErrorState, PageSkeleton } from "@/shared/ui/primitives";
import { ProductEditor } from "@/components/product-editor";
import type { VendorProduct } from "@/lib/types";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  // The vendor API returns only this vendor's own products, so another vendor's id simply isn't found.
  const { data: product, error, loading, reload } = useApi<VendorProduct>(`/vendor/products/${id}`);
  if (loading) return <PageSkeleton />;
  if (error || !product) return <ErrorState error={error ?? { message: "Product not found." }} onRetry={reload} />;
  return <ProductEditor product={product} />;
}
