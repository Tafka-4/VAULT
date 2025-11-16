<template>
  <main class="relative flex min-h-screen flex-col items-center justify-center bg-[#0f0f0f] px-4 py-12 text-white">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(214,211,209,0.18),transparent_65%)]"></div>
    <div v-if="metadata" class="w-full max-w-3xl space-y-6 rounded-[2rem] bg-white/5 p-8 ring-1 ring-white/15">
      <div class="space-y-2 text-center">
        <p class="text-xs uppercase tracking-[0.32em] text-white/60">공유 파일</p>
        <h1 class="text-2xl font-semibold">{{ metadata.fileName }}</h1>
        <p class="text-sm text-white/65">{{ formatBytes(metadata.fileSize) }}</p>
        <p v-if="metadata.folderPath" class="text-xs text-white/45">위치: {{ metadata.folderPath }}</p>
      </div>
      <div class="rounded-[1.25rem] bg-black/40 p-4 text-sm text-white/70">
        <p>만료일: <span class="font-semibold">{{ formatExpiry(metadata.expiresAt) }}</span></p>
        <p>비밀번호 보호: <span class="font-semibold">{{ metadata.hasPassword ? '예' : '아니요' }}</span></p>
      </div>
      <div v-if="canPreview" class="rounded-[1.25rem] bg-black/30 p-4">
        <component :is="previewComponent" v-if="previewComponent" :src="previewSrc" controls preload="metadata" class="w-full rounded-xl bg-black">
          <track kind="captions" />
        </component>
        <img v-else-if="isImage" :src="previewSrc" :alt="metadata.fileName" class="mx-auto max-h-[420px] rounded-xl object-contain" />
        <p v-else class="text-center text-sm text-white/60">이 파일 형식은 미리보기를 지원하지 않습니다.</p>
      </div>
      <div class="space-y-4">
        <p class="text-sm text-white/70">공유자가 설정한 비밀번호를 입력하면 파일을 다운로드할 수 있습니다.</p>
        <input
          v-if="metadata.hasPassword"
          v-model="password"
          type="password"
          placeholder="비밀번호"
          class="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm focus:border-white/40 focus:outline-none"
        />
        <a
          :href="downloadHref"
          download
          class="block w-full rounded-full bg-white/90 px-4 py-3 text-center text-sm font-semibold text-black transition hover:bg-white"
        >
          다운로드
        </a>
      </div>
    </div>
    <div v-else-if="pending" class="text-sm text-white/70">링크 정보를 불러오는 중입니다...</div>
    <div v-else class="w-full max-w-md space-y-4 rounded-[1.5rem] bg-white/5 p-6 text-center text-white/80 ring-1 ring-white/15">
      <p class="text-lg font-semibold">링크를 찾을 수 없습니다.</p>
      <p class="text-sm text-white/60">만료되었거나 잘못된 주소입니다.</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PublicShareMetadata } from '~/types/share'

const route = useRoute()
const shareId = computed(() => route.params.id as string)

const { data, pending } = await useFetch<{ data: PublicShareMetadata }>(`/api/public/share/${shareId.value}`, {
  key: `public-share-${shareId.value}`
})

const metadata = computed(() => data.value?.data)
const password = ref('')
const previewNonce = ref(0)

const downloadHref = computed(() => {
  if (!metadata.value) return '#'
  const base = `/api/public/share/${shareId.value}/stream`
  const search = new URLSearchParams()
  if (metadata.value.hasPassword && password.value) {
    search.set('password', password.value)
  }
  search.set('nonce', String(previewNonce.value))
  return `${base}?${search.toString()}`
})

const previewSrc = computed(() => {
  if (!metadata.value) return ''
  const base = `/api/public/share/${shareId.value}/stream`
  const params = new URLSearchParams()
  if (metadata.value.hasPassword && password.value) {
    params.set('password', password.value)
  }
  params.set('preview', '1')
  params.set('nonce', String(previewNonce.value))
  return `${base}?${params.toString()}`
})

const isImage = computed(() => metadata.value?.mimeType.startsWith('image/'))
const isVideo = computed(() => metadata.value?.mimeType.startsWith('video/'))
const isAudio = computed(() => metadata.value?.mimeType.startsWith('audio/'))

const previewComponent = computed(() => {
  if (isVideo.value) return 'video'
  if (isAudio.value) return 'audio'
  return null
})

const canPreview = computed(() => !metadata.value?.hasPassword || Boolean(password.value))

watch(password, () => {
  previewNonce.value += 1
})

const formatBytes = (bytes: number) => {
  if (!bytes) return '0B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)}${units[unit]}`
}

const formatExpiry = (timestamp: number) => {
  const diff = timestamp - Date.now()
  if (diff <= 0) return '만료됨'
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000))
  return `${days}일 후 만료`
}
</script>
