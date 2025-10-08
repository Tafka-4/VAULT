<template>
  <div class="flex items-center justify-between py-3 border-b border-white/5 last:border-none">
    <p class="text-sm">{{ label }}</p>
    <span class="text-xs px-2 py-1 rounded-lg ring-1 ring-surface bg-white/5">{{ value }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string }>()
</script>
