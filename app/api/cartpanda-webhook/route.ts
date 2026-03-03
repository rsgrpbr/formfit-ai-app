import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Log completo para debug
    console.log('WEBHOOK FULL PAYLOAD:', JSON.stringify(body, null, 2));

    // CartPanda envia status do pedido
    const status = body.status || body.order_status || body.financial_status;

    // Tentar extrair email de todos os campos possíveis
    const email =
      body.customer?.email ||
      body.email ||
      body.customer_email ||
      body.billing_address?.email ||
      body.contact_email ||
      body.buyer?.email ||
      body.order?.customer?.email ||
      body.order?.email ||
      body.data?.customer?.email ||
      body.data?.email;

    console.log('Email encontrado:', email);
    console.log('Status:', status);
    console.log('Todos os campos:', Object.keys(body));

    if (!email) {
      console.log('PAYLOAD COMPLETO para debug:', JSON.stringify(body));
      return Response.json({ error: 'No email' }, { status: 400 });
    }

    // Só processa pedidos pagos
    if (status === 'paid' || status === 'approved' || status === 'complete') {

      // Calcular expiração baseado no produto
      const productId = body.product_id?.toString()
        || body.line_items?.[0]?.product_id?.toString();

      let expiresAt = new Date();

      // Mensal BR
      if (productId === '208184469') expiresAt.setMonth(expiresAt.getMonth() + 1);
      // Trimestral BR
      if (productId === '208184474') expiresAt.setMonth(expiresAt.getMonth() + 3);
      // Anual BR
      if (productId === '208184481') expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      // Default: 1 mês se produto não identificado
      if (expiresAt.getTime() === new Date().getTime()) {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      const supabase = await createAdminClient();

      const { error } = await supabase
        .from('profiles')
        .update({
          is_pro: true,
          pro_expires_at: expiresAt.toISOString(),
        })
        .eq('email', email.toLowerCase());

      if (error) {
        console.error('Supabase update error:', error);
        return Response.json({ error: 'DB error' }, { status: 500 });
      }

      console.log(`PRO activated for ${email} until ${expiresAt}`);
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
