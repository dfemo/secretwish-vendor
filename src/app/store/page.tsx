"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, CircleX, Star } from "lucide-react";
import { api, ApiError, useApi, useMutation } from "@/shared/lib/api";
import { pct } from "@/shared/lib/format";
import { Avatar, Badge, Button, Card, CardHeader, ErrorState, Field, Input, Notice, PageHeader, PageSkeleton, Select, StatusBadge, Textarea } from "@/shared/ui/primitives";
import { useToast } from "@/shared/ui/overlay";

type Me = { vendor: { name: string; contactName: string; email: string; city: string; primaryCategory: string; description: string; status: string; businessVerified: boolean; bankVerified: boolean; idVerified: boolean; rating: number; acceptanceRate: number; onTimeRate: number; plan: string; decisionReason?: string } };

export default function StorePage() {
  const { data, error, loading, reload } = useApi<Me>("/me");
  const toast = useToast();
  const [f, setF] = useState({ description: "", city: "", contactName: "" });
  useEffect(() => { if (data?.vendor) setF({ description: data.vendor.description, city: data.vendor.city, contactName: data.vendor.contactName }); }, [data]);
  const save = useMutation(() => api("/vendor/store", { method: "PUT", body: f }));
  if (loading) return <PageSkeleton />;
  if (error || !data?.vendor) return <ErrorState error={error} onRetry={reload} />;
  const v = data.vendor;
  const descError = save.error instanceof ApiError ? save.error.errors?.description?.[0] ?? save.error.message : null;

  return (
    <>
      <PageHeader title="Store profile" description="How your store appears to SecretWish customers." />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Public profile" />
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-4">
              <Avatar name={v.name} size={64} />
              <div>
                <p className="font-display text-2xl font-semibold text-plum-900">{v.name}</p>
                <p className="flex items-center gap-2 text-sm text-ink-500">{v.primaryCategory} · <Star className="size-3.5 fill-gold-500 text-gold-500" aria-hidden /> {v.rating.toFixed(1)}</p>
              </div>
            </div>
            <Field label="About your store" required error={descError}>
              {(id, d) => <Textarea id={id} aria-describedby={d} aria-invalid={!!descError} className="min-h-[120px]" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact name">{(id) => <Input id={id} value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} />}</Field>
              <Field label="Dispatch city">
                {(id) => (
                  <Select id={id} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>
                    {["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Kano"].map((c) => (<option key={c}>{c}</option>))}
                  </Select>
                )}
              </Field>
            </div>
            <Button loading={save.pending} onClick={async () => { if ((await save.run()) !== undefined) toast({ tone: "success", title: "Store profile saved" }); }}>Save profile</Button>
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Account status" action={<StatusBadge status={v.status} />} />
            <ul className="space-y-2 p-5 text-sm">
              {[["Business registration", v.businessVerified], ["Settlement bank account", v.bankVerified], ["Director ID", v.idVerified]].map(([l, ok]) => (
                <li key={l as string} className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2">
                  <span>{l}</span>
                  {ok ? <span className="inline-flex items-center gap-1 font-semibold text-success-700"><BadgeCheck className="size-4" aria-hidden /> Verified</span> : <span className="inline-flex items-center gap-1 text-ink-500"><CircleX className="size-4" aria-hidden /> Pending</span>}
                </li>
              ))}
            </ul>
            {v.decisionReason && <Notice className="mx-5 mb-5">{v.decisionReason}</Notice>}
          </Card>
          <Card>
            <CardHeader title="Performance" description="Visible to SecretWish operations" />
            <dl className="grid grid-cols-2 gap-3 p-5 text-center">
              <div className="rounded-xl bg-ink-50 p-3"><dt className="text-xs text-ink-500">Acceptance</dt><dd className="text-xl font-bold tabular">{pct(v.acceptanceRate * 100, 0)}</dd></div>
              <div className="rounded-xl bg-ink-50 p-3"><dt className="text-xs text-ink-500">On-time</dt><dd className="text-xl font-bold tabular">{pct(v.onTimeRate * 100, 0)}</dd></div>
            </dl>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold">Subscription</p>
            <p className="mt-1 text-sm text-ink-700">{v.plan} <Badge tone="gold" className="ml-1">Simulated billing</Badge></p>
            <p className="mt-1 text-xs text-ink-500">Vendor plans are monthly, or yearly at a reduced price. Price points to be confirmed.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
