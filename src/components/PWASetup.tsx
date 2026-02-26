'use client';

import { useEffect } from 'react';
import { registerServiceWorker, unlockIOSAudio } from '@/lib/pwa';

/** Registra o SW e desbloqueia áudio iOS. Incluído no RootLayout. */
export default function PWASetup() {
  useEffect(() => {
    registerServiceWorker();
    unlockIOSAudio();
  }, []);

  return null;
}
