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
          <div class="space-y-2 text-left">
            <label class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">업로드 위치</label>
            <div class="relative">
              <select
                v-model="selectedFolderOption"
                class="w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-4 py-2 pr-10 text-sm text-paper-oklch focus:border-white/40 focus:outline-none"
              >
                <option value="root">루트 폴더</option>
                <option v-for="folder in folders" :key="folder.id" :value="folder.id">
                  {{ folder.path }}
                </option>
              </select>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-paper-oklch/60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
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
              <div class="flex flex-wrap items-center justify-center gap-3">
                <label class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white/90 px-6 py-2 text-xs font-semibold text-black transition hover:bg-white">
                  파일 선택
                  <input type="file" class="hidden" multiple @change="handleFiles" />
                </label>
                <label class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-2 text-xs font-semibold text-paper-oklch/80 ring-1 ring-surface transition hover:bg-white/15">
                  폴더 선택
                  <input type="file" class="hidden" multiple webkitdirectory directory @change="handleFolderSelection" />
                </label>
              </div>
              <p class="text-[11px] text-paper-oklch/50">폴더 업로드 시 구조가 자동으로 루트에 생성됩니다.</p>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <span class="uppercase text-lg font-bold text-paper-oklch/55">업로드 진행</span>
              <div class="flex items-center gap-2 text-xs">
                <NuxtLink to="/app/logs" class="text-paper-oklch/60 hover:text-paper-oklch/80">활동 보기</NuxtLink>
                <button
                  v-if="uploads.length > 4"
                  type="button"
                  class="tap-area rounded-full px-3 py-1 text-paper-oklch/70 ring-1 ring-surface hover:bg-white/10"
                  @click="openDetailsModal"
                >
                  상세 보기
                </button>
              </div>
            </div>
            <template v-if="uploads.length">
              <div class="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                <div v-if="folderUploadGroups.length" class="space-y-3">
                  <div
                    v-for="group in folderUploadGroups"
                    :key="group.id"
                    class="space-y-2 rounded-2xl bg-black/35 px-4 py-4 text-sm ring-1 ring-surface"
                  >
                    <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div class="min-w-0">
                        <p class="truncate font-semibold max-w-[70vw] sm:max-w-none" :title="group.name">{{ formatDisplayName(group.name) }}</p>
                        <p class="text-xs text-paper-oklch/55">{{ group.count }}개 파일 · {{ formatBytes(group.totalSize) }}</p>
                      </div>
                      <span
                        class="text-xs font-semibold self-end whitespace-nowrap sm:self-auto"
                        :class="group.status === 'error' ? 'text-red-200/80' : 'text-paper-oklch/45'"
                      >
                        {{ statusLabel(group.status) }}
                      </span>
                    </div>
                    <div class="h-1.5 rounded-full bg-white/10">
                      <div
                        class="h-full rounded-full transition-all"
                        :class="group.status === 'error' ? 'bg-red-300/80' : 'bg-white/70'"
                        :style="{ width: `${group.progress}%` }"
                      ></div>
                    </div>
                    <p class="text-xs text-paper-oklch/55">
                      {{ group.progress }}% 완료 ({{ formatBytes(group.completedBytes) }} / {{ formatBytes(group.totalSize) }})
                    </p>
                  </div>
                </div>
                <div v-if="standaloneUploads.length" class="space-y-3">
                  <div
                    v-for="item in standaloneUploads"
                    :key="item.id"
                    class="space-y-2 rounded-2xl bg-black/35 px-4 py-3 text-sm ring-1 ring-surface"
                  >
                    <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div class="min-w-0 flex-1">
                        <p class="truncate font-medium max-w-[70vw] sm:max-w-none" :title="item.name">{{ formatDisplayName(item.name) }}</p>
                        <p class="truncate text-xs text-paper-oklch/55">{{ formatBytes(item.size) }}</p>
                      </div>
                      <span
                        class="text-xs font-semibold self-end whitespace-nowrap sm:self-auto"
                        :class="item.status === 'error' ? 'text-red-200/80' : 'text-paper-oklch/45'"
                      >
                        {{ statusLabel(item.status) }}
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
                    <div
                      v-if="item.status === 'pending' || item.status === 'uploading'"
                      class="flex justify-end"
                    >
                      <button
                        type="button"
                        class="tap-area rounded-full px-3 py-1 text-xs text-paper-oklch/70 hover:bg-white/10"
                        @click="cancelUpload(item.id)"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <div
              v-else
              class="rounded-2xl bg-black/30 px-4 py-5 text-sm text-paper-oklch/55 ring-1 ring-surface"
            >
              파일을 추가하면 업로드 상태가 여기에 표시됩니다.
            </div>
          </div>
        </form>

        <aside class="space-y-5">
          <div class="space-y-3 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-bold text-paper-oklch/55">최근 업로드</h2>
              <NuxtLink to="/app" class="text-xs text-paper-oklch/60 hover:text-paper-oklch/80">
                라이브러리로 이동
              </NuxtLink>
            </div>
            <div v-if="recentUploads.length" class="space-y-2 text-sm text-paper-oklch/70">
              <div
                v-for="item in recentUploads"
                :key="item.id"
                class="flex flex-col items-start gap-2 rounded-xl bg-black/30 px-3 py-3 ring-1 ring-surface sm:flex-row sm:items-center sm:justify-between"
              >
                <div class="min-w-0">
                  <p class="truncate font-medium max-w-[70vw] sm:max-w-none" :title="item.name">{{ formatDisplayName(item.name) }}</p>
                  <p class="truncate text-xs text-paper-oklch/55" :title="new Date(item.updatedAt).toLocaleString('ko-KR')">
                    {{ formatBytes(item.size) }} · {{ new Date(item.updatedAt).toLocaleString('ko-KR') }}
                  </p>
                </div>
                <NuxtLink :to="`/app/file-preview/${item.id}`" class="whitespace-nowrap text-xs text-paper-oklch/60 hover:text-paper-oklch/80">보기</NuxtLink>
              </div>
            </div>
            <p v-else class="text-xs text-paper-oklch/55">아직 업로드 기록이 없습니다.</p>
          </div>
        </aside>
      </div>
    </section>
  </main>

  <transition name="fade">
    <div v-if="showDetailsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur">
      <div class="w-full max-w-lg rounded-3xl bg-[#0f0f11] p-6 text-paper-oklch ring-1 ring-white/10">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">업로드 상세</p>
            <h3 class="text-lg font-semibold">전체 파일 진행 상황</h3>
          </div>
          <button type="button" class="tap-area rounded-full p-2 hover:bg-white/10" @click="closeDetailsModal">
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div class="mt-5 max-h-[60vh] space-y-2 overflow-y-auto text-sm">
          <p v-if="!uploads.length" class="rounded-2xl bg-black/40 px-4 py-3 text-center text-paper-oklch/55 ring-1 ring-surface">
            진행 중인 업로드가 없습니다.
          </p>
          <div
            v-else
            v-for="item in uploads"
            :key="`details-${item.id}`"
            class="space-y-1 rounded-2xl bg-black/40 px-4 py-3 text-xs ring-1 ring-surface"
          >
            <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div class="min-w-0 max-w-full">
                <p class="truncate font-medium max-w-[70vw] sm:max-w-[32rem]" :title="item.name">{{ formatDisplayName(item.name, 48) }}</p>
                <p v-if="item.relativeDirectory" class="text-[11px] text-paper-oklch/50 truncate" :title="item.relativeDirectory">
                  {{ item.relativeDirectory }}/
                </p>
              </div>
              <span
                class="whitespace-nowrap font-semibold self-end sm:self-auto"
                :class="item.status === 'error' ? 'text-red-200/80' : 'text-paper-oklch/55'"
              >
                {{ statusLabel(item.status) }}
              </span>
            </div>
            <div class="flex items-center justify-between text-paper-oklch/60">
              <span>{{ formatBytes(Math.min(item.loadedBytes, item.size)) }}</span>
              <span>{{ formatBytes(item.size) }}</span>
            </div>
            <div class="h-1 rounded-full bg-white/10">
              <div
                class="h-full rounded-full transition-all"
                :class="item.status === 'error' ? 'bg-red-300/80' : 'bg-white/70'"
                :style="{ width: `${item.progress}%` }"
              ></div>
            </div>
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <button
            type="button"
            class="tap-area rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-black hover:bg-white"
            @click="closeDetailsModal"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { nanoid } from 'nanoid'
