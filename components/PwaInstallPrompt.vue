<template>
  <transition name="fade">
    <div
      v-if="shouldShow"
      class="fixed inset-x-0 bottom-4 z-[60] px-4 sm:bottom-6 sm:px-0"
      role="dialog"
      aria-label="웹앱 설치 안내"
    >
      <div class="mx-auto flex max-w-lg items-center gap-4 rounded-2xl border border-white/10 bg-black/80 px-4 py-3 backdrop-blur shadow-lg shadow-black/40">
        <div class="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-white/15 to-white/5 text-white ring-1 ring-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 11.5L12 7l5 4.5" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 7v10" />
          </svg>
        </div>
        <div class="flex-1 text-left">
          <p class="text-sm font-semibold text-white">웹앱으로 설치할까요?</p>
          <p class="text-xs text-paper-oklch/70">홈 화면에 추가하면 더 빠르게 열리고, 로그인 상태도 유지돼요.</p>
        </div>
        <div class="flex flex-shrink-0 items-center gap-2">
          <button type="button" class="tap-area rounded-xl px-3 py-2 text-xs text-paper-oklch/70 hover:bg-white/5" @click="dismiss">
            나중에
          </button>
          <button type="button" class="tap-area rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-white/90" @click="install">
            설치하기
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const deferredPrompt = useState<any>('pwa:prompt');
const shouldShowPrompt = useState<boolean>('pwa:prompt:show');
const isStandalone = useState<boolean>('pwa:standalone');

const dismiss = () => {
  shouldShowPrompt.value = false;
};

const install = async () => {
  if (!deferredPrompt.value) return;
  shouldShowPrompt.value = false;
  await deferredPrompt.value.prompt();
  await deferredPrompt.value.userChoice;
  deferredPrompt.value = null;
};

const shouldShow = computed(() => shouldShowPrompt.value && !isStandalone.value);
</script>
