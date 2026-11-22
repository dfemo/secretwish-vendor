"use client";

import { useEffect, useState } from "react";
import { PlansDialog, PlanSummaryCard } from "@/shared/ui/pricing";

/**
 * The store's plan: a summary card (plan, until when, last payment) that opens the vendor plans in a dialog. A paid plan is paid
 * with the payment engine chosen for plans and switches on once the payment is confirmed. /store#plans opens the dialog straight away.
 */
export function StorePlans({ current, onChanged }: { current: string; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (window.location.hash === "#plans") setOpen(true); }, []);
  return (
    <>
      <PlanSummaryCard audience="vendor" onManage={() => setOpen(true)} />
      <PlansDialog
        open={open}
        onClose={() => setOpen(false)}
        audience="vendor"
        current={current}
        next="/store"
        onSwitched={onChanged}
        intro="Prices are set in USD and shown in your currency. A commission also applies to each order's product subtotal."
      />
    </>
  );
}
