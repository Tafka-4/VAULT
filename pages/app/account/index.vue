<template>
  <main class="relative flex min-h-full flex-col">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[340px] bg-[radial-gradient(60%_50%_at_50%_-10%,_rgba(214,211,209,0.18),_transparent_65%)]"></div>

    <section class="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <div class="rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">계정</p>
            <h1 class="text-2xl font-extrabold">내 정보</h1>
            <p class="mt-1 text-sm text-paper-oklch/70">이메일과 가입 정보를 확인하고 관리하세요.</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <NuxtLink
              to="/app/account/edit"
              class="tap-area inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-black hover:bg-white"
            >
              정보 수정
            </NuxtLink>
            <NuxtLink
              to="/app/upload"
              class="tap-area inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-paper-oklch/80 ring-1 ring-surface hover:bg-white/5 hover:text-paper-oklch"
            >
              업로드로 이동
            </NuxtLink>
          </div>
        </div>

        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <div class="rounded-[1.5rem] bg-black/30 p-5 ring-1 ring-surface">
            <p class="text-xs uppercase tracking-[0.3em] text-paper-oklch/55">로그인 이메일</p>
            <p class="mt-2 text-lg font-semibold">{{ userEmail }}</p>
            <p class="mt-1 text-sm text-paper-oklch/60">가입일 {{ joinedAt }}</p>
            <p class="mt-3 text-xs text-paper-oklch/55">계정 초기화를 원한다면 암호를 변경하거나 로그아웃 후 다시 로그인하세요.</p>
          </div>

          <div class="rounded-[1.5rem] bg-black/30 p-5 ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs uppercase tracking-[0.3em] text-paper-oklch/55">스토리지 사용량</p>
                <p class="mt-2 text-lg font-semibold">{{ formatBytes(personalUsage) }}</p>
              </div>
              <span class="text-xs text-paper-oklch/60">{{ usageLabel }}</span>
            </div>
            <div class="mt-4 h-2 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
              <div
                class="h-full bg-sky-300/80 transition-all"
                :style="{ width: usedPercent + '%' }"
                aria-label="사용 중"
              ></div>
            </div>
            <div class="mt-3 grid grid-cols-3 gap-2 text-xs text-paper-oklch/70">
              <div>
                <p class="text-paper-oklch/50">내 사용량</p>
                <p class="font-semibold">{{ formatBytes(personalUsage) }}</p>
              </div>
              <div>
                <p class="text-paper-oklch/50">서버 사용량</p>
                <p class="font-semibold">{{ formatBytes(overallUsage) }}</p>
              </div>
              <div>
                <p class="text-paper-oklch/50">총 용량</p>
                <p class="font-semibold">{{ formatBytes(capacityBytes) }}</p>
              </div>
            </div>
            <p class="mt-2 text-xs text-paper-oklch/60">남은 공간 {{ formatBytes(remainingBytes) }}</p>
            <p v-if="errorMessage" class="mt-3 text-xs text-red-200/80">{{ errorMessage }}</p>
            <p v-else class="mt-3 text-xs text-paper-oklch/55">
              {{ pending ? '용량 정보를 불러오는 중...' : '업로드와 다운로드에 사용할 수 있는 개인 저장공간입니다.' }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import { getErrorMessage } from '~/utils/errorMessage'

definePageMeta({ layout: 'app' })

type StorageStats = { totalBytes: number; usedBytes: number; freeBytes: number; userBytes: number }
type StorageStatsResponse = { data: StorageStats }

const auth = useAuth()
const requestFetch = useRequestFetch()

const stats = ref<StorageStats | null>(null)
const pending = ref(false)
const errorMessage = ref('')

const userEmail = computed(() => auth.user.value?.email ?? '계정 정보를 불러오지 못했어요.')
const joinedAt = computed(() => {
  if (!auth.user.value?.createdAt) return '-'
  return new Date(auth.user.value.createdAt).toLocaleString('ko-KR')
})

const personalUsage = computed(() => stats.value?.userBytes ?? 0)
const overallUsage = computed(() => stats.value?.usedBytes ?? 0)
const capacityBytes = computed(() => stats.value?.totalBytes ?? 0)
const remainingBytes = computed(() => Math.max(stats.value?.freeBytes ?? 0, 0))
const usedPercent = computed(() => {
  const total = stats.value?.totalBytes ?? 1
  const used = personalUsage.value
  return Math.min(100, Math.round((used / total) * 100))
})
const usageLabel = computed(() => (stats.value ? `${usedPercent.value}% 사용 중` : '정보 없음'))

const formatBytes = (bytes: number) => {
  if (!bytes) return '0B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const order = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, order)
  return `${value.toFixed(order === 0 ? 0 : 1)}${units[order]}`
}

const fetchStats = async () => {
  pending.value = true
  errorMessage.value = ''
  try {
    const response = await requestFetch<StorageStatsResponse>('/api/storage/stats', { credentials: 'include' })
    stats.value = response.data
  } catch (error) {
    errorMessage.value = getErrorMessage(error) || '스토리지 정보를 불러올 수 없습니다.'
  } finally {
    pending.value = false
  }
}

onMounted(fetchStats)

watchEffect(() => {
  if (!auth.user.value && auth.status.value === 'idle') {
    auth.refresh().catch(() => {})
  }
})
</script>
