import { watch, onMounted } from 'vue';

export default defineNuxtPlugin(async () => {
  const auth = useAuth();

  // Initial refresh on app start
  if (auth.status.value === 'idle') {
    try {
      await auth.refresh();
    } catch {
      // no-op: unauthenticated users will be handled elsewhere
    }
  }

  if (process.client) {
    let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

    const startKeepAlive = () => {
      if (keepAliveTimer) return;
      keepAliveTimer = setInterval(() => {
        if (auth.isAuthenticated.value && document.visibilityState === 'visible') {
          auth.refresh();
        }
      }, 10 * 60 * 1000); // every 10 minutes while visible
    };

    const stopKeepAlive = () => {
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
    };

    watch(
      () => auth.isAuthenticated.value,
      (isAuthed) => {
        if (isAuthed) startKeepAlive();
        else stopKeepAlive();
      },
      { immediate: true },
    );

    onMounted(() => {
      document.addEventListener('visibilitychange', () => {
        if (auth.isAuthenticated.value && document.visibilityState === 'visible') {
          auth.refresh();
        }
      });
    });
  }
});
