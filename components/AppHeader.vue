<template>
  <header class="sticky top-0 z-50 bg-black/15 backdrop-blur supports-[backdrop-filter]:bg-black/25">
    <div class="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
      <NuxtLink to="/app" class="flex items-center gap-2">
        <div class="grid size-7 place-items-center rounded-xl bg-white/5 ring-1 ring-surface">
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M12 3.5l6 2.4v5.3c0 4.2-2.8 8-6 9-3.2-1-6-4.8-6-9V5.9l6-2.4z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9.8 12.2v-1.1a2.2 2.2 0 114.4 0v1.1m-5.4 0h6.4v4.1H9.8z"
            />
          </svg>
        </div>
        <span class="text-base font-semibold">VAULT</span>
      </NuxtLink>
      <div class="flex items-center gap-3">
        <NuxtLink
          v-if="showLoginLink"
          to="/login"
          class="tap-area hidden rounded-xl px-3 py-2 text-sm text-paper-oklch/80 ring-1 ring-surface transition hover:bg-white/5 hover:text-paper-oklch sm:inline-flex"
        >
          로그인
        </NuxtLink>
        <NuxtLink
          v-if="isAuthenticated"
          to="/app/upload"
          class="tap-area inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-sm font-semibold text-black hover:bg-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
          </svg>
          새 업로드
        </NuxtLink>
        <NuxtLink
          v-if="isAuthenticated"
          to="/app/account"
          class="tap-area inline-flex rounded-xl px-3 py-2 text-sm text-paper-oklch/80 ring-1 ring-surface transition hover:bg-white/5 hover:text-paper-oklch"
        >
          내 정보
        </NuxtLink>
        <div v-if="isAuthenticated" class="flex items-center gap-2">
          <div class="grid size-9 place-items-center rounded-full bg-white/10 text-sm font-semibold uppercase ring-1 ring-surface">
            {{ userInitial }}
          </div>
          <button
            type="button"
            class="tap-area rounded-xl px-3 py-2 text-sm text-paper-oklch/80 ring-1 ring-surface hover:bg-white/5 hover:text-paper-oklch"
            @click="handleLogout"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const auth = useAuth()
const route = useRoute()

const isAuthenticated = computed(() => Boolean(auth.user.value))
const showLoginLink = computed(() => !isAuthenticated.value && route.path !== '/login')
const userInitial = computed(() => auth.user.value?.email?.[0]?.toUpperCase() ?? 'U')

const handleLogout = async () => {
  await auth.logout()
  if (route.path.startsWith('/app')) {
    await navigateTo('/login')
  }
}
</script>
