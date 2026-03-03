import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('CartPanda event:', body.event);

    const order = body.order;
    if (!order) {
      return Response.json({ error: 'No order' }, { status: 400 });
    }

    // Email está em order.email ou order.customer.email
    const email = order.email || order.customer?.email;
    console.log('Email:', email);

    if (!email) {
      return Response.json({ error: 'No email' }, { status: 400 });
    }

    // Variant ID está em order.line_items[0].variant_id
    const variantId = order.line_items?.[0]?.variant_id?.toString();
    console.log('Variant ID:', variantId);

    const supabase = await createAdminClient();

    // PEDIDO PAGO ou ASSINATURA CRIADA → ativar PRO
    if (body.event === 'order.paid' || body.event === 'subscription.created') {

      let expiresAt = new Date();
      // Mapear variant_id para período
      if (variantId === '208184469') expiresAt.setMonth(expiresAt.getMonth() + 1);           // Mensal BR
      else if (variantId === '208184474') expiresAt.setMonth(expiresAt.getMonth() + 3);      // Trimestral BR
      else if (variantId === '208184481') expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Anual BR
      else expiresAt.setMonth(expiresAt.getMonth() + 1);                                     // fallback 1 mês

      const { error } = await supabase
        .from('profiles')
        .update({
          plan: 'pro',
          pro_expires_at: expiresAt.toISOString(),
        })
        .eq('email', email.toLowerCase());

      if (error) {
        console.error('Supabase error:', error);
        return Response.json({ error: 'DB error' }, { status: 500 });
      }

      console.log(`PRO ativado para ${email} até ${expiresAt}`);
    }

    // REEMBOLSO ou CANCELAMENTO → remover PRO
    if (body.event === 'order.refunded' || body.event === 'subscription.cancelled') {
      await supabase
        .from('profiles')
        .update({ plan: 'free', pro_expires_at: null })
        .eq('email', email.toLowerCase());

      console.log(`PRO removido para ${email}`);
    }

    return Response.json({ received: true }, { status: 200 });

  } catch (err) {
    console.error('Webhook error:', err);
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

// CartPanda às vezes faz GET para validar o endpoint
export async function GET() {
  return Response.json({ status: 'ok' });
}
