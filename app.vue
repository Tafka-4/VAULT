<template>
  <div class="min-h-dvh bg-ink-oklch text-paper-oklch antialiased">
    <AppHeader />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <PwaInstallPrompt />
  </div>
</template>

<script setup lang="ts"></script>

<style>
html, body, #__nuxt { height: 100%; }
</style>
