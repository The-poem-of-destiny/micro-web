<script setup lang="ts">
import type { CSSProperties } from 'vue';

defineProps<{
  setEl: (el: HTMLElement | null) => void;
  expanded: boolean;
  docked: 'left' | 'right' | null;
  isDragging: boolean;
  style: CSSProperties;
}>();

const emit = defineEmits<{ click: [] }>();
</script>

<template>
  <button
    v-show="!expanded"
    :ref="el => setEl(el as HTMLElement | null)"
    class="stb-orb"
    :class="[
      isDragging || docked === null ? 'stb-orb--free' : docked === 'left' ? 'stb-orb--left' : 'stb-orb--right',
      isDragging ? 'stb-orb--dragging' : 'stb-orb--idle',
    ]"
    :style="style"
    aria-label="打开状态栏"
    @click="emit('click')"
  >
    <span class="stb-orb__icon" aria-hidden="true">◈</span>
  </button>
</template>

<style lang="scss" scoped>
.stb-orb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--stb-orb-size);
  height: var(--stb-orb-size);
  cursor: grab;
  touch-action: none;
  user-select: none;
  border-radius: var(--stb-radius-orb);
  border: 1px solid var(--stb-color-border);
  background: var(--stb-color-bg-orb);
  color: var(--stb-color-text);
  box-shadow: var(--stb-shadow-orb);
  z-index: var(--stb-z-orb);

  &:active {
    cursor: grabbing;
  }
}

/* 贴边缩半：向左/向右平移一半，仅露出半圆；拖动与中间悬浮保持完整 */
.stb-orb--left {
  translate: -50% 0;
}

.stb-orb--right {
  translate: 50% 0;
}

.stb-orb--free {
  translate: 0 0;
}

.stb-orb--dragging {
  transition: none;
}

.stb-orb--idle {
  /* 仅过渡缩半；left/top 瞬移，避免贴边时“甩动”观感 */
  transition: translate 200ms ease-out;
}

.stb-orb__icon {
  font-size: var(--stb-icon-md);
  line-height: 1;
}
</style>