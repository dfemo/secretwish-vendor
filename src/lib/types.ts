export type VendorOrder = {
  id: string;
  reference: string;
  createdAt: string;
  status: string;
  fulfilmentStatus: string;
  deliveryStatus: string;
  lines: { productName: string; emoji: string; quantity: number; unitPrice: number; customisation: string; total: number }[];
  earnings: { gross: number; fee: number; net: number };
  sender: string;
  /** For hub orders (viaHub) these are the SecretWish hub's details: deliver there, not to the recipient. */
  recipient: { name: string; phone: string; address: string; city: string };
  viaHub?: boolean;
  hubReceivedAt?: string | null;
  gift: { giftMessage: string; personalisation: string; discreetPackaging: boolean; hidePrice: boolean };
  delivery: { deliveryOption: string; deliveryDate: string | null; trackingReference: string | null; courier: string | null; deliveredAt: string | null; deliveryEvidence: string | null; senderApprovedAt: string | null };
  acceptBy: string | null;
  events?: { id: string; at: string; title: string; detail: string; actor: string; internal: boolean }[];
  payout?: { eligible: boolean; reason: string } | null;
  actions: { key: string; label: string }[];
};

export type VendorProduct = {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
  stock: number;
  lowStockThreshold: number;
  /** Photo links, cover first (empty: show the emoji). */
  images?: string[];
  /** Waiting listings from vendors on timed approval: when it goes live unless SecretWish reviews it first. */
  autoApproveAt?: string | null;
  emoji: string;
  tint: string;
  status: string;
  reviewNote?: string;
  deliveryOptions: string[];
  rating: number;
  sold: number;
  categoryId: string;
  category: string;
};
