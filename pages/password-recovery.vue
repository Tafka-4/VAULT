<template>
  <main class="relative flex min-h-dvh flex-col items-center justify-center px-4">
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(58%_48%_at_50%_-10%,_rgba(214,211,209,0.16),_transparent_65%)]"></div>
    <div class="w-full max-w-xl space-y-10 text-center">
      <NuxtLink to="/" class="inline-flex flex-col items-center gap-2">
        <span class="text-[3.25rem] font-extrabold uppercase tracking-[0.6em] text-paper-oklch/80 sm:text-[4rem]">VAULT</span>
        <span class="text-xs uppercase tracking-[0.4em] text-paper-oklch/40">암호 재설정 요청</span>
      </NuxtLink>

      <form class="space-y-5 rounded-[1.75rem] bg-white/5 p-6 ring-1 ring-surface" @submit.prevent="handleSendLink">
        <div class="space-y-2 text-left">
          <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">이메일 링크</p>
          <h2 class="text-xl font-bold">메일로 복구 링크 받기</h2>
          <p class="text-sm text-paper-oklch/60">복구 링크를 눌러 자동 인증 후 암호를 새로 설정하세요.</p>
        </div>
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

      <div class="space-y-2 text-xs text-paper-oklch/50">
        <NuxtLink to="/password-reset-code" class="block hover:text-paper-oklch/80">초대 코드가 있나요? 암호 재설정</NuxtLink>
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
const sendPending = ref(false)
const sendMessage = ref('')
const sendError = ref('')

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
    sendMessage.value = '해당 이메일로 복구 링크를 보냈어요. 메일의 링크를 눌러 자동 인증 후 암호를 변경하세요.'
  } catch (error) {
    sendError.value = getErrorMessage(error) || '메일을 보낼 수 없습니다.'
  } finally {
    sendPending.value = false
  }
}
</script>