import { getErrorMessage } from '~/utils/errorMessage'
import type { StoredFile, StoredFolder } from '~/types/storage'

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
  folderId?: string | null
  uploadType?: 'single' | 'chunked'
  sessionId?: string
  shouldCancel?: boolean
  relativeDirectory?: string | null
  folderRoot?: string | null
  loadedBytes: number
  finishedAt?: number
}

type FilesResponse = { data: StoredFile[] }
type FoldersResponse = { data: StoredFolder[] }
type QueuedFileEntry = { file: File; relativeDirectory?: string | null }
type UploadStatus = UploadItem['status']
type UploadGroupSummary = {
  id: string
  name: string
  count: number
  totalSize: number
  completedBytes: number
  progress: number
  status: UploadStatus
  items: UploadItem[]
}

const requestFetch = useRequestFetch()
const CHUNK_SIZE_BYTES = 10 * 1024 * 1024
const CHUNK_UPLOAD_THRESHOLD_BYTES = CHUNK_SIZE_BYTES
const CHUNK_UPLOAD_CONCURRENCY = 24
const COMPLETED_RETENTION_MS = 4000
const CLEANUP_INTERVAL_MS = 1200

const uploads = ref<UploadItem[]>([])
const uploading = ref(false)
const dragActive = ref(false)
let dragDepth = 0
const targetFolderId = ref<string | null>(null)
const showDetailsModal = ref(false)
let cleanupTimer: number | null = null

