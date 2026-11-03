"use client";

import { useState } from "react";
import { useApi } from "@/shared/lib/api";
import { useSession } from "@/shared/lib/session";
import { pct, shortDate } from "@/shared/lib/format";
import { Card, CardHeader, ErrorState, KpiCard, PageHeader, PageSkeleton, SampleDataBadge, Select } from "@/shared/ui/primitives";
import { BarsChart, ChartCard } from "@/shared/ui/charts";

type Analytics = {
  days: number;
  sampleData: boolean;
  totals: { sales: number; net: number; orders: number; aov: number; refundRate: number; lateRate: number };
  weekly: { week: string; sales: number; orders: number }[];
  products: { product: string; units: number; sales: number }[];
  cities: { city: string; orders: number }[];
};

export default function AnalyticsPage() {
  const [days, setDays] = useState(90);
  const { data, error, loading, reload } = useApi<Analytics>(`/vendor/analytics?days=${days}`);
  const { fmt } = useSession();
  return (
    <>
      <PageHeader
        title="Sales analytics"
        description="Sales exclude cancelled and refunded orders. Net is after SecretWish commission."
        actions={
          <>
            {data?.sampleData && <SampleDataBadge />}
            <label htmlFor="d" className="sr-only">Date range</label>
            <Select id="d" value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-40">
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 180 days</option>
            </Select>
          </>
        }
      />
      {loading && <PageSkeleton />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard tint="gold" label="Sales" value={fmt(data.totals.sales)} />
            <KpiCard tint="sage" label="Net earnings" value={fmt(data.totals.net)} />
            <KpiCard tint="plum" label="Orders" value={data.totals.orders} />
            <KpiCard tint="lavender" label="Average order" value={fmt(data.totals.aov)} />
            <KpiCard tint="rose" label="Refund rate" value={pct(data.totals.refundRate)} />
            <KpiCard tint="rose" label="Late deliveries" value={pct(data.totals.lateRate)} />
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <ChartCard
              title="Weekly sales"
              summary={`${fmt(data.totals.sales)} across ${data.weekly.length} weeks.`}
              table={{ headers: ["Week of", "Orders", "Sales"], rows: data.weekly.map((w) => [shortDate(w.week), w.orders, fmt(w.sales)]) }}
              height={280}
            >
              <BarsChart data={data.weekly.map((w) => ({ ...w, label: shortDate(w.week) }))} x="label" series={[{ key: "sales", label: "Sales" }]} format={(v) => fmt(v, { compact: true })} />
            </ChartCard>
            <Card>
              <CardHeader title="Where your gifts go" />
              <ul className="space-y-2 p-5">
                {data.cities.map((c) => {
                  const max = Math.max(...data.cities.map((x) => x.orders));
                  return (
                    <li key={c.city} className="text-sm">
                      <div className="flex justify-between"><span>{c.city}</span><span className="font-semibold tabular">{c.orders}</span></div>
                      <div className="mt-1 h-2 rounded-full bg-ink-100"><div className="h-2 rounded-full bg-plum-600" style={{ width: `${(c.orders / max) * 100}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
          <Card className="mt-6">
            <CardHeader title="By product" />
            <div className="overflow-x-auto px-2 pb-3">
              <table className="w-full min-w-[420px] text-left text-sm">
                <caption className="sr-only">Sales by product</caption>
                <thead><tr className="text-xs text-ink-500"><th className="px-3 py-2 font-semibold">Product</th><th className="px-3 py-2 text-right font-semibold">Units</th><th className="px-3 py-2 text-right font-semibold">Sales</th></tr></thead>
                <tbody>
                  {data.products.map((p) => (
                    <tr key={p.product} className="border-t border-ink-100"><td className="px-3 py-2.5 font-semibold">{p.product}</td><td className="px-3 py-2.5 text-right tabular">{p.units}</td><td className="px-3 py-2.5 text-right tabular">{fmt(p.sales)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
