<template>
  <main class="relative flex min-h-full flex-col">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_50%_at_50%_-10%,_rgba(214,211,209,0.18),_transparent_65%)]"></div>

    <section class="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <NuxtLink
          to="/app/share"
          class="tap-area inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-paper-oklch/75 ring-1 ring-surface hover:bg-white/15"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7" />
          </svg>
          공유 허브로 돌아가기
        </NuxtLink>
        <button class="tap-area inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-black hover:bg-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" />
          </svg>
          변경 사항 저장
        </button>
      </div>

      <header class="space-y-2">
        <p class="text-xs uppercase tracking-[0.32em] text-paper-oklch/55">공유 설정</p>
        <h1 class="text-2xl font-extrabold">접근 제어 및 만료 정책</h1>
        <p class="text-sm text-paper-oklch/70">링크 만료, 비밀번호 및 팀 권한을 조정해 안전하게 공유하세요.</p>
      </header>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <section class="space-y-5">
          <div class="space-y-4 rounded-[2rem] bg-white/5 p-6 ring-1 ring-surface">
            <h2 class="text-base font-semibold">외부 링크 정책</h2>
            <div class="space-y-3 text-sm text-paper-oklch/70">
              <label class="flex items-center justify-between gap-4 rounded-[1.5rem] bg-black/30 px-4 py-3 ring-1 ring-surface">
                <div>
                  <p class="font-medium">만료 활성화</p>
                  <p class="text-xs text-paper-oklch/55">만료 이후 자동으로 접근이 차단됩니다.</p>
                </div>
                <span class="relative inline-flex h-6 w-11 items-center">
                  <input type="checkbox" checked class="peer sr-only" />
                  <span class="h-full w-full rounded-full bg-white/15 transition peer-checked:bg-white/60"></span>
                  <span class="absolute left-1 size-4 rounded-full bg-white transition peer-checked:translate-x-5 peer-checked:bg-black"></span>
                </span>
              </label>
              <div class="rounded-[1.5rem] bg-black/30 px-4 py-4 ring-1 ring-surface">
                <label class="flex flex-col gap-3 text-xs text-paper-oklch/55">
                  만료 날짜
                  <input
                    type="date"
                    value="2024-06-30"
                    class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-paper-oklch focus:border-white/40 focus:outline-none"
                  />
                </label>
              </div>
              <label class="flex items-center justify-between gap-4 rounded-[1.5rem] bg-black/30 px-4 py-3 ring-1 ring-surface">
                <div>
                  <p class="font-medium">비밀번호 보호</p>
                  <p class="text-xs text-paper-oklch/55">링크 열람 전 비밀번호 입력이 필요합니다.</p>
                </div>
                <span class="relative inline-flex h-6 w-11 items-center">
                  <input type="checkbox" checked class="peer sr-only" />
                  <span class="h-full w-full rounded-full bg-white/15 transition peer-checked:bg-white/60"></span>
                  <span class="absolute left-1 size-4 rounded-full bg-white transition peer-checked:translate-x-5 peer-checked:bg-black"></span>
                </span>
              </label>
              <div class="rounded-[1.5rem] bg-black/30 px-4 py-4 ring-1 ring-surface">
                <label class="flex flex-col gap-3 text-xs text-paper-oklch/55">
                  공유 비밀번호
                  <input
                    type="text"
                    value="vault-2024"
                    class="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-paper-oklch focus:border-white/40 focus:outline-none"
                  />
                </label>
                <p class="mt-2 text-xs text-emerald-300/80">비밀번호가 안전하게 저장되었습니다.</p>
              </div>
            </div>
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
              <li
                v-for="alert in alerts"
                :key="`${alert.time}-${alert.code}`"
                class="rounded-xl bg-black/35 px-4 py-3 ring-1 ring-surface"
              >
                <div class="flex items-center justify-between">
                  <span class="text-paper-oklch/50">{{ alert.time }}</span>
                  <span
                    class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
                    :class="alert.type === 'error' ? 'bg-red-200/20 text-red-100' : alert.type === 'warning' ? 'bg-amber-200/20 text-amber-100' : 'bg-emerald-200/20 text-emerald-100'"
                  >
                    {{ alert.type === 'error' ? '에러' : alert.type === 'warning' ? '주의' : '안내' }}
                  </span>
                </div>
                <p class="mt-1 text-paper-oklch/70">{{ alert.message }}</p>
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

type AlertCode = 'external_access' | 'password_required'
type AlertEntry = {
  time: string
  code: AlertCode
  type: 'info' | 'warning' | 'error'
}

const alertMessages: Record<AlertCode, string> = {
  external_access: 'Moodboard 링크가 외부에서 2회 열람되었습니다.',
  password_required: '암호 미설정 링크 1개를 자동으로 비활성화했습니다.'
}

const rawAlerts: AlertEntry[] = [
  { time: '오늘', code: 'external_access', type: 'info' },
  { time: '어제', code: 'password_required', type: 'warning' }
]

const alerts = rawAlerts.map((alert) => ({
  ...alert,
  message: alertMessages[alert.code]
}))
</script>
