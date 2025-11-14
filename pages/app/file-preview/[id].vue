<template>
  <main class="relative flex min-h-full flex-col" v-if="file">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_50%_at_50%_-10%,_rgba(214,211,209,0.18),_transparent_65%)]"></div>

    <section class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="space-y-1">
          <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">파일 미리보기</p>
          <h1 class="text-2xl font-extrabold truncate">{{ file.name }}</h1>
          <p class="text-sm text-paper-oklch/70">
            {{ formatBytes(file.size) }} · {{ formatRelative(file.updatedAt) }} · {{ file.mimeType }}
          </p>
        </div>
        <div class="inline-flex flex-wrap items-center gap-2 text-xs text-paper-oklch/55">
          <button
            type="button"
            class="tap-area rounded-full bg-white/10 px-3 py-1 ring-1 ring-surface hover:bg-white/15"
            @click="refreshFile"
          >
            새로고침
          </button>
          <a
            :href="downloadUrl"
            download
            class="tap-area rounded-full bg-white/90 px-3 py-1 font-semibold text-black hover:bg-white"
          >
            다운로드
          </a>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div class="space-y-5">
          <div class="rounded-[2rem] bg-white/5 p-4 ring-1 ring-surface">
            <div class="rounded-[1.75rem] bg-black/40 p-4 text-center">
              <template v-if="previewType === 'image'">
                <img :src="streamUrl" :alt="file.name" class="mx-auto max-h-[460px] rounded-[1.25rem] object-contain" />
              </template>
              <template v-else-if="previewType === 'video'">
                <video
                  :src="streamUrl"
                  controls
                  preload="metadata"
                  class="mx-auto w-full rounded-[1.25rem] bg-black"
                ></video>
              </template>
              <template v-else-if="previewType === 'audio'">
                <div class="space-y-4 rounded-[1.25rem] bg-black/50 p-6">
                  <p class="text-sm text-paper-oklch/70">스트리밍이 가능한 오디오입니다.</p>
                  <audio :src="streamUrl" controls class="w-full" preload="metadata"></audio>
                </div>
              </template>
              <template v-else>
                <div class="space-y-4 py-16">
                  <p class="text-lg font-semibold text-paper-oklch">미리보기가 지원되지 않는 형식입니다.</p>
                  <p class="text-sm text-paper-oklch/60">다운로드 후 열어주세요.</p>
                  <a
                    :href="downloadUrl"
                    download
                    class="tap-area inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-black hover:bg-white"
                  >
                    파일 다운로드
                  </a>
                </div>
              </template>
            </div>
          </div>

          <div class="grid gap-3 rounded-[1.5rem] bg-black/35 p-5 text-sm ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <span class="text-sm uppercase font-bold text-paper-oklch/55">메타데이터</span>
            </div>
            <ul class="grid gap-2 text-xs text-paper-oklch/60">
              <li class="flex items-center justify-between">
                <span>파일 크기</span>
                <span>{{ formatBytes(file.size) }}</span>
              </li>
              <li class="flex items-center justify-between">
                <span>콘텐츠 유형</span>
                <span>{{ file.mimeType }}</span>
              </li>
              <li class="flex items-center justify-between">
                <span>생성</span>
                <span>{{ new Date(file.createdAt).toLocaleString('ko-KR') }}</span>
              </li>
              <li class="flex items-center justify-between">
                <span>업데이트</span>
                <span>{{ new Date(file.updatedAt).toLocaleString('ko-KR') }}</span>
              </li>
              <li class="flex items-center justify-between">
                <span>암호화 상태</span>
                <span>활성 (KMS)</span>
              </li>
            </ul>
          </div>
        </div>

        <aside class="space-y-5">
          <div class="space-y-4 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-paper-oklch/55">보안 링크</h2>
            </div>
            <p class="text-sm text-paper-oklch/70">링크는 로그인된 사용자에게만 유효합니다.</p>
            <div class="space-y-3 rounded-[1.5rem] bg-black/35 p-4 text-sm ring-1 ring-surface">
              <div class="rounded-xl bg-black/40 px-3 py-3 text-xs text-paper-oklch/55 break-all">{{ fullShareLink }}</div>
              <button
                type="button"
                class="tap-area w-full rounded-xl bg-white/90 px-4 py-2 text-xs font-semibold text-black transition hover:bg-white"
                @click="copyLink"
              >
                링크 복사
              </button>
              <p class="text-xs text-paper-oklch/50">{{ copyMessage }}</p>
            </div>
          </div>

          <div class="space-y-3 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-paper-oklch/55">다른 파일</h2>
            </div>
            <div class="rounded-[1.25rem] bg-black/30 p-2 ring-1 ring-surface">
              <FileRow
                v-for="item in relatedFiles"
                :key="item.id"
                :icon="item.mimeType.startsWith('image/') ? 'image' : 'file'"
                :name="item.name"
                :detail="formatBytes(item.size)"
                :to="`/app/file-preview/${item.id}`"
              />
              <p v-if="!relatedFiles.length" class="p-4 text-center text-xs text-paper-oklch/55">표시할 다른 파일이 없습니다.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>

  <div v-else-if="pending" class="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
    <p class="text-sm text-paper-oklch/60">파일을 불러오는 중입니다...</p>
  </div>

  <div v-else class="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
    <p class="text-lg font-semibold text-paper-oklch">파일을 찾을 수 없습니다.</p>
    <NuxtLink to="/app" class="tap-area rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-black hover:bg-white">대시보드로 돌아가기</NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getErrorMessage } from '~/utils/errorMessage'