const { data, refresh: refreshFiles } = await useFetch<FilesResponse>('/api/files', {
  key: 'files-upload'
})

const { data: foldersData, refresh: refreshFolders } = await useFetch<FoldersResponse>('/api/folders', {
  key: 'folders-upload'
})

const recentUploads = computed(() => data.value?.data.slice(0, 3) ?? [])
const folders = computed(() => foldersData.value?.data ?? [])

const folderPathCache = new Map<string, string | null>()
const pendingFolderCreates = new Map<string, Promise<string | null>>()

const rebuildFolderCache = () => {
  folderPathCache.clear()
  folderPathCache.set('/', null)
  folders.value.forEach(folder => {
    folderPathCache.set(folder.path || '/', folder.id)
  })
}

watch(
  () => folders.value,
  () => {
    rebuildFolderCache()
  },
  { immediate: true }
)

const folderUploadGroups = computed<UploadGroupSummary[]>(() => {
  const map = new Map<string, UploadItem[]>()
  uploads.value.forEach(item => {
    if (!item.folderRoot) return
    if (!map.has(item.folderRoot)) {
      map.set(item.folderRoot, [])
    }
    map.get(item.folderRoot)!.push(item)
  })
  return Array.from(map.entries()).map(([name, items]) => {
    const totalSize = items.reduce((sum, entry) => sum + entry.size, 0)
    const completedBytes = items.reduce((sum, entry) => sum + Math.min(entry.loadedBytes, entry.size), 0)
    let status: UploadStatus = 'pending'
    if (items.some(entry => entry.status === 'error')) {
      status = 'error'
    } else if (items.some(entry => entry.status === 'uploading')) {
      status = 'uploading'
    } else if (items.every(entry => entry.status === 'done')) {
      status = 'done'
    }
    const progress = totalSize ? Math.min(100, Math.round((completedBytes / totalSize) * 100)) : 0
    return {
      id: name,
      name,
      items,
      count: items.length,
      totalSize,
      completedBytes,
      progress,
      status
    }
  })
})

const standaloneUploads = computed(() => uploads.value.filter(item => !item.folderRoot))

watch(
  () => uploads.value.filter(item => item.status === 'pending' || item.status === 'uploading').length,
  activeCount => {
    if (!activeCount) {
      showDetailsModal.value = false
    }
  }
)

const cleanupCompletedUploads = () => {
  if (!process.client) return
  const cutoff = Date.now() - COMPLETED_RETENTION_MS
  uploads.value = uploads.value.filter(item => {
    if (item.status === 'pending' || item.status === 'uploading') return true
    if (!item.finishedAt) return true
    return item.finishedAt > cutoff
  })
  const hasFinished = uploads.value.some(item => item.status !== 'pending' && item.status !== 'uploading')
  if (hasFinished && cleanupTimer === null) {
    cleanupTimer = window.setTimeout(() => {
      cleanupTimer = null
      cleanupCompletedUploads()
    }, CLEANUP_INTERVAL_MS)
  }
}

