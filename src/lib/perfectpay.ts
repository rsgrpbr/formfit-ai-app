// ── PerfectPay checkout links (configurados como env vars) ──────────────────
export const PLANS: Record<string, string | undefined> = {
  pro_mensal:       process.env.NEXT_PUBLIC_PP_PRO_MENSAL,
  pro_anual:        process.env.NEXT_PUBLIC_PP_PRO_ANUAL,
  personal_mensal:  process.env.NEXT_PUBLIC_PP_PERSONAL_MENSAL,
  personal_anual:   process.env.NEXT_PUBLIC_PP_PERSONAL_ANUAL,
};

// Redireciona ao checkout externo da PerfectPay preservando UTMs
export function redirectToCheckout(planKey: string, userId: string): void {
  const url = PLANS[planKey];
  if (!url) {
    console.error('[PerfectPay] Link não configurado para plano:', planKey);
    return;
  }
  // Passa userId como src para rastrear conversão por usuário
  window.location.href = `${url}?src=${userId}`;
}

// Consulta status da assinatura via API server-side
// Endpoint oficial: POST https://app.perfectpay.com.br/api/v1/subscriptions/get
// Headers: Authorization Bearer TOKEN, Content-Type application/json
// Body: { customer_email: string, subscription_status_enum: number }
// Status: 1=trial, 2=ativa, 3=cancelada, 4=aguardando
export async function getSubscriptionStatus(email: string) {
  const res = await fetch('/api/perfectpay/subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
}
