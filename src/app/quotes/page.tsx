"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { api, useMutation, usePagedApi } from "@/shared/lib/api";
import { PagedFooter } from "@/shared/ui/data";
import { useSession } from "@/shared/lib/session";
import { date, timeAgo } from "@/shared/lib/format";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, Notice, PageHeader, SearchInput, Spinner, StatusBadge, Textarea } from "@/shared/ui/primitives";
import { Modal, useToast } from "@/shared/ui/overlay";

type Request = {
  id: string; reference: string; title: string; budgetMin: number; budgetMax: number; deliveryCity: string; neededBy?: string; notes: string; status: string; createdAt: string; category: string; recipient: string; quotesReceived: number;
  myQuote: { id: string; description: string; priceUsd: number; overBudget: boolean; status: string } | null;
};

export default function QuotesPage() {
  const { data: paged, items: data, error, loading, reload, setPage, search, setSearch } = usePagedApi<Request>("/vendor/quotes", {}, 20);
  const { fmt } = useSession();
  const toast = useToast();
  const [open, setOpen] = useState<Request | null>(null);
  const [form, setForm] = useState({ description: "", price: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = useMutation(() => api<{ overBudget: boolean }>("/vendor/quotes", { method: "POST", body: { requestId: open!.id, description: form.description, priceUsd: Number(form.price) } }));
  const price = Number(form.price);
  const outside = open && price > 0 && (price > open.budgetMax || price < open.budgetMin);

  return (
    <>
      <PageHeader title="Surprise requests" description="Senders describe a moment and set a budget range. Quote within it — quotes outside the range are flagged to the sender and rarely chosen." />
      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      <SearchInput value={search} onChange={setSearch} label="Search requests" placeholder="Search by title or reference" className="mb-5 sm:w-80" />
      {data?.length === 0 && <EmptyState icon={Sparkles} title={search ? "No requests match your search" : "No requests in your categories yet"} />}
      <ul className="grid gap-4 lg:grid-cols-2">
        {data?.map((r) => (
          <li key={r.id}>
            <Card className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-ink-500">{r.reference} · {r.category} · {timeAgo(r.createdAt)}</p>
                  <h2 className="font-display text-xl font-semibold text-plum-900">{r.title}</h2>
                  <p className="text-sm text-ink-500">For {r.recipient} in {r.deliveryCity}{r.neededBy && ` · needed by ${date(r.neededBy)}`}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              {r.notes && <p className="mt-2 text-[13px] text-ink-700">“{r.notes}”</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="gold">Budget {fmt(r.budgetMin)} – {fmt(r.budgetMax)}</Badge>
                <Badge tone="neutral">{r.quotesReceived} quote{r.quotesReceived === 1 ? "" : "s"} so far</Badge>
              </div>
              <div className="mt-auto pt-4">
                {r.myQuote ? (
                  <div className="rounded-xl bg-ink-50 p-3 text-[13px]">
                    <p className="flex items-center justify-between font-semibold">Your quote: {fmt(r.myQuote.priceUsd)} <StatusBadge status={r.myQuote.status} /></p>
                    <p className="text-ink-700">{r.myQuote.description}</p>
                    {r.myQuote.overBudget && <p className="mt-1 text-xs font-semibold text-warning-700">Outside the sender&apos;s range</p>}
                  </div>
                ) : r.status === "Open" || r.status === "Quoted" ? (
                  <Button onClick={() => { setOpen(r); setForm({ description: "", price: "" }); setErrors({}); }}>Send a quote</Button>
                ) : (
                  <p className="text-sm text-ink-500">This request has closed.</p>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <PagedFooter data={paged} onPage={setPage} className="mt-4 rounded-2xl border bg-white" />
      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={`Quote for ${open?.reference}`}
        description={open ? `Sender's budget: ${fmt(open.budgetMin)} – ${fmt(open.budgetMax)}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(null)}>Cancel</Button>
            <Button
              loading={submit.pending}
              onClick={async () => {
                const e: Record<string, string> = {};
                if (form.description.trim().length < 15) e.description = "Describe what you'll send (at least 15 characters).";
                if (!(price >= 1)) e.price = "Enter your price.";
                setErrors(e);
                if (Object.keys(e).length) return;
                const r = await submit.run();
                if (r) {
                  toast({ tone: r.overBudget ? "info" : "success", title: "Quote sent", body: r.overBudget ? "It's flagged to the sender as outside their range." : "The sender has been notified." });
                  setOpen(null);
                }
              }}
            >
              Send quote
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="What will you send?" required error={errors.description}>
            {(id, d) => <Textarea id={id} aria-describedby={d} aria-invalid={!!errors.description} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}
          </Field>
          <Field label="Price incl. delivery (USD)" required error={errors.price}>
            {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!errors.price} type="number" min={1} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-40" />}
          </Field>
          {outside && <Notice tone="warning" title="Outside the sender's budget">Quotes outside {fmt(open!.budgetMin)} – {fmt(open!.budgetMax)} are allowed but clearly flagged to the sender.</Notice>}
          {submit.error && <Notice tone="danger">{submit.error.message}</Notice>}
        </div>
      </Modal>
    </>
  );
}
