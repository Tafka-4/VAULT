<template>
  <div :class="outerClass">
    <div :class="frameClass">
      <div class="flex items-center justify-between px-4 py-3 text-sm text-paper-oklch/80">
        <span class="font-semibold">{{ title }}</span>
        <span class="inline-flex gap-1">
          <span class="size-1.5 rounded-full bg-emerald-400/70"></span>
          <span class="size-1.5 rounded-full bg-amber-300/70"></span>
          <span class="size-1.5 rounded-full bg-rose-400/70"></span>
        </span>
      </div>
      <div class="px-3 pb-4">
        <slot name="body" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ title: string; primary?: boolean }>(), {
  primary: false
})

const outerClass = computed(() => [
  'rounded-[2rem] shadow-vault p-3 border transition-colors duration-200',
  props.primary ? 'border-white/20 bg-white/10 ring-1 ring-white/20' : 'border-paper-oklch/15 bg-white/[0.04]'
])

const frameClass = computed(() => [
  'rounded-[1.25rem] overflow-hidden ring-1 backdrop-blur-sm transition-colors duration-200',
  props.primary ? 'bg-black/20 ring-white/20' : 'bg-black/30 ring-surface'
])
</script>
