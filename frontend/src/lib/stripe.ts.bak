import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const PLANS = {
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    price: 19,
    interval: "month",
    features: [
      "50 drafts por mes",
      "Voice memory persistente",
      "X + LinkedIn",
      "Feedback loop que aprende",
    ],
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    price: 49,
    interval: "month",
    features: [
      "Drafts ilimitados",
      "4 plataformas (X, LinkedIn, Substack, TikTok)",
      "Feedback loop avanzado",
      "Voice profile export",
      "Soporte prioritario",
    ],
  },
} as const;
