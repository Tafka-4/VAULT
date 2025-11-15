<template>
  <main class="relative flex min-h-full flex-col">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_50%_at_50%_-10%,_rgba(214,211,209,0.18),_transparent_65%)]"></div>

    <section class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8">
      <div class="space-y-1 text-center sm:text-left">
        <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">새 업로드</p>
        <h1 class="text-2xl font-extrabold">파일 업로드</h1>
        <p class="text-sm text-paper-oklch/70">휴대폰에서 촬영한 사진과 문서 자료를 안전하게 올려보세요.</p>
      </div>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <form class="space-y-6 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface" @submit.prevent>
          <div
            class="rounded-[1.75rem] border-2 border-dashed border-white/15 bg-black/30 p-6 text-center text-sm text-paper-oklch/70 transition"
            :class="{ 'border-white/40 bg-black/20 shadow-lg shadow-white/10': dragActive }"
            @dragenter.prevent="handleDragEnter"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
          >
            <div class="mx-auto flex max-w-xs flex-col items-center gap-4">
              <div class="grid size-14 place-items-center rounded-full bg-white/10 ring-1 ring-surface">
                <svg xmlns="http://www.w3.org/2000/svg" class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div class="space-y-2">
                <p class="text-paper-oklch">파일을 끌어놓거나 업로드 버튼을 눌러주세요</p>
                <p class="text-xs text-paper-oklch/50">선택 즉시 AES-256으로 암호화되어 서버에 저장됩니다.</p>
              </div>
              <label class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white/90 px-6 py-2 text-xs font-semibold text-black transition hover:bg-white">
                파일 선택
                <input type="file" class="hidden" multiple @change="handleFiles" />
              </label>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="uppercase text-lg font-bold text-paper-oklch/55">업로드 진행</span>
              <NuxtLink to="/app/logs" class="text-xs text-paper-oklch/60 hover:text-paper-oklch/80">활동 보기</NuxtLink>
            </div>
            <div v-if="uploads.length" class="space-y-3">
              <div
                v-for="item in uploads"
                :key="item.id"
                class="space-y-2 rounded-2xl bg-black/35 px-4 py-3 text-sm ring-1 ring-surface"
              >
                <div class="flex items-center justify-between gap-4">
                  <div class="min-w-0">
                    <p class="truncate font-medium">{{ item.name }}</p>
                    <p class="text-xs text-paper-oklch/55">{{ formatBytes(item.size) }}</p>
                  </div>
                  <span
                    class="text-xs font-semibold"
                    :class="item.status === 'error' ? 'text-red-200/80' : 'text-paper-oklch/45'"
                  >
                    {{ statusLabel(item) }}
                  </span>
                </div>
                <div class="h-1.5 rounded-full bg-white/10">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="item.status === 'error' ? 'bg-red-300/80' : 'bg-white/70'"
                    :style="{ width: `${item.progress}%` }"
                  ></div>
                </div>
                <p v-if="item.speed" class="text-xs text-paper-oklch/55">
                  전송 속도: {{ item.speed }}
                </p>
                <p v-if="item.message && item.status === 'error'" class="text-xs text-red-200/80">
                  {{ item.message }}
                </p>
              </div>
            </div>
            <div v-else class="rounded-2xl bg-black/30 px-4 py-5 text-sm text-paper-oklch/55 ring-1 ring-surface">
              파일을 추가하면 업로드 상태가 여기에 표시됩니다.
            </div>
          </div>
        </form>

        <aside class="space-y-5">
          <div class="space-y-3 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-bold text-paper-oklch/55">최근 업로드</h2>
              <NuxtLink
                to="/app/search?preset=recent"
                class="text-xs text-paper-oklch/60 hover:text-paper-oklch/80"
              >
                목록 열기
              </NuxtLink>
            </div>
            <div v-if="recentUploads.length" class="space-y-2 text-sm text-paper-oklch/70">
              <div
                v-for="item in recentUploads"
                :key="item.id"
                class="flex items-center justify-between rounded-xl bg-black/30 px-3 py-3 ring-1 ring-surface"
              >
                <div>
                  <p class="font-medium">{{ item.name }}</p>
                  <p class="text-xs text-paper-oklch/55">{{ formatBytes(item.size) }} · {{ new Date(item.updatedAt).toLocaleString('ko-KR') }}</p>
                </div>
                <NuxtLink :to="`/app/file-preview/${item.id}`" class="text-xs text-paper-oklch/60 hover:text-paper-oklch/80">보기</NuxtLink>
              </div>
            </div>
            <p v-else class="text-xs text-paper-oklch/55">아직 업로드 기록이 없습니다.</p>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import { getErrorMessage } from '~/utils/errorMessage'
