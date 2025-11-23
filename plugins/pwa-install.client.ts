type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default defineNuxtPlugin(() => {
  if (!process.client) return;

  const deferredPrompt = useState<DeferredPromptEvent | null>('pwa:prompt', () => null);
  const shouldShowPrompt = useState<boolean>('pwa:prompt:show', () => false);
  const isStandalone = useState<boolean>('pwa:standalone', () => false);
  const isMobile = useState<boolean>('pwa:isMobile', () =>
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || ''),
  );

  const updateStandalone = () => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    isStandalone.value = standalone;
    if (standalone) {
      shouldShowPrompt.value = false;
      deferredPrompt.value = null;
    }
  };

  updateStandalone();

  window.matchMedia('(display-mode: standalone)').addEventListener('change', updateStandalone);

  window.addEventListener('beforeinstallprompt', (event) => {
    if (!isMobile.value) return;
    event.preventDefault();
    deferredPrompt.value = event as DeferredPromptEvent;
    if (!isStandalone.value) {
      shouldShowPrompt.value = true;
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null;
    shouldShowPrompt.value = false;
    isStandalone.value = true;
  });
});
