"use client";

import { useState } from "react";
import { Globe2, Landmark } from "lucide-react";
import { useApi } from "@/shared/lib/api";
import { Badge, Button, Card, CardHeader, Notice, Spinner } from "@/shared/ui/primitives";
import { BankAccountForm } from "@/shared/ui/bank-account";

type Account = { bankName: string; accountName: string; accountNumber: string; updatedAt: string; bankCode: string | null; verified: boolean; needsBankCode: boolean };
type Data = { account: Account | null; stripeConnected: boolean };

/** Where SecretWish pays the store: a Nigerian bank account (checked with the bank), or Stripe for stores outside Nigeria. */
export function PayoutAccountCard() {
  const { data, loading, reload } = useApi<Data>("/vendor/payout-account");
  const { data: banks } = useApi<{ engine: string | null }>("/payments/banks?country=NG");
  const { data: stripe } = useApi<{ connected: boolean; payoutsEnabled: boolean; available: boolean }>("/payments/connect/status?for=store");
  const [editing, setEditing] = useState(false);
  const account = data?.account;
  const showForm = editing || (!loading && !account && !stripe?.connected);

  return (
    <Card>
      <CardHeader title="Payout account" description="Where SecretWish sends your earnings. The account number is encrypted; only its last 4 digits are shown." />
      <div className="space-y-4 p-5 pt-0">
        {loading && <Spinner />}
        {account?.needsBankCode && banks?.engine && !editing && <Notice tone="warning">Choose your bank again from the list so payouts can be sent to this account.</Notice>}
        {account && !editing && (
          <div className="flex items-center gap-3">
            <Landmark className="size-6 text-plum-700" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{account.bankName} {account.accountNumber}</p>
              <p className="text-xs text-ink-500">{account.accountName}{account.verified ? " · confirmed by your bank" : ""}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Change</Button>
          </div>
        )}
        {stripe?.connected && (
          <p className="flex items-center gap-2 text-sm">
            <Globe2 className="size-4 text-plum-700" aria-hidden /> Stripe payouts
            {stripe.payoutsEnabled ? <Badge tone="success">Ready</Badge> : <Badge tone="warning">Finish setting up on Stripe</Badge>}
          </p>
        )}
        {showForm && (
          <BankAccountForm endpoint="/vendor/payout-account" connectFor="store" submitLabel="Save payout account"
            onSaved={() => { setEditing(false); reload(); }} onCancel={account ? () => setEditing(false) : undefined} />
        )}
      </div>
    </Card>
  );
}
