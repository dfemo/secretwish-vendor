"use client";

import Link from "next/link";
import { useState } from "react";
import { HandCoins, Lock } from "lucide-react";
import { useApi } from "@/shared/lib/api";
import { useSession } from "@/shared/lib/session";
import { date } from "@/shared/lib/format";
import { Card, EmptyState, ErrorState, KpiCard, Notice, PageHeader, PageSkeleton, StatusBadge, Tabs } from "@/shared/ui/primitives";
import { DataTable, type Column } from "@/shared/ui/data";

type Data = {
  rules: { payoutHoldDays: number; commissionRate: number; requireDeliveryEvidenceForPayout: boolean };
  summary: { eligibleNet: number; eligibleGross: number; eligibleFees: number; pendingNet: number; processing: number; paidToDate: number };
  orders: { id: string; reference: string; status: string; deliveredAt?: string; gross: number; fee: number; net: number; eligible: boolean; reason: string }[];
  history: { id: string; reference: string; gross: number; fees: number; adjustments: number; deductions: number; net: number; status: string; providerStatus: string; providerReference?: string; reconciliation: string; createdAt: string; paidAt?: string; orders: number }[];
};

export default function PayoutsPage() {
  const { data, error, loading, reload } = useApi<Data>("/vendor/payouts");
  const { fmt } = useSession();
  const [tab, setTab] = useState<"pending" | "history">("pending");
  if (loading) return <PageSkeleton />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  const orderCols: Column<Data["orders"][number]>[] = [
    { key: "r", header: "Order", render: (o) => <Link href={`/orders/${o.id}`} className="font-semibold text-plum-700 hover:underline">{o.reference}</Link> },
    { key: "s", header: "Status", render: (o) => <StatusBadge status={o.status} /> },
    { key: "d", header: "Delivered", render: (o) => <span className="text-xs">{date(o.deliveredAt)}</span> },
    { key: "g", header: "Gross", align: "right", render: (o) => fmt(o.gross) },
    { key: "f", header: "Fees", align: "right", render: (o) => <span className="text-ink-500">−{fmt(o.fee)}</span> },
    { key: "n", header: "Net", align: "right", render: (o) => <b>{fmt(o.net)}</b> },
    { key: "e", header: "Eligibility", render: (o) => (o.eligible ? <StatusBadge status="Eligible" /> : <span className="text-xs text-ink-500">{o.reason}</span>) },
  ];
  const historyCols: Column<Data["history"][number]>[] = [
    { key: "r", header: "Payout", render: (p) => (<div><p className="font-semibold">{p.reference}</p><p className="text-xs text-ink-500">{p.orders} orders · {date(p.createdAt)}</p></div>) },
    { key: "g", header: "Gross", align: "right", render: (p) => fmt(p.gross) },
    { key: "f", header: "Fees", align: "right", render: (p) => `−${fmt(p.fees)}` },
    { key: "d", header: "Refund deductions", align: "right", hideOnMobile: true, render: (p) => (p.deductions ? `−${fmt(p.deductions)}` : "—") },
    { key: "n", header: "Net", align: "right", render: (p) => <b>{fmt(p.net)}</b> },
    { key: "s", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
    { key: "p", header: "Provider", hideOnMobile: true, render: (p) => (<div className="max-w-[200px]"><p className="truncate text-xs">{p.providerStatus}</p>{p.providerReference && <p className="font-mono text-[10px] text-ink-400">{p.providerReference}</p>}</div>) },
    { key: "rec", header: "Reconciliation", render: (p) => <StatusBadge status={p.reconciliation} /> },
  ];

  return (
    <>
      <PageHeader title="Payouts" description="Payouts are calculated by SecretWish's eligibility rules and sent by the payment provider." />
      <Notice className="mb-6" tone="plum" icon={Lock} title="Read-only">
        Payout records can&apos;t be edited by vendors. An order becomes eligible once it&apos;s delivered with evidence, the {data.rules.payoutHoldDays}-day hold has passed and there&apos;s no open refund, dispute or chargeback. Commission: {Math.round(data.rules.commissionRate * 100)}% of the product subtotal.
      </Notice>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard tint="sage" icon={HandCoins} label="Eligible for next payout" value={fmt(data.summary.eligibleNet)} hint={`${fmt(data.summary.eligibleGross)} gross − ${fmt(data.summary.eligibleFees)} fees`} />
        <KpiCard tint="gold" label="Pending eligibility" value={fmt(data.summary.pendingNet)} />
        <KpiCard tint="lavender" label="Processing with provider" value={fmt(data.summary.processing)} />
        <KpiCard tint="plum" label="Paid to date" value={fmt(data.summary.paidToDate)} />
      </div>
      <Card>
        <div className="border-b border-ink-100 p-4">
          <Tabs value={tab} onChange={setTab} tabs={[{ value: "pending", label: "Upcoming", count: data.orders.length }, { value: "history", label: "Payout history", count: data.history.length }]} />
        </div>
        {tab === "pending" ? (
          <DataTable caption="Orders awaiting payout" columns={orderCols} rows={data.orders} rowKey={(o) => o.id} empty={<EmptyState icon={HandCoins} title="Nothing pending" />} />
        ) : (
          <DataTable caption="Payout history" columns={historyCols} rows={data.history} rowKey={(p) => p.id} empty={<EmptyState icon={HandCoins} title="No payouts yet" />} />
        )}
      </Card>
    </>
  );
}
