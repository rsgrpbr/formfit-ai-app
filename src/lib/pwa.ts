let _audioUnlocked = false;

/** Registra o Service Worker. Chamar apenas no client. */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('[SW] Registered', reg.scope))
      .catch((err) => console.error('[SW] Registration failed', err));
  });
}

/**
 * Desbloqueia o AudioContext no iOS após o primeiro toque do usuário.
 * Sem isso, Audio.play() é bloqueado silenciosamente no iPhone/iPad.
 */
export function unlockIOSAudio(): void {
  if (typeof window === 'undefined' || _audioUnlocked) return;

  const unlock = () => {
    if (_audioUnlocked) return;
    _audioUnlocked = true;

    // Toca um áudio silencioso para desbloquear o contexto de áudio do iOS
    const audio = new Audio();
    audio.play().catch(() => {});

    // Também tenta desbloquear AudioContext se estiver em estado suspenso
    if (typeof AudioContext !== 'undefined') {
      const ctx = new AudioContext();
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      ctx.close();
    }
  };

  document.addEventListener('touchstart', unlock, { once: true, capture: true });
}
