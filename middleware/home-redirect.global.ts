export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path !== '/' && to.path !== '') {
    return;
  }

  const auth = useAuth();
  if (!auth.user.value) {
    try {
      await auth.refresh();
    } catch {
      // ignore unauthenticated errors: handled by auth middleware elsewhere
    }
  }

  if (auth.user.value) {
    return navigateTo('/app', { replace: true });
  }
});
