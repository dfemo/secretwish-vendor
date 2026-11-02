"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Clock, EyeOff, Info, MapPin, Phone } from "lucide-react";
import { useApi } from "@/shared/lib/api";
import { useSession } from "@/shared/lib/session";
import { date, dateTime, timeAgo } from "@/shared/lib/format";
import { Badge, Button, Card, CardHeader, cx, ErrorState, Notice, PageSkeleton, ProductArt, Stat, StatusBadge } from "@/shared/ui/primitives";
import { Timeline } from "@/shared/ui/data";
import { OrderActionDialog } from "@/shared/ui/order-actions";
import type { VendorOrder } from "@/lib/types";

export default function VendorOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: o, error, loading, reload } = useApi<VendorOrder>(`/vendor/orders/${id}`);
  const { fmt } = useSession();
  const [action, setAction] = useState<{ key: string; label: string } | null>(null);
  if (loading) return <PageSkeleton />;
  if (error || !o) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <Link href="/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-plum-700">
        <ArrowLeft className="size-4" aria-hidden /> Orders
      </Link>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-semibold text-plum-900">{o.reference}</h1>
            <StatusBadge status={o.status} />
          </div>
          <p className="mt-1 text-sm text-ink-500">Placed {dateTime(o.createdAt)} · for SecretWish customer</p>
          {o.acceptBy && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-700">
              <Clock className="size-3.5" aria-hidden /> Accept {timeAgo(o.acceptBy)} to protect your acceptance rate
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {o.actions.map((a) => (
            <Button key={a.key} variant={a.key === "reject" || a.key === "report-issue" ? "secondary" : "primary"} onClick={() => setAction(a)}>
              {a.label}
            </Button>
          ))}
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Items to prepare" />
            <ul className="divide-y divide-ink-100 px-5">
              {o.lines.map((l, i) => (
                <li key={i} className="flex items-center gap-4 py-4">
                  <ProductArt emoji={l.emoji} size="md" />
                  <div className="flex-1">
                    <p className="font-semibold">{l.productName}</p>
                    <p className="text-xs text-ink-500">Qty {l.quantity}{l.customisation && ` · ${l.customisation}`}</p>
                  </div>
                  <p className="tabular">{fmt(l.total)}</p>
                </li>
              ))}
            </ul>
            <div className="mx-5 mb-5 space-y-3 rounded-2xl bg-ivory-100 p-4 text-sm">
              <p className="font-semibold">Packing instructions</p>
              {o.gift.giftMessage ? <p className="rounded-xl bg-white px-4 py-3 font-display text-plum-900 italic">Card: “{o.gift.giftMessage}”</p> : <p className="text-ink-500">No card message.</p>}
              {o.gift.personalisation && <p>Personalisation: <b>{o.gift.personalisation}</b></p>}
              <div className="flex flex-wrap gap-2">
                {o.gift.discreetPackaging && <Badge tone="plum" icon={EyeOff}>Discreet outer packaging</Badge>}
                {o.gift.hidePrice && <Badge tone="gold">No prices on slip or card</Badge>}
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Timeline" />
            <div className="px-5 pt-4 pb-5">
              <Timeline items={(o.events ?? []).map((e) => ({ id: e.id, at: e.at, title: e.title, detail: e.detail, actor: e.actor }))} formatTime={dateTime} />
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Delivery" description="Use only to deliver this order." />
            <dl className="grid grid-cols-2 gap-4 p-5">
              <Stat label="Recipient" value={o.recipient.name} />
              <Stat label="Phone" value={<span className="inline-flex items-center gap-1"><Phone className="size-3.5" aria-hidden /> {o.recipient.phone}</span>} />
              <Stat className="col-span-2" label="Address" value={<span className="inline-flex items-start gap-1"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {o.recipient.address}</span>} />
              <Stat label="Option" value={o.delivery.deliveryOption} />
              <Stat label="Deliver by" value={date(o.delivery.deliveryDate)} />
              <Stat label="Courier" value={o.delivery.courier ?? "—"} />
              <Stat label="Tracking" value={<span className="font-mono text-xs">{o.delivery.trackingReference ?? "—"}</span>} />
              {o.delivery.deliveredAt && <Stat label="Delivered" value={dateTime(o.delivery.deliveredAt)} />}
              {o.delivery.deliveredAt && <Stat label="Customer confirmed" value={o.delivery.senderApprovedAt ? dateTime(o.delivery.senderApprovedAt) : "Not yet"} />}
            </dl>
          </Card>
          <Card>
            <CardHeader title="Your earnings" />
            <dl className="space-y-1.5 p-5 text-sm">
              <div className="flex justify-between"><dt className="text-ink-500">Gross (items + delivery)</dt><dd className="tabular">{fmt(o.earnings.gross)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">SecretWish commission</dt><dd className="tabular">−{fmt(o.earnings.fee)}</dd></div>
              <div className="flex justify-between border-t border-ink-100 pt-2 font-semibold"><dt>Net to you</dt><dd className="tabular">{fmt(o.earnings.net)}</dd></div>
            </dl>
            {o.payout && (
              <p className={cx("mx-5 mb-5 rounded-xl px-3 py-2 text-xs", o.payout.eligible ? "bg-success-50 text-success-700" : "bg-ink-100 text-ink-700")}>
                Payout: <b>{o.payout.eligible ? "eligible for the next payout" : o.payout.reason}</b>
              </p>
            )}
          </Card>
          {o.status === "Dispatched" && (
            <Notice tone="info" icon={Info} title="How delivery is confirmed">
              Delivery is confirmed when the recipient enters the secret code from their gift card, by the sender if the recipient isn&apos;t on SecretWish, or by SecretWish operations with courier proof of delivery. Vendors can&apos;t mark orders as delivered. If the sender then confirms they&apos;re satisfied, your payout doesn&apos;t wait for the hold period.
            </Notice>
          )}
        </div>
      </div>
      <OrderActionDialog action={action} basePath="/vendor" orderId={o.id} onClose={() => setAction(null)} />
    </>
  );
}