const setFinishedState = (item: UploadItem, status: Extract<UploadStatus, 'done' | 'error'>, message?: string) => {
  item.status = status
  item.message = message
  item.finishedAt = Date.now()
  cleanupCompletedUploads()
}

const ensureFolderPath = async (relativePath: string): Promise<string | null> => {
  const normalized = normalizeRelativeDirectory(relativePath)
  if (!normalized) return null
  const segments = normalized.split('/').filter(Boolean)
  if (!segments.length) return null
  let parentId: string | null = null
  const builtSegments: string[] = []
  for (const segment of segments) {
    builtSegments.push(segment)
    const canonicalPath = `/${builtSegments.join('/')}`
    let cachedId = folderPathCache.get(canonicalPath) ?? null
    if (cachedId) {
      parentId = cachedId
      continue
    }
    try {
      cachedId = await createFolderForPath(segment, parentId, canonicalPath)
      parentId = cachedId
    } catch (error) {
      throw error
    }
  }
  return parentId
}

const createFolderForPath = (name: string, parentId: string | null, canonicalPath: string) => {
  const pending = pendingFolderCreates.get(canonicalPath)
  if (pending) {
    return pending
  }
  const promise = (async () => {
    const response = await requestFetch<{ data: StoredFolder }>('/api/folders', {
      method: 'POST',
      body: { name, parentId: parentId ?? null }
    })
    const folder = response?.data
    if (!folder) {
      throw new Error('폴더를 생성할 수 없습니다.')
    }
    folderPathCache.set(folder.path || canonicalPath, folder.id)
    if (!foldersData.value) {
      foldersData.value = { data: [folder] }
    } else if (Array.isArray(foldersData.value.data)) {
      foldersData.value.data = [...foldersData.value.data, folder]
    } else {
      foldersData.value.data = [folder]
    }
    return folder.id
  })()
    .catch(error => {
      throw error
    })
    .finally(() => {
      pendingFolderCreates.delete(canonicalPath)
    })

  pendingFolderCreates.set(canonicalPath, promise)
  return promise
}
const selectedFolderOption = computed({
  get: () => (targetFolderId.value === null ? 'root' : targetFolderId.value || 'root'),
  set: (value: string) => {
    targetFolderId.value = value === 'root' ? null : value
  }
})
const activeRequests = new Map<string, Set<XMLHttpRequest>>()

const registerRequest = (uploadId: string, xhr: XMLHttpRequest) => {
  if (!activeRequests.has(uploadId)) {
    activeRequests.set(uploadId, new Set())
  }
  activeRequests.get(uploadId)!.add(xhr)
}

const unregisterRequest = (uploadId: string, xhr: XMLHttpRequest) => {
  const set = activeRequests.get(uploadId)
  if (!set) return
  set.delete(xhr)
  if (!set.size) {
    activeRequests.delete(uploadId)
  }
}

const abortActiveRequests = (uploadId: string) => {
  const set = activeRequests.get(uploadId)
  if (!set) return
  for (const xhr of set) {
    xhr.abort()
  }
  activeRequests.delete(uploadId)
}

const normalizeRelativeDirectory = (value?: string | null) => {
  if (!value) return null
  const cleaned = value.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '')
  return cleaned || null
}

const relativeDirectoryFromFile = (file: File) => {
  const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath
  if (!relativePath) return null
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
  const parts = normalized.split('/')
  if (parts.length <= 1) return null
  parts.pop()
  return normalizeRelativeDirectory(parts.join('/'))
}

const relativeDirFromFullPath = (fullPath?: string | null, isDirectory = false) => {
  if (!fullPath) return null
  const normalized = fullPath.replace(/\\/g, '/').replace(/^\/+/, '')
  if (!normalized) return null
  const parts = normalized.split('/').filter(Boolean)
  if (!parts.length) return null
  if (!isDirectory) {
    parts.pop()
  }
  if (!parts.length) return null
  return normalizeRelativeDirectory(parts.join('/'))
}

