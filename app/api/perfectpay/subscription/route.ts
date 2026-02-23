import { NextRequest, NextResponse } from 'next/server';

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
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ plan: 'free', status: 'no_email' });
    }

    const token = process.env.PERFECTPAY_TOKEN;
    if (!token) {
      return NextResponse.json({ plan: 'free', status: 'token_missing' });
    }

    // Consulta API da PerfectPay server-side
    const res = await fetch('https://app.perfectpay.com.br/api/v1/subscriptions/get', {
      method: 'POST',
      headers: {
        'Authorization':  `Bearer ${token}`,
        'Content-Type':   'application/json',
      },
      body: JSON.stringify({
        customer_email:            email,
        subscription_status_enum:  2, // 2 = ativa
      }),
    });

    if (!res.ok) {
      console.error('[PerfectPay] API error', res.status);
      return NextResponse.json({ plan: 'free', status: 'api_error' });
    }

    const data = await res.json();

    // PerfectPay retorna lista de assinaturas
    const subscriptions: unknown[] = data?.data ?? data?.subscriptions ?? [];

    if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
      return NextResponse.json({ plan: 'free', status: 'no_subscription' });
    }

    const sub = subscriptions[0] as Record<string, unknown>;
    const planObj  = sub?.plan  as Record<string, unknown> | undefined;
    const prodObj  = sub?.product as Record<string, unknown> | undefined;
    const planName = (planObj?.name ?? prodObj?.name ?? '') as string;
    const plan     = identifyPlan(planName);

    return NextResponse.json({ plan, status: 'active', planName });
  } catch (err) {
    console.error('[PerfectPay subscription]', err);
    return NextResponse.json({ plan: 'free', status: 'error' });
  }
}
