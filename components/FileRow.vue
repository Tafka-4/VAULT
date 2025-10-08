<template>
  <div
    :class="rowClasses"
    :role="to ? 'link' : undefined"
    :tabindex="to ? 0 : undefined"
    @click="navigate"
    @keydown.enter.prevent="navigate"
    @keydown.space.prevent="navigate"
  >
    <div class="flex items-center gap-3">
      <div class="size-9 grid place-items-center rounded-xl bg-white/10 ring-1 ring-surface">
        <Icon :name="icon" />
      </div>
      <div class="min-w-0">
        <p class="truncate font-medium">{{ name }}</p>
        <p class="text-xs text-paper-oklch/60">{{ detail }}</p>
      </div>
    </div>
    <button
      type="button"
      class="tap-area size-9 grid place-items-center rounded-xl hover:bg-white/10"
      @click.stop
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 12h.01M12 12h.01M18 12h.01" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, type PropType } from 'vue'

const props = defineProps<{ icon: IconName; name: string; detail: string; to?: string }>()

const rowClasses = computed(() => [
  'flex items-center justify-between border-b border-white/5 py-3 last:border-none transition-colors',
  props.to
    ? 'cursor-pointer rounded-xl bg-transparent hover:bg-white/5 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-0 focus-visible:ring-offset-transparent focus-visible:shadow-vault'
    : ''
])

const navigate = () => {
  if (!props.to) return
  navigateTo(props.to)
}

type IconName = 'file' | 'image' | 'folder' | 'lock'

const paths: Record<IconName, string[]> = {
  file: ['M9 3h6l4 4v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z'],
  image: [
    'M4 5h16v14H4z',
    'M6 15l4-4 4 5 3-3 3 4'
  ],
  folder: ['M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z'],
  lock: [
    'M7 11h10v8H7z',
    'M9 11V9a3 3 0 116 0v2'
  ]
}

const Icon = defineComponent<{ name: IconName }>({
  props: {
    name: { type: String as PropType<IconName>, required: true }
  },
  setup(props) {
    return () =>
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
        paths[props.name].map(d => h('path', { d }))
      )
  }
})
</script>
