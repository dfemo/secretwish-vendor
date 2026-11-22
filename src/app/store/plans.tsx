"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/shared/lib/api";
import { useSession } from "@/shared/lib/session";
import { Skeleton } from "@/shared/ui/primitives";
import { useToast } from "@/shared/ui/overlay";
import { BillingToggle, parsePlanCode, PlanButton, PlanSummaryCard, PricingCards, usePlanChoice, usePlanSummary, type Billing, type PlanCatalog } from "@/shared/ui/pricing";

/** The vendor plans admins have set, with the store's current one marked. A paid plan is paid with the default payment engine and
 * switches on once the payment is confirmed. */
export function StorePlans({ current, onChanged }: { current: string; onChanged: () => void }) {
  const { data: catalog } = useApi<PlanCatalog>("/plans/vendor");
  const { fmt } = useSession();
  const toast = useToast();
  const [billing, setBilling] = useState<Billing>("Yearly");
  const change = usePlanChoice("vendor");
  const summary = usePlanSummary("vendor");
  // Open on the period the store pays for.
  useEffect(() => { const b = parsePlanCode(current).billing; if (b) setBilling(b); }, [current]);

  return (
    <section id="plans" aria-labelledby="plans-h" className="mt-8 scroll-mt-24 rounded-[32px] bg-[linear-gradient(135deg,#f3eef7_0%,#fbf6e8_100%)] p-4 sm:p-6 md:p-8">
      <PlanSummaryCard audience="vendor" manageHref="#plans" className="mb-6" />
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="plans-h" className="flex items-center gap-2 font-display text-3xl font-semibold text-plum-900">
            Subscription
          </h2>
          <p className="mt-1 text-sm text-ink-500">Prices are set in USD and shown in your currency. A commission also applies to each order&apos;s product subtotal.</p>
        </div>
        <BillingToggle value={billing} onChange={setBilling} />
      </div>
      {catalog ? (
        <PricingCards
          catalog={catalog}
          billing={billing}
          format={(usd) => fmt(usd)}
          current={current}
          action={(p, { current: isCurrent, code }) => (
            <PlanButton
              plan={p}
              disabled={(isCurrent && p.isFree) || change.pending || !!summary.data?.blocked[code]}
              title={summary.data?.blocked[code]}
              onClick={async () => {
                const r = await change.choose(code, p.isFree, "/store#plans");
                if (r?.switched) {
                  toast({ tone: "success", title: `Switched to ${p.name}` });
                  onChanged();
                }
              }}
            >
              {isCurrent ? (p.isFree ? "Your plan" : `Renew ${p.name}`) : summary.data?.blocked[code] ? "Available after your plan ends" : p.isFree ? `Switch to ${p.name}` : `Pay for ${p.name}`}
            </PlanButton>
          )}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-[480px] rounded-[30px]" />)}</div>
      )}
      {change.error && <p role="alert" className="mt-4 text-center text-sm text-danger-700">{change.error.message}</p>}
    </section>
  );
}
