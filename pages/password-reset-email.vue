<template>
  <main class="relative flex min-h-dvh flex-col items-center justify-center px-4">
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(58%_48%_at_50%_-10%,_rgba(214,211,209,0.16),_transparent_65%)]"></div>
    <div class="w-full max-w-xl space-y-8 text-center">
      <NuxtLink to="/" class="inline-flex flex-col items-center gap-2">
        <span class="text-[3.25rem] font-extrabold uppercase tracking-[0.6em] text-paper-oklch/80 sm:text-[4rem]">VAULT</span>
        <span class="text-xs uppercase tracking-[0.4em] text-paper-oklch/40">이메일 링크 재설정</span>
      </NuxtLink>

      <div class="rounded-[1.75rem] bg-white/5 p-6 text-left ring-1 ring-surface">
        <div class="space-y-2">
          <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">이메일 링크</p>
          <h2 class="text-xl font-bold">링크로 인증 후 변경</h2>
          <p class="text-sm text-paper-oklch/60">메일로 받은 링크를 열면 자동으로 인증됩니다. 인증된 상태에서 새 암호를 입력하세요.</p>
          <p v-if="tokenStatus" class="text-xs text-emerald-200/80">{{ tokenStatus }}</p>
          <p v-if="tokenError" class="text-xs text-red-200/80">{{ tokenError }}</p>
        </div>

        <form class="mt-5 space-y-4" @submit.prevent="handleRecover">
          <div class="space-y-1 rounded-xl bg-black/25 p-3 text-sm">
            <p class="text-paper-oklch/60">인증 이메일</p>
            <p class="font-semibold" v-if="resolvedEmail">{{ resolvedEmail }}</p>
            <p v-else class="text-xs text-red-200/80">인증된 이메일을 불러오지 못했어요. 링크를 다시 열어주세요.</p>
          </div>

          <div v-if="resolvedEmail" class="space-y-3 rounded-xl bg-black/20 p-4 ring-1 ring-white/5">
            <p class="text-xs uppercase tracking-[0.3em] text-paper-oklch/55">새 암호</p>
            <div class="space-y-3">
              <div class="space-y-2">
                <label for="email-password" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">새 암호</label>
                <input
                  id="email-password"
                  type="password"
                  placeholder="최소 8자"
                  minlength="8"
                  v-model="password"
                  required
                  class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <div class="space-y-2">
                <label for="email-confirm" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">새 암호 확인</label>
                <input
                  id="email-confirm"
                  type="password"
                  minlength="8"
                  v-model="confirm"
                  placeholder="다시 입력"
                  required
                  class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
            </div>
          </div>

          <p v-if="errorMessage" class="text-xs text-red-200/80">{{ errorMessage }}</p>
          <p v-else-if="successMessage" class="text-xs text-emerald-200/80">{{ successMessage }}</p>

          <button
            v-if="resolvedEmail"
            type="submit"
            :disabled="pending"
            class="tap-area w-full rounded-2xl bg-white/90 px-4 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/40"
          >
            {{ pending ? '저장 중...' : '암호 재설정' }}
          </button>
        </form>
      </div>

      <div class="space-y-2 text-xs text-paper-oklch/50">
        <NuxtLink to="/password-recovery" class="block hover:text-paper-oklch/80">이메일을 다시 보내기</NuxtLink>
        <NuxtLink to="/login" class="block hover:text-paper-oklch/80">로그인으로 돌아가기</NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { getErrorMessage } from '~/utils/errorMessage'

const auth = useAuth()
const route = useRoute()

const password = ref('')
const confirm = ref('')
const pending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const tokenStatus = ref('')
const tokenError = ref('')
const autoToken = ref('')

const resolvedEmail = computed(() => auth.user.value?.email || (route.query.email as string | undefined) || '')

onMounted(async () => {
  const tokenFromQuery = typeof route.query.token === 'string' ? route.query.token : ''
  if (tokenFromQuery) {
    autoToken.value = tokenFromQuery
    await attemptTokenLogin(tokenFromQuery)
  }
})

watch(
  () => auth.user.value?.email,
  (value) => {
    if (value) {
      tokenStatus.value = '이메일 링크로 인증되었습니다. 새 암호를 설정하세요.'
    }
  }
)

const attemptTokenLogin = async (token: string) => {
  tokenStatus.value = ''
  tokenError.value = ''
  try {
    await auth.loginWithResetToken(token)
    tokenStatus.value = '이메일 링크로 인증되었습니다. 새 암호를 설정하세요.'
  } catch (error) {
    tokenError.value = getErrorMessage(error) || '링크 인증에 실패했습니다.'
  }
}

const handleRecover = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value !== confirm.value) {
    errorMessage.value = '새 암호가 일치하지 않습니다.'
    return
  }

  if (!autoToken.value) {
    errorMessage.value = '링크 토큰이 없습니다. 이메일을 다시 확인하세요.'
    return
  }

  const email = resolvedEmail.value
  if (!email) {
    errorMessage.value = '인증된 이메일을 확인할 수 없습니다.'
    return
  }

  pending.value = true
  try {
    await auth.recoverPassword({
      email,
      password: password.value,
      resetToken: autoToken.value
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
