'use client';

import { textToSpeech, type TTSOptions } from './client';

interface CacheEntry {
  buffer: ArrayBuffer;
  createdAt: number;
}

const TTL_MS = 1000 * 60 * 60; // 1 hora
const cache  = new Map<string, CacheEntry>();

function cacheKey(text: string, locale: string): string {
  return `${locale}:${text}`;
}

export async function getOrFetchTTS(
  text: string,
  options: TTSOptions = {}
): Promise<ArrayBuffer> {
  const locale = options.locale ?? 'pt';
  const key    = cacheKey(text, locale);
  const now    = Date.now();

  const entry = cache.get(key);
  if (entry && now - entry.createdAt < TTL_MS) return entry.buffer;

  const buffer = await textToSpeech(text, options);
  cache.set(key, { buffer, createdAt: now });
  return buffer;
}

export async function playFromCache(
  text: string,
  options: TTSOptions = {}
): Promise<void> {
  const buffer = await getOrFetchTTS(text, options);
  const blob   = new Blob([buffer], { type: 'audio/mpeg' });
  const url    = URL.createObjectURL(blob);
  const audio  = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  await audio.play();
}

export function clearTTSCache(): void {
  cache.clear();
}
