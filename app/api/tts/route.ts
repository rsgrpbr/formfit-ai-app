import { NextRequest, NextResponse } from 'next/server';

// Voice IDs por idioma — default: Sarah (multilingual, EXAVITQu4vr4xnSDxMaL)
const VOICE_IDS: Record<string, string> = {
  pt: process.env.ELEVENLABS_VOICE_ID_PT ?? 'EXAVITQu4vr4xnSDxMaL',
  en: process.env.ELEVENLABS_VOICE_ID_EN ?? 'EXAVITQu4vr4xnSDxMaL',
  es: process.env.ELEVENLABS_VOICE_ID_ES ?? 'EXAVITQu4vr4xnSDxMaL',
  fr: process.env.ELEVENLABS_VOICE_ID_FR ?? 'EXAVITQu4vr4xnSDxMaL',
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { text, locale = 'pt' } = body as { text?: string; locale?: string };

  console.log('[Voice] idioma selecionado:', locale);
  console.log('[Voice] texto a falar:', text);

  if (!text || typeof text !== 'string' || !text.trim()) {
    console.error('[Voice] erro: texto vazio ou ausente');
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = VOICE_IDS[locale] ?? VOICE_IDS.pt;

  console.log('[Voice] API key presente:', !!apiKey, '| começa com sk_:', apiKey?.startsWith('sk_'));
  console.log('[Voice] voice_id:', voiceId);

  if (!apiKey) {
    console.error('[Voice] erro: ELEVENLABS_API_KEY não configurada no .env.local');
    return NextResponse.json(
      { error: 'ELEVENLABS_API_KEY não configurada. Adicione ao .env.local: ELEVENLABS_API_KEY=sk_...' },
      { status: 500 }
    );
  }

  console.log('[Voice] chamando ElevenLabs...');

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    console.log('[Voice] resposta status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('[Voice] erro:', error);
      return NextResponse.json(
        { error: `ElevenLabs ${response.status}: ${error}` },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    console.log('[Voice] áudio recebido, bytes:', buffer.byteLength);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[Voice] erro de rede:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
