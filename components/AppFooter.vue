<template>
  <nav class="sticky bottom-0 z-40 border-t border-white/10 bg-black/40 backdrop-blur">
    <div class="mx-auto grid max-w-3xl grid-cols-3">
      <NuxtLink
        v-for="item in navItems"
        :key="item.label"
        :to="item.to"
        class="tap-area flex flex-col items-center gap-1 px-4 py-3 text-xs"
        :class="item.active ? 'text-paper-oklch' : 'text-paper-oklch/55'"
      >
        <span
          :class="[
            'grid size-9 place-items-center rounded-2xl ring-1 transition-colors',
            item.active ? 'bg-white text-black ring-white' : 'bg-white/5 ring-surface text-paper-oklch/70'
          ]"
        >
          {{ item.icon }}
        </span>
        <span>{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

const route = useRoute()

type NavItem = {
  label: string
  icon: string
  to: string
  match: (current: RouteLocationNormalizedLoaded) => boolean
}

const baseItems: NavItem[] = [
  {
    label: '홈',
    icon: '🏠',
    to: '/app',
    match: current => current.path === '/app'
  },
  {
    label: '업로드',
    icon: '⬆️',
    to: '/app/upload',
    match: current => current.path === '/app/upload'
  },
  {
    label: '공유',
    icon: '🤝',
    to: '/app/share',
    match: current => current.path === '/app/share' || current.path === '/app/share-settings'
  }
]

const navItems = computed(() =>
  baseItems.map(({ match, ...item }) => ({
    ...item,
    active: match(route)
  }))
)
</script>
