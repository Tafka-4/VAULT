<template>
  <main class="relative flex min-h-full flex-col">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_50%_at_50%_-10%,_rgba(214,211,209,0.18),_transparent_65%)]"></div>

    <section class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <NuxtLink to="/app/file-preview" class="inline-flex items-center gap-2 text-sm text-paper-oklch/70 hover:text-paper-oklch">
          <div class="grid size-7 place-items-center rounded-xl bg-white/5 ring-1 ring-surface">
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          미리보기로 돌아가기
        </NuxtLink>
        <div class="flex items-center gap-2">
          <NuxtLink
            to="/app/share-settings"
            class="tap-area hidden rounded-xl px-3 py-2 text-sm text-paper-oklch/70 ring-1 ring-surface hover:bg-white/5 sm:inline-flex"
          >
            공유 설정
          </NuxtLink>
          <button class="tap-area rounded-xl bg-white/90 px-3 py-2 text-sm font-semibold text-black hover:bg-white">
            다운로드
          </button>
        </div>
      </div>

      <header class="space-y-2">
        <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">파일 정보</p>
        <h1 class="text-2xl font-extrabold">프로젝트 메타데이터</h1>
        <p class="text-sm text-paper-oklch/70">버전 관리, 암호화 정책, 접근 권한을 한눈에 확인하세요.</p>
      </header>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section class="space-y-5">
          <div class="space-y-4 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <h2 class="text-base font-semibold">요약</h2>
            <ul class="grid gap-3 text-sm text-paper-oklch/70">
              <li class="flex items-center justify-between">
                <span>파일명</span>
                <span class="font-medium text-paper-oklch/85">Moodboard-08.jpg</span>
              </li>
              <li class="flex items-center justify-between">
                <span>크기</span>
                <span class="text-paper-oklch/60">12.4MB</span>
              </li>
              <li class="flex items-center justify-between">
                <span>버전</span>
                <span class="text-paper-oklch/60">v3 · Joy가 12분 전 수정</span>
              </li>
              <li class="flex items-center justify-between">
                <span>스토리지</span>
                <span class="text-paper-oklch/60">VAULT Edge · 서울 리전</span>
              </li>
            </ul>
          </div>

          <div class="space-y-4 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold">버전 기록</h2>
              <button type="button" class="tap-area rounded-xl px-3 py-2 text-xs text-paper-oklch/60 ring-1 ring-surface hover:bg-white/10">
                모두 다운로드
              </button>
            </div>
            <ul class="space-y-3 text-sm text-paper-oklch/70">
              <li v-for="history in versionHistory" :key="history.version" class="rounded-[1.5rem] bg-black/35 px-4 py-4 ring-1 ring-surface">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-paper-oklch/85">{{ history.version }}</span>
                  <span class="text-xs text-paper-oklch/55">{{ history.time }}</span>
                </div>
                <p class="mt-2 text-xs text-paper-oklch/55">{{ history.note }}</p>
              </li>
            </ul>
          </div>
        </section>

        <aside class="space-y-5">
          <div class="space-y-3 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <h2 class="text-base font-semibold">보안 & 권한</h2>
            <ul class="space-y-2 text-sm text-paper-oklch/70">
              <li class="flex items-center justify-between">
                <span>암호화</span>
                <span class="text-xs text-paper-oklch/55">종단간 · AES-256</span>
              </li>
              <li class="flex items-center justify-between">
                <span>링크 보호</span>
                <span class="text-xs text-paper-oklch/55">만료 6일 후 · 비밀번호 설정</span>
              </li>
              <li class="flex items-center justify-between">
                <span>액세스 수준</span>
                <span class="text-xs text-paper-oklch/55">편집 3명 · 읽기 7명</span>
              </li>
            </ul>
            <NuxtLink
              to="/app/share-settings"
              class="tap-area block rounded-xl bg-white/10 px-4 py-3 text-center text-xs text-paper-oklch/70 ring-1 ring-surface hover:bg-white/15"
            >
              공유 정책 조정
            </NuxtLink>
          </div>

          <div class="space-y-3 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <h2 class="text-base font-semibold">관련 활동</h2>
            <ul class="space-y-2 text-xs text-paper-oklch/60">
              <li v-for="activity in activities" :key="activity.time">
                <span class="text-paper-oklch/45">{{ activity.time }}</span>
                <span class="mx-2 text-paper-oklch/45">·</span>
                {{ activity.message }}
              </li>
            </ul>
            <NuxtLink to="/app/logs" class="text-xs text-paper-oklch/60 hover:text-paper-oklch/80">전체 로그 보기</NuxtLink>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })

const versionHistory = [
  { version: 'v3 · 조정안', time: '12분 전', note: '조도 대비 +5% · Joy Park' },
  { version: 'v2 · 파생', time: '어제 17:18', note: '톤 커브 조정 · Lukas' },
  { version: 'v1 · 업로드', time: '이번 주 월요일', note: '원본 촬영본 업로드' }
]

const activities = [
  { time: '5분 전', message: '외부 파트너가 뷰어로 열람' },
  { time: '27분 전', message: 'Joy가 링크 만료일을 연장' },
  { time: '어제', message: '버전 v2가 생성됨' }
]
</script>
