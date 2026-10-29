"use client";

import { useApi } from "@/shared/lib/api";
import { PageHeader } from "@/shared/ui/primitives";
import { SupportCenter } from "@/shared/ui/account";
import type { VendorOrder } from "@/lib/types";

export default function SupportPage() {
  const { data } = useApi<VendorOrder[]>("/vendor/orders");
  return (
    <>
      <PageHeader title="Support" description="Talk to SecretWish operations about orders, listings, payouts or your account." />
      <SupportCenter orders={data?.map((o) => ({ id: o.id, reference: o.reference, label: o.lines[0]?.productName ?? "" }))} />
    </>
  );
}
