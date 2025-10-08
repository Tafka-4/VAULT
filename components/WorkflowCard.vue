<template>
  <div class="rounded-vault p-4 ring-1 ring-surface bg-white/5 shadow-vault space-y-3">
    <div class="flex items-center gap-3">
      <div class="size-10 grid place-items-center rounded-xl bg-white/10 ring-1 ring-surface">
        <component :is="iconComp" />
      </div>
      <div>
        <p class="text-[11px] uppercase tracking-[0.18em] text-paper-oklch/50">{{ label }}</p>
        <h3 class="font-semibold text-lg">{{ title }}</h3>
      </div>
    </div>
    <p class="text-sm text-paper-oklch/75">{{ desc }}</p>
    <ul v-if="bullets?.length" class="space-y-2 text-xs text-paper-oklch/65">
      <li v-for="bullet in bullets" :key="bullet" class="flex items-start gap-2">
        <span class="mt-1.5 inline-flex size-1.5 rounded-full bg-white/40"></span>
        <span class="flex-1 leading-relaxed">{{ bullet }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'

type IconName = 'capture' | 'organize' | 'share'

const props = defineProps<{
  label: string
  title: string
  desc: string
  icon: IconName
  bullets?: string[]
}>()

const icons: Record<IconName, ReturnType<typeof defineComponent>> = {
  capture: defineComponent(() => () =>
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
        h('path', { d: 'M5 7a2 2 0 012-2h2l1-2h6l1 2h2a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7z' }),
        h('circle', { cx: 12, cy: 12, r: 3 })
      ]
    )
  ),
  organize: defineComponent(() => () =>
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
        h('path', { d: 'M4 7h16v4H4z' }),
        h('path', { d: 'M4 13h16v4H4z' }),
        h('path', { d: 'M9 3v4' }),
        h('path', { d: 'M15 17v4' })
      ]
    )
  ),
  share: defineComponent(() => () =>
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
        h('path', { d: 'M7 10l5-5 5 5' }),
        h('path', { d: 'M12 5v12' }),
        h('path', { d: 'M5 17h14' })
      ]
    )
  )
}

const iconComp = computed(() => icons[props.icon])
</script>
