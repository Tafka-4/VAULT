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
            class="rounded-[1.75rem] border-2 border-dashed border-white/15 bg-black/30 p-6 text-center text-sm text-paper-oklch/70"
          >
            <div class="mx-auto flex max-w-xs flex-col items-center gap-4">
              <div class="grid size-14 place-items-center rounded-full bg-white/10 ring-1 ring-surface">
                <svg xmlns="http://www.w3.org/2000/svg" class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div class="space-y-2">
                <p class="text-paper-oklch">파일을 끌어놓거나 업로드 버튼을 눌러주세요</p>
                <p class="text-xs text-paper-oklch/50">용량 제한 없음 · 이미지, 비디오, 문서 지원</p>
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
            <div v-if="queuedFiles.length" class="space-y-3">
              <div
                v-for="file in queuedFiles"
                :key="file.name"
                class="rounded-2xl bg-black/35 px-4 py-3 text-sm ring-1 ring-surface"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium">{{ file.name }}</p>
                    <p class="text-xs text-paper-oklch/55">{{ file.detail }}</p>
                  </div>
                  <span class="text-xs text-paper-oklch/45">{{ file.status }}</span>
                </div>
                <div class="mt-3 h-1.5 rounded-full bg-white/10">
                  <div class="h-full rounded-full bg-white/70" :style="{ width: file.progress }" />
                </div>
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
            <ul class="space-y-2 text-sm text-paper-oklch/70">
              <li
                v-for="item in recentUploads"
                :key="item.name"
                class="flex items-center justify-between rounded-xl bg-black/30 px-3 py-3 ring-1 ring-surface"
              >
                <div>
                  <p class="font-medium">{{ item.name }}</p>
                  <p class="text-xs text-paper-oklch/55">{{ item.detail }}</p>
                </div>
                <NuxtLink :to="item.to" class="text-xs text-paper-oklch/60 hover:text-paper-oklch/80">보기</NuxtLink>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })

const queuedFiles = ref<{
  name: string
  detail: string
  progress: string
  status: string
}[]>([])

const recentUploads = [
  { name: 'Kickoff-notes.pdf', detail: '어제 · 12MB', to: '/app/file-preview?file=kickoff' },
  { name: 'Scene-A3.mov', detail: '2일 전 · 420MB', to: '/app/file-preview?file=scene-a3' },
  { name: 'Brand-guide.fig', detail: '이번 주 · 85MB', to: '/app/file-preview?file=brand-guide' }
]

const handleFiles = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const files = Array.from(input.files).map(file => ({
    name: file.name,
    detail: `${(file.size / (1024 * 1024)).toFixed(1)}MB · 업로드 준비`,
    progress: '12%',
    status: '대기'
  }))

  queuedFiles.value = [...queuedFiles.value, ...files]
  input.value = ''
}
</script>
