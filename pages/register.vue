<template>
  <main class="relative flex min-h-dvh flex-col items-center justify-center px-4">
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_48%_at_50%_-10%,_rgba(214,211,209,0.18),_transparent_70%)]"></div>
    <div class="w-full max-w-sm space-y-10 text-center">
      <NuxtLink to="/" class="inline-flex flex-col items-center gap-2">
        <span class="text-[3.25rem] font-extrabold uppercase tracking-[0.6em] text-paper-oklch/80 sm:text-[4rem]">VAULT</span>
        <span class="text-xs uppercase tracking-[0.4em] text-paper-oklch/40">회원가입</span>
      </NuxtLink>
      <form
        class="space-y-5 rounded-[1.75rem] bg-white/5 p-6 ring-1 ring-surface"
        @submit.prevent="handleRegister"
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
          <label for="password" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">패스워드</label>
          <input
            id="password"
            type="password"
            placeholder="최소 8자"
            v-model="password"
            minlength="8"
            required
            class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
        <div class="space-y-2 text-left">
          <label for="verificationCode" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">검증 코드</label>
          <input
            id="verificationCode"
            type="text"
            placeholder="초대 코드 입력"
            v-model="verificationCode"
            minlength="8"
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
          {{ pending ? '확인 중...' : '가입 완료' }}
        </button>
      </form>
      <NuxtLink to="/login" class="block text-xs text-paper-oklch/50 hover:text-paper-oklch/80">이미 계정이 있나요? 로그인</NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getErrorMessage } from '~/utils/errorMessage'

const auth = useAuth()
const email = ref('')
const password = ref('')
const verificationCode = ref('')
const pending = ref(false)
const errorMessage = ref('')

const handleRegister = async () => {
  errorMessage.value = ''
  pending.value = true
  try {
    await auth.register({
      email: email.value,
      password: password.value,
      verificationCode: verificationCode.value
    })
    await navigateTo('/app')
  } catch (error) {
    errorMessage.value = getErrorMessage(error) || '가입에 실패했습니다.'
  } finally {
    pending.value = false
  }
}
</script>
