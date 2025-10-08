<template>
  <main class="relative flex min-h-full flex-col">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_50%_at_50%_-10%,_rgba(214,211,209,0.18),_transparent_65%)]"></div>

    <section class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8">
      <div class="rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-2xl font-extrabold">Tafka4의 스토리지</h1>
            <p class="mt-1 text-sm text-paper-oklch/70">마지막 접속 · 2분 전</p>
          </div>
          <div id="search" class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div class="flex grow items-center gap-2 rounded-2xl bg-black/35 px-4 py-3 ring-1 ring-surface">
              <svg xmlns="http://www.w3.org/2000/svg" class="size-5 text-paper-oklch/50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
              </svg>
              <input
                type="search"
                placeholder="프로토타입, 계약서..."
                class="w-full bg-transparent text-sm text-paper-oklch placeholder:text-paper-oklch/45 focus:outline-none"
              />
            </div>
            <button class="tap-area rounded-2xl bg-white/10 px-4 py-3 text-sm text-paper-oklch/80 ring-1 ring-surface hover:bg-white/15">
              필터
            </button>
          </div>
        </div>
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <div class="rounded-2xl bg-black/35 px-4 py-4 text-sm ring-1 ring-surface">
            <p class="text-xs uppercase text-paper-oklch/50 font-bold">총 저장 용량</p>
            <p class="mt-2 text-2xl font-semibold"><span class="text-emerald-200/90 font-bold">22%</span> 사용</p>
            <div class="mt-3 h-2 rounded-full bg-white/10">
              <div class="h-full rounded-full bg-white/70" style="width: 22%" />
            </div>
            <p class="mt-2 text-xs text-paper-oklch/55">512GB 중 214GB 사용 중</p>
          </div>
          <div class="rounded-2xl bg-black/35 px-4 py-4 text-sm ring-1 ring-surface">
            <p class="text-xs uppercase text-paper-oklch/50 font-bold">보안 상태</p>
            <p class="mt-3 text-2xl font-semibold text-paper-oklch/60">2단계 인증: <span class="text-emerald-200/90 font-bold">활성화</span></p>
          </div>
        </div>
      </div>

      <section id="recent" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">최근 파일</h2>
          <NuxtLink
            to="/app/search?preset=recent"
            class="tap-area inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs uppercase font-semibold text-paper-oklch/70 ring-1 ring-surface hover:bg-white/15 hover:text-paper-oklch/90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.5 12a7.5 7.5 0 0112.708-5.303M19.5 12a7.5 7.5 0 01-12.708 5.303" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 4v5h5M21 20v-5h-5" />
            </svg>
            새로고침
          </NuxtLink>
        </div>
        <div class="rounded-[1.75rem] bg-white/5 p-3 ring-1 ring-surface">
          <div class="rounded-[1.25rem] bg-black/30 p-2">
            <FileRow
              v-for="file in recentFiles"
              :key="file.name"
              :icon="file.icon"
              :name="file.name"
              :detail="file.detail"
              :to="file.to"
            />
          </div>
        </div>
      </section>

      <section id="pinned" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">즐겨찾기 폴더</h2>
          <button class="tap-area inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs uppercase font-semibold text-paper-oklch/70 ring-1 ring-surface hover:bg-white/15 hover:text-paper-oklch/90">
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 6h12M3 12h8M3 18h4M17 6v12m0 0 3-3m-3 3-3-3" />
            </svg>
            정렬
          </button>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div
            v-for="folder in pinned"
            :key="folder.name"
            class="rounded-2xl bg-white/5 px-5 py-5 ring-1 ring-surface transition hover:bg-white/10"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="grid size-10 place-items-center rounded-xl bg-white/10 ring-1 ring-surface">
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                  </svg>
                </div>
                <div>
                  <p class="font-medium">{{ folder.name }}</p>
                  <p class="text-xs text-paper-oklch/55">{{ folder.detail }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div
                  v-for="status in (folder.status.length <= 2 ? folder.status : folder.status.slice(0, 2))"
                  :key="status"
                  class="rounded-full bg-white/10 px-3 py-1 text-xs text-paper-oklch/60"
                >
                  {{ status }}
                </div>
                <div v-if="folder.status.length > 2" class="rounded-full bg-white/10 px-3 py-1 text-xs text-paper-oklch/60">+{{ folder.status.length - 2 }}</div>
              </div>
            </div>
            <div class="mt-4 flex items-center justify-between text-xs text-paper-oklch/50">
              <span>{{ folder.updated }}</span>
              <NuxtLink
                :to="folder.to"
                class="tap-area rounded-lg px-3 py-1 ring-1 ring-surface hover:bg-white/10"
              >
                열기
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
const recentFiles = [
  { icon: 'file', name: '서비스-프레임워크.pdf', detail: '8.6 MB · 오늘 수정', to: '/app/file-preview?file=framework' },
  { icon: 'image', name: 'hero-animation.mov', detail: '148 MB · 09:24 업로드', to: '/app/file-preview?file=hero-animation' },
  { icon: 'lock', name: '파트너계약서.zip', detail: '암호화됨 · 어제', to: '/app/file-preview?file=contract' },
  { icon: 'folder', name: '캠페인 공유', detail: '24개 항목 · 지난주', to: '/app/file-preview?file=campaign' }
]

const pinned = [
  { name: '디자인 시스템', detail: 'Figma · 120 Assets', status: ['보안 폴더'], updated: '1시간 전', to: '/app/file-preview?file=design-system' },
  { name: '법무 아카이브', detail: 'PDF · 202개 문서', status: ['공유', '읽기 전용', '보안 폴더'], updated: '2일 전', to: '/app/file-preview?file=legal-archive' }
]

// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })
</script>
