export default defineNuxtPlugin(() => {
  if (process.dev || !('serviceWorker' in navigator)) {
    return;
  }

  const register = async () => {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (error) {
      console.error('[PWA] Failed to register service worker', error);
    }
  };

  window.addEventListener('load', register);
});
