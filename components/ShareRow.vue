<template>
  <div class="flex items-center justify-between py-3 border-b border-white/5 last:border-none">
    <div class="flex items-center gap-3">
      <div class="size-9 grid place-items-center rounded-xl bg-white/10 ring-1 ring-surface">
        <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 8a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 20a6 6 0 1118 0H3z" />
        </svg>
      </div>
      <div>
        <p class="font-medium">{{ name }}</p>
        <p class="text-xs text-paper-oklch/60">{{ role }}</p>
      </div>
    </div>
    <button class="tap-area text-xs rounded-lg px-2 py-1 ring-1 ring-surface hover:bg-white/5">공유 옵션</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ name: string; role: string }>()
</script>
