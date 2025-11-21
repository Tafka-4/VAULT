<template>
  <main class="relative flex min-h-full flex-col">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_50%_at_50%_-10%,_rgba(214,211,209,0.18),_transparent_65%)]"></div>

    <section class="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <NuxtLink
          to="/app/share"
          class="tap-area inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-paper-oklch/75 ring-1 ring-surface hover:bg-white/15"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7" />
          </svg>
          공유 허브로 돌아가기
        </NuxtLink>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="tap-area inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-black hover:bg-white disabled:opacity-60"
            :disabled="saving"
            @click="saveSettings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" />
            </svg>
            {{ saving ? '저장 중...' : '변경 사항 저장' }}
          </button>
          <p v-if="saveMessage" class="text-xs text-emerald-300/80">{{ saveMessage }}</p>
        </div>
      </div>

      <header class="space-y-2">
        <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">공유 설정</p>
        <h1 class="text-2xl font-extrabold">기본 정책과 보안 기본값</h1>
        <p class="text-sm text-paper-oklch/70">새 링크에 적용될 만료 기준과 비밀번호 정책을 지정하고, 현재 링크 현황을 한눈에 확인하세요.</p>
      </header>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <section class="space-y-5">
          <div class="space-y-4 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold">만료 기본값</h2>
              <label class="inline-flex items-center gap-2 text-xs text-paper-oklch/60">
                <input v-model="form.expiryEnabled" type="checkbox" class="size-4 rounded border border-white/30 bg-black/40" />
                만료 사용
              </label>
            </div>
            <div class="space-y-3 text-sm text-paper-oklch/70">
              <label class="flex flex-col gap-2">
                <span class="text-xs uppercase tracking-[0.28em] text-paper-oklch/55">만료일 (일)</span>
                <input
                  v-model.number="form.defaultExpiryDays"
                  type="number"
                  min="1"
                  max="90"
                  class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-paper-oklch focus:border-white/40 focus:outline-none"
                  :disabled="!form.expiryEnabled"
                />
              </label>
              <p class="text-xs text-paper-oklch/55">새 링크 생성 시 기본 만료일을 적용합니다. 만료 사용을 끄면 만료 없이 생성됩니다.</p>
            </div>
          </div>

          <div class="space-y-4 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold">비밀번호 정책</h2>
              <label class="inline-flex items-center gap-2 text-xs text-paper-oklch/60">
                <input v-model="form.requirePassword" type="checkbox" class="size-4 rounded border border-white/30 bg-black/40" />
                비밀번호 필수
              </label>
            </div>
            <div class="space-y-3 text-sm text-paper-oklch/70">
              <label class="flex flex-col gap-2">
                <span class="text-xs uppercase tracking-[0.28em] text-paper-oklch/55">기본 비밀번호 (선택)</span>
                <input
                  v-model="form.defaultPassword"
                  type="text"
                  maxlength="64"
                  class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-paper-oklch focus:border-white/40 focus:outline-none"
                  :disabled="!form.requirePassword"
                  placeholder="예: vault-2024"
                />
              </label>
              <p class="text-xs text-paper-oklch/55">
                {{ passwordHint }}
              </p>
            </div>
          </div>

          <div class="space-y-3 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <h2 class="text-base font-semibold">적용 범위</h2>
            <ul class="space-y-2 text-sm text-paper-oklch/70">
              <li class="flex items-start gap-2">
                <span class="mt-1 size-2 rounded-full bg-emerald-300/80"></span>
                <p>새로운 공유 링크 생성 시 위 기본값이 자동 채워집니다.</p>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 size-2 rounded-full bg-sky-300/80"></span>
                <p>기존 링크에는 영향을 주지 않습니다. 업데이트하려면 공유 허브에서 개별 링크를 수정하세요.</p>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 size-2 rounded-full bg-amber-300/80"></span>
                <p>만료/비밀번호를 강제하려면 팀 정책 설정에서 추가 제어가 필요합니다.</p>
              </li>
            </ul>
          </div>
        </section>

        <aside class="space-y-5">
          <div class="space-y-3 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold">링크 현황</h2>
              <button type="button" class="tap-area rounded-full px-3 py-1 text-xs text-paper-oklch/60 hover:bg-white/10" @click="refreshShareLinks">새로고침</button>
            </div>
            <ul class="space-y-2 text-sm text-paper-oklch/70">
              <li class="flex items-center justify-between">
                <span>활성 링크</span>
                <span class="text-xs text-paper-oklch/55">{{ stats.total }}개</span>
              </li>
              <li class="flex items-center justify-between">
                <span>비밀번호 보호</span>
                <span class="text-xs text-paper-oklch/55">{{ stats.protected }}개</span>
              </li>
              <li class="flex items-center justify-between">
                <span>만료 임박 (3일)</span>
                <span class="text-xs text-paper-oklch/55">{{ stats.expiringSoon }}개</span>
              </li>
              <li class="flex items-center justify-between">
                <span>공유된 폴더</span>
                <span class="text-xs text-paper-oklch/55">{{ stats.folderCount }}개</span>
              </li>
            </ul>
          </div>

          <div class="space-y-3 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <h2 class="text-base font-semibold">정책 미리보기</h2>
            <ul class="space-y-2 text-xs text-paper-oklch/60">
              <li class="flex items-center justify-between rounded-xl bg-black/30 px-4 py-3">
                <span>만료</span>
                <span class="text-paper-oklch/50">{{ form.expiryEnabled ? `${form.defaultExpiryDays}일 후 만료` : '사용 안 함' }}</span>
              </li>
              <li class="flex items-center justify-between rounded-xl bg-black/30 px-4 py-3">
                <span>비밀번호</span>
                <span class="text-paper-oklch/50">
                  {{ form.requirePassword ? (form.defaultPassword ? '기본 비밀번호 자동 설정' : '생성 시 필수 입력') : '필수 아님' }}
                </span>
              </li>
              <li class="flex items-center justify-between rounded-xl bg-black/30 px-4 py-3">
                <span>적용 대상</span>
                <span class="text-paper-oklch/50">새로 생성되는 공유 링크</span>
              </li>
            </ul>
            <NuxtLink to="/app/share" class="text-xs text-paper-oklch/60 hover:text-paper-oklch/80">공유 허브에서 링크 관리</NuxtLink>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { ShareLink } from '~/types/share'

// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })

type ShareLinksResponse = { data: ShareLink[] }

const form = reactive({
  expiryEnabled: true,
  defaultExpiryDays: 7,
  requirePassword: false,
  defaultPassword: ''
})

const saving = ref(false)
const saveMessage = ref('')

const { data: shareLinksData, refresh: refreshShareLinks } = await useFetch<ShareLinksResponse>('/api/share-links', {
  key: 'share-links-settings'
})

const shareLinks = computed(() => shareLinksData.value?.data ?? [])

const stats = computed(() => {
  const total = shareLinks.value.length
  const protectedCount = shareLinks.value.filter(link => link.hasPassword).length
  const expiringSoon = shareLinks.value.filter(link => link.expiresAt - Date.now() < 3 * 24 * 60 * 60 * 1000).length
  const folderCount = new Set(shareLinks.value.map(link => link.folderId || 'root')).size
  return {
    total,
    protected: protectedCount,
    expiringSoon,
    folderCount
  }
})

const passwordHint = computed(() => {
  if (!form.requirePassword) return '비밀번호 없이 생성됩니다.'
  if (form.defaultPassword) return '새 링크에 기본 비밀번호가 자동 입력됩니다.'
  return '비밀번호를 직접 입력해야 새 링크를 만들 수 있습니다.'
})

const loadSettings = () => {
  if (!process.client) return
  try {
    const raw = localStorage.getItem('vault:share-settings')
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      form.expiryEnabled = Boolean(parsed.expiryEnabled)
      form.defaultExpiryDays = Number(parsed.defaultExpiryDays) || form.defaultExpiryDays
      form.requirePassword = Boolean(parsed.requirePassword)
      form.defaultPassword = typeof parsed.defaultPassword === 'string' ? parsed.defaultPassword : ''
    }
  } catch {
    // ignore malformed storage
  }
}

const persistSettings = () => {
  if (!process.client) return
  const payload = {
    expiryEnabled: form.expiryEnabled,
    defaultExpiryDays: form.defaultExpiryDays || 7,
    requirePassword: form.requirePassword,
    defaultPassword: form.defaultPassword
  }
  try {
    localStorage.setItem('vault:share-settings', JSON.stringify(payload))
  } catch {
    // ignore storage issues
  }
}

if (process.client) {
  loadSettings()
}

watch(
  () => ({ ...form }),
  () => persistSettings(),
  { deep: true }
)

const saveSettings = async () => {
  saving.value = true
  saveMessage.value = ''
  try {
    persistSettings()
    saveMessage.value = '변경 사항이 저장되었습니다.'
    setTimeout(() => {
      saveMessage.value = ''
    }, 2000)
  } finally {
    saving.value = false
  }
}
</script>
