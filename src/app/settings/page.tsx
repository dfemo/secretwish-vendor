"use client";

import { useSession } from "@/shared/lib/session";
import { Badge, Card, CardHeader, PageHeader, Stat } from "@/shared/ui/primitives";
import { NotificationPreferences } from "@/shared/ui/account";

export default function SettingsPage() {
  const { persona, isDemo } = useSession();
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Your account" action={isDemo ? <Badge tone="gold">Demo persona</Badge> : undefined} />
          <dl className="grid grid-cols-2 gap-4 p-5">
            <Stat label="Name" value={persona.name} />
            <Stat label="Email" value={<span className="break-all">{persona.email}</span>} />
            <Stat label="Store" value={persona.vendorName ?? "—"} />
            <Stat label="Role" value="Store owner" />
          </dl>
          <p className="px-5 pb-5 text-xs text-ink-500">Team members, two-factor authentication and bank-detail changes would live here in production (bank changes require re-verification by SecretWish).</p>
        </Card>
        <NotificationPreferences showWishlist={false} />
      </div>
    </>
  );
}
