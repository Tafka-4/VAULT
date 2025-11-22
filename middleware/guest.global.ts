const guestOnlyPaths = new Set(['/login', '/register', '/password-recovery', '/password-reset']);

export default defineNuxtRouteMiddleware(async (to) => {
  const normalizedPath = to.path.endsWith('/') && to.path.length > 1 ? to.path.slice(0, -1) : to.path;
  if (!guestOnlyPaths.has(normalizedPath)) return;

  const auth = useAuth();
  if (auth.status.value === 'idle') {
    try {
      await auth.refresh();
    } catch {
      // ignore refresh failures; user will stay on the guest page
    }
  }

  if (auth.user.value) {
    return navigateTo('/app', { replace: true });
  }
});
