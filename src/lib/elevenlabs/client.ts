'use client';

export interface TTSOptions {
  locale?: string;
}

/**
 * Chama a rota server-side /api/tts que faz o proxy seguro para o ElevenLabs.
 * A API key nunca é exposta no browser.
 */
export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<ArrayBuffer> {
  const { locale = 'pt' } = options;

  console.log('[Voice] idioma selecionado:', locale);
  console.log('[Voice] texto a falar:', text);
  console.log('[Voice] chamando ElevenLabs...');

  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, locale }),
  });

  console.log('[Voice] resposta status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.error('[Voice] erro:', error);
    throw new Error(`TTS error ${response.status}: ${error}`);
  }

  return response.arrayBuffer();
}

export async function playTTS(text: string, options: TTSOptions = {}): Promise<void> {
  const buffer = await textToSpeech(text, options);
  const blob   = new Blob([buffer], { type: 'audio/mpeg' });
  const url    = URL.createObjectURL(blob);
  const audio  = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  await audio.play();
}
