<template>
  <main class="relative flex min-h-dvh flex-col items-center justify-center px-4">
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(58%_48%_at_50%_-10%,_rgba(214,211,209,0.16),_transparent_65%)]"></div>
    <div class="w-full max-w-xl space-y-8 text-center">
      <NuxtLink to="/" class="inline-flex flex-col items-center gap-2">
        <span class="text-[3.25rem] font-extrabold uppercase tracking-[0.6em] text-paper-oklch/80 sm:text-[4rem]">VAULT</span>
        <span class="text-xs uppercase tracking-[0.4em] text-paper-oklch/40">초대 코드 재설정</span>
      </NuxtLink>

      <div class="rounded-[1.75rem] bg-white/5 p-6 text-left ring-1 ring-surface">
        <div class="space-y-2">
          <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">초대 코드</p>
          <h2 class="text-xl font-bold">초대 코드로 재설정</h2>
          <p class="text-sm text-paper-oklch/60">초대 코드와 계정 이메일을 입력해 새 암호를 설정하세요.</p>
        </div>

        <form class="mt-5 space-y-4" @submit.prevent="handleRecover">
          <div class="space-y-2">
            <label for="code-email" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">이메일</label>
            <input
              id="code-email"
              type="email"
              placeholder="you@vault.app"
              v-model="email"
              class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div class="space-y-2">
            <label for="verificationCode" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">초대 코드</label>
            <input
              id="verificationCode"
              type="text"
              placeholder="Vault{...} 형식의 코드"
              v-model="verificationCode"
              class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <label for="code-password" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">새 암호</label>
              <input
                id="code-password"
                type="password"
                placeholder="최소 8자"
                minlength="8"
                v-model="password"
                required
                class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div class="space-y-2">
              <label for="code-confirm" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">새 암호 확인</label>
              <input
                id="code-confirm"
                type="password"
                minlength="8"
                v-model="confirm"
                placeholder="다시 입력"
                required
                class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>

          <p v-if="errorMessage" class="text-xs text-red-200/80">{{ errorMessage }}</p>
          <p v-else-if="successMessage" class="text-xs text-emerald-200/80">{{ successMessage }}</p>

          <button
            type="submit"
            :disabled="pending"
            class="tap-area w-full rounded-2xl bg-white/90 px-4 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/40"
          >
            {{ pending ? '저장 중...' : '암호 재설정' }}
          </button>
        </form>
      </div>

      <div class="space-y-2 text-xs text-paper-oklch/50">
        <NuxtLink to="/password-recovery" class="block hover:text-paper-oklch/80">이메일로 링크 받기</NuxtLink>
        <NuxtLink to="/password-reset-email" class="block hover:text-paper-oklch/80">이메일 링크로 재설정</NuxtLink>
        <NuxtLink to="/login" class="block hover:text-paper-oklch/80">로그인으로 돌아가기</NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getErrorMessage } from '~/utils/errorMessage'

const auth = useAuth()

const email = ref('')
const verificationCode = ref('')
const password = ref('')
const confirm = ref('')
const pending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleRecover = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value !== confirm.value) {
    errorMessage.value = '새 암호가 일치하지 않습니다.'
    return
  }

  if (!email.value || !verificationCode.value) {
    errorMessage.value = '이메일과 초대 코드를 입력하세요.'
    return
  }

  pending.value = true
  try {
    await auth.recoverPassword({
      email: email.value,
      password: password.value,
      verificationCode: verificationCode.value
    })
    successMessage.value = '암호가 재설정되었어요. 잠시 후 대시보드로 이동합니다.'
    await navigateTo('/app')
  } catch (error) {
    errorMessage.value = getErrorMessage(error) || '암호를 재설정할 수 없습니다.'
  } finally {
    pending.value = false
  }
}
</script>
