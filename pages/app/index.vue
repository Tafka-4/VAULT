<template>
  <main class="relative flex min-h-full flex-col">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_50%_at_50%_-10%,_rgba(214,211,209,0.18),_transparent_65%)]"></div>

    <section class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8">
      <div class="rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">서버 스토리지 상태</p>
            <h1 class="text-2xl font-extrabold">나의 스토리지</h1>
            <p class="mt-1 text-sm text-paper-oklch/70">파일 {{ files.length }}개 · 저장소</p>
          </div>
          <p class="text-xs text-paper-oklch/60">총 용량 {{ formatBytes(storageTotalBytes) }}</p>
        </div>
        <div class="mt-6 rounded-[1.75rem] bg-black/35 px-5 py-5 ring-1 ring-surface">
          <div class="space-y-4">
            <div class="h-2 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
              <div class="relative h-full w-full">
                <span
                  class="absolute inset-y-0 left-0 h-full bg-amber-200/70 transition-all"
                  :style="{ width: usedCapacityPercent + '%' }"
                  aria-label="사용 중"
                ></span>
                <span
                  class="absolute inset-y-0 left-0 h-full bg-sky-300/80 transition-all"
                  :style="{ width: personalUsagePercent + '%' }"
                  aria-label="내 사용량"
                ></span>
                <span
                  class="absolute inset-y-0 right-0 h-full bg-emerald-300/70 transition-all"
                  :style="{ width: remainingPercent + '%' }"
                  aria-label="남은 공간"
                ></span>
              </div>
            </div>
            <div class="grid gap-4 text-sm text-paper-oklch/80 sm:grid-cols-3">
              <div class="flex items-center gap-3">
                <span class="size-3 rounded-full bg-emerald-400/80"></span>
                <div>
                  <p class="text-xs uppercase text-paper-oklch/50 font-bold">남은 공간</p>
                  <p class="font-semibold">{{ formatBytes(remainingBytes) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="size-3 rounded-full bg-amber-300/90"></span>
                <div>
                  <p class="text-xs uppercase text-paper-oklch/50 font-bold">사용 중</p>
                  <p class="font-semibold">{{ formatBytes(usedCapacityBytes) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="size-3 rounded-full bg-sky-400/90"></span>
                <div>
                  <p class="text-xs uppercase text-paper-oklch/50 font-bold">내 사용량</p>
                  <p class="font-semibold">{{ formatBytes(personalUsageBytes) }}</p>
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
          <h2 class="text-lg font-semibold">즐겨찾기</h2>
          <span class="text-xs uppercase tracking-[0.3em] text-paper-oklch/55">
            {{ pinnedItems.length ? `${pinnedItems.length}개` : '비어 있음' }}
          </span>
        </div>
        <div v-if="pinnedItems.length" class="rounded-[1.75rem] bg-white/5 p-3 ring-1 ring-surface">
          <div class="rounded-[1.25rem] bg-black/30 p-2">
            <FileRow
              v-for="item in pinnedItems"
              :key="`${item.type}-${item.id}`"
              :icon="item.icon"
              :name="item.name"
              :detail="item.detail"
              :to="item.to"
              :actionable="item.type === 'folder'"
              :pinnable="true"
              :pinned="true"
              @pin="togglePinEntry(item.type, item.id)"
              @action="item.folderId ? handlePinnedFolderNavigate(item.folderId) : null"
            />
          </div>
        </div>
        <div
          v-else
          class="rounded-[1.75rem] bg-white/5 p-6 text-sm text-paper-oklch/70 ring-1 ring-surface"
        >
          <p class="leading-relaxed">
            아직 즐겨찾기한 파일이나 폴더가 없습니다. 라이브러리에서 별 아이콘을 눌러 자주 사용하는 항목을 고정할 수 있어요.
          </p>
        </div>
      </section>

      <section id="library" class="space-y-6">
        <div class="space-y-4 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">파일</h2>
              <p class="text-xs text-paper-oklch/55">{{ totalEntriesCount }}개 표시</p>
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
          <div class="rounded-[1.25rem] bg-black/20 p-3 ring-1 ring-surface">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div class="flex grow items-center gap-2 rounded-xl bg-black/40 px-4 py-2 text-sm text-paper-oklch ring-1 ring-surface">
                <svg xmlns="http://www.w3.org/2000/svg" class="size-5 text-paper-oklch/50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
                </svg>
                <input
                  v-model="search"
                  type="search"
                  placeholder="파일 또는 폴더 검색..."
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
            <div v-if="currentPathLabel" class="mt-2 flex flex-wrap items-center gap-2 text-xs text-paper-oklch/60">
              <span>경로: <span class="font-semibold text-paper-oklch/80">{{ currentPathLabel }}</span></span>
              <div class="flex items-center gap-2">
                <button
                  v-if="folderScope !== 'all'"
                  type="button"
                  class="tap-area inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-paper-oklch/70 hover:bg-white/10"
                  @click="goToParentFolder"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7" />
                  </svg>
                  상위
                </button>
                <button
                  v-if="folderScope !== 'all'"
                  type="button"
                  class="tap-area rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-paper-oklch/70 hover:bg-white/10"
                  @click="selectFolderScope('all')"
                >
                  전체
                </button>
              </div>
            </div>
          </div>
          <div class="rounded-[1.25rem] bg-black/30 p-2">
            <template v-if="filteredFolders.length">
              <p class="px-2 pb-1 text-xs font-semibold uppercase tracking-[0.2em] text-paper-oklch/50">폴더</p>
              <FileRow
                v-for="folder in filteredFolders"
                :key="folder.id"
                icon="folder"
                :name="folder.name"
                :detail="folder.path"
                actionable
                :active="folderScope === folder.id"
                show-delete
                :deleting="Boolean(deleteFolderState[folder.id])"
                :pinnable="true"
                :pinned="isFolderPinned(folder.id)"
                @action="selectFolderScope(folder.id)"
                @delete="requestDeleteFolder(folder)"
                @pin="toggleFolderPin(folder)"
              />
            </template>
            <template v-if="filteredFiles.length">
              <p class="px-2 pb-1 text-xs font-semibold uppercase tracking-[0.2em] text-paper-oklch/50">파일</p>
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
                :pinnable="true"
                :pinned="isFilePinned(file.id)"
                @dragstart="handleFileDragStart(file.id)"
                @dragend="handleFileDragEnd"
                @delete="requestDeleteFile(file)"
                @pin="toggleFilePin(file)"
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

  <transition name="fade">
    <div v-if="confirmDialog.open" class="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur">
      <div class="w-full max-w-md rounded-3xl bg-[#0f0f11] p-6 text-paper-oklch ring-1 ring-white/10">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">삭제 확인</p>
            <h3 class="text-lg font-semibold">이 작업을 계속할까요?</h3>
          </div>
          <button type="button" class="tap-area rounded-full p-2 hover:bg-white/10" @click="closeConfirmDialog" :disabled="confirmDialog.submitting">
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <p class="mt-4 text-sm text-paper-oklch/70">{{ confirmMessage }}</p>
        <div class="mt-6 flex items-center justify-end gap-3 text-sm">
          <button type="button" class="tap-area rounded-full px-4 py-2 text-paper-oklch/70 hover:bg-white/10" @click="closeConfirmDialog" :disabled="confirmDialog.submitting">
            취소
          </button>
          <button
            type="button"
            class="tap-area rounded-full bg-rose-500/90 px-4 py-2 font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
            :disabled="confirmDialog.submitting"
            @click="confirmDeletion"
          >
            {{ confirmDialog.submitting ? '삭제 중...' : '삭제' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import type { StoredFile, StoredFolder } from '~/types/storage'
import { getErrorMessage } from '~/utils/errorMessage'

// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })

type FilesResponse = { data: StoredFile[] }
type FoldersResponse = { data: StoredFolder[] }
type StorageStatsResponse = { data: { totalBytes: number; usedBytes: number; freeBytes: number; userBytes: number } }
type PinnedEntry = { id: string; type: 'file' | 'folder' }

const search = ref('')
const quotaBytes = 512 * 1024 * 1024 * 1024 // 512GB
const folderScope = ref<'all' | 'root' | string>('all')
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

const pinnedEntries = useState<PinnedEntry[]>('dashboard:pinned', () => [])
const pinnedLoaded = useState('dashboard:pinned-loaded', () => false)

if (process.client && !pinnedLoaded.value) {
  try {
    const raw = localStorage.getItem('vault:pinned')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        pinnedEntries.value = parsed.filter(
          (entry: any) => entry && (entry.type === 'file' || entry.type === 'folder') && typeof entry.id === 'string'
        )
      }
    }
  } catch {
    // ignore malformed storage
  } finally {
    pinnedLoaded.value = true
  }
}

if (process.client) {
  watch(
    pinnedEntries,
    value => {
      if (!pinnedLoaded.value) return
      try {
        localStorage.setItem('vault:pinned', JSON.stringify(value))
      } catch {
        // ignore storage errors
      }
    },
    { deep: true }
  )
}

const prunePinnedEntries = () => {
  const fileIds = new Set(files.value.map(file => file.id))
  const folderIds = new Set(folders.value.map(folder => folder.id))
  pinnedEntries.value = pinnedEntries.value.filter(entry =>
    entry.type === 'file' ? fileIds.has(entry.id) : folderIds.has(entry.id)
  )
}

watch([files, folders], () => prunePinnedEntries(), { immediate: true })

const isPinned = (type: PinnedEntry['type'], id: string) =>
  pinnedEntries.value.some(entry => entry.type === type && entry.id === id)

const togglePinEntry = (type: PinnedEntry['type'], id: string) => {
  if (isPinned(type, id)) {
    pinnedEntries.value = pinnedEntries.value.filter(entry => !(entry.type === type && entry.id === id))
  } else {
    pinnedEntries.value = [...pinnedEntries.value, { type, id }]
  }
}

const pinnedFiles = computed(() =>
  pinnedEntries.value
    .filter(entry => entry.type === 'file')
    .map(entry => files.value.find(file => file.id === entry.id))
    .filter((file): file is StoredFile => Boolean(file))
)

const pinnedFolders = computed(() =>
  pinnedEntries.value
    .filter(entry => entry.type === 'folder')
    .map(entry => folders.value.find(folder => folder.id === entry.id))
    .filter((folder): folder is StoredFolder => Boolean(folder))
)

type PinnedDisplay = {
  id: string
  type: 'file' | 'folder'
  name: string
  detail: string
  icon: 'file' | 'image' | 'folder'
  to?: string
  folderId?: string
}

const pinnedItems = computed<PinnedDisplay[]>(() => {
  const fileItems = pinnedFiles.value.map<PinnedDisplay>(file => ({
    id: file.id,
    type: 'file',
    name: file.name,
    detail: detailForFile(file),
    icon: iconForFile(file),
    to: `/app/file-preview/${file.id}`
  }))
  const folderItems = pinnedFolders.value.map<PinnedDisplay>(folder => ({
    id: folder.id,
    type: 'folder',
    name: folder.name,
    detail: folder.path,
    icon: 'folder',
    folderId: folder.id
  }))
  return [...folderItems, ...fileItems]
})

const handlePinnedFolderNavigate = (folderId: string) => {
  folderScope.value = folderId
}

const isFilePinned = (id: string) => isPinned('file', id)
const isFolderPinned = (id: string) => isPinned('folder', id)
const toggleFilePin = (file: StoredFile) => togglePinEntry('file', file.id)
const toggleFolderPin = (folder: StoredFolder) => togglePinEntry('folder', folder.id)

const folderScopeFilter = computed(() => {
  if (folderScope.value === 'all') return undefined
  if (folderScope.value === 'root') return null
  return folderScope.value
})

const folderParentFilter = computed(() => (folderScope.value === 'root' || folderScope.value === 'all' ? null : folderScope.value))

const scopedFolders = computed(() => folders.value.filter(folder => folder.parentId === folderParentFilter.value))

const scopedFiles = computed(() => {
  const target = folderScopeFilter.value
  if (target === undefined) return files.value
  if (target === null) return files.value.filter(file => file.folderId == null)
  return files.value.filter(file => file.folderId === target)
})

const filteredFiles = computed(() => {
  const query = search.value.trim().toLowerCase()
  const scopeList = scopedFiles.value
  if (!query) return scopeList
  return scopeList.filter(file => file.name.toLowerCase().includes(query))
})

const filteredFolders = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return scopedFolders.value
  return scopedFolders.value.filter(folder => {
    const name = folder.name.toLowerCase()
    const path = folder.path.toLowerCase()
    return name.includes(query) || path.includes(query)
  })
})

const totalEntriesCount = computed(() => filteredFolders.value.length + filteredFiles.value.length)

const recentFiles = computed(() => [...files.value].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5))

const selectedFolder = computed(() => {
  if (folderScope.value === 'all') return null
  if (folderScope.value === 'root') return { id: 'root', name: '루트', path: '/' }
  return folders.value.find(folder => folder.id === folderScope.value) ?? null
})
const currentPathLabel = computed(() => {
  if (folderScope.value === 'all') return ''
  if (folderScope.value === 'root') return '/'
  return selectedFolder.value?.path ?? '/'
})

const deleteState = ref<Record<string, boolean>>({})
const deleteFolderState = ref<Record<string, boolean>>({})
const confirmDialog = reactive({
  open: false,
  type: null as 'file' | 'folder' | null,
  targetId: '',
  targetName: '',
  submitting: false
})
const confirmMessage = computed(() => {
  if (!confirmDialog.type) return ''
  return confirmDialog.type === 'file'
    ? `"${confirmDialog.targetName}" 파일을 삭제하시겠습니까?`
    : `"${confirmDialog.targetName}" 폴더를 삭제하시겠습니까? 폴더의 파일은 루트로 이동합니다.`
})
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
  if (deleteFolderState.value[folderId]) return
  deleteFolderState.value = { ...deleteFolderState.value, [folderId]: true }
  try {
    await requestFetch(`/api/folders/${folderId}`, { method: 'DELETE' })
    if (folderScope.value === folderId) {
      folderScope.value = 'all'
    }
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

const requestDeleteFile = (file: StoredFile) => {
  confirmDialog.open = true
  confirmDialog.type = 'file'
  confirmDialog.targetId = file.id
  confirmDialog.targetName = file.name
}

const requestDeleteFolder = (folder: StoredFolder) => {
  confirmDialog.open = true
  confirmDialog.type = 'folder'
  confirmDialog.targetId = folder.id
  confirmDialog.targetName = folder.name
}

const closeConfirmDialog = () => {
  if (confirmDialog.submitting) return
  confirmDialog.open = false
  confirmDialog.type = null
  confirmDialog.targetId = ''
  confirmDialog.targetName = ''
}

const confirmDeletion = async () => {
  if (!confirmDialog.type || !confirmDialog.targetId) return
  confirmDialog.submitting = true
  try {
    if (confirmDialog.type === 'file') {
      await deleteFile(confirmDialog.targetId)
    } else {
      await deleteFolder(confirmDialog.targetId)
    }
    closeConfirmDialog()
  } catch (error) {
    alert(getErrorMessage(error) || '삭제에 실패했습니다.')
  } finally {
    confirmDialog.submitting = false
  }
}

const showCreateFolderModal = ref(false)
const newFolderName = ref('')
const creatingFolder = ref(false)

const currentParentId = computed(() => {
  if (folderScope.value === 'all' || folderScope.value === 'root') return null
  const exists = folders.value.some(folder => folder.id === folderScope.value)
  return exists ? folderScope.value : null
})

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
      body: { name: newFolderName.value, parentId: currentParentId.value }
    })
    await Promise.all([refreshFolders(), refresh()])
    closeCreateFolderModal()
  } catch (error) {
    alert(getErrorMessage(error) || '폴더를 생성할 수 없습니다.')
  } finally {
    creatingFolder.value = false
  }
}

const selectFolderScope = (scope: 'all' | 'root' | string) => {
  folderScope.value = scope
}

const goToParentFolder = () => {
  if (folderScope.value === 'all') return
  if (folderScope.value === 'root') {
    folderScope.value = 'all'
    return
  }
  const current = folders.value.find(folder => folder.id === folderScope.value)
  if (!current) {
    folderScope.value = 'all'
    return
  }
  folderScope.value = current.parentId ?? 'root'
}

const totalUsageBytes = computed(() => files.value.reduce((sum, file) => sum + file.size, 0))

const storageTotalBytes = computed(() => storageStats.value?.data.totalBytes ?? quotaBytes)
const usedCapacityBytes = computed(() => {
  if (storageStats.value?.data) {
    return Math.max(storageStats.value.data.usedBytes, 0)
  }
  return totalUsageBytes.value
})
const remainingBytes = computed(() => {
  if (storageStats.value?.data) {
    return Math.max(storageStats.value.data.freeBytes, 0)
  }
  return Math.max(quotaBytes - totalUsageBytes.value, 0)
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
