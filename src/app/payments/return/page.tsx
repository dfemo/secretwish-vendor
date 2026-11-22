"use client";

import { Suspense } from "react";
import { PageSkeleton } from "@/shared/ui/primitives";
import { PaymentReturn } from "@/shared/ui/payment-return";

/** Where Paystack, Flutterwave and Stripe send stores back after paying for their plan. */
export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PaymentReturn home="/store" homeLabel="Back to your store" />
    </Suspense>
  );
}
