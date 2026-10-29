"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowRight, Boxes, CircleDollarSign, Clock, HandCoins, PackageCheck, RotateCcw, ShoppingBag, Timer } from "lucide-react";
import { useApi } from "@/shared/lib/api";
import { useSession } from "@/shared/lib/session";
import { pct, shortDate, timeAgo } from "@/shared/lib/format";
import { Badge, Card, CardHeader, ErrorState, KpiCard, PageHeader, PageSkeleton, ProductArt, SampleDataBadge, Select, StatusBadge } from "@/shared/ui/primitives";
import { ChartCard, TrendChart } from "@/shared/ui/charts";

type Overview = {
  vendor: { name: string; status: string };
  kpis: { sales: number; orders: number; requiringAction: number; awaitingAcceptance: number; productsListed: number; lowStock: number; refundCases: number; pendingPayout: number; processingPayout: number; acceptanceRate: number; onTimeRate: number; avgFulfilmentHours: number; rating: number };
  trend: { date: string; sales: number; orders: number }[];
  actionQueue: { id: string; reference: string; status: string; createdAt: string; product: string; emoji: string; deliveryDate: string; acceptBy: string | null }[];
  lowStock: { id: string; name: string; emoji: string; stock: number; lowStockThreshold: number }[];
  topProducts: { id: string; name: string; emoji: string; sold: number; priceUsd: number; rating: number }[];
};

export default function VendorOverview() {
  const [days, setDays] = useState(30);
  const { data, error, loading, reload } = useApi<Overview>(`/vendor/overview?days=${days}`);
  const { fmt } = useSession();
  if (loading) return <PageSkeleton />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;
  const k = data.kpis;

  return (
    <>
      <PageHeader
        eyebrow={data.vendor.name}
        title="Overview"
        description="Your orders, stock and payouts at a glance."
        actions={
          <>
            <SampleDataBadge />
            <label htmlFor="d" className="sr-only">Date range</label>
            <Select id="d" value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-40">
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </Select>
          </>
        }
      />
      {data.vendor.status !== "Approved" && <div className="mb-6 rounded-2xl bg-danger-50 px-5 py-4 text-sm font-semibold text-danger-700">Your store is {data.vendor.status.toLowerCase()}. Listings are hidden from customers.</div>}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <KpiCard tint="gold" icon={CircleDollarSign} label="Total sales" value={fmt(k.sales)} hint="Subtotal + delivery, excl. refunds" />
        <KpiCard tint="plum" icon={ShoppingBag} label="Orders received" value={k.orders} />
        <KpiCard tint="rose" icon={AlertTriangle} label="Orders requiring action" value={k.requiringAction} hint={`${k.awaitingAcceptance} awaiting acceptance`} href="/fulfilment" />
        <KpiCard tint="sage" icon={HandCoins} label="Eligible for payout" value={fmt(k.pendingPayout)} hint={`${fmt(k.processingPayout)} with provider`} href="/payouts" />
        <KpiCard tint="lavender" icon={Boxes} label="Products listed" value={k.productsListed} href="/products" />
        <KpiCard tint="rose" icon={Clock} label="Low-stock products" value={k.lowStock} href="/inventory" />
        <KpiCard tint="ivory" icon={Timer} label="Fulfilment performance" value={pct(k.onTimeRate * 100, 0)} hint={`On time · ${pct(k.acceptanceRate * 100, 0)} acceptance · ${k.avgFulfilmentHours}h avg`} />
        <KpiCard tint="lavender" icon={RotateCcw} label="Refund & return cases" value={k.refundCases} href="/returns" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartCard
          title="Sales trend"
          description={`Last ${days} days`}
          summary={`${fmt(k.sales)} in sales from ${k.orders} orders.`}
          table={{ headers: ["Date", "Orders", "Sales"], rows: data.trend.map((t) => [shortDate(t.date), t.orders, fmt(t.sales)]) }}
          height={260}
        >
          <TrendChart data={data.trend.map((t) => ({ ...t, label: shortDate(t.date) }))} x="label" series={[{ key: "sales", label: "Sales" }]} format={(v) => fmt(v, { compact: true })} />
        </ChartCard>
        <Card>
          <CardHeader title="Needs your attention" action={<Link href="/fulfilment" className="text-xs font-semibold text-plum-700 hover:underline">Fulfilment board</Link>} />
          <ul className="divide-y divide-ink-100 px-5 pb-3">
            {data.actionQueue.length === 0 && <li className="py-8 text-center text-sm text-ink-500">All caught up 🎉</li>}
            {data.actionQueue.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="flex items-center gap-3 py-3 hover:text-plum-700">
                  <ProductArt emoji={o.emoji} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{o.reference} · {o.product}</p>
                    <p className="text-xs text-ink-500">{o.acceptBy ? <span className="font-semibold text-warning-700">Accept {timeAgo(o.acceptBy)}</span> : `Placed ${timeAgo(o.createdAt)}`}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top products" />
          <ul className="divide-y divide-ink-100 px-5 pb-3">
            {data.topProducts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <ProductArt emoji={p.emoji} size="sm" />
                <span className="flex-1 text-sm font-semibold">{p.name}</span>
                <span className="text-xs text-ink-500">{p.sold} sold</span>
                <span className="w-20 text-right text-sm tabular">{fmt(p.priceUsd)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Low stock" action={<Link href="/inventory" className="inline-flex items-center gap-1 text-xs font-semibold text-plum-700 hover:underline">Inventory <ArrowRight className="size-3" aria-hidden /></Link>} />
          <ul className="divide-y divide-ink-100 px-5 pb-3">
            {data.lowStock.length === 0 && <li className="flex items-center gap-2 py-6 text-sm text-ink-500"><PackageCheck className="size-4" aria-hidden /> Stock levels look healthy.</li>}
            {data.lowStock.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <ProductArt emoji={p.emoji} size="sm" />
                <span className="flex-1 text-sm font-semibold">{p.name}</span>
                <Badge tone={p.stock === 0 ? "danger" : "warning"}>{p.stock === 0 ? "Out of stock" : `${p.stock} left`}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
