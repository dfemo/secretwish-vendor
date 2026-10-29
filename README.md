# SecretWish — Vendor portal

The seller portal for approved vendors: accept and fulfil orders discreetly, manage listings and stock, quote on surprise requests and follow payouts.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Recharts · lucide-react. All data comes from the SecretWish .NET API (`../Backend`).

## Run

```bash
npm install
cp .env.example .env.local   # optional — defaults point at http://localhost:5080
npm run dev                  # http://localhost:3004
```

Start the API first (`dotnet run --project ../Backend/src/SecretWish.Api --launch-profile http`). Production build: `npm run build && npm start`. Type check: `npm run typecheck`.

## Screens

| Screen | What you can do |
|---|---|
| Overview | Sales, orders, action queue, listings, low stock, fulfilment performance, refund cases, payout status, sales trend |
| Orders / Fulfilment | Accept or decline (with reason), mark dispatched with courier + tracking, report or re-dispatch exceptions. Cannot mark delivered. Sender identity is never shown |
| Returns & Issues | Refund requests and delivery exceptions on your orders |
| Surprise requests | Quote on sender briefs; quotes outside the budget range are flagged |
| Products | Create / edit with validation, cover art + simulated photo upload, submit for review; statuses Draft · Pending review · Approved · Rejected · Suspended · Out of stock |
| Inventory | Inline stock edits; zero stock hides the listing automatically |
| Sales Analytics · Payouts | Weekly sales, products, cities; read-only payout eligibility, history and reconciliation |
| Store Profile · Support · Settings | Profile, verification status, plan, tickets, notifications |

Demo persona: **Bisi Ogunleye** (Lagos Luxe Hampers).

## Shared design system

`src/shared` is identical in Admin, Sender, Recipient and Vendor (tokens, components, API client, app shells). Edit it in one app, then run `sync-shared.ps1` from the workspace root to copy it to the others. A later step is to publish it as a private `@secretwish/ui` package.

## Prototype notes

- **Demo sign-in:** pick a synthetic persona; the API trusts the `X-Demo-User` header. Not real authentication.
- **Sample data only.** Figures are generated, not production analytics.
- Browser storage holds only per-viewer conveniences (chosen persona, currency, sidebar state, recently viewed).
- Prices are stored in USD and shown in USD or NGN at the recorded sample FX rate (toggle in the header).
