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
          <div class="flex items-center gap-3 text-xs text-paper-oklch/55">
            <span>{{ logs.length }}건 표시</span>
            <button type="button" class="tap-area rounded-xl px-3 py-1 hover:bg-white/10" @click="refreshLogs">새로고침</button>
          </div>
        </div>

        <div class="rounded-[1.5rem] bg-black/30 ring-1 ring-surface">
          <table class="w-full text-left text-sm text-paper-oklch/70">
            <thead class="text-xs uppercase tracking-[0.18em] text-paper-oklch/45">
              <tr>
                <th class="px-4 py-3">시간</th>
                <th class="px-4 py-3">활동</th>
                <th class="px-4 py-3">대상</th>
                <th class="px-4 py-3">세부 정보</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!pending && !filteredLogs.length">
                <td colspan="4" class="px-4 py-6 text-center text-xs text-paper-oklch/55">최근 활동 로그가 없습니다.</td>
              </tr>
              <tr v-for="entry in filteredLogs" :key="entry.id" class="border-t border-white/5">
                <td class="px-4 py-3 text-xs text-paper-oklch/50">{{ formatTimestamp(entry.createdAt) }}</td>
                <td class="px-4 py-3">
                  <p class="font-semibold text-paper-oklch/85">{{ actionLabel(entry.action) }}</p>
                  <p class="text-xs text-paper-oklch/55">{{ describeAction(entry) }}</p>
                </td>
                <td class="px-4 py-3 text-sm text-paper-oklch/80">
                  <div class="flex flex-col">
                    <span class="font-medium">{{ entry.targetName || '—' }}</span>
                    <span class="text-xs text-paper-oklch/55">{{ entry.targetId || '' }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-xs text-paper-oklch/55">{{ formatMetadata(entry) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-paper-oklch/55">
          <span>최근 50개의 활동을 표시합니다.</span>
          <button type="button" class="tap-area rounded-full px-3 py-1 hover:bg-white/10" @click="downloadCsv">CSV 내보내기</button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ActivityLog } from '~/types/activity'

// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })

type FilterKey = 'all' | 'upload' | 'download' | 'delete' | 'move'

const selectedFilter = ref<FilterKey>('all')

const { data, pending, refresh: refreshLogs } = await useFetch<{ data: ActivityLog[] }>('/api/activity/logs', {
  key: 'activity-logs'
})

const logs = computed(() => data.value?.data ?? [])

const filters = computed(() => {
  const base: { value: FilterKey; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'upload', label: '업로드' },
    { value: 'download', label: '다운로드' },
    { value: 'delete', label: '삭제' },
    { value: 'move', label: '이동' }
  ]
  return base.map(filter => ({ ...filter, active: selectedFilter.value === filter.value }))
})

const filteredLogs = computed(() => {
  if (selectedFilter.value === 'all') return logs.value
  return logs.value.filter(entry => entry.action === selectedFilter.value)
})

const selectFilter = (filter: FilterKey) => {
  selectedFilter.value = filter
}

const actionLabel = (action: string) => {
  switch (action) {
    case 'upload':
      return '파일 업로드'
    case 'download':
      return '파일 다운로드'
    case 'delete':
      return '파일 삭제'
    case 'move':
      return '파일 이동'
    default:
      return action
  }
}

const describeAction = (entry: ActivityLog) => {
  const meta = (entry.metadata || null) as Record<string, any> | null
  if (entry.action === 'move' && meta) {
    const from = meta.from ?? '어디서든'
    const to = meta.to ?? '루트'
    return `폴더 이동: ${from || '루트'} → ${to || '루트'}`
  }
  if (entry.action === 'download' && meta) {
    const bytes = typeof meta.bytes === 'number' ? meta.bytes : null
    return bytes ? `${formatBytes(bytes)} 전송` : '다운로드 실행'
  }
  if (entry.action === 'upload' && meta) {
    const size = typeof meta.size === 'number' ? meta.size : null
    return size ? `${formatBytes(size)} 업로드 완료` : '업로드 완료'
  }
  return '작업 완료'
}

const formatMetadata = (entry: ActivityLog) => {
  if (entry.action === 'move' && entry.metadata) {
    return describeAction(entry)
  }
  const meta = entry.metadata as Record<string, any> | null
  if (meta?.chunks) {
    return `${meta.chunks}개 청크`
  }
  return ''
}

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)}${units[unit]}`
}

const downloadCsv = () => {
  if (!process.client) return
  const header = ['createdAt', 'action', 'targetId', 'targetName']
  const rows = logs.value.map(log => [new Date(log.createdAt).toISOString(), log.action, log.targetId ?? '', log.targetName ?? ''])
  const csv = [header, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'activity-logs.csv'
  link.click()
  URL.revokeObjectURL(url)
}
</script>