import type { StoredFile } from '~/types/storage'

// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })

const route = useRoute()
const fileId = computed(() => route.params.id as string)

const fileFetchKey = `file-${fileId.value}`
const { data, pending, refresh } = await useFetch<{ data: StoredFile }>(`/api/files/${fileId.value}`, {
  key: fileFetchKey
})

const file = computed(() => data.value?.data)

const streamUrl = computed(() => `/api/files/${fileId.value}/stream`)
const downloadUrl = computed(() => `${streamUrl.value}?download=1`)

const previewType = computed(() => {
  if (!file.value) return 'none'
  if (file.value.mimeType.startsWith('image/')) return 'image'
  if (file.value.mimeType.startsWith('video/')) return 'video'
  if (file.value.mimeType.startsWith('audio/')) return 'audio'
  return 'other'
})

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const order = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, order)
  return `${value.toFixed(order === 0 ? 0 : 1)}${units[order]}`
}

const rtf = new Intl.RelativeTimeFormat('ko', { numeric: 'auto' })
const formatRelative = (timestamp: number) => {
  const diff = timestamp - Date.now()
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000]
  ]
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms || unit === 'minute') {
      return rtf.format(Math.round(diff / ms), unit)
    }
  }
  return '지금'
}

const { data: listResponse } = await useFetch<{ data: StoredFile[] }>('/api/files', {
  key: 'file-preview-related'
})

const relatedFiles = computed(() => {
  const list = listResponse.value?.data ?? []
  return list.filter(item => item.id !== fileId.value).slice(0, 3)
})

const copyMessage = ref('링크는 세션이 유효할 때만 열 수 있습니다.')
let copyTimer: ReturnType<typeof setTimeout> | undefined
const requestURL = useRequestURL()
const origin = computed(() => (process.client ? window.location.origin : requestURL.origin))
const fullShareLink = computed(() => `${origin.value}/app/file-preview/${fileId.value}`)

const copyLink = async () => {
  if (!file.value || !process.client) return
  if (copyTimer) clearTimeout(copyTimer)
  try {
    await navigator.clipboard.writeText(fullShareLink.value)
    copyMessage.value = '복사되었습니다.'
  } catch (e) {
    copyMessage.value = getErrorMessage(e) || '복사에 실패했습니다.'
  }
  copyTimer = setTimeout(() => {
    copyMessage.value = '링크는 세션이 유효할 때만 열 수 있습니다.'
  }, 2000)
}

const refreshFile = async () => {
  await refresh()
}
</script>
