// IMPORTANTE: adicionar no Vercel Dashboard as mesmas
// variáveis NEXT_PUBLIC_CARTPANDA_* do .env.local

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Product IDs → expiration
// 208184469 → 1 month (Pro Mensal)
// 208184474 → 3 months (Pro Trimestral)
// 208184481 → 1 year (Pro Anual)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    if (body.order_status === 'paid') {
      const email = body.customer_email as string | undefined;
      if (!email) return Response.json({ received: true });

      const productId = String(body.product_id ?? '');
      const expiresAt = new Date();

      if (productId === '208184469') expiresAt.setMonth(expiresAt.getMonth() + 1);
      else if (productId === '208184474') expiresAt.setMonth(expiresAt.getMonth() + 3);
      else if (productId === '208184481') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      else {
        console.warn('[CartPanda Webhook] produto desconhecido:', productId);
        return Response.json({ received: true });
      }

      const supabase = await createAdminClient();
      await supabase
        .from('profiles')
        .update({
          plan: 'pro',
          pro_expires_at: expiresAt.toISOString(),
        })
        .eq('email', email);
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error('[CartPanda Webhook]', err);
    return Response.json({ received: true });
  }
}
