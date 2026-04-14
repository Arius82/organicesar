import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_COOLDOWN_HOURS = 24; // Show again after 24 hours

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;

    // Check if cooldown has elapsed
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      const cooldownMs = DISMISS_COOLDOWN_HOURS * 60 * 60 * 1000;
      if (elapsed < cooldownMs) return; // still in cooldown
      // Cooldown expired—clear it and continue
      localStorage.removeItem(DISMISS_KEY);
    }

    if (isStandalone) return;

    // Native iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIOSDevice) {
      setIsIOS(true);
      setCanInstall(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
      setDeferredPrompt(null);
    }
  };

  const dismissInstall = () => {
    // Store timestamp instead of permanent boolean—shows again after cooldown
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setCanInstall(false);
    setDeferredPrompt(null);
  };

  return { canInstall, isIOS, promptInstall, dismissInstall };
}
