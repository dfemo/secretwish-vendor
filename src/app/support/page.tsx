"use client";

import { useApi, type Paged } from "@/shared/lib/api";
import { PageHeader } from "@/shared/ui/primitives";
import { SupportCenter } from "@/shared/ui/account";
import type { VendorOrder } from "@/lib/types";

export default function SupportPage() {
  // Recent orders for the "which order?" picker.
  const { data } = useApi<Paged<VendorOrder>>("/vendor/orders?pageSize=50");
  return (
    <>
      <PageHeader title="Support" description="Talk to SecretWish operations about orders, listings, payouts or your account." />
      <SupportCenter orders={data?.items.map((o) => ({ id: o.id, reference: o.reference, label: o.lines[0]?.productName ?? "" }))} />
    </>
  );
}