const queueEntries = (entries: QueuedFileEntry[]) => {
  if (!entries.length) return
  const newItems: UploadItem[] = entries.map(({ file, relativeDirectory }) => {
    const normalizedDirectory =
      relativeDirectory !== undefined ? normalizeRelativeDirectory(relativeDirectory) : relativeDirectoryFromFile(file)
    const folderRoot = normalizedDirectory ? normalizedDirectory.split('/')[0] ?? null : null
    return {
      id: nanoid(8),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending' as const,
      file,
      folderId: normalizedDirectory ? null : targetFolderId.value,
      relativeDirectory: normalizedDirectory,
      folderRoot,
      loadedBytes: 0,
      uploadType: file.size >= CHUNK_UPLOAD_THRESHOLD_BYTES ? 'chunked' : 'single',
      shouldCancel: false
    }
  })

  uploads.value = [...uploads.value, ...newItems]
  void processQueue()
}

const queueFilesFromList = (fileList: FileList | File[]) => {
  const files = Array.from(fileList)
  if (!files.length) return
  queueEntries(files.map(file => ({ file })))
}

const traverseFileSystemEntry = (entry: FileSystemEntry): Promise<QueuedFileEntry[]> => {
  return new Promise((resolve, reject) => {
    if (entry.isFile) {
      ;(entry as FileSystemFileEntry).file(
        file => {
          resolve([{ file, relativeDirectory: relativeDirFromFullPath(entry.fullPath, false) }])
        },
        error => reject(error)
      )
      return
    }

    if (entry.isDirectory) {
      const directory = entry as FileSystemDirectoryEntry
      const reader = directory.createReader()
      const results: QueuedFileEntry[] = []
      const readBatch = () => {
        reader.readEntries(
          batch => {
            if (!batch.length) {
              resolve(results)
              return
            }
            Promise.all(batch.map(child => traverseFileSystemEntry(child)))
              .then(children => {
                children.forEach(childEntries => results.push(...childEntries))
                readBatch()
              })
              .catch(reject)
          },
          error => reject(error)
        )
      }
      readBatch()
      return
    }

    resolve([])
  })
}

const extractEntriesFromDataTransfer = async (dataTransfer: DataTransfer): Promise<QueuedFileEntry[] | null> => {
  const items = dataTransfer.items
  if (!items || !items.length) return null
  const entryPromises: Promise<QueuedFileEntry[]>[] = []
  Array.from(items).forEach(item => {
    if (item.kind !== 'file') return
    const entry = (item as DataTransferItem & { webkitGetAsEntry?: () => FileSystemEntry | null }).webkitGetAsEntry?.()
    if (entry) {
      entryPromises.push(traverseFileSystemEntry(entry))
    }
  })
  if (!entryPromises.length) return null
  const results = await Promise.all(entryPromises)
  return results.flat()
}

const openDetailsModal = () => {
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
}

const handleFiles = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  queueFilesFromList(input.files)
  input.value = ''
}

const handleFolderSelection = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  queueFilesFromList(input.files)
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

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  dragDepth = 0
  dragActive.value = false
  const dataTransfer = event.dataTransfer ?? null
  if (!dataTransfer) return
  try {
    const entries = await extractEntriesFromDataTransfer(dataTransfer)
    if (entries?.length) {
      queueEntries(entries)
      return
    }
  } catch (error) {
    console.warn('Failed to read dropped directories', error)
  }
  const files = dataTransfer.files
  if (files?.length) {
    queueFilesFromList(files)
  }
}

const cancelUpload = async (itemId: string) => {
  const item = uploads.value.find(upload => upload.id === itemId)
  if (!item) return
  item.shouldCancel = true
  if (item.status === 'uploading') {
    abortActiveRequests(item.id)
    item.progress = 0
    item.loadedBytes = 0
    setFinishedState(item, 'error', '취소됨')
    if (item.uploadType === 'chunked' && item.sessionId) {
      requestFetch(`/api/uploads/${item.sessionId}`, { method: 'DELETE' }).catch(() => {})
    }
  } else if (item.status === 'pending') {
    uploads.value = uploads.value.filter(upload => upload.id !== itemId)
  }
}

