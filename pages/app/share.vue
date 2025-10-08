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
              <span class="text-xs text-paper-oklch/50">{{ activeLinks.length }}개</span>
            </div>
            <ul class="mt-4 space-y-3">
              <li
                v-for="link in activeLinks"
                :key="link.name"
                class="rounded-[1.5rem] bg-black/35 p-4 text-sm ring-1 ring-surface"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="font-semibold">{{ link.name }}</p>
                    <p class="text-xs text-paper-oklch/55">{{ link.detail }}</p>
                  </div>
                  <span class="rounded-full bg-white/10 px-3 py-1 text-xs text-paper-oklch/55">{{ link.expires }}</span>
                </div>
                <div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-paper-oklch/60">
                  <span class="rounded-full bg-white/5 px-3 py-1">{{ link.permission }}</span>
                  <span>{{ link.lastViewed }}</span>
                  <NuxtLink :to="link.manageTo" class="tap-area rounded-xl px-3 py-1 hover:bg-white/10">
                    관리
                  </NuxtLink>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <aside class="space-y-5">
          <div class="space-y-3 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold">즐겨찾는 공유 폴더</h2>
              <NuxtLink to="/app/file-preview" class="text-xs text-paper-oklch/60 hover:text-paper-oklch/80">열기</NuxtLink>
            </div>
            <ul class="space-y-2 text-sm text-paper-oklch/70">
              <li
                v-for="folder in pinnedShare"
                :key="folder.name"
                class="flex items-center justify-between rounded-[1.25rem] bg-black/35 px-4 py-4 ring-1 ring-surface"
              >
                <div>
                  <p class="font-medium">{{ folder.name }}</p>
                  <p class="text-xs text-paper-oklch/55">{{ folder.detail }}</p>
                </div>
                <span class="text-xs text-paper-oklch/50">{{ folder.updated }}</span>
              </li>
            </ul>
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
</template>

<script setup lang="ts">
// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })

const activeLinks = [
  {
    name: '봄 캠페인 무드보드',
    detail: '읽기 전용 · 만료 7일 전 알림',
    expires: '만료 6일 후',
    permission: '읽기 전용',
    lastViewed: '어제 외부 파트너 열람',
    manageTo: '/app/share-settings'
  },
  {
    name: '프로덕션 자료실',
    detail: '편집 권한 · 내부 팀',
    expires: '만료 없음',
    permission: '편집 가능',
    lastViewed: 'Joy가 2시간 전 수정',
    manageTo: '/app/share-settings'
  }
]

const invitations = [
  { name: 'Mina Park', email: 'mina@atelier.studio', permission: '편집', status: '수락 완료', sentAt: '오늘 08:20' },
  { name: '김지훈', email: 'jihoon@vault.team', permission: '읽기 전용', status: '전송됨', sentAt: '어제 17:42' },
  { name: 'Lukas', email: 'lukas@renderlab.co', permission: '댓글', status: '미확인', sentAt: '2일 전' }
]

const pinnedShare = [
  { name: '런칭 보도자료', detail: 'PDF · 외부 열람', updated: '오늘' },
  { name: '파트너 계약', detail: 'ZIP · 암호 보호', updated: '어제' },
  { name: '스팟 라이트', detail: '비디오 · 만료 3일 후', updated: '3일 전' }
]

const externalStatus = [
  { label: '외부 열람 링크', value: '5개 활성' },
  { label: '만료 예정', value: '2개 · 48시간 내' },
  { label: '암호 보호', value: '4개 적용' }
]
</script>
