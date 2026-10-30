"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Package } from "lucide-react";
import { usePagedApi } from "@/shared/lib/api";
import { useSession } from "@/shared/lib/session";
import { date, dateTime, timeAgo } from "@/shared/lib/format";
import { ORDER_STATUSES, statusMeta } from "@/shared/lib/status";
import { Card, EmptyState, ErrorState, PageHeader, ProductArt, SearchInput, Select, Spinner, StatusBadge } from "@/shared/ui/primitives";
import { DataTable, PagedFooter, type Column } from "@/shared/ui/data";
import type { VendorOrder } from "@/lib/types";

function VendorOrdersInner() {
  const router = useRouter();
  const [status, setStatus] = useState(useSearchParams().get("status") ?? "action");
  const { data, items, error, loading, reload, setPage, search, setSearch } = usePagedApi<VendorOrder>("/vendor/orders", { status }, 20);
  const { fmt } = useSession();
  const rows = items ?? [];

  const cols: Column<VendorOrder>[] = [
    {
      key: "o",
      header: "Order",
      render: (o) => (
        <div className="flex items-center gap-3">
          <ProductArt emoji={o.lines[0]?.emoji ?? "🎁"} size="sm" />
          <div>
            <p className="font-semibold">{o.reference}</p>
            <p className="max-w-[220px] truncate text-xs text-ink-500">{o.lines.map((l) => `${l.quantity}× ${l.productName}`).join(", ")}</p>
          </div>
        </div>
      ),
    },
    { key: "placed", header: "Placed", render: (o) => <span className="text-xs">{dateTime(o.createdAt)}</span> },
    { key: "to", header: "Deliver to", render: (o) => <span className="text-xs">{o.recipient.name.split(" ")[0]} · {o.recipient.city}</span> },
    { key: "by", header: "Due", render: (o) => (o.acceptBy ? <span className="text-xs font-semibold text-warning-700">Accept {timeAgo(o.acceptBy)}</span> : <span className="text-xs">{date(o.delivery.deliveryDate)}</span>) },
    { key: "net", header: "Your earnings", align: "right", render: (o) => fmt(o.earnings.net) },
    { key: "s", header: "Status", render: (o) => <StatusBadge status={o.status} /> },
  ];

  return (
    <>
      <PageHeader title="Orders" description="Sender identities are never shared with vendors. You see what you need to fulfil and deliver." />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 p-4">
          <SearchInput value={search} onChange={setSearch} label="Search orders" placeholder="Reference or product" className="min-w-[200px] flex-1" />
          <label htmlFor="st" className="sr-only">Status</label>
          <Select id="st" value={status} onChange={(e) => setStatus(e.target.value)} className="w-56">
            <option value="action">Needs action</option>
            <option value="active">In fulfilment</option>
            <option value="returns">Returns &amp; exceptions</option>
            <option value="">All orders</option>
            {ORDER_STATUSES.filter((s) => s !== "PaymentPending").map((s) => (<option key={s} value={s}>{statusMeta(s).label}</option>))}
          </Select>
        </div>
        {loading && <Spinner />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && (
          <>
            <DataTable caption="Orders" columns={cols} rows={rows} rowKey={(o) => o.id} onRowClick={(o) => router.push(`/orders/${o.id}`)} rowLabel={(o) => `Open ${o.reference}`} empty={<EmptyState icon={Package} title={status === "action" ? "Nothing needs action" : "No orders match"} />} />
            <PagedFooter data={data} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}

export default function VendorOrders() {
  return (
    <Suspense fallback={<Spinner />}>
      <VendorOrdersInner />
    </Suspense>
  );
}
