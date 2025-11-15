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
          <div id="search" class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div class="flex grow items-center gap-2 rounded-2xl bg-black/35 px-4 py-3 ring-1 ring-surface">
              <svg xmlns="http://www.w3.org/2000/svg" class="size-5 text-paper-oklch/50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
              </svg>
              <input
                type="search"
                placeholder="계약서..."
                v-model="search"
                class="w-full bg-transparent text-sm text-paper-oklch placeholder:text-paper-oklch/45 focus:outline-none"
              />
            </div>
            <button
              class="tap-area rounded-2xl bg-white/10 px-4 py-3 text-sm text-paper-oklch/80 ring-1 ring-surface hover:bg-white/15"
              @click="refresh"
            >
              새로고침
            </button>
          </div>
        </div>
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <div class="rounded-2xl bg-black/35 px-4 py-4 text-sm ring-1 ring-surface">
            <p class="text-xs uppercase text-paper-oklch/50 font-bold">총 저장 용량</p>
            <p class="mt-2 text-2xl font-semibold">
              <span class="text-emerald-200/90 font-bold">{{ usagePercent }}%</span> 사용
            </p>
            <div class="mt-3 h-2 rounded-full bg-white/10">
              <div class="h-full rounded-full bg-white/70 transition-all" :style="{ width: usagePercent + '%' }" />
            </div>
            <p class="mt-2 text-xs text-paper-oklch/55">{{ formatBytes(totalUsageBytes) }} / {{ formatBytes(quotaBytes) }}</p>
          </div>
          <div class="rounded-2xl bg-black/35 px-4 py-4 text-sm ring-1 ring-surface">
            <p class="text-xs uppercase text-paper-oklch/50 font-bold">보안 상태</p>
            <p class="mt-3 text-2xl font-semibold text-paper-oklch/60">
              KMS 연동:
              <span class="text-emerald-200/90 font-bold">실시간</span>
            </p>
            <p class="mt-2 text-xs text-paper-oklch/55">파일은 업로드 시 즉시 암호화되어 저장됩니다.</p>
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

      <section id="library" class="grid gap-6 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)]">
        <aside class="rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">폴더</h2>
              <p class="text-xs text-paper-oklch/55">
                {{ folderScope === 'all' ? '전체 파일 보기' : selectedFolder?.path || '루트 폴더' }}
              </p>
            </div>
            <button
              type="button"
              class="tap-area inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-black hover:bg-white disabled:opacity-50"
              :disabled="creatingFolder"
              @click="createFolder"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
              </svg>
              새 폴더
            </button>
          </div>
          <div class="mt-4 space-y-2">
            <button
              type="button"
              class="w-full rounded-xl px-4 py-2 text-left text-sm transition"
              :class="folderScope === 'all' ? 'bg-white text-black font-semibold' : 'bg-black/30 text-paper-oklch/70 hover:bg-black/20'"
              @click="selectFolderScope('all')"
            >
              전체 파일
            </button>
            <button
              type="button"
              class="w-full rounded-xl px-4 py-2 text-left text-sm transition"
              :class="folderScope === 'root' ? 'bg-white text-black font-semibold' : 'bg-black/30 text-paper-oklch/70 hover:bg-black/20'"
              @click="selectFolderScope('root')"
            >
              루트 폴더
            </button>
            <div v-if="folders.length" class="space-y-1">
              <button
                v-for="folder in folders"
                :key="folder.id"
                type="button"
                class="w-full rounded-xl px-4 py-2 text-left text-sm transition"
                :class="folderScope === folder.id ? 'bg-white text-black font-semibold' : 'bg-black/20 text-paper-oklch/70 hover:bg-black/10'"
                @click="selectFolderScope(folder.id)"
              >
                <p class="font-medium truncate">{{ folder.name }}</p>
                <p class="text-xs text-paper-oklch/55 truncate">{{ folder.path }}</p>
              </button>
            </div>
            <p v-else class="text-xs text-paper-oklch/55">아직 생성된 폴더가 없습니다.</p>
          </div>
        </aside>
        <div class="space-y-4 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">파일</h2>
              <p class="text-xs text-paper-oklch/55">{{ filteredFiles.length }}개 표시</p>
            </div>
            <button
              type="button"
              class="tap-area rounded-full bg-white/10 px-4 py-2 text-xs text-paper-oklch/70 ring-1 ring-surface hover:bg-white/15"
              @click="refresh"
            >
              새로고침
            </button>
          </div>
          <div class="rounded-[1.25rem] bg-black/30 p-2">
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
                @delete="deleteFile(file.id)"
              />
            </template>
            <p v-else class="p-4 text-center text-sm text-paper-oklch/55">표시할 파일이 없습니다.</p>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { StoredFile, StoredFolder } from '~/types/storage'
import { getErrorMessage } from '~/utils/errorMessage'

// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })

type FilesResponse = { data: StoredFile[] }
type FoldersResponse = { data: StoredFolder[] }

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

const files = computed(() => data.value?.data ?? [])
const folders = computed(() => foldersData.value?.data ?? [])

const scopedFiles = computed(() => {
  if (folderScope.value === 'all') return files.value
  if (folderScope.value === 'root') return files.value.filter(file => !file.folderId)
  return files.value.filter(file => file.folderId === folderScope.value)
})

const filteredFiles = computed(() => {
  const query = search.value.trim().toLowerCase()
  const scopeList = scopedFiles.value
  if (!query) return scopeList
  return scopeList.filter(file => file.name.toLowerCase().includes(query))
})

const recentFiles = computed(() => [...files.value].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5))

const pinnedFiles = computed(() =>
  [...files.value].sort((a, b) => b.size - a.size).slice(0, 2)
)

const selectedFolder = computed(() => {
  if (folderScope.value === 'all') return null
  if (folderScope.value === 'root') return { id: 'root', name: '루트', path: '/' }
  return folders.value.find(folder => folder.id === folderScope.value) ?? null
})

const deleteState = ref<Record<string, boolean>>({})

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

const creatingFolder = ref(false)
const createFolder = async () => {
  const name = window.prompt('새 폴더 이름을 입력하세요.')
  if (!name) return
  creatingFolder.value = true
  try {
    const parentId = folderScope.value === 'all' ? null : folderScope.value === 'root' ? null : folderScope.value
    await requestFetch('/api/folders', {
      method: 'POST',
      body: { name, parentId }
    })
    await refreshFolders()
  } catch (error) {
    alert(getErrorMessage(error) || '폴더를 생성할 수 없습니다.')
  } finally {
    creatingFolder.value = false
  }
}

const selectFolderScope = (scope: 'all' | 'root' | string) => {
  folderScope.value = scope
}

const pinnedGridColsClass = computed(() => {
  if (pinnedFiles.value.length === 0) return 'grid-cols-1'
  return pinnedFiles.value.length % 2 === 1 ? 'sm:grid-cols-1' : 'sm:grid-cols-2'
})

const totalUsageBytes = computed(() => files.value.reduce((sum, file) => sum + file.size, 0))
const usagePercent = computed(() => Math.min(100, Math.round((totalUsageBytes.value / quotaBytes) * 100)))

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
