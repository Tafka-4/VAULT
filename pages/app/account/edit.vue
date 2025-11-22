<template>
  <main class="relative flex min-h-full flex-col">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[340px] bg-[radial-gradient(60%_50%_at_50%_-10%,_rgba(214,211,209,0.18),_transparent_65%)]"></div>

    <section class="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8">
      <div class="rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">계정</p>
            <h1 class="text-2xl font-extrabold">정보 수정</h1>
            <p class="mt-1 text-sm text-paper-oklch/70">이메일 또는 암호를 변경하려면 현재 암호를 입력하세요.</p>
          </div>
          <NuxtLink
            to="/app/account"
            class="tap-area inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-paper-oklch/80 ring-1 ring-surface hover:bg-white/5 hover:text-paper-oklch"
          >
            내 정보로 돌아가기
          </NuxtLink>
        </div>

        <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-2 text-left">
            <label for="email" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">이메일</label>
            <input
              id="email"
              type="email"
              placeholder="you@vault.app"
              v-model="email"
              class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div class="space-y-2 text-left">
            <label for="currentPassword" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">현재 암호</label>
            <input
              id="currentPassword"
              type="password"
              v-model="currentPassword"
              placeholder="변경을 위해 입력하세요"
              class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2 text-left">
              <label for="newPassword" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">새 암호</label>
              <input
                id="newPassword"
                type="password"
                minlength="8"
                v-model="newPassword"
                placeholder="최소 8자"
                class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div class="space-y-2 text-left">
              <label for="confirmPassword" class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">새 암호 확인</label>
              <input
                id="confirmPassword"
                type="password"
                minlength="8"
                v-model="confirmPassword"
                placeholder="다시 입력"
                class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>

          <p v-if="errorMessage" class="text-xs text-red-200/80">{{ errorMessage }}</p>
          <p v-else-if="successMessage" class="text-xs text-emerald-200/80">{{ successMessage }}</p>

          <div class="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              :disabled="pending"
              class="tap-area inline-flex items-center justify-center gap-2 rounded-xl bg-white/90 px-5 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/40"
            >
              {{ pending ? '저장 중...' : '변경 내용 저장' }}
            </button>
            <span class="text-xs text-paper-oklch/60">변경 시 다른 기기의 세션이 모두 해제됩니다.</span>
          </div>
        </form>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getErrorMessage } from '~/utils/errorMessage'

definePageMeta({ layout: 'app' })

const auth = useAuth()

const email = ref(auth.user.value?.email ?? '')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const pending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const normalizedEmail = computed(() => email.value.trim())
const hasEmailChange = computed(() => Boolean(normalizedEmail.value) && normalizedEmail.value !== auth.user.value?.email)
const hasPasswordChange = computed(() => Boolean(newPassword.value))

watch(
  () => auth.user.value?.email,
  (value) => {
    if (value && !email.value) {
      email.value = value
    }
  }
)

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!hasEmailChange.value && !hasPasswordChange.value) {
    errorMessage.value = '변경할 내용을 입력하세요.'
    return
  }

  if (!currentPassword.value) {
    errorMessage.value = '현재 암호를 입력해야 변경할 수 있습니다.'
    return
  }

  if (hasPasswordChange.value && newPassword.value !== confirmPassword.value) {
    errorMessage.value = '새 암호가 일치하지 않습니다.'
    return
  }

  if (hasPasswordChange.value && newPassword.value.length < 8) {
    errorMessage.value = '새 암호는 8자 이상이어야 합니다.'
    return
  }

  pending.value = true

  try {
    await auth.updateProfile({
      email: hasEmailChange.value ? normalizedEmail.value : undefined,
      password: hasPasswordChange.value ? newPassword.value : undefined,
      currentPassword: currentPassword.value
    })
    successMessage.value = '계정 정보가 수정되었습니다.'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    await navigateTo('/app/account')
  } catch (error) {
    errorMessage.value = getErrorMessage(error) || '정보를 수정할 수 없습니다.'
  } finally {
    pending.value = false
  }
}
</script>
