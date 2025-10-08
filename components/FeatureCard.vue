<template>
  <div class="rounded-vault p-4 ring-1 ring-surface bg-white/5 shadow-vault">
    <div class="size-10 grid place-items-center rounded-xl bg-white/10 ring-1 ring-surface">
      <component :is="iconComp" />
    </div>
    <h3 class="mt-3 font-semibold">{{ title }}</h3>
    <p class="mt-1 text-sm text-paper-oklch/75">{{ desc }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'

const props = defineProps<{ title: string; desc: string; icon: 'key' | 'sync' | 'shield' }>()

const KeyIcon = defineComponent(() => () =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      class: 'size-5',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.5,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    },
    [
      h('path', { d: 'M15 7a5 5 0 1 0 4.9 6h1.6v3h-3v2h-3v-2h-1.5' }),
      h('circle', { cx: 15, cy: 7, r: 1 })
    ]
  )
)

const SyncIcon = defineComponent(() => () =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      class: 'size-5',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.5,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    },
    [h('path', { d: 'M21 12a9 9 0 1 1-2.6-6.4M21 4v6h-6' })]
  )
)

const ShieldIcon = defineComponent(() => () =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      class: 'size-5',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.5,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    },
    [h('path', { d: 'M12 3.5l6 2.4v5.3c0 4.2-2.8 8-6 9-3.2-1-6-4.8-6-9V5.9l6-2.4z' })]
  )
)

const iconComp = computed(() => ({ key: KeyIcon, sync: SyncIcon, shield: ShieldIcon }[props.icon]))
</script>
