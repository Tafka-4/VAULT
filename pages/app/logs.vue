<template>
  <main class="relative flex min-h-full flex-col">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_50%_at_50%_-10%,_rgba(214,211,209,0.18),_transparent_65%)]"></div>

    <section class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div class="space-y-1">
          <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">보안 활동</p>
          <h1 class="text-2xl font-extrabold">활동 로그</h1>
          <p class="text-sm text-paper-oklch/70">접속, 공유, 다운로드 내역을 확인하고 이상 징후를 빠르게 파악하세요.</p>
        </div>
        <NuxtLink
          to="/app/share"
          class="tap-area inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-paper-oklch/75 ring-1 ring-surface hover:bg-white/15"
        >
          공유 허브 이동
        </NuxtLink>
      </header>

      <div class="space-y-4 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="filter in filters"
              :key="filter.value"
              type="button"
              :class="[
                'tap-area rounded-xl px-4 py-2 text-xs uppercase tracking-[0.22em] transition',
                filter.active ? 'bg-white text-black font-semibold' : 'bg-white/10 text-paper-oklch/60 hover:bg-white/15'
              ]"
              @click="selectFilter(filter.value)"
            >
              {{ filter.label }}
            </button>
          </div>
          <span class="text-xs text-paper-oklch/55">최근 30일</span>
        </div>

        <div class="rounded-[1.5rem] bg-black/30 ring-1 ring-surface">
          <table class="w-full text-left text-sm text-paper-oklch/70">
            <thead class="text-xs uppercase tracking-[0.18em] text-paper-oklch/45">
              <tr>
                <th class="px-4 py-3">시간</th>
                <th class="px-4 py-3">사용자</th>
                <th class="px-4 py-3">활동</th>
                <th class="px-4 py-3">위치</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in filteredLogs" :key="entry.time" class="border-t border-white/5">
                <td class="px-4 py-3 text-xs text-paper-oklch/50">{{ entry.time }}</td>
                <td class="px-4 py-3">
                  <div class="flex flex-col">
                    <span class="font-medium text-paper-oklch/80">{{ entry.user }}</span>
                    <span class="text-xs text-paper-oklch/55">{{ entry.device }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-paper-oklch/75">{{ entry.action }}</td>
                <td class="px-4 py-3 text-xs text-paper-oklch/55">{{ entry.location }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-paper-oklch/55">
          <span>로그는 90일간 보관됩니다.</span>
          <button type="button" class="tap-area rounded-full px-3 py-1 hover:bg-white/10">CSV 내보내기</button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'

// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })

type FilterKey = 'all' | 'share' | 'security' | 'download'

const state = reactive<{ filter: FilterKey }>({ filter: 'all' })

const filterLabels: Record<FilterKey, string> = {
  all: '전체',
  share: '공유',
  security: '보안',
  download: '다운로드'
}

const filters = computed(() =>
  (Object.keys(filterLabels) as FilterKey[]).map(value => ({
    value,
    label: filterLabels[value],
    active: state.filter === value
  }))
)

const logs = [
  {
    time: '오늘 · 09:42',
    user: 'Joy Park',
    device: 'macOS · Chrome',
    action: 'Moodboard-08.jpg 링크 열람',
    location: 'Seoul, KR',
    type: 'share' as FilterKey
  },
  {
    time: '오늘 · 08:18',
    user: '관리자',
    device: 'iOS · VAULT Mobile',
    action: '2단계 인증 백업 키 생성',
    location: 'Seoul, KR',
    type: 'security' as FilterKey
  },
  {
    time: '어제 · 22:03',
    user: 'Mina Park',
    device: 'Windows · Edge',
    action: '파트너계약서.zip 다운로드',
    location: 'Busan, KR',
    type: 'download' as FilterKey
  },
  {
    time: '어제 · 17:26',
    user: 'Lukas',
    device: 'Ubuntu · Firefox',
    action: '프로덕션 자료실 편집',
    location: 'Berlin, DE',
    type: 'share' as FilterKey
  }
]

const filteredLogs = computed(() => {
  if (state.filter === 'all') return logs
  return logs.filter(entry => entry.type === state.filter)
})

const selectFilter = (filter: FilterKey) => {
  state.filter = filter
}
</script>
