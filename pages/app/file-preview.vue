<template>
  <main class="relative flex min-h-full flex-col">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_50%_at_50%_-10%,_rgba(214,211,209,0.18),_transparent_65%)]"></div>

    <section class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="space-y-1">
          <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">파일 미리보기</p>
          <h1 class="text-2xl font-extrabold">Moodboard-08.jpg</h1>
          <p class="text-sm text-paper-oklch/70">업로드 · Joy의 iPhone · 5분 전 · 12.4MB</p>
        </div>
        <div class="inline-flex items-center gap-2 text-xs text-paper-oklch/55">
          <span class="rounded-full bg-white/10 px-3 py-1">보안 폴더</span>
          <span class="rounded-full bg-white/10 px-3 py-1">태그11111</span>
          <span class="rounded-full bg-white/10 px-3 py-1">+2</span>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div class="space-y-4">
          <div class="flex gap-2 overflow-x-auto rounded-2xl bg-black/40 p-2 ring-1 ring-surface">
            <button
              v-for="mode in previewModes"
              :key="mode.label"
              :class="[
                'tap-area rounded-xl px-4 py-2 text-sm transition',
                mode.active ? 'bg-white text-black font-semibold' : 'bg-white/5 text-paper-oklch/70'
              ]"
            >
              {{ mode.label }}
            </button>
          </div>
          <div class="rounded-[2rem] bg-white/5 p-4 ring-1 ring-surface">
            <div class="rounded-[1.75rem] bg-gradient-to-br from-white/25 via-white/5 to-black/40 p-6">
              <div class="aspect-[3/4] overflow-hidden rounded-[1.25rem] bg-[url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=compress&cs=tinysrgb&w=600')] bg-cover bg-center shadow-vault">
                <div class="flex h-full flex-col justify-end bg-gradient-to-t from-black/60 via-black/10 to-transparent p-4">
                  <p class="text-sm font-medium text-white/90">Moodboard Layers</p>
                  <p class="text-xs text-white/70">색상, 질감, 조도 레퍼런스</p>
                </div>
              </div>
            </div>
          </div>
          <div class="grid gap-3 rounded-[1.5rem] bg-black/35 p-5 text-sm ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <span class="text-sm uppercase font-bold text-paper-oklch/55">메타데이터</span>
              <NuxtLink to="/app/file-info" class="text-xs text-paper-oklch/60 hover:text-paper-oklch/80">자세히 보기</NuxtLink>
            </div>
            <p class="text-paper-oklch/80">
              봄 시즌 캠페인 색감을 검토하는 무드보드입니다. 자연광과 야간 대비를 참고하기 위한 레이어가 포함되어 있습니다. <span class="font-semibold text-paper-oklch/55">(+24)</span>
            </p>
            <ul class="grid gap-2 text-xs text-paper-oklch/60">
              <li class="flex items-center justify-between">
                <span>버전</span>
                <span>v3 · 12분 전</span>
              </li>
              <li class="flex items-center justify-between">
                <span>해상도</span>
                <span>4000 × 5333 · Display P3</span>
              </li>
              <li class="flex items-center justify-between">
                <span>보관 정책</span>
                <span>오프라인 48시간</span>
              </li>
            </ul>
          </div>
        </div>

        <aside class="space-y-5">
          <div class="space-y-4 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-paper-oklch/55">링크 공유</h2>
              <NuxtLink to="/app/share-settings" class="text-xs text-paper-oklch/60 hover:text-paper-oklch/80">설정 이동</NuxtLink>
            </div>
            <p class="text-sm text-paper-oklch/70">링크 권한과 만료일을 조정해 외부 검토를 관리하세요.</p>
            <div class="space-y-3 rounded-[1.5rem] bg-black/35 p-4 text-sm ring-1 ring-surface">
              <div class="rounded-xl bg-black/40 px-3 py-3 text-xs text-paper-oklch/55">{{ shareLink }}</div>
              <button
                type="button"
                class="tap-area w-full rounded-xl bg-white/90 px-4 py-2 text-xs font-semibold text-black transition hover:bg-white"
                @click="copyShareLink"
              >
                링크 복사
              </button>
              <p class="text-xs text-paper-oklch/50">{{ copyFeedback }}</p>
            </div>
            <ul class="space-y-2 text-sm text-paper-oklch/70">
              <li
                v-for="target in shareTargets"
                :key="target.name"
                class="flex items-center justify-between rounded-xl bg-white/5 px-3 py-3 ring-1 ring-surface"
              >
                <div>
                  <p class="font-medium">{{ target.name }}</p>
                  <p class="text-xs text-paper-oklch/55">{{ target.detail }}</p>
                </div>
                <span class="text-xs text-paper-oklch/50">{{ target.status }}</span>
              </li>
            </ul>
          </div>

          <div class="space-y-3 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-paper-oklch/55">활동 로그</h2>
            </div>
            <div v-if="logs.length <= 6">
              <ul class="space-y-2 rounded-[0.75rem] bg-black/35 p-4 text-xs text-paper-oklch/65 ring-1 ring-surface">
                <li v-for="log in logs" :key="log.time">
                  <span class="text-paper-oklch/45 font-bold">{{ log.time }}</span> · {{ log.message }}
                </li>
              </ul>
            </div>
            <div v-else>
              <ul class="space-y-2 rounded-[0.75rem] bg-black/35 p-4 text-xs text-paper-oklch/65 ring-1 ring-surface">
                <li v-for="log in logs.slice(0, 6)" :key="log.time">
                  <span class="text-paper-oklch/45 font-bold">{{ log.time }}</span> · {{ log.message }}
                </li>
                <span class="text-paper-oklch/45 font-bold inline-block">...</span>
              </ul>
            </div>
            <NuxtLink
              to="/app/logs"
              class="tap-area block rounded-xl bg-white/10 px-4 py-3 text-center text-xs text-paper-oklch/70 ring-1 ring-surface hover:bg-white/15"
            >
              전체 로그 페이지로 이동
            </NuxtLink>
          </div>

          <div class="space-y-3 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <h2 class="text-sm font-bold text-paper-oklch/55">관련 항목</h2>
            <div class="rounded-[1.25rem] bg-black/30 p-2 ring-1 ring-surface">
              <FileRow
                v-for="item in relatedItems"
                :key="item.name"
                :icon="item.icon"
                :name="item.name"
                :detail="item.detail"
              />
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })

