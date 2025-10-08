<template>
  <div :class="['rounded-vault p-5 ring-1 ring-surface shadow-vault', highlight ? 'bg-white/10' : 'bg-white/5']">
    <div class="flex items-baseline justify-between">
      <h3 class="font-bold text-lg">{{ plan }}</h3>
      <span class="text-sm text-paper-oklch/70">{{ price }}</span>
    </div>
    <ul class="mt-4 space-y-2 text-sm">
      <li v-for="feature in features" :key="feature" class="flex gap-2 items-start">
        <svg xmlns="http://www.w3.org/2000/svg" class="size-4 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" />
        </svg>
        <span>{{ feature }}</span>
      </li>
    </ul>
    <button class="mt-5 w-full tap-area rounded-xl px-4 py-3 font-semibold bg-white/90 text-black hover:bg-white">선택</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ plan: string; price: string; features: string[]; highlight?: boolean }>()
</script>
