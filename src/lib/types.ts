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
  recipient: { name: string; phone: string; address: string; city: string };
  gift: { giftMessage: string; personalisation: string; discreetPackaging: boolean; hidePrice: boolean };
  delivery: { deliveryOption: string; deliveryDate: string | null; trackingReference: string | null; courier: string | null; deliveredAt: string | null; deliveryEvidence: string | null };
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