import type { StoredFile } from '~/types/storage'

// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })

type UploadItem = {
  id: string
  name: string
  size: number
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  message?: string
  file: File
  speed?: string
}

type FilesResponse = { data: StoredFile[] }

const uploads = ref<UploadItem[]>([])
const uploading = ref(false)
const dragActive = ref(false)
let dragDepth = 0

const { data, refresh: refreshFiles } = await useFetch<FilesResponse>('/api/files', {
  key: 'files-upload'
})

const recentUploads = computed(() => data.value?.data.slice(0, 3) ?? [])

const queueFiles = (fileList: FileList | File[]) => {
  const files = Array.from(fileList)
  if (!files.length) return
  const newItems: UploadItem[] = files.map(file => ({
    id: nanoid(8),
    name: file.name,
    size: file.size,
    progress: 0,
    status: 'pending',
    file
  }))

  uploads.value = [...uploads.value, ...newItems]
  void processQueue()
}

const handleFiles = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  queueFiles(input.files)
  input.value = ''
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  dragDepth += 1
  dragActive.value = true
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) {
    dragActive.value = false
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  dragDepth = 0
  dragActive.value = false
  const files = event.dataTransfer?.files
  if (files?.length) {
    queueFiles(files)
  }
}

const processQueue = async () => {
  if (!process.client) return
  if (uploading.value) return
  uploading.value = true
  try {
    for (const item of uploads.value) {
      if (item.status !== 'pending') continue
      item.status = 'uploading'
      try {
        await uploadSingleFile(item)
        item.progress = 100
        item.status = 'done'
        item.message = '완료'
        try {
          await refreshFiles()
        } catch (refreshError) {
          console.warn('Failed to refresh files after upload', refreshError)
        }
      } catch (error) {
        item.status = 'error'
        item.progress = 0
        item.message = getErrorMessage(error) || '업로드 실패'
      }
    }
  } finally {
    uploading.value = false
  }
}

const uploadSingleFile = (item: UploadItem) => {
  if (!process.client) {
    return Promise.reject(new Error('클라이언트에서만 업로드할 수 있습니다.'))
  }
  return new Promise<void>((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', item.file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/files')
    xhr.withCredentials = true
    const startedAt = performance.now()

    xhr.upload.onprogress = event => {
      if (!event.lengthComputable) return
      const percent = Math.min(99, Math.round((event.loaded / event.total) * 100))
      item.progress = percent
      const elapsed = Math.max(performance.now() - startedAt, 1)
      const bytesPerSecond = event.loaded / (elapsed / 1000)
      item.speed = formatRate(bytesPerSecond)
    }

    xhr.onload = () => {
      const elapsed = Math.max(performance.now() - startedAt, 1)
      const bytesPerSecond = item.size / (elapsed / 1000)
      item.speed = formatRate(bytesPerSecond)
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
        return
      }
      reject(new Error(extractUploadError(xhr)))
    }

    xhr.onerror = () => {
      reject(new Error('네트워크 오류로 업로드에 실패했습니다.'))
    }

    xhr.send(formData)
  })
}

const extractUploadError = (xhr: XMLHttpRequest) => {
  try {
    const payload = JSON.parse(xhr.responseText)
    if (payload) {
      const message = normalizeMessage(payload)
      if (message) return message
    }
  } catch {
    // ignore parse errors
  }
  return xhr.status === 429 ? 'KMS 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' : '업로드 실패'
}

const normalizeMessage = (input: unknown): string | null => {
  if (typeof input === 'string') return input
  if (!input || typeof input !== 'object') return null
  if ('message' in input) {
    const value = (input as Record<string, unknown>).message
    if (typeof value === 'string') return value
    if (value && typeof value === 'object') {
      return JSON.stringify(value)
    }
  }
  if ('error' in input) {
    const value = (input as Record<string, unknown>).error
    if (typeof value === 'string') return value
    if (value && typeof value === 'object') {
      return JSON.stringify(value)
    }
  }
  return JSON.stringify(input)
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0B'
  const units = ['B', 'KB', 'MB', 'GB']
  const order = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, order)
  return `${value.toFixed(order === 0 ? 0 : 1)}${units[order]}`
}

const statusLabel = (item: UploadItem) => {
  switch (item.status) {
    case 'pending':
      return '대기 중'
    case 'uploading':
      return '암호화/업로드 중'
    case 'done':
      return '완료'
    case 'error':
    default:
      return '실패'
  }
}

const formatRate = (bytesPerSecond: number) => {
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  let value = bytesPerSecond
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  const digits = unitIndex === 0 ? 0 : 1
  return `${value.toFixed(digits)} ${units[unitIndex]}`
}
</script>
