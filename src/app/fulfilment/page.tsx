"use client";

import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/shared/lib/api";
import { date, timeAgo } from "@/shared/lib/format";
import { statusMeta } from "@/shared/lib/status";
import { Button, Card, cx, ErrorState, PageHeader, PageSkeleton, ProductArt } from "@/shared/ui/primitives";
import { OrderActionDialog } from "@/shared/ui/order-actions";
import type { VendorOrder } from "@/lib/types";

const columns = [
  { status: "AwaitingVendorAcceptance", title: "To accept", hint: "Respond within 12 hours" },
  { status: "Processing", title: "Preparing", hint: "Pack discreetly, then dispatch" },
  { status: "Dispatched", title: "With courier", hint: "Delivery confirmed by recipient code or ops" },
  { status: "DeliveryException", title: "Exceptions", hint: "Re-dispatch or contact operations" },
];

export default function FulfilmentPage() {
  const { data, error, loading, reload } = useApi<VendorOrder[]>("/vendor/orders");
  const [action, setAction] = useState<{ order: VendorOrder; key: string; label: string } | null>(null);
  if (loading) return <PageSkeleton />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Fulfilment" description="Move each gift from accepted to dispatched. Every update reaches operations and the sender instantly." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((c) => {
          const orders = data.filter((o) => o.status === c.status);
          const Icon = statusMeta(c.status).icon;
          return (
            <section key={c.status} aria-labelledby={`col-${c.status}`} className="rounded-2xl bg-ink-100/60 p-3">
              <header className="mb-3 px-1">
                <h2 id={`col-${c.status}`} className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="size-4 text-plum-600" aria-hidden /> {c.title}
                  <span className="rounded-full bg-white px-2 text-xs">{orders.length}</span>
                </h2>
                <p className="text-[11px] text-ink-500">{c.hint}</p>
              </header>
              <ul className="space-y-2">
                {orders.length === 0 && <li className="rounded-xl border border-dashed border-ink-300 p-4 text-center text-xs text-ink-400">Nothing here</li>}
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
                            <Button key={a.key} size="sm" variant={a.key === "reject" || a.key === "report-issue" ? "ghost" : "subtle"} onClick={() => setAction({ order: o, ...a })}>
                              {a.key === "report-issue" ? "Problem" : a.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <OrderActionDialog action={action ? { key: action.key, label: action.label } : null} basePath="/vendor" orderId={action?.order.id ?? ""} onClose={() => setAction(null)} />
    </>
  );
}
