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
          <span class="text-xs text-paper-oklch/55">
            {{ pending ? '검색 중...' : `총 ${results.length}개` }}
          </span>
        </div>
        <div class="rounded-[1.75rem] bg-white/5 p-3 ring-1 ring-surface">
          <div class="rounded-[1.25rem] bg-black/30 p-2">
            <FileRow
              v-if="results.length"
              v-for="item in results"
              :key="item.id"
              :icon="item.mimeType.startsWith('image/') ? 'image' : 'file'"
              :name="item.name"
              :detail="`${formatBytes(item.size)} · ${formatRelative(item.updatedAt)}`"
              :to="`/app/file-preview/${item.id}`"
            />
            <p v-else class="p-4 text-center text-sm text-paper-oklch/55">조건에 맞는 파일이 없습니다.</p>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import type { StoredFile } from '~/types/storage'

// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })

type PresetKey = 'recent' | 'shared' | 'secure'

const route = useRoute()
const router = useRouter()
const presetOrder: PresetKey[] = ['recent', 'shared', 'secure']

const preset = ref<PresetKey>((route.query.preset as PresetKey) || 'recent')
const keyword = ref('')

const presetLabels: Record<PresetKey, string> = {
  recent: '최근 기록',
  shared: '이름순',
  secure: '대형/보안 파일'
}

const { data, pending, refresh } = await useFetch<{ data: StoredFile[] }>('/api/files', { key: 'files-search' })
const files = computed(() => data.value?.data ?? [])

const presets = computed(() =>
  presetOrder.map(value => ({
    value,
    label: presetLabels[value],
    active: preset.value === value
  }))
)

const applyPreset = (value: PresetKey) => {
  preset.value = value
  router.replace({ query: { ...route.query, preset: value } })
}

const clearFilters = () => {
  keyword.value = ''
  applyPreset('recent')
}

const filteredByPreset = computed(() => {
  const list = [...files.value]
  switch (preset.value) {
    case 'recent':
      return list.sort((a, b) => b.updatedAt - a.updatedAt)
    case 'shared':
      return list.sort((a, b) => a.name.localeCompare(b.name))
    case 'secure':
      return list
        .filter(file => file.mimeType.includes('zip') || file.name.toLowerCase().includes('key') || file.size > 25 * 1024 * 1024)
        .sort((a, b) => b.size - a.size)
    default:
      return list
  }
})

const results = computed(() => {
  const base = filteredByPreset.value
  const term = keyword.value.trim().toLowerCase()
  if (!term) return base
  return base.filter(file => file.name.toLowerCase().includes(term))
})

const activeChips = computed(() => [
  presetLabels[preset.value],
  keyword.value ? `키워드 · ${keyword.value}` : '키워드 없음'
])

watchEffect(() => {
  const queryPreset = route.query.preset
  if (typeof queryPreset === 'string' && presetOrder.includes(queryPreset as PresetKey)) {
    preset.value = queryPreset as PresetKey
  }
})

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0B'
  const units = ['B', 'KB', 'MB', 'GB']
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
</script>