const processQueue = async () => {
  if (!process.client) return
  if (uploading.value) return
  uploading.value = true
  try {
    for (const item of uploads.value) {
      if (item.status !== 'pending') continue
      if (item.relativeDirectory && !item.folderId) {
        try {
          item.folderId = await ensureFolderPath(item.relativeDirectory)
        } catch (error) {
          item.status = 'error'
          item.progress = 0
          item.loadedBytes = 0
          item.message = getErrorMessage(error) || '폴더를 생성할 수 없습니다.'
          continue
        }
      }
      item.status = 'uploading'
      item.loadedBytes = 0
      try {
        if (item.uploadType === 'chunked') {
          await uploadLargeFile(item)
        } else {
          await uploadSingleFile(item)
        }
        item.progress = 100
        item.loadedBytes = item.size
        setFinishedState(item, 'done', '완료')
        try {
          await refreshFiles()
        } catch (refreshError) {
          console.warn('Failed to refresh files after upload', refreshError)
        }
      } catch (error) {
        item.progress = 0
        item.loadedBytes = 0
        const message = getErrorMessage(error)
        setFinishedState(item, 'error', item.shouldCancel ? '취소됨' : (message || '업로드 실패'))
      }
    }
  } finally {
    uploading.value = false
  }
}

const MIN_SPEED_SAMPLE_WINDOW_MS = 200

const uploadSingleFile = (item: UploadItem) => {
  if (!process.client) {
    return Promise.reject(new Error('클라이언트에서만 업로드할 수 있습니다.'))
  }
  return new Promise<void>((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', item.file)
    if (item.folderId !== undefined) {
      formData.append('folderId', item.folderId === null ? 'root' : item.folderId)
    }

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/files')
    xhr.withCredentials = true
    const startedAt = performance.now()
    let lastLoadedBytes = 0
    let lastSampleAt = startedAt
    registerRequest(item.id, xhr)

    xhr.upload.onprogress = event => {
      if (!event.lengthComputable) return
      const percent = Math.min(99, Math.round((event.loaded / event.total) * 100))
      item.progress = percent
      item.loadedBytes = Math.min(event.loaded, item.size)
      const now = performance.now()
      const elapsed = Math.max(now - startedAt, 1)
      const deltaBytes = Math.max(event.loaded - lastLoadedBytes, 0)
      const deltaMs = Math.max(now - lastSampleAt, 1)
      const instantaneous =
        deltaMs >= MIN_SPEED_SAMPLE_WINDOW_MS && deltaBytes > 0 ? deltaBytes / (deltaMs / 1000) : 0
      const average = event.loaded / (elapsed / 1000)
      const bytesPerSecond = instantaneous || average
      item.speed = formatRate(bytesPerSecond)
      lastLoadedBytes = event.loaded
      lastSampleAt = now
    }

    xhr.onload = () => {
      const elapsed = Math.max(performance.now() - startedAt, 1)
      const bytesPerSecond = item.size / (elapsed / 1000)
      item.speed = formatRate(bytesPerSecond)
      if (xhr.status >= 200 && xhr.status < 300) {
        unregisterRequest(item.id, xhr)
        item.loadedBytes = item.size
        resolve()
        return
      }
      unregisterRequest(item.id, xhr)
      reject(new Error(extractUploadError(xhr)))
    }

    xhr.onerror = () => {
      unregisterRequest(item.id, xhr)
      reject(new Error('네트워크 오류로 업로드에 실패했습니다.'))
    }

    xhr.onabort = () => {
      unregisterRequest(item.id, xhr)
      reject(new Error('사용자가 업로드를 취소했습니다.'))
    }

    xhr.send(formData)
  })
}

