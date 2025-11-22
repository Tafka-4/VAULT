<template>
  <main class="relative flex min-h-dvh flex-col items-center justify-center px-4">
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(58%_48%_at_50%_-10%,_rgba(214,211,209,0.16),_transparent_65%)]"></div>
    <div class="w-full max-w-4xl space-y-10 text-center">
      <NuxtLink to="/" class="inline-flex flex-col items-center gap-2">
        <span class="text-[3.25rem] font-extrabold uppercase tracking-[0.6em] text-paper-oklch/80 sm:text-[4rem]">VAULT</span>
        <span class="text-xs uppercase tracking-[0.4em] text-paper-oklch/40">암호 재설정</span>
      </NuxtLink>

      <div class="grid gap-6 lg:grid-cols-2">
        <form class="space-y-5 rounded-[1.75rem] bg-white/5 p-6 text-left ring-1 ring-surface" @submit.prevent="handleSendLink">
          <div class="space-y-2">
            <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">이메일 링크</p>
            <h2 class="text-xl font-bold">메일로 복구 링크 받기</h2>
            <p class="text-sm text-paper-oklch/60">초대 코드가 없다면 메일로 전송되는 복구 링크의 토큰을 사용하세요.</p>
          </div>
          <div class="space-y-2">
            <label for="email-send" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">이메일</label>
            <input
              id="email-send"
              type="email"
              placeholder="you@vault.app"
              v-model="email"
              required
              class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
          <p v-if="sendError" class="text-xs text-red-200/80">{{ sendError }}</p>
          <p v-else-if="sendMessage" class="text-xs text-emerald-200/80">{{ sendMessage }}</p>
          <button
            type="submit"
            :disabled="sendPending"
            class="tap-area w-full rounded-2xl bg-white/90 px-4 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/40"
          >
            {{ sendPending ? '전송 중...' : '복구 링크 보내기' }}
          </button>
        </form>

        <form class="space-y-5 rounded-[1.75rem] bg-white/5 p-6 text-left ring-1 ring-surface" @submit.prevent="handleRecover">
          <div class="space-y-2">
            <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">암호 재설정</p>
            <h2 class="text-xl font-bold">토큰 또는 초대 코드로 재설정</h2>
            <p class="text-sm text-paper-oklch/60">이메일로 받은 토큰 또는 초대 코드 중 하나만 입력해도 됩니다.</p>
          </div>

          <div class="space-y-2">
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

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <label for="resetToken" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">이메일 토큰</label>
              <input
                id="resetToken"
                type="text"
                placeholder="메일 링크의 token 값"
                v-model="resetToken"
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
          </div>

          <div class="space-y-2">
            <label for="password" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">새 암호</label>
            <input
              id="password"
              type="password"
              placeholder="최소 8자"
              minlength="8"
              v-model="password"
              required
              class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <p v-if="errorMessage" class="text-xs text-red-200/80">{{ errorMessage }}</p>
          <p v-else-if="successMessage" class="text-xs text-emerald-200/80">{{ successMessage }}</p>

          <button
            type="submit"
            :disabled="pending"
            class="tap-area w-full rounded-2xl bg-white/90 px-4 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/40"
          >
            {{ pending ? '확인 중...' : '암호 재설정' }}
          </button>
        </form>
      </div>

      <div class="space-y-2 text-xs text-paper-oklch/50">
        <NuxtLink to="/login" class="block hover:text-paper-oklch/80">로그인으로 돌아가기</NuxtLink>
        <NuxtLink to="/register" class="block hover:text-paper-oklch/80">새 계정 만들기</NuxtLink>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getErrorMessage } from '~/utils/errorMessage'

const auth = useAuth()
const route = useRoute()

const email = ref('')
const verificationCode = ref('')
const resetToken = ref('')
const password = ref('')
const pending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const sendPending = ref(false)
const sendMessage = ref('')
const sendError = ref('')

onMounted(() => {
  const tokenFromQuery = route.query.token
  if (typeof tokenFromQuery === 'string') {
    resetToken.value = tokenFromQuery
  }
})

const handleSendLink = async () => {
  sendError.value = ''
  sendMessage.value = ''

  if (!email.value) {
    sendError.value = '이메일을 입력하세요.'
    return
  }

  sendPending.value = true
  try {
    await auth.requestPasswordReset({ email: email.value })
    sendMessage.value = '해당 이메일로 복구 링크를 보냈어요. 메일의 token 값을 아래에 입력해 주세요.'
  } catch (error) {
    sendError.value = getErrorMessage(error) || '메일을 보낼 수 없습니다.'
  } finally {
    sendPending.value = false
  }
}

const handleRecover = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  pending.value = true

  if (!verificationCode.value && !resetToken.value) {
    errorMessage.value = '초대 코드 또는 이메일 토큰을 입력하세요.'
    pending.value = false
    return
  }

  try {
    await auth.recoverPassword({
      email: email.value,
      password: password.value,
      verificationCode: verificationCode.value || undefined,
      resetToken: resetToken.value || undefined
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
