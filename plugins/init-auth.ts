export default defineNuxtPlugin(async () => {
  const auth = useAuth();
  if (auth.status.value === 'idle') {
    try {
      await auth.refresh();
    } catch {
      // no-op: unauthenticated users will be handled elsewhere
    }
  }
});
