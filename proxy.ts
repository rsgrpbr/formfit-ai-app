import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pass-through proxy — garante que /api/* nunca é interceptado
// pelo next-intl ou qualquer outro proxy futuro
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Exclui: /api/*, /_next/*, /_vercel/*, arquivos estáticos (com extensão)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)',],
};
