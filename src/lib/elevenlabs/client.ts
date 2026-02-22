'use client';

const VOICE_IDS: Record<string, string> = {
  pt: 'pNInz6obpgDQGcFmaJgB',
  en: 'EXAVITQu4vr4xnSDxMaL',
  es: 'ErXwobaYiN019PkySvjV',
  fr: 'MF3mGyEYCl7XYWbV9V6O',
};

const API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

export interface TTSOptions {
  locale?: string;
  stability?: number;
  similarityBoost?: number;
}

export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<ArrayBuffer> {
  const { locale = 'pt', stability = 0.5, similarityBoost = 0.75 } = options;
  const voiceId = VOICE_IDS[locale] ?? VOICE_IDS.pt;
  const apiKey  = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

  if (!apiKey) throw new Error('NEXT_PUBLIC_ELEVENLABS_API_KEY não configurada');

  const response = await fetch(`${API_URL}/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability, similarity_boost: similarityBoost },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs error ${response.status}: ${err}`);
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
