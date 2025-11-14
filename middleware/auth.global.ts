export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/app')) return;

  const auth = useAuth();
  if (auth.status.value === 'idle') {
    try {
      await auth.refresh();
    } catch {
      // ignore
    }
  }

  if (!auth.user.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
