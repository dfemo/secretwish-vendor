"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useApi } from "@/shared/lib/api";
import { useSession } from "@/shared/lib/session";
import { dateTime } from "@/shared/lib/format";
import { ButtonLink, Card, EmptyState, ErrorState, Notice, PageHeader, ProductArt, Spinner, StatusBadge } from "@/shared/ui/primitives";
import type { VendorOrder } from "@/lib/types";

export default function ReturnsPage() {
  const { data, error, loading, reload } = useApi<VendorOrder[]>("/vendor/orders");
  const { fmt } = useSession();
  const rows = data?.filter((o) => ["RefundRequested", "RefundCompleted", "DeliveryException"].includes(o.status)) ?? [];
  return (
    <>
      <PageHeader title="Returns & Issues" description="Refund requests, disputes and delivery exceptions on your orders. SecretWish operations make refund decisions and keep you informed." />
      <Notice className="mb-6" tone="info">
        Refunds and chargebacks are decided by SecretWish Finance with evidence from you, the courier and the customer. Orders with an open case are not paid out until resolved.
      </Notice>
      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && rows.length === 0 && <EmptyState icon={RotateCcw} title="No open issues" description="Great work — nothing needs attention." />}
      <ul className="space-y-3">
        {rows.map((o) => (
          <li key={o.id}>
            <Card className="flex flex-wrap items-center gap-4 p-4">
              <ProductArt emoji={o.lines[0]?.emoji ?? "🎁"} size="md" />
              <div className="min-w-[200px] flex-1">
                <Link href={`/orders/${o.id}`} className="font-semibold hover:text-plum-700">{o.reference} · {o.lines[0]?.productName}</Link>
                <p className="text-xs text-ink-500">Placed {dateTime(o.createdAt)} · {o.recipient.city} · your net {fmt(o.earnings.net)}</p>
              </div>
              <StatusBadge status={o.status} />
              <ButtonLink href={`/support?order=${o.id}`} variant="secondary" size="sm">Send evidence to ops</ButtonLink>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
