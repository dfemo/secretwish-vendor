"use client";

import type { ReactNode } from "react";
import { BarChart3, Boxes, ClipboardList, HandCoins, LayoutDashboard, LifeBuoy, Package, RotateCcw, Settings, Sparkles, Store, Truck } from "lucide-react";
import { useApi } from "@/shared/lib/api";
import { SessionProvider, useSession } from "@/shared/lib/session";
import { SidebarShell, type NavSection } from "@/shared/layout/shell";
import { ToastProvider } from "@/shared/ui/overlay";

function Shell({ children }: { children: ReactNode }) {
  const { persona } = useSession();
  const { data } = useApi<{ kpis: { awaitingAcceptance: number; lowStock: number } }>("/vendor/overview?days=30");
  const sections: NavSection[] = [
    { items: [{ href: "/", label: "Overview", icon: LayoutDashboard }] },
    {
      title: "Sell",
      items: [
        { href: "/orders", label: "Orders", icon: Package, badge: data?.kpis.awaitingAcceptance },
        { href: "/fulfilment", label: "Fulfilment", icon: Truck },
        { href: "/returns", label: "Returns & Issues", icon: RotateCcw },
        { href: "/quotes", label: "Surprise requests", icon: Sparkles },
      ],
    },
    {
      title: "Catalogue",
      items: [
        { href: "/products", label: "Products", icon: Boxes },
        { href: "/inventory", label: "Inventory", icon: ClipboardList, badge: data?.kpis.lowStock },
      ],
    },
    {
      title: "Business",
      items: [
        { href: "/analytics", label: "Sales Analytics", icon: BarChart3 },
        { href: "/payouts", label: "Payouts", icon: HandCoins },
        { href: "/store", label: "Store Profile", icon: Store },
      ],
    },
    {
      title: "Account",
      items: [
        { href: "/support", label: "Support", icon: LifeBuoy },
        { href: "/settings", label: "Settings", icon: Settings },
      ],
    },
  ];
  return (
    <SidebarShell sections={sections} suffix="Vendor" subtitle={persona.vendorName ?? "Vendor"}>
      {children}
    </SidebarShell>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SessionProvider
        app="vendor"
        intro={
          <>
            <h1 className="font-display text-4xl leading-tight font-semibold md:text-5xl">
              Your storefront for <span className="text-gold-400">secret surprises</span>.
            </h1>
            <p className="mt-4 max-w-md text-plum-200">Accept orders, dispatch discreetly, quote on custom surprises within each sender&apos;s budget, and track payouts — all in one place.</p>
          </>
        }
      >
        <Shell>{children}</Shell>
      </SessionProvider>
    </ToastProvider>
  );
}
