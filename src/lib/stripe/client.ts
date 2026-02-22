import Stripe from 'stripe';

export function getStripeServer(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY não configurada');
  return new Stripe(key, { apiVersion: '2025-01-27.acacia' });
}

export const PLANS = {
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO ?? '',
    price: 'R$ 29,90/mês',
    features: [
      'Exercícios ilimitados',
      'Histórico completo',
      'Feedback por voz (ElevenLabs)',
      'Export CSV',
    ],
  },
  annual: {
    name: 'Anual',
    priceId: process.env.STRIPE_PRICE_ANNUAL ?? '',
    price: 'R$ 199,90/ano',
    features: [
      'Tudo do Pro',
      'Análise avançada',
      'Suporte prioritário',
      '2 meses grátis',
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
