<script setup lang="ts">
import { computed } from 'vue';
import type { Scope } from '../composables/usePanelRoute';
import { useStatusStore } from '../store';
import FaIcon from './FaIcon.vue';

/**
 * 作用域行：[当前角色 ▾] [任务 N]。
 * 恒定两个 chip，角色数量增长不会导致本行变化（防爆设计）。
 */
defineProps<{ scope: Scope; listOpen: boolean; label: string }>();
const emit = defineEmits<{ select: [scope: Scope]; toggleList: [] }>();

const store = useStatusStore();
const taskCount = computed(() => Object.keys(store.tasks).length);
</script>

<template>
  <div class="stb-scope">
    <button
      class="stb-scope__chip"
      :class="{ 'stb-scope__chip--open': listOpen }"
      aria-label="切换角色"
      @click="emit('toggleList')"
    >
      <span class="stb-scope__name">{{ label }}</span>
      <FaIcon icon="chevron-down" size="sm" class="stb-scope__caret" :class="{ 'stb-scope__caret--up': listOpen }" />
    </button>
    <button
      class="stb-scope__chip"
      :class="{ 'stb-scope__chip--on': scope.kind === 'tasks' && !listOpen }"
      @click="emit('select', { kind: 'tasks' })"
    >
      任务<span v-if="taskCount > 0" class="stb-scope__count">{{ taskCount }}</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.stb-scope {
  flex-shrink: 0;
  display: flex;
  gap: var(--stb-space-2);
  padding: var(--stb-space-2) var(--stb-space-4);
}

.stb-scope__chip {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: var(--stb-space-2);
  min-height: 32px;
  padding: 0 var(--stb-space-3);
  border: 1px solid var(--stb-color-border-soft);
  border-radius: var(--stb-radius-card);
  background: transparent;
  color: var(--stb-color-text);
  font-size: var(--stb-font-size-sm);
  cursor: pointer;

  &:active {
    border-color: var(--stb-color-accent);
  }
}

.stb-scope__chip--on,
.stb-scope__chip--open {
  border-color: var(--stb-color-accent);
  color: var(--stb-color-accent);
}

.stb-scope__name {
  min-width: 0;
  overflow-wrap: break-word;
  white-space: normal;
  text-align: left;
  /* 最长 2 行：西幻长名完整可辨，同时保护 chip 单行控件形态 */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.stb-scope__caret {
  /* 下拉箭头固定在 chip 右侧 */
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  line-height: 1;
  transition: transform 0.15s ease;
}

.stb-scope__caret--up {
  transform: rotate(180deg);
}

.stb-scope__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  margin-left: auto;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--stb-color-accent);
  color: #171a24;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}
</style>
