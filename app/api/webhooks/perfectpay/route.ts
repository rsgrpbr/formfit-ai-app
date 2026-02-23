import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type Plan = 'free' | 'pro' | 'personal';

function identifyPlan(name: string): Plan {
  const lower = name.toLowerCase();
  if (lower.includes('personal')) return 'personal';
  if (lower.includes('pro'))      return 'pro';
  return 'free';
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json() as Record<string, unknown>;

    // 1. Validar token do payload
    const webhookToken = process.env.PERFECTPAY_WEBHOOK_TOKEN;
    if (!webhookToken || payload.token !== webhookToken) {
      console.error('[PerfectPay Webhook] Token inválido');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer       = payload.customer as Record<string, unknown> | undefined;
    const planObj        = payload.plan     as Record<string, unknown> | undefined;
    const email          = customer?.email  as string | undefined;
    const saleStatus     = payload.sale_status_enum as number;
    const planName       = (planObj?.name ?? '') as string;
    const code           = payload.code as string | undefined;

    if (!email) {
      return NextResponse.json({ received: true });
    }

    const admin = await createAdminClient();

    // Buscar usuário no Supabase pelo e-mail
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (!profile) {
      console.warn('[PerfectPay Webhook] Usuário não encontrado:', email);
      return NextResponse.json({ received: true });
    }

    const userId = profile.id as string;

    // 2. Venda aprovada
    if (saleStatus === 2) {
      const plan: Plan = identifyPlan(planName);

      await admin.from('subscriptions').upsert(
        {
          user_id:         userId,
          plan,
          status:          'active',
          perfectpay_code: code ?? null,
          updated_at:      new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      await admin.from('profiles').update({ plan }).eq('id', userId);
    }

    // 3. Cancelada (6) ou reembolsada (7)
    if (saleStatus === 6 || saleStatus === 7) {
      await admin.from('subscriptions').upsert(
        {
          user_id:    userId,
          plan:       'free',
          status:     'cancelled',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      await admin.from('profiles').update({ plan: 'free' }).eq('id', userId);
    }

    // Sempre retornar 200 — PerfectPay retenta se não receber 200
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[PerfectPay Webhook]', err);
    return NextResponse.json({ received: true });
  }
}
