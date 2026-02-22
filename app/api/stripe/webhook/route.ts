import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripeServer } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function upsertSubscription(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  sub: Stripe.Subscription,
  userId: string,
  plan: string
) {
  const period = sub.items.data[0]?.current_period_end;
  await admin.from('subscriptions').upsert(
    {
      user_id:            userId,
      stripe_customer_id: sub.customer as string,
      stripe_sub_id:      sub.id,
      plan,
      status:             sub.status,
      current_period_end: period ? new Date(period * 1000).toISOString() : null,
      updated_at:         new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  await admin.from('profiles').update({ plan }).eq('id', userId);
}

export async function POST(req: NextRequest) {
  const body          = await req.text();
  const sig           = req.headers.get('stripe-signature') ?? '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

  const stripe = getStripeServer();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('[Webhook] Assinatura inválida', err);
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 });
  }

  const admin = await createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession;
      const userId  = session.metadata?.user_id;
      const plan    = session.metadata?.plan ?? 'pro';

      if (userId && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await upsertSubscription(admin, sub, userId, plan);
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub    = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      const plan   = sub.metadata?.plan ?? (sub.status === 'active' ? 'pro' : 'free');

      if (userId) await upsertSubscription(admin, sub, userId, plan);
      break;
    }

    default:
      console.log(`[Webhook] Evento não tratado: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
