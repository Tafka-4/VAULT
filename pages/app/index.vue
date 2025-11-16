<template>
  <main class="relative flex min-h-full flex-col">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_50%_at_50%_-10%,_rgba(214,211,209,0.18),_transparent_65%)]"></div>

    <section class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8">
      <div class="rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-2xl font-extrabold">내 스토리지</h1>
            <p class="mt-1 text-sm text-paper-oklch/70">파일 {{ files.length }}개 · 저장소</p>
          </div>
          <p class="text-xs text-paper-oklch/60">총 용량 {{ formatBytes(storageTotalBytes) }}</p>
        </div>
        <div class="mt-6 rounded-[1.75rem] bg-black/35 px-5 py-6 ring-1 ring-surface">
          <div class="flex flex-col gap-4">
            <div>
              <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">용량 상태</p>
              <p class="mt-1 text-sm text-paper-oklch/70">/mnt/data 기준 남은 공간 · 전체 사용량 · 내 사용량</p>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
              <div class="relative h-full w-full">
                <span
                  class="absolute inset-y-0 left-0 h-full bg-amber-300/80 transition-all"
                  :style="{ width: usedCapacityPercent + '%' }"
                  aria-label="사용 중"
                ></span>
                <span
                  class="absolute inset-y-0 left-0 h-full bg-sky-400/90 transition-all"
                  :style="{ width: personalUsagePercent + '%' }"
                  aria-label="내 사용량"
                ></span>
                <span
                  class="absolute inset-y-0 right-0 h-full bg-emerald-400/70 transition-all"
                  :style="{ width: remainingPercent + '%' }"
                  aria-label="남은 공간"
                ></span>
              </div>
            </div>
            <div class="grid gap-4 text-sm text-paper-oklch/80 sm:grid-cols-3">
              <div class="flex items-center gap-2">
                <span class="size-3 rounded-full bg-emerald-400/80"></span>
                <div>
                  <p class="text-xs uppercase tracking-[0.3em] text-paper-oklch/50">남은 공간</p>
                  <p class="font-semibold text-paper-oklch">{{ formatBytes(remainingBytes) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="size-3 rounded-full bg-amber-400/90"></span>
                <div>
                  <p class="text-xs uppercase tracking-[0.3em] text-paper-oklch/50">사용 중</p>
                  <p class="font-semibold text-paper-oklch">{{ formatBytes(usedCapacityBytes) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="size-3 rounded-full bg-sky-400/90"></span>
                <div>
                  <p class="text-xs uppercase tracking-[0.3em] text-paper-oklch/50">내 사용량</p>
                  <p class="font-semibold text-paper-oklch">{{ formatBytes(personalUsageBytes) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="recent" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">최근 파일</h2>
          <p class="text-xs text-paper-oklch/55">
            {{ pending ? '업데이트 중...' : `${recentFiles.length}개 표시` }}
          </p>
        </div>
        <div class="rounded-[1.75rem] bg-white/5 p-3 ring-1 ring-surface">
          <div class="rounded-[1.25rem] bg-black/30 p-2">
            <FileRow
              v-if="recentFiles.length"
              v-for="file in recentFiles"
              :key="file.id"
              :icon="iconForFile(file)"
              :name="file.name"
              :detail="detailForFile(file)"
              :to="`/app/file-preview/${file.id}`"
            />
            <p v-else class="p-4 text-center text-sm text-paper-oklch/55">업로드된 파일이 없습니다.</p>
          </div>
        </div>
      </section>

      <section id="pinned" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">즐겨찾기 폴더</h2>
          <button class="tap-area inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs uppercase font-semibold text-paper-oklch/70 ring-1 ring-surface">
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 6h12M3 12h8M3 18h4M17 6v12m0 0 3-3m-3 3-3-3" />
            </svg>
            {{ pinnedFiles.length ? '용량순' : '정렬' }}
          </button>
        </div>
        <div class="grid gap-3" :class="pinnedGridColsClass">
          <div
            v-for="file in pinnedFiles"
            :key="file.id"
            class="rounded-2xl bg-white/5 px-5 py-5 ring-1 ring-surface transition hover:bg-white/10"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="grid size-10 place-items-center rounded-xl bg-white/10 ring-1 ring-surface">
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <p class="font-medium truncate">{{ file.name }}</p>
                  <p class="text-xs text-paper-oklch/55">{{ formatBytes(file.size) }} · {{ formatRelative(file.updatedAt) }}</p>
                </div>
              </div>
              <span class="rounded-full bg-white/10 px-3 py-1 text-xs text-paper-oklch/60">암호화</span>
            </div>
            <div class="mt-4 flex items-center justify-between text-xs text-paper-oklch/50">
              <span>{{ formatRelative(file.updatedAt) }}</span>
              <NuxtLink
                :to="`/app/file-preview/${file.id}`"
                class="tap-area rounded-lg px-3 py-1 ring-1 ring-surface hover:bg-white/10"
              >
                열기
              </NuxtLink>
            </div>
          </div>
          <div v-if="!pinnedFiles.length" class="rounded-2xl bg-white/5 px-5 py-10 text-center text-sm text-paper-oklch/60 ring-1 ring-surface">
            용량이 큰 파일이 업로드되면 자동으로 표시됩니다.
          </div>
        </div>
      </section>

      <section id="library" class="space-y-6">
        <div class="rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">폴더</h2>
              <p class="text-xs text-paper-oklch/55">루트 기준으로 표시됩니다.</p>
            </div>
            <button
              type="button"
              class="tap-area inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-black hover:bg-white disabled:opacity-50"
              :disabled="creatingFolder"
              @click="openCreateFolderModal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
              </svg>
              새 폴더
            </button>
          </div>
          <div
            v-if="rootFolders.length"
            class="mt-4 grid gap-3 md:grid-cols-2"
          >
            <div
              v-for="folder in rootFolders"
              :key="folder.id"
              class="rounded-2xl bg-black/30 px-4 py-4 ring-1 ring-surface transition hover:bg-black/20"
              @dragover.prevent
              @drop.prevent="handleFileDrop(folder.id)"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-semibold text-paper-oklch">{{ folder.name }}</p>
                  <p class="text-xs text-paper-oklch/60">{{ folder.path }}</p>
                </div>
                <button
                  type="button"
                  class="tap-area rounded-full p-2 text-xs text-red-200/80 hover:bg-white/10 disabled:opacity-50"
                  :disabled="deleteFolderState[folder.id]"
                  @click="deleteFolder(folder.id)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 7h12M9 7l.867-2.6A1 1 0 0 1 10.816 4h2.368a1 1 0 0 1 .949.658L15 7m0 0v11a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <p v-else class="mt-4 text-sm text-paper-oklch/60">루트 폴더가 없습니다.</p>
        </div>

        <div class="space-y-4 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
          <div class="rounded-[1.25rem] bg-black/20 p-3 ring-1 ring-surface">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div class="flex grow items-center gap-2 rounded-xl bg-black/40 px-4 py-2 text-sm text-paper-oklch ring-1 ring-surface">
                <svg xmlns="http://www.w3.org/2000/svg" class="size-5 text-paper-oklch/50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
                </svg>
                <input
                  v-model="search"
                  type="search"
                  placeholder="파일 검색..."
                  class="w-full bg-transparent text-sm text-paper-oklch placeholder:text-paper-oklch/45 focus:outline-none"
                />
              </div>
              <button
                type="button"
                class="tap-area rounded-xl bg-white/10 px-4 py-2 text-xs text-paper-oklch/80 ring-1 ring-surface hover:bg-white/15"
                @click="refresh"
              >
                새로고침
              </button>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">파일</h2>
              <p class="text-xs text-paper-oklch/55">{{ filteredFiles.length }}개 표시</p>
            </div>
          </div>
          <div class="rounded-[1.25rem] bg-black/30 p-2" @dragover.prevent @drop.prevent="handleFileDrop(null)">
            <template v-if="filteredFiles.length">
              <FileRow
                v-for="file in filteredFiles"
                :key="file.id"
                :icon="iconForFile(file)"
                :name="file.name"
                :detail="detailForFile(file)"
                :to="`/app/file-preview/${file.id}`"
                show-delete
                :deleting="Boolean(deleteState[file.id])"
                draggable
                @dragstart="handleFileDragStart(file.id)"
                @dragend="handleFileDragEnd"
                @delete="deleteFile(file.id)"
              />
            </template>
            <p v-else class="p-4 text-center text-sm text-paper-oklch/55">표시할 파일이 없습니다.</p>
          </div>
        </div>
      </section>
    </section>
  </main>

  <transition name="fade">
    <div
      v-if="showCreateFolderModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur"
    >
      <div class="w-full max-w-md rounded-3xl bg-[#0f0f11] p-6 text-paper-oklch ring-1 ring-white/10">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">새 폴더</p>
            <h3 class="text-lg font-semibold">폴더 만들기</h3>
          </div>
          <button type="button" class="tap-area rounded-full p-2 hover:bg-white/10" @click="closeCreateFolderModal">
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <form class="mt-6 space-y-4" @submit.prevent="submitCreateFolder">
          <div class="space-y-2">
            <label class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">폴더 이름</label>
            <input
              v-model="newFolderName"
              type="text"
              class="w-full rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-sm text-paper-oklch focus:outline-none focus:ring-2 focus:ring-white/40"
              placeholder="예: 프로젝트 자료"
              required
            />
          </div>
          <div class="space-y-2">
            <label class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">상위 폴더</label>
            <p class="rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-paper-oklch/70">
              {{ selectedFolder?.path || '루트' }}
            </p>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="tap-area rounded-full px-4 py-2 text-sm text-paper-oklch/70 hover:bg-white/10"
              :disabled="creatingFolder"
              @click="closeCreateFolderModal"
            >
              취소
            </button>
            <button
              type="submit"
              class="tap-area rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50"
              :disabled="creatingFolder"
            >
              {{ creatingFolder ? '생성 중...' : '생성' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { StoredFile, StoredFolder } from '~/types/storage'
import { getErrorMessage } from '~/utils/errorMessage'

// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })

type FilesResponse = { data: StoredFile[] }
type FoldersResponse = { data: StoredFolder[] }
type StorageStatsResponse = { data: { totalBytes: number; usedBytes: number; freeBytes: number; userBytes: number } }

const search = ref('')
const quotaBytes = 512 * 1024 * 1024 * 1024 // 512GB
const requestFetch = useRequestFetch()

const { data, pending, refresh } = await useFetch<FilesResponse>('/api/files', {
  key: 'files-dashboard'
})

const { data: foldersData, refresh: refreshFolders } = await useFetch<FoldersResponse>('/api/folders', {
  key: 'folders-dashboard'
})

const { data: storageStats } = await useFetch<StorageStatsResponse>('/api/storage/stats', {
  key: 'storage-stats'
})

const files = computed(() => data.value?.data ?? [])
const folders = computed(() => foldersData.value?.data ?? [])

const filteredFiles = computed(() => {
  const query = search.value.trim().toLowerCase()
  const list = files.value
  if (!query) return list
  return list.filter(file => file.name.toLowerCase().includes(query))
})

const recentFiles = computed(() => [...files.value].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5))

const pinnedFiles = computed(() =>
  [...files.value].sort((a, b) => b.size - a.size).slice(0, 2)
)

const rootFolders = computed(() => folders.value.filter(folder => !folder.parentId))

const deleteState = ref<Record<string, boolean>>({})
const deleteFolderState = ref<Record<string, boolean>>({})
const draggingFileId = ref<string | null>(null)

const setDeleteState = (id: string, value: boolean) => {
  if (value) {
    deleteState.value = { ...deleteState.value, [id]: true }
  } else {
    const { [id]: _removed, ...rest } = deleteState.value
    deleteState.value = rest
  }
}

const deleteFile = async (fileId: string) => {
  if (!confirm('이 파일을 삭제하시겠습니까?')) return
  if (deleteState.value[fileId]) return
  setDeleteState(fileId, true)
  try {
    await requestFetch(`/api/files/${fileId}`, { method: 'DELETE' })
    await refresh()
  } catch (error) {
    alert(getErrorMessage(error) || '파일 삭제에 실패했습니다.')
  } finally {
    setDeleteState(fileId, false)
  }
}

const moveFile = async (fileId: string, folderId: string | null) => {
  try {
    await requestFetch(`/api/files/${fileId}/move`, {
      method: 'POST',
      body: { folderId }
    })
    await refresh()
  } catch (error) {
    alert(getErrorMessage(error) || '파일을 이동할 수 없습니다.')
  }
}

const deleteFolder = async (folderId: string) => {
  if (!confirm('폴더를 삭제하시겠습니까? 폴더의 파일은 루트로 이동합니다.')) return
  if (deleteFolderState.value[folderId]) return
  deleteFolderState.value = { ...deleteFolderState.value, [folderId]: true }
  try {
    await requestFetch(`/api/folders/${folderId}`, { method: 'DELETE' })
    await Promise.all([refreshFolders(), refresh()])
  } catch (error) {
    alert(getErrorMessage(error) || '폴더 삭제에 실패했습니다.')
  } finally {
    const { [folderId]: _removed, ...rest } = deleteFolderState.value
    deleteFolderState.value = rest
  }
}

const handleFileDragStart = (fileId: string) => {
  draggingFileId.value = fileId
}

const handleFileDragEnd = () => {
  draggingFileId.value = null
}

const handleFileDrop = async (folderId: string | null) => {
  if (!draggingFileId.value) return
  await moveFile(draggingFileId.value, folderId)
  draggingFileId.value = null
}

const showCreateFolderModal = ref(false)
const newFolderName = ref('')
const creatingFolder = ref(false)

const openCreateFolderModal = () => {
  newFolderName.value = ''
  showCreateFolderModal.value = true
}

const closeCreateFolderModal = () => {
  if (creatingFolder.value) return
  showCreateFolderModal.value = false
}

const submitCreateFolder = async () => {
  if (!newFolderName.value.trim()) {
    alert('폴더 이름을 입력하세요.')
    return
  }
  creatingFolder.value = true
  try {
    await requestFetch('/api/folders', {
      method: 'POST',
      body: { name: newFolderName.value, parentId: null }
    })
    await Promise.all([refreshFolders(), refresh()])
    closeCreateFolderModal()
  } catch (error) {
    alert(getErrorMessage(error) || '폴더를 생성할 수 없습니다.')
  } finally {
    creatingFolder.value = false
  }
}

const storageTotalBytes = computed(() => storageStats.value?.data.totalBytes ?? quotaBytes)
const remainingBytes = computed(() => {
  if (storageStats.value?.data) {
    return Math.max(storageStats.value.data.freeBytes, 0)
  }
  return Math.max(quotaBytes - totalUsageBytes.value, 0)
})
const usedCapacityBytes = computed(() => {
  if (storageStats.value?.data) {
    return Math.max(storageStats.value.data.usedBytes, 0)
  }
  return totalUsageBytes.value
})
const personalUsageBytes = computed(() => storageStats.value?.data.userBytes ?? totalUsageBytes.value)
const usedCapacityPercent = computed(() => {
  const total = storageTotalBytes.value || 1
  return Math.min(100, Math.round((usedCapacityBytes.value / total) * 100))
})
const personalUsagePercent = computed(() => {
  const total = storageTotalBytes.value || 1
  return Math.min(usedCapacityPercent.value, Math.round((personalUsageBytes.value / total) * 100))
})
const remainingPercent = computed(() => {
  const total = storageTotalBytes.value || 1
  return Math.max(0, Math.min(100, Math.round(((total - usedCapacityBytes.value) / total) * 100)))
})

const pinnedGridColsClass = computed(() => {
  if (pinnedFiles.value.length === 0) return 'grid-cols-1'
  return pinnedFiles.value.length % 2 === 1 ? 'sm:grid-cols-1' : 'sm:grid-cols-2'
})

const totalUsageBytes = computed(() => files.value.reduce((sum, file) => sum + file.size, 0))
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

const iconForFile = (file: StoredFile) => (file.mimeType.startsWith('image/') ? 'image' : 'file')

const detailForFile = (file: StoredFile) => `${formatBytes(file.size)} · ${formatRelative(file.updatedAt)}`
</script>
