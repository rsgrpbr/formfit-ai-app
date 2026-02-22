'use client';

import { useCallback, useRef, useState } from 'react';
import { playFromCache } from '@/lib/elevenlabs/cache';

interface UseVoiceCoachOptions {
  locale?: string;
  cooldownMs?: number;
  enabled?: boolean;
}

export function useVoiceCoach({
  locale     = 'pt',
  cooldownMs = 3000,
  enabled    = true,
}: UseVoiceCoachOptions = {}) {
  const lastSpokenRef = useRef<Map<string, number>>(new Map());
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Opções em refs — atualizadas a cada render sem causar re-render,
  // e sem precisar entrar nas deps do useCallback
  const localeRef    = useRef(locale);
  const cooldownRef  = useRef(cooldownMs);
  const enabledRef   = useRef(enabled);

  localeRef.current    = locale;
  cooldownRef.current  = cooldownMs;
  enabledRef.current   = enabled;

  // deps: [] — função nunca é recriada; lê valores sempre atuais via refs
  const speak = useCallback(
    async (text: string, priority: 'low' | 'high' = 'low') => {
      if (!enabledRef.current) return;

      const now      = Date.now();
      const lastTime = lastSpokenRef.current.get(text) ?? 0;
      const cooldown = priority === 'high' ? cooldownRef.current / 3 : cooldownRef.current;

      if (now - lastTime < cooldown) return;

      lastSpokenRef.current.set(text, now);
      setIsSpeaking(true);

      try {
        await playFromCache(text, { locale: localeRef.current });
      } catch (err) {
        console.error('[VoiceCoach]', err);
      } finally {
        setIsSpeaking(false);
      }
    },
    [] // estável — não recria em nenhum render
  );

  // estável porque speak é estável
  const speakFeedback = useCallback(
    (feedbackKeys: string[], messages: Record<string, string>) => {
      const key = feedbackKeys[0];
      if (!key) return;
      const text = messages[key];
      if (text) speak(text);
    },
    [speak]
  );

  return { speak, speakFeedback, isSpeaking };
}
