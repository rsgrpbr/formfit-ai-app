'use client';

import { useCallback, useRef, useState } from 'react';
import { playFromCache } from '@/lib/elevenlabs/cache';

interface UseVoiceCoachOptions {
  locale?: string;
  cooldownMs?: number;
  enabled?: boolean;
}

interface QueueItem {
  text: string;
  priority: 'low' | 'high';
}

export function useVoiceCoach({
  locale     = 'pt',
  cooldownMs = 3000,
  enabled    = true,
}: UseVoiceCoachOptions = {}) {
  const lastSpokenRef = useRef<Map<string, number>>(new Map());
  const isSpeakingRef = useRef(false);           // controle interno — sem re-render
  const queueRef      = useRef<QueueItem[]>([]); // fila de falas pendentes
  const [isSpeaking, setIsSpeaking] = useState(false); // exposto para a UI

  // Opções em refs — lidas dentro do callback sem entrar nas deps do useCallback
  const localeRef   = useRef(locale);
  const cooldownRef = useRef(cooldownMs);
  const enabledRef  = useRef(enabled);

  localeRef.current   = locale;
  cooldownRef.current = cooldownMs;
  enabledRef.current  = enabled;

  // Processa o próximo item da fila sequencialmente
  const processQueue = useCallback(async () => {
    if (isSpeakingRef.current || queueRef.current.length === 0) return;

    const item = queueRef.current.shift()!;
    isSpeakingRef.current = true;
    setIsSpeaking(true);

    try {
      await playFromCache(item.text, { locale: localeRef.current });
    } catch (err) {
      console.error('[VoiceCoach]', err);
    } finally {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      // Processa o próximo da fila após terminar
      processQueue();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const speak = useCallback(
    (text: string, priority: 'low' | 'high' = 'low') => {
      if (!enabledRef.current) return;

      const now      = Date.now();
      const lastTime = lastSpokenRef.current.get(text) ?? 0;
      const cooldown = priority === 'high' ? cooldownRef.current / 3 : cooldownRef.current;

      if (now - lastTime < cooldown) return;

      lastSpokenRef.current.set(text, now);

      // Itens de alta prioridade entram na frente da fila
      if (priority === 'high') {
        queueRef.current.unshift({ text, priority });
      } else {
        queueRef.current.push({ text, priority });
      }

      // Limita fila a 3 itens para não acumular falas velhas
      if (queueRef.current.length > 3) {
        queueRef.current = queueRef.current.slice(0, 3);
      }

      processQueue();
    },
    [processQueue]
  );

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
