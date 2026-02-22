import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer, PLANS, type PlanKey } from '@/lib/stripe/client';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const plan = body.plan as PlanKey;

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    const stripe = getStripeServer();
    const admin  = await createAdminClient();

    // Busca customer existente no Stripe
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      success_url: `${req.nextUrl.origin}/dashboard?checkout=success`,
      cancel_url:  `${req.nextUrl.origin}/pricing?checkout=canceled`,
      metadata: { user_id: user.id, plan },
      subscription_data: { metadata: { user_id: user.id, plan } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[Stripe Checkout]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
