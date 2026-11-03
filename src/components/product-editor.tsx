"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowLeftRight, ImagePlus, Send, X } from "lucide-react";
import { api, ApiError, useMutation } from "@/shared/lib/api";
import { useSession } from "@/shared/lib/session";
import { Button, Card, CardHeader, cx, Field, Input, Notice, ProductArt, Select, StatusBadge, Textarea } from "@/shared/ui/primitives";
import { useToast } from "@/shared/ui/overlay";
import type { VendorProduct } from "@/lib/types";

const emojis = ["🎁", "🧺", "💐", "🌹", "🎂", "🍫", "🕯️", "🧴", "💍", "📿", "👗", "🧣", "🎧", "⌚", "📚", "☕", "🍷", "🛁", "💆", "⛵"];
const tints = ["lavender", "gold", "ivory", "rose", "sage", "plum"];
const deliveryOptions = ["Standard", "Express", "Same-day", "E-voucher"];
const MaxPhotos = 3;

type Form = { name: string; description: string; categoryId: string; priceUsd: string; stock: string; lowStockThreshold: string; emoji: string; tint: string; deliveryOptions: string[] };

export function ProductEditor({ product }: { product?: VendorProduct }) {
  const router = useRouter();
  const toast = useToast();
  const { meta, fmt } = useSession();
  const [f, setF] = useState<Form>({ name: "", description: "", categoryId: "", priceUsd: "", stock: "10", lowStockThreshold: "5", emoji: "🎁", tint: "lavender", deliveryOptions: ["Standard"] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Uploaded photo links, cover first (up to three).
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  useEffect(() => {
    if (product) {
      setF({ name: product.name, description: product.description, categoryId: product.categoryId, priceUsd: String(product.priceUsd), stock: String(product.stock), lowStockThreshold: String(product.lowStockThreshold), emoji: product.emoji, tint: product.tint, deliveryOptions: product.deliveryOptions });
      setImages(product.images ?? []);
    }
  }, [product]);

  /** Uploads the chosen photos (as many as still fit) one at a time and adds their links. */
  const addPhotos = async (files: FileList | null) => {
    setUploadError(null);
    const chosen = Array.from(files ?? []).slice(0, MaxPhotos - images.length);
    if (chosen.some((file) => file.size > 5 * 1024 * 1024)) return setUploadError("Each photo must be 5 MB or smaller.");
    setUploading(true);
    try {
      for (const file of chosen) {
        const dataBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("That photo couldn't be read."));
          reader.readAsDataURL(file);
        });
        const { url } = await api<{ url: string }>("/vendor/products/images", { method: "POST", body: { fileName: file.name, dataBase64 } });
        setImages((xs) => [...xs, url].slice(0, MaxPhotos));
      }
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };
  // Default new products to the first category once reference data has loaded.
  useEffect(() => {
    if (!product && meta?.categories.length) setF((x) => (x.categoryId ? x : { ...x, categoryId: meta.categories[0].id }));
  }, [product, meta]);

  const body = () => ({ ...f, priceUsd: Number(f.priceUsd), stock: Number(f.stock), lowStockThreshold: Number(f.lowStockThreshold), imageUrls: images });
  const save = useMutation(async (submit: boolean) => {
    const saved = await api<{ id: string; status: string; autoApproveAt?: string | null }>(product ? `/vendor/products/${product.id}` : "/vendor/products", { method: product ? "PUT" : "POST", body: body() });
    if (submit && (saved.status === "Draft" || saved.status === "Rejected")) return api<{ id: string; status: string; autoApproveAt?: string | null }>(`/vendor/products/${saved.id}/submit`, { method: "POST" });
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
      const live = r.status === "Approved" || r.status === "OutOfStock";
      toast({
        tone: "success",
        title: live && forReview ? "Your listing is live" : forReview ? "Submitted for review" : "Saved",
        body: r.status === "PendingReview" ? (r.autoApproveAt ? "It goes live in 24 hours unless SecretWish reviews it sooner." : "SecretWish will review the listing before it goes live.") : live ? (r.status === "OutOfStock" ? "Approved. Add stock so senders can buy it." : "Senders can find it now.") : `Status: ${r.status}`,
      });
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
            <CardHeader title="Photos" description={`Up to ${MaxPhotos} photos (JPG, PNG or WebP, 5 MB each). Senders see them before they buy; the first is the cover. Changing photos on a live listing sends it back for review.`} />
            <div className="space-y-4 p-5">
              <ProductArt emoji={f.emoji} tint={f.tint} size="xl" src={images[0]} label={images[0] ? "Cover photo" : "Listing cover preview"} />
              {images.length > 0 && (
                <ul className="grid grid-cols-3 gap-2">
                  {images.map((src, i) => (
                    <li key={src} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Photo ${i + 1}`} className={cx("aspect-square w-full rounded-xl object-cover", i === 0 && "ring-2 ring-plum-500")} />
                      <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setImages(images.filter((x) => x !== src))} className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-white/90 text-ink-700 shadow hover:text-danger-700">
                        <X className="size-3.5" aria-hidden />
                      </button>
                      {i > 0 && (
                        <button type="button" onClick={() => setImages([src, ...images.filter((x) => x !== src)])} className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-plum-800 shadow">
                          <ArrowLeftRight className="size-3" aria-hidden /> Make cover
                        </button>
                      )}
                      {i === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-plum-800 px-2 py-0.5 text-[11px] font-semibold text-ivory-50">Cover</span>}
                    </li>
                  ))}
                </ul>
              )}
              {images.length < MaxPhotos && (
                <label className={cx("flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300 px-3 py-3 text-sm font-semibold text-plum-700 hover:bg-plum-50", uploading && "pointer-events-none opacity-60")}>
                  <ImagePlus className="size-4" aria-hidden /> {uploading ? "Uploading…" : `Add photos (${images.length}/${MaxPhotos})`}
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={uploading} onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
                </label>
              )}
              {(uploadError || err("imageUrls")) && <p className="text-xs font-medium text-danger-700" role="alert">{uploadError ?? err("imageUrls")}</p>}
              <div>
                <p className="mb-1.5 text-[13px] font-semibold text-ink-700">{images.length ? "Illustration (shown where photos can't load)" : "Cover illustration"}</p>
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
            <Button variant="secondary" loading={save.pending} disabled={uploading} onClick={() => submit(false)}>
              {product && product.status !== "Draft" ? "Save changes" : "Save draft"}
            </Button>
            {(!product || ["Draft", "Rejected"].includes(product.status)) && (
              <Button icon={Send} loading={save.pending} disabled={uploading} onClick={() => submit(true)}>
                Submit for review
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
