"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { api, useMutation, usePagedApi } from "@/shared/lib/api";
import { PagedFooter } from "@/shared/ui/data";
import { useSession } from "@/shared/lib/session";
import { date, moneyIn, timeAgo } from "@/shared/lib/format";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, Notice, PageHeader, SearchInput, Select, Spinner, StatusBadge, Textarea } from "@/shared/ui/primitives";
import { Modal, useToast } from "@/shared/ui/overlay";

type Request = {
  id: string; reference: string; title: string; budgetMin: number; budgetMax: number; currency: string; budgetMinLocal: number; budgetMaxLocal: number; deliveryCity: string; neededBy?: string; notes: string; status: string; createdAt: string; category: string; recipient: string; quotesReceived: number;
  /** Everything the sender wants; one quote covers the whole list. */
  items: { id: string; name: string; category: string; emoji: string; quantity: number; notes: string }[];
  myQuote: { id: string; description: string; priceUsd: number; overBudget: boolean; status: string } | null;
  /** Set when the sender is sourcing a wish from someone's wishlist: exactly what they asked for. */
  wish: { title: string; url: string | null; imageUrl: string | null; estimatedPriceUsd: number | null } | null;
};

export default function QuotesPage() {
  const [category, setCategory] = useState("");
  const [mine, setMine] = useState(false);
  const { data: paged, items: data, error, loading, reload, setPage, search, setSearch } = usePagedApi<Request>("/vendor/quotes", { category, mine: mine || null }, 20);
  const { fmt, meta } = useSession();
  const toast = useToast();
  const [open, setOpen] = useState<Request | null>(null);
  const [form, setForm] = useState({ description: "", price: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Vendors quote in the currency the sender budgeted in; the API stores USD at the same rate.
  const rateOf = (r: Request) => (r.budgetMax > 0 && r.budgetMaxLocal > 0 ? r.budgetMaxLocal / r.budgetMax : 1);
  const price = Number(form.price);
  const priceUsd = open ? Math.round((price / rateOf(open)) * 100) / 100 : 0;
  const submit = useMutation(() => api<{ overBudget: boolean }>("/vendor/quotes", { method: "POST", body: { requestId: open!.id, description: form.description, priceUsd } }));
  const outside = open && price > 0 && (price > open.budgetMaxLocal || price < open.budgetMinLocal);

  return (
    <>
      <PageHeader title="Surprise requests" description="Every request on SecretWish is open to every store. Filter by what you sell, then quote within the sender's budget. Quotes outside the range are flagged to the sender and rarely chosen." />
      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} label="Search requests" placeholder="Search by title or reference" className="sm:w-80" />
        <label htmlFor="cat" className="sr-only">Category</label>
        <Select id="cat" value={category} onChange={(e) => setCategory(e.target.value)} className="w-56">
          <option value="">All categories</option>
          {meta?.categories.map((c) => <option key={c.id} value={c.slug}>{c.emoji} {c.name}</option>)}
        </Select>
        <label className="inline-flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" className="size-4 accent-plum-700" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Only requests I&apos;ve quoted on
        </label>
      </div>
      {data?.length === 0 && <EmptyState icon={Sparkles} title={search || category || mine ? "No requests match your filters" : "No surprise requests yet"} description={search || category || mine ? undefined : "New requests from senders appear here as soon as they're posted."} />}
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
              {r.wish && (
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-plum-50 p-3">
                  {r.wish.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.wish.imageUrl} alt="" referrerPolicy="no-referrer" className="size-14 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 text-[13px]">
                    <p className="font-semibold text-plum-900">From their wishlist: {r.wish.title}</p>
                    {r.wish.url && <a href={r.wish.url} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-plum-700 underline">See the item they want</a>}
                    {r.wish.estimatedPriceUsd != null && <span className="text-ink-500"> · around {fmt(r.wish.estimatedPriceUsd)}</span>}
                  </div>
                </div>
              )}
              {!r.wish && (
                <ul className="mt-3 divide-y divide-ink-100 rounded-xl border border-ink-200 text-[13px]" aria-label="Items requested">
                  {r.items.map((i) => (
                    <li key={i.id} className="flex items-start gap-2 px-3 py-2">
                      <span aria-hidden>{i.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="font-semibold text-ink-900">{i.name}</span> <span className="text-ink-500">· {i.category}</span>
                        {i.notes && <span className="block text-xs text-ink-500">{i.notes}</span>}
                      </span>
                      <span className="text-xs text-ink-500 tabular">× {i.quantity}</span>
                    </li>
                  ))}
                </ul>
              )}
              {r.notes && <p className="mt-2 text-[13px] whitespace-pre-line text-ink-700">“{r.notes}”</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="gold">Budget {moneyIn(r.budgetMinLocal, r.currency)} – {moneyIn(r.budgetMaxLocal, r.currency)}</Badge>
                {r.currency !== "USD" && <Badge tone="neutral">≈ {fmt(r.budgetMin)} – {fmt(r.budgetMax)}</Badge>}
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
        description={open ? `Sender's budget: ${moneyIn(open.budgetMinLocal, open.currency)} – ${moneyIn(open.budgetMaxLocal, open.currency)}${open.items.length > 1 ? ` for all ${open.items.length} items` : ""}` : undefined}
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
          {open && open.items.length > 1 && (
            <Notice tone="info" title="Quote for the whole list">
              Your price must cover every item: {open.items.map((i) => (i.quantity > 1 ? `${i.quantity}× ${i.name}` : i.name)).join(", ")}.
            </Notice>
          )}
          <Field label="What will you send?" required error={errors.description}>
            {(id, d) => <Textarea id={id} aria-describedby={d} aria-invalid={!!errors.description} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}
          </Field>
          <Field label={open && open.items.length > 1 ? `Total price for all items, incl. delivery (${open.currency})` : `Price incl. delivery (${open?.currency ?? "USD"})`} required error={errors.price}>
            {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!errors.price} type="number" min={1} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-40" />}
          </Field>
          {outside && <Notice tone="warning" title="Outside the sender's budget">Quotes outside {moneyIn(open!.budgetMinLocal, open!.currency)} – {moneyIn(open!.budgetMaxLocal, open!.currency)} are allowed but clearly flagged to the sender.</Notice>}
          {submit.error && <Notice tone="danger">{submit.error.message}</Notice>}
        </div>
      </Modal>
    </>
  );
}
