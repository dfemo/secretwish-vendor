"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ImagePlus, Send } from "lucide-react";
import { api, ApiError, useMutation } from "@/shared/lib/api";
import { useSession } from "@/shared/lib/session";
import { Button, Card, CardHeader, cx, Field, Input, Notice, ProductArt, Select, StatusBadge, Textarea } from "@/shared/ui/primitives";
import { useToast } from "@/shared/ui/overlay";
import type { VendorProduct } from "@/lib/types";

const emojis = ["🎁", "🧺", "💐", "🌹", "🎂", "🍫", "🕯️", "🧴", "💍", "📿", "👗", "🧣", "🎧", "⌚", "📚", "☕", "🍷", "🛁", "💆", "⛵"];
const tints = ["lavender", "gold", "ivory", "rose", "sage", "plum"];
const deliveryOptions = ["Standard", "Express", "Same-day", "E-voucher"];

type Form = { name: string; description: string; categoryId: string; priceUsd: string; stock: string; lowStockThreshold: string; emoji: string; tint: string; deliveryOptions: string[] };

export function ProductEditor({ product }: { product?: VendorProduct }) {
  const router = useRouter();
  const toast = useToast();
  const { meta, fmt } = useSession();
  const [f, setF] = useState<Form>({ name: "", description: "", categoryId: "", priceUsd: "", stock: "10", lowStockThreshold: "5", emoji: "🎁", tint: "lavender", deliveryOptions: ["Standard"] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    if (product)
      setF({ name: product.name, description: product.description, categoryId: product.categoryId, priceUsd: String(product.priceUsd), stock: String(product.stock), lowStockThreshold: String(product.lowStockThreshold), emoji: product.emoji, tint: product.tint, deliveryOptions: product.deliveryOptions });
  }, [product]);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);
  // Default new products to the first category once reference data has loaded.
  useEffect(() => {
    if (!product && meta?.categories.length) setF((x) => (x.categoryId ? x : { ...x, categoryId: meta.categories[0].id }));
  }, [product, meta]);

  const body = () => ({ ...f, priceUsd: Number(f.priceUsd), stock: Number(f.stock), lowStockThreshold: Number(f.lowStockThreshold) });
  const save = useMutation(async (submit: boolean) => {
    const saved = await api<{ id: string; status: string }>(product ? `/vendor/products/${product.id}` : "/vendor/products", { method: product ? "PUT" : "POST", body: body() });
    if (submit && (saved.status === "Draft" || saved.status === "Rejected")) return api<{ id: string; status: string }>(`/vendor/products/${saved.id}/submit`, { method: "POST" });
    return saved;
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "Name is required.";
    if (f.description.trim().length < 20) e.description = "Describe the product in at least 20 characters.";
    if (!(Number(f.priceUsd) >= 1 && Number(f.priceUsd) <= 5000)) e.priceUsd = "Enter a price between $1 and $5,000.";
    if (!(Number(f.stock) >= 0) || !Number.isInteger(Number(f.stock))) e.stock = "Enter a whole number, 0 or more.";
    if (!f.categoryId) e.categoryId = "Choose a category.";
    if (f.deliveryOptions.length === 0) e.deliveryOptions = "Choose at least one delivery option.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (forReview: boolean) => {
    if (!validate()) return;
    const r = await save.run(forReview);
    if (r) {
      toast({ tone: "success", title: forReview ? "Submitted for review" : "Saved", body: r.status === "PendingReview" ? "SecretWish will review the listing before it goes live." : `Status: ${r.status}` });
      router.push("/products");
    }
  };
  const serverErrors = save.error instanceof ApiError ? save.error.errors : undefined;
  const err = (k: string) => errors[k] ?? serverErrors?.[k]?.[0];
  const live = product && ["Approved", "OutOfStock"].includes(product.status);

  return (
    <>
      <Link href="/products" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-plum-700">
        <ArrowLeft className="size-4" aria-hidden /> Products
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-semibold text-plum-900">{product ? "Edit product" : "New product"}</h1>
        {product && <StatusBadge status={product.status} />}
      </div>
      {product?.reviewNote && <Notice className="mb-6" tone="warning" title="Reviewer note">{product.reviewNote}</Notice>}
      {live && <Notice className="mb-6">Changing the name, description, price or category of a live listing sends it back for review. Stock and delivery changes apply immediately.</Notice>}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Details" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Product name" required className="sm:col-span-2" error={err("name")}>
              {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!err("name")} maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}
            </Field>
            <Field label="Description" required className="sm:col-span-2" error={err("description")} hint="What's included, sizes, materials, allergens.">
              {(id, d) => <Textarea id={id} aria-describedby={d} aria-invalid={!!err("description")} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />}
            </Field>
            <Field label="Category">
              {(id) => (
                <Select id={id} value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}>
                  {meta?.categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </Select>
              )}
            </Field>
            <Field label="Price (USD base currency)" required error={err("priceUsd")} hint={Number(f.priceUsd) > 0 ? `Shown to Nigerian customers as ≈ ₦${Math.round(Number(f.priceUsd) * (meta?.fxRateNgn ?? 1550)).toLocaleString()}` : "Prices are set in USD and converted locally."}>
              {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!err("priceUsd")} type="number" min={1} step="0.01" value={f.priceUsd} onChange={(e) => setF({ ...f, priceUsd: e.target.value })} />}
            </Field>
            <Field label="Stock" required error={err("stock")}>
              {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!err("stock")} type="number" min={0} value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} />}
            </Field>
            <Field label="Low-stock alert at">
              {(id) => <Input id={id} type="number" min={0} value={f.lowStockThreshold} onChange={(e) => setF({ ...f, lowStockThreshold: e.target.value })} />}
            </Field>
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-[13px] font-semibold text-ink-700">Delivery options <span className="text-danger-600">*</span></legend>
              <div className="flex flex-wrap gap-2">
                {deliveryOptions.map((o) => {
                  const on = f.deliveryOptions.includes(o);
                  return (
                    <label key={o} className={cx("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm", on ? "border-plum-500 bg-plum-50" : "border-ink-200")}>
                      <input type="checkbox" className="accent-plum-700" checked={on} onChange={() => setF({ ...f, deliveryOptions: on ? f.deliveryOptions.filter((x) => x !== o) : [...f.deliveryOptions, o] })} />
                      {o} <span className="text-xs text-ink-500">({fmt(meta?.deliveryFees[o] ?? 0)} to customer)</span>
                    </label>
                  );
                })}
              </div>
              {err("deliveryOptions") && <p className="mt-1 text-xs font-medium text-danger-700" role="alert">{err("deliveryOptions")}</p>}
            </fieldset>
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Images" description="Upload is simulated in the prototype — files stay in your browser and aren't stored." />
            <div className="space-y-4 p-5">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Preview of the uploaded product photo" className="aspect-[4/3] w-full rounded-2xl object-cover" />
              ) : (
                <ProductArt emoji={f.emoji} tint={f.tint} size="xl" label="Listing cover preview" />
              )}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300 px-3 py-3 text-sm font-semibold text-plum-700 hover:bg-plum-50">
                <ImagePlus className="size-4" aria-hidden /> Choose a photo (preview only)
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) setPhoto(URL.createObjectURL(file)); }} />
              </label>
              <div>
                <p className="mb-1.5 text-[13px] font-semibold text-ink-700">Cover illustration</p>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Cover illustration">
                  {emojis.map((e) => (
                    <button key={e} type="button" role="radio" aria-checked={f.emoji === e} onClick={() => setF({ ...f, emoji: e })} className={cx("grid size-9 place-items-center rounded-lg text-lg", f.emoji === e ? "bg-plum-100 ring-2 ring-plum-500" : "bg-ink-50 hover:bg-ink-100")}>
                      {e}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex gap-1.5" role="radiogroup" aria-label="Background tint">
                  {tints.map((t) => (
                    <button key={t} type="button" role="radio" aria-checked={f.tint === t} aria-label={t} onClick={() => setF({ ...f, tint: t })} className={cx("size-8 rounded-full", `bg-${t}-tint`, f.tint === t && "ring-2 ring-plum-500 ring-offset-2")} />
                  ))}
                </div>
              </div>
            </div>
          </Card>
          {save.error && !serverErrors && <Notice tone="danger">{save.error.message}</Notice>}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" loading={save.pending} onClick={() => submit(false)}>
              {product && product.status !== "Draft" ? "Save changes" : "Save draft"}
            </Button>
            {(!product || ["Draft", "Rejected"].includes(product.status)) && (
              <Button icon={Send} loading={save.pending} onClick={() => submit(true)}>
                Submit for review
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
