<template>
  <main class="relative flex min-h-screen flex-col items-center justify-center bg-[#0f0f0f] px-4 py-12 text-white">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(214,211,209,0.18),transparent_65%)]"></div>
    <div v-if="metadata" class="w-full max-w-3xl space-y-6 rounded-[2rem] bg-white/5 p-8 ring-1 ring-white/15">
      <div class="space-y-2 text-center">
        <p class="text-xs uppercase tracking-[0.32em] text-white/60">공유 파일</p>
        <h1 class="break-words text-2xl font-semibold" :title="metadata.fileName">{{ metadata.fileName }}</h1>
        <p class="text-sm text-white/65">{{ formatBytes(metadata.fileSize) }}</p>
        <p v-if="metadata.folderPath" class="break-words text-xs text-white/45" :title="metadata.folderPath">위치: {{ metadata.folderPath }}</p>
      </div>
      <div class="rounded-[1.25rem] bg-black/40 p-4 text-sm text-white/70 space-y-1">
        <p>
          만료일:
          <span class="font-semibold">{{ expiryLabel }}</span>
        </p>
        <p>
          비밀번호 보호:
          <span class="font-semibold">{{ metadata.hasPassword ? '예' : '아니요' }}</span>
        </p>
      </div>
      <div v-if="canPreview" class="rounded-[1.25rem] bg-black/30 p-4">
        <component :is="previewComponent" v-if="previewComponent" :src="previewSrc" controls preload="metadata" class="w-full rounded-xl bg-black">
          <track kind="captions" />
        </component>
        <img v-else-if="isImage" :src="previewSrc" :alt="metadata.fileName" class="mx-auto max-h-[420px] rounded-xl object-contain" />
        <p v-else class="text-center text-sm text-white/60">이 파일 형식은 미리보기를 지원하지 않습니다.</p>
      </div>
      <div class="space-y-4">
        <p class="text-sm text-white/70">공유자가 설정한 비밀번호를 입력하면 파일을 다운로드하거나 스트리밍할 수 있습니다.</p>
        <div v-if="metadata.hasPassword" class="space-y-3">
          <input
            v-model="password"
            type="password"
            placeholder="비밀번호"
            class="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm focus:border-white/40 focus:outline-none"
          />
          <button
            type="button"
            class="w-full rounded-full bg-white/90 px-4 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-50"
            :disabled="verifying || !password"
            @click="verifyPassword"
          >
            {{ verifying ? '확인 중...' : passwordVerified ? '확인 완료' : '비밀번호 확인' }}
          </button>
          <p v-if="verifyMessage" class="text-center text-xs text-emerald-300/80">{{ verifyMessage }}</p>
          <p v-if="verifyError" class="text-center text-xs text-rose-300/80">{{ verifyError }}</p>
        </div>
        <button
          type="button"
          class="block w-full rounded-full bg-white/90 px-4 py-3 text-center text-sm font-semibold text-black transition hover:bg-white disabled:opacity-40"
          :disabled="metadata.hasPassword && !passwordVerified"
          @click="downloadFile"
        >
          다운로드
        </button>
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
const passwordVerified = ref(false)
const verifying = ref(false)
const verifyMessage = ref('')
const verifyError = ref('')
const previewNonce = ref(0)

watch(
  metadata,
  (next) => {
    password.value = ''
    passwordVerified.value = !next?.hasPassword
    verifyMessage.value = ''
    verifyError.value = ''
    previewNonce.value += 1
  },
  { immediate: true }
)

watch(password, () => {
  if (metadata.value?.hasPassword) {
    passwordVerified.value = false
    verifyMessage.value = ''
    verifyError.value = ''
  }
  previewNonce.value += 1
})

const downloadHref = computed(() => {
  if (!metadata.value || (metadata.value.hasPassword && !passwordVerified.value)) return '#'
  const base = `/api/public/share/${shareId.value}/stream`
  const search = new URLSearchParams()
  if (metadata.value.hasPassword && password.value) {
    search.set('password', password.value)
  }
  search.set('nonce', String(previewNonce.value))
  return `${base}?${search.toString()}`
})

const previewSrc = computed(() => {
  if (!metadata.value || (metadata.value.hasPassword && !passwordVerified.value)) return ''
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

const canPreview = computed(() => !metadata.value?.hasPassword || passwordVerified.value)

const expiryLabel = computed(() => {
  if (!metadata.value) return ''
  const date = new Date(metadata.value.expiresAt)
  const formatted = date.toLocaleString('ko-KR', { dateStyle: 'long', timeStyle: 'short' })
  return `${formatted} (${formatExpiry(metadata.value.expiresAt)})`
})

const verifyPassword = async () => {
  if (!process.client) return
  if (!metadata.value?.hasPassword) {
    passwordVerified.value = true
    return
  }
  if (!password.value) {
    verifyError.value = '비밀번호를 입력하세요.'
    return
  }
  verifying.value = true
  verifyError.value = ''
  verifyMessage.value = ''
  try {
    const res = await fetch(`/api/public/share/${shareId.value}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value })
    })
    if (!res.ok) {
      const text = await res.text()
      try {
        const parsed = JSON.parse(text)
        verifyError.value = parsed?.error?.message || text || '비밀번호 확인에 실패했습니다.'
      } catch {
        verifyError.value = text || '비밀번호 확인에 실패했습니다.'
      }
      return
    }
    passwordVerified.value = true
    verifyMessage.value = '비밀번호가 확인되었습니다.'
    previewNonce.value += 1
  } catch (error) {
    verifyError.value = (error as Error).message
  } finally {
    verifying.value = false
  }
}

const downloadFile = () => {
  if (!process.client) return
  if (!metadata.value) return
  if (metadata.value.hasPassword && !passwordVerified.value) return
  const link = document.createElement('a')
  link.href = downloadHref.value
  link.download = metadata.value.fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

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