const uploadLargeFile = async (item: UploadItem) => {
  const totalChunks = Math.ceil(item.size / CHUNK_SIZE_BYTES)
  const init = await requestFetch<{ data?: { uploadId: string } }>('/api/uploads/init', {
    method: 'POST',
    body: {
      name: item.name,
      mimeType: item.file.type || 'application/octet-stream',
      size: item.size,
      totalChunks,
      folderId: item.folderId ?? null
    }
  })
  const uploadId = init?.data?.uploadId
  if (!uploadId) {
    throw new Error('업로드 세션을 생성할 수 없습니다.')
  }
  item.sessionId = uploadId
  const startedAt = performance.now()
  const chunkProgress = new Array(totalChunks).fill(0)
  let lastLoadedBytes = 0
  let lastSampleAt = startedAt
  const updateOverallProgress = () => {
    const totalLoaded = chunkProgress.reduce((sum, value) => sum + value, 0)
    const denominator = Math.max(item.size, 1)
    const percent = Math.min(99, Math.round((totalLoaded / denominator) * 100))
    item.progress = percent
    item.loadedBytes = Math.min(totalLoaded, item.size)
    const now = performance.now()
    const deltaBytes = Math.max(totalLoaded - lastLoadedBytes, 0)
    const deltaMs = Math.max(now - lastSampleAt, 1)
    const instantaneousRate =
      deltaMs >= MIN_SPEED_SAMPLE_WINDOW_MS && deltaBytes > 0 ? deltaBytes / (deltaMs / 1000) : 0
    const averageRate = totalLoaded / (Math.max(now - startedAt, 1) / 1000)
    const bytesPerSecond = instantaneousRate > 0 ? instantaneousRate : averageRate
    item.speed = formatRate(bytesPerSecond)
    lastLoadedBytes = totalLoaded
    lastSampleAt = now
  }

  const workerCount = Math.min(CHUNK_UPLOAD_CONCURRENCY, Math.max(totalChunks, 1))
  let nextIndex = 0

  const worker = async () => {
    while (true) {
      if (item.shouldCancel) {
        throw new Error('사용자가 업로드를 취소했습니다.')
      }
      const current = nextIndex++
      if (current >= totalChunks) break
      const start = current * CHUNK_SIZE_BYTES
      const end = Math.min(item.size, start + CHUNK_SIZE_BYTES)
      const expectedSize = end - start
      const blob = item.file.slice(start, end)
      await sendChunk(uploadId, current, blob, expectedSize, item, chunkProgress, updateOverallProgress)
    }
  }

  await Promise.all(Array.from({ length: workerCount }, worker))

  if (item.shouldCancel) {
    throw new Error('사용자가 업로드를 취소했습니다.')
  }

  if (chunkProgress.length) {
    updateOverallProgress()
  }
  await requestFetch(`/api/uploads/${uploadId}/complete`, { method: 'POST' })
  item.loadedBytes = item.size
  item.sessionId = undefined
}

const sendChunk = (
  uploadId: string,
  index: number,
  blob: Blob,
  expectedSize: number,
  item: UploadItem,
  chunkProgress: number[],
  onProgress: () => void
) => {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/uploads/${uploadId}/chunk?index=${index}`)
    xhr.withCredentials = true
    registerRequest(item.id, xhr)

    xhr.upload.onprogress = event => {
      if (!event.lengthComputable) return
      chunkProgress[index] = Math.min(event.loaded, expectedSize)
      onProgress()
    }

    xhr.onload = () => {
      unregisterRequest(item.id, xhr)
      if (xhr.status >= 200 && xhr.status < 300) {
        chunkProgress[index] = expectedSize
        onProgress()
        resolve()
        return
      }
      reject(new Error(extractUploadError(xhr)))
    }

    xhr.onerror = () => {
      unregisterRequest(item.id, xhr)
      reject(new Error('네트워크 오류로 업로드에 실패했습니다.'))
    }

    xhr.onabort = () => {
      unregisterRequest(item.id, xhr)
      reject(new Error('사용자가 업로드를 취소했습니다.'))
    }

    xhr.send(blob)
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
  const candidate = extractStringField(input, ['message', 'statusMessage'])
  if (candidate) return candidate

  if ('data' in input && input.data && typeof input.data === 'object') {
    const nested = extractStringField(input.data as Record<string, unknown>, ['message', 'error'])
    if (nested) return nested
  }

  if ('error' in input) {
    const value = (input as Record<string, unknown>).error
    if (typeof value === 'string') return value
  }

  return JSON.stringify(input)
}

const extractStringField = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    if (!(key in source)) continue
    const value = source[key]
    if (typeof value === 'string') {
      return value
    }
    if (value && typeof value === 'object') {
      return JSON.stringify(value)
    }
  }
  return null
}

const formatDisplayName = (value: string, max = 24) => {
  if (!value) return ''
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0B'
  const units = ['B', 'KB', 'MB', 'GB']
  const order = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, order)
  return `${value.toFixed(order === 0 ? 0 : 1)}${units[order]}`
}

const statusLabel = (status: UploadStatus) => {
  switch (status) {
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
