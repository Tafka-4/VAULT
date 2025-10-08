<template>
  <main class="relative flex min-h-full flex-col">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_50%_at_50%_-10%,_rgba(214,211,209,0.18),_transparent_65%)]"></div>

    <section class="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <NuxtLink to="/app/share" class="inline-flex items-center gap-2 text-sm text-paper-oklch/70 hover:text-paper-oklch">
          <div class="grid size-7 place-items-center rounded-xl bg-white/5 ring-1 ring-surface">
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          공유 허브로 돌아가기
        </NuxtLink>
        <button class="tap-area rounded-xl bg-white/90 px-3 py-2 text-sm font-semibold text-black hover:bg-white">
          변경 사항 저장
        </button>
      </div>

      <header class="space-y-2">
        <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">공유 설정</p>
        <h1 class="text-2xl font-extrabold">접근 제어 및 만료 정책</h1>
        <p class="text-sm text-paper-oklch/70">링크 만료, 비밀번호 및 팀 권한을 조정해 안전하게 공유하세요.</p>
      </header>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section class="space-y-5">
          <div class="space-y-4 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <h2 class="text-base font-semibold">외부 링크 정책</h2>
            <div class="space-y-3 text-sm text-paper-oklch/70">
              <label class="flex items-center justify-between gap-4 rounded-[1.5rem] bg-black/35 px-4 py-3 ring-1 ring-surface">
                <div>
                  <p class="font-medium">만료 활성화</p>
                  <p class="text-xs text-paper-oklch/55">만료 이후 자동으로 접근이 차단됩니다.</p>
                </div>
                <input type="checkbox" checked class="size-5 accent-white" />
              </label>
              <div class="rounded-[1.5rem] bg-black/35 px-4 py-4 ring-1 ring-surface">
                <label class="flex flex-col gap-2 text-xs text-paper-oklch/55">
                  만료 날짜
                  <input
                    type="date"
                    value="2024-06-30"
                    class="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-paper-oklch focus:border-white/30 focus:outline-none"
                  />
                </label>
              </div>
              <label class="flex items-center justify-between gap-4 rounded-[1.5rem] bg-black/35 px-4 py-3 ring-1 ring-surface">
                <div>
                  <p class="font-medium">비밀번호 보호</p>
                  <p class="text-xs text-paper-oklch/55">링크 열람 전 비밀번호 입력이 필요합니다.</p>
                </div>
                <input type="checkbox" checked class="size-5 accent-white" />
              </label>
              <label class="flex flex-col gap-2 rounded-[1.5rem] bg-black/35 px-4 py-4 text-xs text-paper-oklch/55 ring-1 ring-surface">
                공유 비밀번호
                <input
                  type="text"
                  value="vault-2024"
                  class="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-paper-oklch focus:border-white/30 focus:outline-none"
                />
              </label>
            </div>
          </div>

          <div class="space-y-4 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold">팀 권한</h2>
              <button type="button" class="tap-area rounded-xl px-3 py-2 text-xs text-paper-oklch/60 ring-1 ring-surface hover:bg-white/10">
                새 팀원 초대
              </button>
            </div>
            <ul class="space-y-3 text-sm text-paper-oklch/70">
              <li
                v-for="member in members"
                :key="member.name"
                class="flex items-center justify-between rounded-[1.5rem] bg-black/35 px-4 py-4 ring-1 ring-surface"
              >
                <div>
                  <p class="font-medium">{{ member.name }}</p>
                  <p class="text-xs text-paper-oklch/55">{{ member.role }}</p>
                </div>
                <select
                  class="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-paper-oklch focus:border-white/30 focus:outline-none"
                  :value="member.permission"
                >
                  <option value="edit">편집</option>
                  <option value="comment">댓글</option>
                  <option value="view">읽기</option>
                </select>
              </li>
            </ul>
          </div>
        </section>

        <aside class="space-y-5">
          <div class="space-y-3 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <h2 class="text-base font-semibold">공유 요약</h2>
            <ul class="space-y-2 text-sm text-paper-oklch/70">
              <li class="flex items-center justify-between">
                <span>활성 링크</span>
                <span class="text-xs text-paper-oklch/55">5개</span>
              </li>
              <li class="flex items-center justify-between">
                <span>외부 열람</span>
                <span class="text-xs text-paper-oklch/55">3개 팀</span>
              </li>
              <li class="flex items-center justify-between">
                <span>암호 보호</span>
                <span class="text-xs text-paper-oklch/55">4개 링크</span>
              </li>
            </ul>
          </div>

          <div class="space-y-3 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <h2 class="text-base font-semibold">보안 알림</h2>
            <ul class="space-y-2 text-xs text-paper-oklch/60">
              <li v-for="alert in alerts" :key="alert.time" class="rounded-xl bg-black/35 px-4 py-3 ring-1 ring-surface">
                <span class="text-paper-oklch/45">{{ alert.time }}</span>
                <span class="mx-2 text-paper-oklch/45">·</span>
                {{ alert.message }}
              </li>
            </ul>
            <NuxtLink to="/app/logs" class="text-xs text-paper-oklch/60 hover:text-paper-oklch/80">로그 열기</NuxtLink>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
// @ts-expect-error - Nuxt macro provided at compile-time
definePageMeta({ layout: 'app' })

const members = [
  { name: 'Joy Park', role: '크리에이티브 디렉터', permission: 'edit' },
  { name: 'Mina Park', role: '프로젝트 매니저', permission: 'comment' },
  { name: 'Lukas', role: '외부 협업자', permission: 'view' }
]

const alerts = [
  { time: '오늘', message: 'Moodboard 링크가 외부에서 2회 열람되었습니다.' },
  { time: '어제', message: '암호 미설정 링크 1개를 자동으로 비활성화했습니다.' }
]
</script>
