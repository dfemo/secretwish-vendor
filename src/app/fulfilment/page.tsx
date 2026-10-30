"use client";

import Link from "next/link";
import { useState } from "react";
import { useApi, type Paged } from "@/shared/lib/api";
import { date, timeAgo } from "@/shared/lib/format";
import { statusMeta } from "@/shared/lib/status";
import { Button, Card, cx, ErrorState, PageHeader, ProductArt, Skeleton } from "@/shared/ui/primitives";
import { OrderActionDialog } from "@/shared/ui/order-actions";
import type { VendorOrder } from "@/lib/types";

const columns = [
  { status: "AwaitingVendorAcceptance", title: "To accept", hint: "Respond within 12 hours" },
  { status: "Processing", title: "Preparing", hint: "Pack discreetly, then dispatch" },
  { status: "Dispatched", title: "With courier", hint: "Delivery confirmed by recipient code or ops" },
  { status: "DeliveryException", title: "Exceptions", hint: "Re-dispatch or contact operations" },
];

export default function FulfilmentPage() {
  const [action, setAction] = useState<{ order: VendorOrder; key: string; label: string } | null>(null);
  return (
    <>
      <PageHeader title="Fulfilment" description="Move each gift from accepted to dispatched. Every update reaches operations and the sender instantly." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((c) => (
          <BoardColumn key={c.status} column={c} onAction={setAction} />
        ))}
      </div>
      <OrderActionDialog action={action ? { key: action.key, label: action.label } : null} basePath="/vendor" orderId={action?.order.id ?? ""} onClose={() => setAction(null)} />
    </>
  );
}

const perColumn = 25;

/** One status column. Loads only its own orders (the oldest-waiting first page) and links to the full list when there are more. */
function BoardColumn({ column: c, onAction }: { column: (typeof columns)[number]; onAction: (a: { order: VendorOrder; key: string; label: string }) => void }) {
  const { data, error, loading, reload } = useApi<Paged<VendorOrder>>(`/vendor/orders?status=${c.status}&pageSize=${perColumn}`);
  const orders = data?.items ?? [];
  const Icon = statusMeta(c.status).icon;
  return (
    <section aria-labelledby={`col-${c.status}`} className="rounded-2xl bg-ink-100/60 p-3">
      <header className="mb-3 px-1">
        <h2 id={`col-${c.status}`} className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="size-4 text-plum-600" aria-hidden /> {c.title}
          <span className="rounded-full bg-white px-2 text-xs">{data ? `${data.total.toLocaleString()}${data.totalCapped ? "+" : ""}` : "…"}</span>
        </h2>
        <p className="text-[11px] text-ink-500">{c.hint}</p>
      </header>
      {loading && <Skeleton className="h-24" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      <ul className="space-y-2">
        {data && orders.length === 0 && <li className="rounded-xl border border-dashed border-ink-300 p-4 text-center text-xs text-ink-400">Nothing here</li>}
        {orders.map((o) => (
          <li key={o.id}>
            <Card className="p-3">
              <Link href={`/orders/${o.id}`} className="flex items-center gap-2 hover:text-plum-700">
                <ProductArt emoji={o.lines[0]?.emoji ?? "🎁"} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold">{o.lines[0]?.productName}</span>
                  <span className="block text-[11px] text-ink-500">{o.reference} · {o.recipient.city}</span>
                </span>
              </Link>
              <p className={cx("mt-2 text-[11px]", o.acceptBy ? "font-semibold text-warning-700" : "text-ink-500")}>
                {o.acceptBy ? `Accept ${timeAgo(o.acceptBy)}` : o.delivery.trackingReference ? `${o.delivery.courier} · ${o.delivery.trackingReference}` : `Deliver by ${date(o.delivery.deliveryDate)}`}
              </p>
              {o.actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {o.actions.map((a) => (
                    <Button key={a.key} size="sm" variant={a.key === "reject" || a.key === "report-issue" ? "ghost" : "subtle"} onClick={() => onAction({ order: o, ...a })}>
                      {a.key === "report-issue" ? "Problem" : a.label}
                    </Button>
                  ))}
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
      {data && data.total > orders.length && (
        <Link href={`/orders?status=${c.status}`} className="mt-3 block text-center text-xs font-semibold text-plum-700 hover:underline">
          See all {data.total.toLocaleString()}{data.totalCapped ? "+" : ""} in Orders →
        </Link>
      )}
    </section>
  );
}
