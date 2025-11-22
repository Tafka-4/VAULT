<template>
  <main class="relative flex min-h-dvh flex-col items-center justify-center px-4">
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(58%_48%_at_50%_-10%,_rgba(214,211,209,0.16),_transparent_65%)]"></div>
    <div class="w-full max-w-4xl space-y-10 text-center">
      <NuxtLink to="/" class="inline-flex flex-col items-center gap-2">
        <span class="text-[3.25rem] font-extrabold uppercase tracking-[0.6em] text-paper-oklch/80 sm:text-[4rem]">VAULT</span>
        <span class="text-xs uppercase tracking-[0.4em] text-paper-oklch/40">암호 재설정</span>
      </NuxtLink>

      <div class="flex flex-wrap items-center justify-center gap-3">
        <button
          class="tap-area rounded-full px-5 py-2 text-sm font-semibold"
          :class="mode === 'email' ? 'bg-white text-black' : 'bg-white/10 text-paper-oklch/80 ring-1 ring-surface'"
          @click="switchMode('email')"
        >
          이메일 링크로 재설정
        </button>
        <button
          class="tap-area rounded-full px-5 py-2 text-sm font-semibold"
          :class="mode === 'code' ? 'bg-white text-black' : 'bg-white/10 text-paper-oklch/80 ring-1 ring-surface'"
          @click="switchMode('code')"
        >
          초대 코드로 재설정
        </button>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div
          class="rounded-[1.75rem] bg-white/5 p-6 text-left ring-1 ring-surface"
          :class="mode === 'email' ? 'ring-white/60' : 'opacity-70'
          "
        >
          <div class="flex flex-col gap-2">
            <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">이메일 링크</p>
            <h2 class="text-xl font-bold">링크로 인증 후 변경</h2>
            <p class="text-sm text-paper-oklch/60">
              메일로 받은 링크를 열면 자동으로 인증됩니다. 인증된 상태에서 새 암호만 입력하세요.
            </p>
            <p v-if="tokenStatus" class="text-xs text-emerald-200/80">{{ tokenStatus }}</p>
            <p v-if="tokenError" class="text-xs text-red-200/80">{{ tokenError }}</p>
          </div>

          <form class="mt-4 space-y-4" @submit.prevent="handleRecover('email')">
            <div class="space-y-1 rounded-xl bg-black/25 p-3 text-sm">
              <p class="text-paper-oklch/60">인증 이메일</p>
              <p class="font-semibold" v-if="resolvedEmail">{{ resolvedEmail }}</p>
              <p v-else class="text-xs text-red-200/80">인증된 이메일을 불러오지 못했어요. 링크를 다시 열어주세요.</p>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2">
                <label for="email-password" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">새 암호</label>
                <input
                  id="email-password"
                  type="password"
                  placeholder="최소 8자"
                  minlength="8"
                  v-model="password"
                  :disabled="mode !== 'email'"
                  required
                  class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-70"
                />
              </div>
              <div class="space-y-2">
                <label for="email-confirm" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">새 암호 확인</label>
                <input
                  id="email-confirm"
                  type="password"
                  minlength="8"
                  v-model="confirm"
                  :disabled="mode !== 'email'"
                  placeholder="다시 입력"
                  required
                  class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-70"
                />
              </div>
            </div>

            <p v-if="mode === 'email' && errorMessage" class="text-xs text-red-200/80">{{ errorMessage }}</p>
            <p v-else-if="mode === 'email' && successMessage" class="text-xs text-emerald-200/80">{{ successMessage }}</p>

            <button
              type="submit"
              :disabled="pending || mode !== 'email'"
              class="tap-area w-full rounded-2xl bg-white/90 px-4 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/40"
            >
              {{ pending && mode === 'email' ? '저장 중...' : '암호 재설정' }}
            </button>
          </form>
        </div>

        <div
          class="rounded-[1.75rem] bg-white/5 p-6 text-left ring-1 ring-surface"
          :class="mode === 'code' ? 'ring-white/60' : 'opacity-70'"
        >
          <div class="flex flex-col gap-2">
            <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">초대 코드</p>
            <h2 class="text-xl font-bold">초대 코드로 재설정</h2>
            <p class="text-sm text-paper-oklch/60">초대 코드와 계정 이메일을 입력해 새 암호를 설정하세요.</p>
          </div>

          <form class="mt-4 space-y-4" @submit.prevent="handleRecover('code')">
            <div class="space-y-2">
              <label for="code-email" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">이메일</label>
              <input
                id="code-email"
                type="email"
                placeholder="you@vault.app"
                v-model="codeEmail"
                :disabled="mode !== 'code'"
                class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-70"
              />
            </div>

            <div class="space-y-2">
              <label for="verificationCode" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">초대 코드</label>
              <input
                id="verificationCode"
                type="text"
                placeholder="Vault{...} 형식의 코드"
                v-model="verificationCode"
                :disabled="mode !== 'code'"
                class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-70"
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
                  :disabled="mode !== 'code'"
                  required
                  class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-70"
                />
              </div>
              <div class="space-y-2">
                <label for="code-confirm" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">새 암호 확인</label>
                <input
                  id="code-confirm"
                  type="password"
                  minlength="8"
                  v-model="confirm"
                  :disabled="mode !== 'code'"
                  placeholder="다시 입력"
                  required
                  class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-70"
                />
              </div>
            </div>

            <p v-if="mode === 'code' && errorMessage" class="text-xs text-red-200/80">{{ errorMessage }}</p>
            <p v-else-if="mode === 'code' && successMessage" class="text-xs text-emerald-200/80">{{ successMessage }}</p>

            <button
              type="submit"
              :disabled="pending || mode !== 'code'"
              class="tap-area w-full rounded-2xl bg-white/90 px-4 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/40"
            >
              {{ pending && mode === 'code' ? '저장 중...' : '암호 재설정' }}
            </button>
          </form>
        </div>
      </div>

      <div class="space-y-2 text-xs text-paper-oklch/50">
        <NuxtLink to="/password-recovery" class="block hover:text-paper-oklch/80">이메일을 다시 보내기</NuxtLink>
        <NuxtLink to="/login" class="block hover:text-paper-oklch/80">로그인으로 돌아가기</NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getErrorMessage } from '~/utils/errorMessage'

