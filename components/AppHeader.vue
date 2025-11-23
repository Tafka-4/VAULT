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
        <div v-if="isAuthenticated" class="relative" ref="profileMenuRef">
          <button
            type="button"
            class="tap-area inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-paper-oklch/90 shadow-sm shadow-black/30 transition hover:border-white/20 hover:bg-white/10"
            @click.stop="toggleMenu"
            :aria-expanded="isMenuOpen"
            aria-haspopup="menu"
            aria-label="프로필 메뉴 열기"
          >
            <span class="grid size-8 place-items-center rounded-full bg-gradient-to-br from-white/30 to-white/10 text-xs font-semibold text-white ring-1 ring-white/20 shadow-inner shadow-black/30">
              {{ userInitial }}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-4 text-paper-oklch/70 transition-transform"
              :class="isMenuOpen ? 'rotate-180' : ''"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <transition name="fade">
            <div
              v-show="isMenuOpen"
              class="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur shadow-xl shadow-black/40 ring-1 ring-surface"
              role="menu"
            >
              <NuxtLink
                to="/app/upload"
                class="flex items-center gap-2 px-4 py-3 text-sm text-paper-oklch/90 hover:bg-white/10"
                @click="closeMenu"
                role="menuitem"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
                </svg>
                새 업로드
              </NuxtLink>
              <NuxtLink
                to="/app/account"
                class="flex items-center gap-2 px-4 py-3 text-sm text-paper-oklch/90 hover:bg-white/10"
                @click="closeMenu"
                role="menuitem"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 20a8 8 0 1116 0H4z" />
                </svg>
                내 정보
              </NuxtLink>
              <button
                type="button"
                class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-200/90 hover:bg-white/10"
                @click="handleLogout"
                role="menuitem"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 12H9m0 0l3-3m-3 3l3 3" />
                </svg>
                로그아웃
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const auth = useAuth()
const route = useRoute()

const isAuthenticated = computed(() => Boolean(auth.user.value))
const showLoginLink = computed(() => !isAuthenticated.value && route.path !== '/login')
const userInitial = computed(() => auth.user.value?.email?.[0]?.toUpperCase() ?? 'U')
const isMenuOpen = ref(false)
const profileMenuRef = ref<HTMLElement | null>(null)

const handleLogout = async () => {
  isMenuOpen.value = false
  await auth.logout()
  if (route.path.startsWith('/app')) {
    await navigateTo('/login')
  }
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const handleClickOutside = (event: MouseEvent) => {
  if (!isMenuOpen.value) return
  const target = event.target as Node | null
  if (profileMenuRef.value && target && !profileMenuRef.value.contains(target)) {
    closeMenu()
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>
