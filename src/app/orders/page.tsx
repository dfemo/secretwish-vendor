"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Package } from "lucide-react";
import { usePagedApi } from "@/shared/lib/api";
import { useSession } from "@/shared/lib/session";
import { date, dateTime, timeAgo } from "@/shared/lib/format";
import { ORDER_STATUSES, statusMeta } from "@/shared/lib/status";
import { Card, EmptyState, ErrorState, PageHeader, ProductArt, SearchInput, Select, Spinner, StatusBadge } from "@/shared/ui/primitives";
import { DataTable, PagedFooter, type Column } from "@/shared/ui/data";
import type { VendorOrder } from "@/lib/types";

// One filter instead of every raw status: each group is counted by the API.
const groups = [
  { value: "", key: "all", label: "All orders" },
  { value: "action", key: "action", label: "Needs action" },
  { value: "active", key: "active", label: "In fulfilment" },
  { value: "delivered", key: "delivered", label: "Delivered" },
  { value: "returns", key: "returns", label: "Returns & exceptions" },
  { value: "cancelled", key: "cancelled", label: "Cancelled" },
];

function VendorOrdersInner() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // Everything by default. Links can open a group (?status=action) or one exact status (?status=Processing, from the fulfilment board).
  const known = (s: string | null) => !!s && (groups.some((g) => g.value === s) || (ORDER_STATUSES as readonly string[]).includes(s));
  const [status, setStatusState] = useState(() => (known(params.get("status")) ? params.get("status")! : ""));
  const setStatus = (s: string) => {
    setStatusState(s);
    router.replace(s ? `${pathname}?status=${s}` : pathname, { scroll: false });
  };
  const { data, items, error, loading, reload, setPage, search, setSearch } = usePagedApi<VendorOrder>("/vendor/orders", { status }, 20);
  const { fmt } = useSession();
  const counts = data?.counts ?? {};
  const rows = items ?? [];
  const current = groups.find((g) => g.value === status) ?? { value: status, key: status, label: statusMeta(status).label };

  const cols: Column<VendorOrder>[] = [
    {
      key: "o",
      header: "Order",
      render: (o) => (
        <div className="flex items-center gap-3">
          <ProductArt emoji={o.lines[0]?.emoji ?? "🎁"} size="sm" />
          <div className="min-w-0">
            <p className="font-semibold">{o.reference}</p>
            <p className="max-w-[240px] truncate text-xs text-ink-500">{o.lines.map((l) => `${l.quantity}× ${l.productName}`).join(", ")}</p>
          </div>
        </div>
      ),
    },
    { key: "placed", header: "Placed", render: (o) => <span className="text-xs">{dateTime(o.createdAt)}</span> },
    { key: "to", header: "Deliver to", render: (o) => <span className="text-xs">{o.recipient.name.split(" ")[0]} · {o.recipient.city}<span className="block text-ink-500">{o.delivery.deliveryOption}</span></span> },
    {
      key: "by",
      header: "Due / delivered",
      render: (o) =>
        o.acceptBy ? <span className="text-xs font-semibold text-warning-700">Accept {timeAgo(o.acceptBy)}</span>
        : o.delivery.deliveredAt ? <span className="text-xs text-success-700">Delivered {date(o.delivery.deliveredAt)}</span>
        : <span className="text-xs">{o.delivery.deliveryDate ? `By ${date(o.delivery.deliveryDate)}` : "—"}</span>,
    },
    {
      key: "progress",
      header: "Fulfilment · delivery",
      render: (o) => (
        <span className="flex flex-wrap gap-1">
          <StatusBadge status={o.fulfilmentStatus} />
          <StatusBadge status={o.deliveryStatus} />
        </span>
      ),
    },
    { key: "next", header: "Next step", render: (o) => (o.actions.length ? <span className="text-xs font-semibold text-plum-700">{o.actions[0].label}</span> : <span className="text-xs text-ink-400">—</span>) },
    { key: "net", header: "Your earnings", align: "right", render: (o) => fmt(o.earnings.net) },
    { key: "s", header: "Status", render: (o) => <StatusBadge status={o.status} /> },
  ];

  return (
    <>
      <PageHeader title="Orders" description="Every paid order for your store, newest first. Sender identities are never shared with vendors." />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 p-4">
          <SearchInput value={search} onChange={setSearch} label="Search orders" placeholder="Search reference, product or city" className="min-w-[220px] flex-1" />
          <label htmlFor="st" className="sr-only">Show</label>
          <Select id="st" value={status} onChange={(e) => setStatus(e.target.value)} className="w-60">
            {groups.map((g) => (
              <option key={g.key} value={g.value}>
                {g.label}{counts[g.key] != null ? ` (${counts[g.key]})` : ""}
              </option>
            ))}
            {!groups.some((g) => g.value === status) && <option value={status}>{current.label}</option>}
          </Select>
        </div>
        {loading && !data && <Spinner />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && (
          <>
            <DataTable
              caption="Orders"
              columns={cols}
              rows={rows}
              rowKey={(o) => o.id}
              onRowClick={(o) => router.push(`/orders/${o.id}`)}
              rowLabel={(o) => `Open ${o.reference}`}
              empty={<EmptyState icon={Package} title={search ? "No orders match your search" : status === "action" ? "Nothing needs action" : status ? `No ${current.label.toLowerCase()} orders` : "No orders yet"} description={!search && !status ? "Paid orders for your store appear here." : undefined} />}
            />
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
