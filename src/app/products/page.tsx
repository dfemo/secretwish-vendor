"use client";

import Link from "next/link";
import { useState } from "react";
import { Boxes, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { api, useApi, useMutation } from "@/shared/lib/api";
import { useSession } from "@/shared/lib/session";
import { Button, ButtonLink, Card, EmptyState, ErrorState, PageHeader, ProductArt, Spinner, StatusBadge, Tabs } from "@/shared/ui/primitives";
import { ConfirmDialog, useToast } from "@/shared/ui/overlay";
import type { VendorProduct } from "@/lib/types";

const tabs = ["All", "Approved", "PendingReview", "Draft", "Rejected", "OutOfStock", "Suspended"] as const;
const labels: Record<string, string> = { All: "All", Approved: "Live", PendingReview: "Pending review", Draft: "Drafts", Rejected: "Rejected", OutOfStock: "Out of stock", Suspended: "Suspended" };

export default function ProductsPage() {
  const { data, error, loading, reload } = useApi<VendorProduct[]>("/vendor/products");
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [deleting, setDeleting] = useState<VendorProduct | null>(null);
  const { fmt } = useSession();
  const toast = useToast();
  const submit = useMutation((id: string) => api(`/vendor/products/${id}/submit`, { method: "POST" }));
  const del = useMutation(async (id: string) => { await api(`/vendor/products/${id}`, { method: "DELETE" }); return true; });
  const rows = data?.filter((p) => tab === "All" || p.status === tab) ?? [];

  return (
    <>
      <PageHeader title="Products" description="New listings and material edits are reviewed by SecretWish before customers can see them." actions={<ButtonLink href="/products/new" icon={Plus}>New product</ButtonLink>} />
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={tabs.map((t) => ({ value: t, label: labels[t], count: t === "All" ? data?.length : data?.filter((p) => p.status === t).length }))} />
      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && rows.length === 0 && <EmptyState icon={Boxes} title="No products here" action={<ButtonLink href="/products/new">Create a product</ButtonLink>} />}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((p) => (
          <li key={p.id}>
            <Card className="flex h-full flex-col overflow-hidden">
              <ProductArt emoji={p.emoji} tint={p.tint} size="xl" className="rounded-none" />
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{p.name}</h2>
                    <p className="text-xs text-ink-500">{p.category} · {p.sold} sold · ★ {p.rating.toFixed(1)}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-2 text-sm"><b className="tabular">{fmt(p.priceUsd)}</b> <span className="text-xs text-ink-500">· {p.stock} in stock · {p.deliveryOptions.join(", ")}</span></p>
                {p.reviewNote && <p className="mt-2 rounded-lg bg-warning-50 px-2 py-1 text-xs text-warning-700">{p.reviewNote}</p>}
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {p.status !== "Suspended" && (
                    <Link href={`/products/${p.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-plum-50 px-3 text-xs font-semibold text-plum-800 hover:bg-plum-100">
                      <Pencil className="size-3.5" aria-hidden /> Edit
                    </Link>
                  )}
                  {(p.status === "Draft" || p.status === "Rejected") && (
                    <Button size="sm" icon={Send} loading={submit.pending} onClick={async () => { if ((await submit.run(p.id)) !== undefined) toast({ tone: "success", title: "Submitted for review" }); }}>
                      Submit for review
                    </Button>
                  )}
                  {p.status === "Draft" && <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleting(p)}>Delete</Button>}
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        tone="danger"
        title={`Delete draft “${deleting?.name}”?`}
        confirmLabel="Delete draft"
        pending={del.pending}
        error={del.error?.message}
        onConfirm={async () => { if (deleting && (await del.run(deleting.id))) { toast({ tone: "success", title: "Draft deleted" }); setDeleting(null); } }}
      />
    </>
  );
}
