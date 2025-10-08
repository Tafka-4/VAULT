<template>
  <main class="relative flex min-h-full flex-col">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_50%_at_50%_-10%,_rgba(214,211,209,0.18),_transparent_65%)]"></div>

    <section class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8">
      <header class="space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-1">
            <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">라이브러리 검색</p>
            <h1 class="text-2xl font-extrabold">파일과 폴더 찾기</h1>
            <p class="text-sm text-paper-oklch/70">
              빠르게 암호화된 데이터를 찾아보세요.
            </p>
          </div>
          <NuxtLink
            to="/app/upload"
            class="tap-area inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-sm font-semibold text-black hover:bg-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
            </svg>
            새 업로드
          </NuxtLink>
        </div>
        <div class="rounded-[2rem] bg-white/5 p-4 ring-1 ring-surface">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-2 rounded-[1.75rem] bg-black/35 px-4 py-3 ring-1 ring-surface">
              <svg xmlns="http://www.w3.org/2000/svg" class="size-5 text-paper-oklch/50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z" />
              </svg>
              <input
                v-model="keyword"
                type="search"
                placeholder="파일, 폴더 명 입력"
                class="w-full bg-transparent text-sm text-paper-oklch placeholder:text-paper-oklch/40 focus:outline-none"
              />
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="preset in presets"
                :key="preset.value"
                type="button"
                :class="[
                  'tap-area rounded-xl px-4 py-2 text-xs uppercase tracking-[0.2em] transition',
                  preset.active ? 'bg-white text-black font-semibold' : 'bg-white/10 text-paper-oklch/60 hover:bg-white/15'
                ]"
                @click="applyPreset(preset.value)"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>
          <div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-paper-oklch/55">
            <span class="rounded-full bg-white/10 px-3 py-1">필터 · {{ activeChips.join(' · ') }}</span>
            <button type="button" class="tap-area rounded-full px-3 py-1 hover:bg-white/10" @click="clearFilters">
              초기화
            </button>
          </div>
        </div>
      </header>

      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">검색 결과</h2>
          <span class="text-xs text-paper-oklch/55">총 {{ results.length }}개</span>
        </div>
        <div class="rounded-[1.75rem] bg-white/5 p-3 ring-1 ring-surface">
          <div class="rounded-[1.25rem] bg-black/30 p-2">
            <FileRow
              v-for="item in results"
              :key="item.name"
              :icon="item.icon"
              :name="item.name"
              :detail="item.detail"
              :to="item.to"
            />
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, watchEffect } from 'vue'

// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })

const route = useRoute()
const router = useRouter()

const presetOrder = ['recent', 'shared', 'secure'] as const

const state = reactive({
  keyword: '',
  preset: 'recent' as (typeof presetOrder)[number]
})

const presetLabels: Record<(typeof presetOrder)[number], string> = {
  recent: '최근 기록',
  shared: '공유 중',
  secure: '보안 파일'
}

const resultMap = {
  recent: [
    { icon: 'file', name: '서비스-프레임워크.pdf', detail: '문서 · 8.6MB · 오늘 수정', to: '/app/file-preview?file=framework' },
    { icon: 'image', name: 'Moodboard-08.jpg', detail: '이미지 · Joy 업로드 · 5분 전', to: '/app/file-preview?file=moodboard' },
    { icon: 'folder', name: '캠페인 공유', detail: '폴더 · 24개 항목 · 지난주', to: '/app/file-preview?file=campaign' }
  ],
  shared: [
    { icon: 'folder', name: '프로덕션 자료실', detail: '편집 권한 · 팀 5명', to: '/app/share-settings' },
    { icon: 'file', name: '파트너계약서.zip', detail: '문서 · 암호화 · 어제 공유', to: '/app/file-preview?file=contract' },
    { icon: 'image', name: 'Spotlight.mov', detail: '비디오 · 외부 링크 · 만료 3일 후', to: '/app/file-preview?file=spotlight' }
  ],
  secure: [
    { icon: 'lock', name: '인증자료.key', detail: '보안 키 · 2단계 확인 필요', to: '/app/file-info?file=credential' },
    { icon: 'file', name: '임원보고서.pdf', detail: '문서 · 암호 보호 · 열람 2회', to: '/app/file-info?file=board-report' },
    { icon: 'lock', name: '보관함', detail: '폴더 · 콜드 스토리지', to: '/app/file-info?file=archive' }
  ]
}

type PresetKey = keyof typeof resultMap

const presets = computed(() =>
  presetOrder.map(value => ({
    value,
    label: presetLabels[value],
    active: state.preset === value
  }))
)

const applyPreset = (value: PresetKey) => {
  state.preset = value
  router.replace({ query: { ...route.query, preset: value } })
}

const clearFilters = () => {
  state.keyword = ''
  applyPreset('recent')
}

const results = computed(() => {
  if (!state.keyword) return resultMap[state.preset]
  const keyword = state.keyword.toLowerCase()
  return resultMap[state.preset].filter(item => item.name.toLowerCase().includes(keyword))
})

const activeChips = computed(() => [presetLabels[state.preset], state.keyword ? `키워드 · ${state.keyword}` : '키워드 없음'])

watchEffect(() => {
  const queryPreset = route.query.preset
  if (typeof queryPreset === 'string' && presetOrder.includes(queryPreset as PresetKey)) {
    state.preset = queryPreset as PresetKey
  }
})

const keyword = computed({
  get: () => state.keyword,
  set: value => {
    state.keyword = value.trimStart()
  }
})
</script>
