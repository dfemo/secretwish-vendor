"use client";

import { useState } from "react";
import { ClipboardList, Save } from "lucide-react";
import { api, useMutation, usePagedApi } from "@/shared/lib/api";
import { PagedFooter } from "@/shared/ui/data";
import { Badge, Button, Card, cx, EmptyState, ErrorState, PageHeader, ProductArt, SearchInput, Spinner, StatusBadge, Switch } from "@/shared/ui/primitives";
import { useToast } from "@/shared/ui/overlay";
import type { VendorProduct } from "@/lib/types";

export default function InventoryPage() {
  const [lowOnly, setLowOnly] = useState(false);
  const { data, items, error, loading, reload, setPage, search, setSearch } = usePagedApi<VendorProduct>("/vendor/products", { view: "inventory", lowStock: lowOnly || null }, 25);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const toast = useToast();
  const update = useMutation((id: string, stock: number) => api<{ stock: number; status: string }>(`/vendor/products/${id}/stock`, { method: "PATCH", body: { stock } }));
  const rows = items ?? [];

  return (
    <>
      <PageHeader title="Inventory" description="Keep stock accurate so customers never order something you can't send. Items at zero are hidden automatically." />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-2">
          <SearchInput value={search} onChange={setSearch} label="Search inventory" placeholder="Search products" className="min-w-[200px] flex-1" />
          <div className="w-64"><Switch checked={lowOnly} onChange={setLowOnly} label="Show low stock only" /></div>
        </div>
        {loading && <Spinner />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && rows.length === 0 && <EmptyState icon={ClipboardList} title={search ? "No products match your search" : lowOnly ? "Nothing low on stock" : "No stocked products yet"} />}
        <ul className="divide-y divide-ink-100">
          {rows.map((p) => {
            const value = edits[p.id] ?? String(p.stock);
            const invalid = !/^\d+$/.test(value) || Number(value) > 10000;
            const changed = value !== String(p.stock);
            const low = p.stock <= p.lowStockThreshold;
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-3">
                <ProductArt emoji={p.emoji} tint={p.tint} size="sm" />
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-ink-500">Alert at {p.lowStockThreshold} · {p.sold} sold</p>
                </div>
                <StatusBadge status={p.status} />
                {low && <Badge tone={p.stock === 0 ? "danger" : "warning"}>{p.stock === 0 ? "Out" : "Low"}</Badge>}
                <form
                  className="flex items-center gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (invalid || !changed) return;
                    const r = await update.run(p.id, Number(value));
                    if (r) {
                      toast({ tone: "success", title: `${p.name}: stock ${r.stock}`, body: r.status === "OutOfStock" ? "Hidden from customers until restocked." : undefined });
                      setEdits(({ [p.id]: _, ...rest }) => rest);
                    }
                  }}
                >
                  <label htmlFor={`stock-${p.id}`} className="sr-only">Stock for {p.name}</label>
                  <input id={`stock-${p.id}`} inputMode="numeric" value={value} aria-invalid={invalid} onChange={(e) => setEdits({ ...edits, [p.id]: e.target.value })} className={cx("h-9 w-20 rounded-xl border px-2 text-right text-sm tabular", invalid ? "border-danger-600" : "border-ink-200")} />
                  <Button type="submit" size="sm" variant={changed ? "primary" : "ghost"} icon={Save} disabled={!changed || invalid} aria-label={`Save stock for ${p.name}`}>Save</Button>
                </form>
              </li>
            );
          })}
        </ul>
        <PagedFooter data={data} onPage={setPage} />
        {update.error && <p className="px-5 py-3 text-sm text-danger-700">{update.error.message}</p>}
      </Card>
    </>
  );
}
