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

  const speak = useCallback(
    async (text: string, priority: 'low' | 'high' = 'low') => {
      if (!enabled) return;

      const now      = Date.now();
      const lastTime = lastSpokenRef.current.get(text) ?? 0;
      const cooldown = priority === 'high' ? cooldownMs / 3 : cooldownMs;

      if (now - lastTime < cooldown) return;

      lastSpokenRef.current.set(text, now);
      setIsSpeaking(true);

      try {
        await playFromCache(text, { locale });
      } catch (err) {
        console.error('[VoiceCoach]', err);
      } finally {
        setIsSpeaking(false);
      }
    },
    [enabled, locale, cooldownMs]
  );

  const speakFeedback = useCallback(
    (feedbackKeys: string[], messages: Record<string, string>) => {
      const key  = feedbackKeys[0];
      if (!key) return;
      const text = messages[key];
      if (text) speak(text);
    },
    [speak]
  );

  return { speak, speakFeedback, isSpeaking };
}
