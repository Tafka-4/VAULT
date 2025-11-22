<template>
  <main class="relative flex min-h-dvh flex-col items-center justify-center px-4">
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(58%_48%_at_50%_-10%,_rgba(214,211,209,0.16),_transparent_65%)]"></div>
    <div class="w-full max-w-sm space-y-10 text-center">
      <NuxtLink to="/" class="inline-flex flex-col items-center gap-2">
        <span class="text-[3.25rem] font-extrabold uppercase tracking-[0.6em] text-paper-oklch/80 sm:text-[4rem]">VAULT</span>
        <span class="text-xs uppercase tracking-[0.4em] text-paper-oklch/40">로그인</span>
      </NuxtLink>
      <form
        class="space-y-5 rounded-[1.75rem] bg-white/5 p-6 ring-1 ring-surface"
        @submit.prevent="handleLogin"
      >
        <div class="space-y-2 text-left">
          <label for="email" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">이메일</label>
          <input
            id="email"
            type="email"
            placeholder="you@vault.app"
            v-model="email"
            required
            class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
        <div class="space-y-2 text-left">
          <label for="password" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">암호</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            v-model="password"
            required
            class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
        <p v-if="errorMessage" class="text-xs text-red-200/80">{{ errorMessage }}</p>
        <button
          type="submit"
          :disabled="pending"
          class="tap-area w-full rounded-2xl bg-white/90 px-4 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/40"
        >
          {{ pending ? '확인 중...' : '로그인' }}
        </button>
      </form>
      <div class="space-y-2 text-xs text-paper-oklch/50">
        <NuxtLink to="/register" class="block hover:text-paper-oklch/80">계정이 없나요? 가입하기</NuxtLink>
        <NuxtLink to="/password-recovery" class="block hover:text-paper-oklch/80">암호를 잊으셨나요?</NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getErrorMessage } from '~/utils/errorMessage'

const auth = useAuth()
const route = useRoute()
const email = ref('')
const password = ref('')
const pending = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''
  pending.value = true
  try {
    await auth.login({ email: email.value, password: password.value })
    const redirect = (route.query.redirect as string) || '/app'
    await navigateTo(redirect)
  } catch (error) {
    errorMessage.value = getErrorMessage(error) || '로그인에 실패했습니다.'
  } finally {
    pending.value = false
  }
}
</script>
