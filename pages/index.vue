<template>
  <main class="relative flex min-h-dvh flex-col items-center justify-center gap-10 px-4 text-center">
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_50%_0%,_rgba(214,211,209,0.12),_transparent_60%)]"></div>
    <div class="flex flex-col items-center gap-6">
      <span class="text-[3.5rem] font-extrabold uppercase tracking-[0.6em] text-paper-oklch/80 sm:text-[4.5rem] center">
        VAULT
      </span>
      <p class="max-w-sm text-sm text-paper-oklch/60 center">
        안전한 개인 클라우드 스토리지.
      </p>
      <NuxtLink
        to="/login"
        class="tap-area rounded-full bg-white/90 px-10 py-3 text-sm font-semibold text-black transition hover:bg-white"
      >
        시작하기
      </NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
const auth = useAuth()

if (!auth.user.value) {
  try {
    await auth.refresh()
  } catch {
    // ignore if refresh fails; user will stay on landing page
  }
}

if (auth.user.value) {
  await navigateTo('/app', { replace: true })
}
</script>