const auth = useAuth()
const route = useRoute()

const codeEmail = ref('')
const verificationCode = ref('')
const autoToken = ref('')
const password = ref('')
const confirm = ref('')
const pending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const tokenStatus = ref('')
const tokenError = ref('')
const mode = ref<'email' | 'code'>(route.query.type === 'code' ? 'code' : 'email')

const resolvedEmail = computed(() => auth.user.value?.email || (route.query.email as string | undefined) || '')

const switchMode = (next: 'email' | 'code') => {
  mode.value = next
  errorMessage.value = ''
  successMessage.value = ''
  navigateTo({ path: '/password-reset', query: { ...(autoToken.value ? { token: autoToken.value } : {}), type: next } }, { replace: true })
}

onMounted(async () => {
  const tokenFromQuery = typeof route.query.token === 'string' ? route.query.token : ''
  if (tokenFromQuery) {
    autoToken.value = tokenFromQuery
    await attemptTokenLogin(tokenFromQuery)
    mode.value = 'email'
  }

  if (!codeEmail.value && auth.user.value?.email) {
    codeEmail.value = auth.user.value.email
  }
})

watch(
  () => auth.user.value?.email,
  (value) => {
    if (value) {
      codeEmail.value = value
    }
  }
)

const attemptTokenLogin = async (token: string) => {
  tokenStatus.value = ''
  tokenError.value = ''
  try {
    await auth.loginWithResetToken(token)
    tokenStatus.value = '이메일 링크로 인증되었습니다. 새 암호를 설정하세요.'
    if (auth.user.value?.email) codeEmail.value = auth.user.value.email
  } catch (error) {
    tokenError.value = getErrorMessage(error) || '링크 인증에 실패했습니다.'
  }
}

const handleRecover = async (currentMode: 'email' | 'code') => {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value !== confirm.value) {
    errorMessage.value = '새 암호가 일치하지 않습니다.'
    return
  }

  pending.value = true
  try {
    if (currentMode === 'email') {
      if (!autoToken.value) {
        throw new Error('링크 토큰이 없습니다. 이메일을 다시 확인하세요.')
      }
      if (!resolvedEmail.value) {
        throw new Error('인증된 이메일을 확인할 수 없습니다.')
      }
      await auth.recoverPassword({
        email: resolvedEmail.value,
        password: password.value,
        resetToken: autoToken.value
      })
    } else {
      if (!codeEmail.value || !verificationCode.value) {
        throw new Error('이메일과 초대 코드를 입력하세요.')
      }
      await auth.recoverPassword({
        email: codeEmail.value,
        password: password.value,
        verificationCode: verificationCode.value
      })
    }
    successMessage.value = '암호가 재설정되었어요. 잠시 후 대시보드로 이동합니다.'
    await navigateTo('/app')
  } catch (error) {
    errorMessage.value = getErrorMessage(error) || '암호를 재설정할 수 없습니다.'
  } finally {
    pending.value = false
  }
}
</script>
