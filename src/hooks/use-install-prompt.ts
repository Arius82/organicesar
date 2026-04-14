import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_COOLDOWN_HOURS = 24;

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [hasNativePrompt, setHasNativePrompt] = useState(false);

  useEffect(() => {
    // Already installed as standalone PWA? Don't show anything.
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    if (isStandalone) return;

    // Check dismiss cooldown
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (!isNaN(elapsed) && elapsed < DISMISS_COOLDOWN_HOURS * 60 * 60 * 1000) {
        return; // still in cooldown
      }
      localStorage.removeItem(DISMISS_KEY);
    }

    // Also remove old format dismiss key if present
    if (localStorage.getItem('pwa-install-dismissed') === 'true') {
      localStorage.removeItem('pwa-install-dismissed');
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    const isAndroidDevice = /android/.test(ua);
    const isMobile = isIOSDevice || isAndroidDevice || /mobile/.test(ua);

    if (isIOSDevice) {
      setIsIOS(true);
      setCanInstall(true);
      return;
    }

    if (isAndroidDevice) {
      setIsAndroid(true);
    }

    // Listen for the native browser install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setHasNativePrompt(true);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Fallback: If on mobile and the native prompt hasn't fired after 3s,
    // show a manual install banner with instructions
    const fallbackTimer = setTimeout(() => {
      if (isMobile) {
        setCanInstall(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setCanInstall(false);
        setDeferredPrompt(null);
      }
    }
  };

  const dismissInstall = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setCanInstall(false);
    setDeferredPrompt(null);
  };

  return { canInstall, isIOS, isAndroid, hasNativePrompt, promptInstall, dismissInstall };
}
