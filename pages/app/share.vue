<template>
  <main class="relative flex min-h-full flex-col">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_50%_at_50%_-10%,_rgba(214,211,209,0.18),_transparent_65%)]"></div>

    <section class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div class="space-y-1">
          <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">공유 허브</p>
          <h1 class="text-2xl font-extrabold">파일 공유 및 초대</h1>
          <p class="text-sm text-paper-oklch/70">
            안전하게 다른 사람과 파일을 공유하고 초대할 수 있습니다.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink
            to="/app/share-settings"
            class="tap-area inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-paper-oklch/75 ring-1 ring-surface hover:bg-white/15"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v12m0 0 4-4m-4 4-4-4" />
            </svg>
            새 링크 생성
          </NuxtLink>
          <NuxtLink
            to="/app/upload"
            class="tap-area inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-sm text-black hover:bg-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
            </svg>
            새 파일 업로드
          </NuxtLink>
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section class="space-y-5">
          <div class="rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold">활성 공유 링크</h2>
              <span class="text-xs text-paper-oklch/50">{{ shareLinks.length }}개</span>
            </div>
            <form class="mt-4 grid gap-4 text-sm text-paper-oklch/80" @submit.prevent="createLink">
              <div class="grid gap-2">
                <label class="text-xs text-paper-oklch/55">대상 선택</label>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="tap-area grow rounded-xl px-3 py-2 text-xs font-semibold ring-1 ring-surface"
                    :class="formState.target === 'file' ? 'bg-white text-black' : 'bg-white/10 text-paper-oklch/70 hover:bg-white/15'"
                    @click="formState.target = 'file'"
                  >
                    파일
                  </button>
                  <button
                    type="button"
                    class="tap-area grow rounded-xl px-3 py-2 text-xs font-semibold ring-1 ring-surface"
                    :class="formState.target === 'folder' ? 'bg-white text-black' : 'bg-white/10 text-paper-oklch/70 hover:bg-white/15'"
                    @click="formState.target = 'folder'"
                  >
                    폴더
                  </button>
                </div>
              </div>
              <div v-if="formState.target === 'file'" class="grid gap-2">
                <label class="text-xs text-paper-oklch/55">파일 선택</label>
                <div class="relative">
                  <select
                    v-model="formState.fileId"
                    class="w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-4 py-2 pr-10 text-sm text-paper-oklch focus:border-white/40 focus:outline-none"
                  >
                    <option disabled value="">파일을 선택하세요</option>
                    <option v-for="item in files" :key="item.id" :value="item.id">
                      {{ item.name }} · {{ formatBytes(item.size) }}
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
              <div v-else class="grid gap-2">
                <label class="text-xs text-paper-oklch/55">폴더 선택</label>
                <div class="relative">
                  <select
                    v-model="formState.folderId"
                    class="w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-4 py-2 pr-10 text-sm text-paper-oklch focus:border-white/40 focus:outline-none"
                  >
                    <option disabled value="">폴더를 선택하세요</option>
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
                <p class="text-xs text-paper-oklch/55">선택한 폴더의 파일마다 개별 링크가 생성됩니다.</p>
              </div>
              <div class="grid gap-2">
                <label class="text-xs text-paper-oklch/55">만료일 (일)</label>
                <input
                  v-model.number="formState.expiresInDays"
                  type="number"
                  min="1"
                  max="30"
                  class="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-paper-oklch focus:border-white/40 focus:outline-none"
                />
              </div>
              <div class="grid gap-2">
                <label class="text-xs text-paper-oklch/55">비밀번호 (선택)</label>
                <input
                  v-model="formState.password"
                  type="text"
                  placeholder="최소 4자"
                  class="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-paper-oklch focus:border-white/40 focus:outline-none"
                />
              </div>
              <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-paper-oklch/60">
                <span>공유 링크는 지정한 만료일 이후 자동으로 비활성화됩니다.</span>
                <button
                  type="submit"
                  class="tap-area rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-black hover:bg-white disabled:opacity-60"
                  :disabled="creatingLink"
                >
                  {{ creatingLink ? '생성 중...' : '공유 링크 생성' }}
                </button>
              </div>
              <p v-if="copyMessage" class="text-xs text-emerald-300/80">{{ copyMessage }}</p>
            </form>

            <ul class="mt-6 space-y-3" v-if="shareLinks.length">
              <li
                v-for="link in shareLinks"
                :key="link.id"
                class="rounded-[1.5rem] bg-black/35 p-4 text-sm ring-1 ring-surface"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate font-semibold" :title="link.fileName">{{ link.fileName }}</p>
                    <p class="truncate text-xs text-paper-oklch/55">
                      {{ formatBytes(link.fileSize) }} · 만료 {{ formatRelative(link.expiresAt) }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2 text-xs">
                    <span class="rounded-full bg-white/10 px-3 py-1 text-paper-oklch/60">
                      {{ link.hasPassword ? '비밀번호' : '공개' }}
                    </span>
                    <button type="button" class="tap-area rounded-full px-3 py-1 text-paper-oklch/55 hover:bg-white/10" @click="requestDeleteLink(link)">
                      제거
                    </button>
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-paper-oklch/55">
                  <code class="grow rounded-xl bg-black/40 px-3 py-2 break-all">{{ shareUrl(link.id) }}</code>
                  <button type="button" class="tap-area rounded-full bg-white/90 px-3 py-2 text-[11px] font-semibold text-black" @click="copyLink(link.id)">
                    복사
                  </button>
                </div>
              </li>
            </ul>
            <p v-else class="mt-4 rounded-[1.5rem] bg-black/30 px-4 py-6 text-center text-xs text-paper-oklch/55 ring-1 ring-surface">
              공유 링크가 없습니다. 위 양식을 사용해 첫 링크를 생성하세요.
            </p>
          </div>
        </section>

        <aside class="space-y-5">
          <div class="space-y-3 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold">공유된 폴더</h2>
              <span class="text-xs text-paper-oklch/60">{{ folderGroups.length }}개</span>
            </div>
            <ul class="space-y-2 text-sm text-paper-oklch/70" v-if="folderGroups.length">
              <li
                v-for="group in folderGroups"
                :key="group.folderId ?? 'root'"
                class="rounded-[1.25rem] bg-black/35 px-4 py-4 ring-1 ring-surface"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate font-medium" :title="group.folderName || '루트 폴더'">{{ group.folderName || '루트 폴더' }}</p>
                    <p class="truncate text-xs text-paper-oklch/55" :title="group.folderPath || '/'">{{ group.folderPath || '/' }}</p>
                  </div>
                  <span class="text-xs text-paper-oklch/50">{{ group.files.length }}개 파일</span>
                </div>
                <div class="mt-2 space-y-1 text-xs text-paper-oklch/60">
                  <div v-for="file in group.files.slice(0, 3)" :key="file.id" class="flex items-center justify-between gap-2">
                    <NuxtLink :to="`/app/file-preview/${file.fileId}`" class="min-w-0 flex-1 truncate hover:text-paper-oklch/80" :title="file.fileName">
                      {{ file.fileName }}
                    </NuxtLink>
                    <span class="whitespace-nowrap">{{ formatBytes(file.fileSize) }}</span>
                  </div>
                  <p v-if="group.files.length > 3" class="text-right text-paper-oklch/50">외 {{ group.files.length - 3 }}개 더 있음</p>
                </div>
              </li>
            </ul>
            <p v-else class="text-xs text-paper-oklch/55">공유된 폴더가 없습니다.</p>
          </div>

          <div class="space-y-3 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <h2 class="text-base font-semibold">외부 링크 상태</h2>
            <ul class="space-y-2 text-sm text-paper-oklch/70">
              <li
                v-for="status in externalStatus"
                :key="status.label"
                class="flex items-center justify-between rounded-xl bg-black/35 px-4 py-3 ring-1 ring-surface"
              >
                <span>{{ status.label }}</span>
                <span class="text-xs text-paper-oklch/55">{{ status.value }}</span>
              </li>
            </ul>
            <NuxtLink
              to="/app/logs"
              class="tap-area block rounded-xl bg-white/10 px-4 py-3 text-center text-xs text-paper-oklch/70 ring-1 ring-surface hover:bg-white/15"
            >
              활동 로그 열기
            </NuxtLink>
          </div>
        </aside>
      </div>
    </section>
  </main>

  <transition name="fade">
    <div v-if="deleteDialog.open" class="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur">
      <div class="w-full max-w-md rounded-3xl bg-[#0f0f11] p-6 text-paper-oklch ring-1 ring-white/10">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">공유 링크 삭제</p>
            <h3 class="text-lg font-semibold">이 링크를 비활성화할까요?</h3>
          </div>
          <button
            type="button"
            class="tap-area rounded-full p-2 hover:bg-white/10"
            :disabled="deleteDialog.submitting"
            @click="closeDeleteDialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <p class="mt-4 text-sm text-paper-oklch/70">{{ deleteDialogMessage }}</p>
        <div class="mt-6 flex items-center justify-end gap-3 text-sm">
          <button
            type="button"
            class="tap-area rounded-full px-4 py-2 text-paper-oklch/70 hover:bg-white/10"
            :disabled="deleteDialog.submitting"
            @click="closeDeleteDialog"
          >
            취소
          </button>
          <button
            type="button"
            class="tap-area rounded-full bg-rose-500/90 px-4 py-2 font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
            :disabled="deleteDialog.submitting"
            @click="confirmDeleteLink"
          >
            {{ deleteDialog.submitting ? '삭제 중...' : '삭제' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { StoredFile, StoredFolder } from '~/types/storage'
import type { ShareLink } from '~/types/share'
import { getErrorMessage } from '~/utils/errorMessage'

// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })

type FilesResponse = { data: StoredFile[] }
type FoldersResponse = { data: StoredFolder[] }
type ShareLinksResponse = { data: ShareLink[] }
type FolderGroup = { folderId: string | null; folderName: string; folderPath: string; files: ShareLink[] }

const requestFetch = useRequestFetch()

const { data: filesData } = await useFetch<FilesResponse>('/api/files', {
  key: 'files-share'
})

const { data: foldersData } = await useFetch<FoldersResponse>('/api/folders', {
  key: 'folders-share'
})

const { data: shareLinksData, refresh: refreshShareLinks } = await useFetch<ShareLinksResponse>('/api/share-links', {
  key: 'share-links'
})

const files = computed(() => filesData.value?.data ?? [])
const folders = computed(() => foldersData.value?.data ?? [])
const shareLinks = computed(() => shareLinksData.value?.data ?? [])

const formState = reactive({
  target: 'file' as 'file' | 'folder',
  fileId: '',
  folderId: '',
  expiresInDays: 7,
  password: ''
})

const creatingLink = ref(false)
const copyMessage = ref<string | null>(null)

const requestURL = useRequestURL()
const origin = computed(() => (process.client ? window.location.origin : requestURL.origin))
const shareUrl = (id: string) => `${origin.value}/share/${id}`

const createLink = async () => {
  if (formState.target === 'file') {
    if (!formState.fileId) {
      alert('공유할 파일을 선택하세요.')
      return
    }
  } else {
    if (!formState.folderId) {
      alert('공유할 폴더를 선택하세요.')
      return
    }
  }
  creatingLink.value = true
  try {
    if (formState.target === 'file') {
      await requestFetch('/api/share-links', {
        method: 'POST',
        body: {
          fileId: formState.fileId,
          expiresInDays: formState.expiresInDays,
          password: formState.password || undefined
        }
      })
    } else {
      await requestFetch('/api/share-links/folder', {
        method: 'POST',
        body: {
          folderId: formState.folderId,
          expiresInDays: formState.expiresInDays,
          password: formState.password || undefined
        }
      })
    }
    formState.password = ''
    await refreshShareLinks()
  } catch (error) {
    alert(getErrorMessage(error) || '공유 링크를 생성할 수 없습니다.')
  } finally {
    creatingLink.value = false
  }
}

const deleteDialog = reactive({
  open: false,
  linkId: '',
  linkName: '',
  submitting: false
})

const deleteDialogMessage = computed(() => {
  if (!deleteDialog.linkName) {
    return '선택된 공유 링크를 비활성화합니다. 계속할까요?'
  }
  return `${deleteDialog.linkName} 링크를 비활성화합니다. 계속할까요?`
})

const requestDeleteLink = (link: ShareLink) => {
  deleteDialog.open = true
  deleteDialog.linkId = link.id
  deleteDialog.linkName = link.fileName
}

const closeDeleteDialog = () => {
  if (deleteDialog.submitting) return
  deleteDialog.open = false
  deleteDialog.linkId = ''
  deleteDialog.linkName = ''
}

const confirmDeleteLink = async () => {
  if (!deleteDialog.linkId) return
  deleteDialog.submitting = true
  let errorMessage: string | null = null
  try {
    await requestFetch(`/api/share-links/${deleteDialog.linkId}`, { method: 'DELETE' })
    await refreshShareLinks()
  } catch (error) {
    errorMessage = getErrorMessage(error) || '공유 링크를 삭제할 수 없습니다.'
  } finally {
    deleteDialog.submitting = false
    closeDeleteDialog()
    if (errorMessage) {
      alert(errorMessage)
    }
  }
}

const copyLink = async (id: string) => {
  const url = shareUrl(id)
  if (!process.client) return
  try {
    await navigator.clipboard.writeText(url)
    copyMessage.value = '링크가 복사되었습니다.'
  } catch {
    copyMessage.value = '클립보드에 복사할 수 없습니다.'
  }
  setTimeout(() => {
    copyMessage.value = null
  }, 2000)
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

const formatRelative = (timestamp: number) => {
  const diff = timestamp - Date.now()
  const absoluteDays = Math.round(Math.abs(diff) / (24 * 60 * 60 * 1000))
  if (diff < 0) {
    return absoluteDays ? `${absoluteDays}일 지남` : '오늘 만료'
  }
  return absoluteDays ? `${absoluteDays}일 남음` : '곧 만료'
}

const folderGroups = computed(() => {
  const groups = new Map<string, FolderGroup>()
  shareLinks.value.forEach(link => {
    const key = link.folderId ?? 'root'
    if (!groups.has(key)) {
      groups.set(key, {
        folderId: link.folderId ?? null,
        folderName: link.folderName ?? (link.folderId ? '폴더' : '루트 폴더'),
        folderPath: link.folderPath ?? '/',
        files: []
      })
    }
    groups.get(key)!.files.push(link)
  })
  return Array.from(groups.values()).sort((a, b) => b.files.length - a.files.length)
})

const externalStatus = computed(() => {
  const total = shareLinks.value.length
  const protectedCount = shareLinks.value.filter(link => link.hasPassword).length
  const expiringSoon = shareLinks.value.filter(link => link.expiresAt - Date.now() < 3 * 24 * 60 * 60 * 1000).length
  const totalAccess = shareLinks.value.reduce((sum, link) => sum + link.accessCount, 0)
  const folderCount = folderGroups.value.length
  return [
    { label: '활성 링크', value: `${total}개` },
    { label: '공유 폴더', value: `${folderCount}개` },
    { label: '비밀번호 보호', value: `${protectedCount}개` },
    { label: '만료 임박 (3일)', value: `${expiringSoon}개` },
    { label: '총 다운로드', value: `${totalAccess}회` }
  ]
})
</script>