const previewModes = [
  { label: '이미지', active: true },
  { label: '비디오', active: false },
  { label: '문서', active: false },
  { label: '음악', active: false },
  { label: '기타', active: false }
]

const shareTargets = [
  { name: 'Joy Park', detail: '편집 권한 · 내부', status: '활성' },
  { name: '외부 링크', detail: '만료 7일 후', status: '읽기 전용' }
]

const relatedItems = [
  { icon: 'file', name: 'Campaign-color.ai', detail: '오늘' },
  { icon: 'image', name: 'Night-scout.mov', detail: '어제' },
  { icon: 'file', name: 'Set-design.pdf', detail: '2일 전' }
]

const logs = [
  { time: '5분 전', message: '수정 됨 (4번째 버전)' },
  { time: '12분 전', message: '수정 됨 (3번째 버전)' },
  { time: '27분 전', message: '열람 됨' },
  { time: '42분 전', message: '수정 됨 (2번째 버전)' },
  { time: '57분 전', message: '수정 됨 (1번째 버전)' },
  { time: '1시간 12분 전', message: '업로드 됨' },
  { time: '1시간 27분 전', message: '업로드 됨' }

]

const shareLink = 'https://vault.app/jp/moodboard-08'
const showLogs = ref(false)
const copyState = ref<'idle' | 'copied' | 'error'>('idle')
let copyTimeout: ReturnType<typeof setTimeout> | undefined

const toggleLogs = () => {
  showLogs.value = !showLogs.value
}

const copyShareLink = async () => {
  if (!import.meta.client) return
  if (copyTimeout) clearTimeout(copyTimeout)
  try {
    await navigator.clipboard.writeText(shareLink)
    copyState.value = 'copied'
  } catch (error) {
    copyState.value = 'error'
  }
  copyTimeout = setTimeout(() => {
    copyState.value = 'idle'
  }, 2000)
}

const copyFeedback = computed(() => {
  if (copyState.value === 'copied') return '링크가 복사되었습니다.'
  if (copyState.value === 'error') return '복사에 실패했습니다. 길게 눌러 직접 복사하세요.'
  return '만료 정책과 비밀번호는 공유 설정에서 변경할 수 있습니다.'
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
