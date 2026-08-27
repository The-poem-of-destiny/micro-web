<script setup lang="ts">
/**
 * 任务作用域内容：任务卡片列表（等级徽标 + 状态徽标 + 委托方 + 长文行）。
 * 解析与排序见 utils/parseTask.ts（schema 宽松字段，按存在性展示）；
 * 长文复用 LongText；非进行中任务沉底淡化。
 */
import { computed } from 'vue';
import { levelVar, parseTasks, statusVar } from '../utils/parseTask';
import LongText from './LongText.vue';

const props = defineProps<{ tasks: unknown }>();

const items = computed(() => parseTasks(props.tasks));
</script>

<template>
  <div v-if="!items.length" class="stb-task__empty">尚无任务</div>

  <div v-else class="stb-task">
    <div v-for="task in items" :key="task.name" class="stb-task__card" :class="{ 'stb-task__card--done': task.done }">
      <div class="stb-task__head">
        <span v-if="task.level" class="stb-task__level" :style="{ color: levelVar(task.level) }">{{ task.level }}</span>
        <span class="stb-task__name">{{ task.name }}</span>
        <span class="stb-task__status" :style="{ color: statusVar(task.status) }">{{ task.status }}</span>
      </div>
      <div v-if="task.client" class="stb-task__client">{{ task.client }}</div>

      <div v-for="long in task.longs" :key="long.key" class="stb-task__row">
        <span class="stb-task__row-key">{{ long.key }}</span>
        <LongText class="stb-task__row-text" :text="long.text" :lines="2" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.stb-task__empty {
  padding: var(--stb-space-5) 0;
  text-align: center;
  color: var(--stb-color-text-dim);
  font-size: var(--stb-font-size-sm);
}

.stb-task__card {
  padding: var(--stb-space-3);
  border: 1px solid var(--stb-color-border-soft);
  border-radius: var(--stb-radius-card);
  background: var(--stb-color-bg-card);

  & + & {
    margin-top: var(--stb-space-2);
  }

  /* 已完成/失败：历史记录感 */
  &--done {
    opacity: 0.6;
  }
}

.stb-task__head {
  display: flex;
  align-items: baseline;
  gap: var(--stb-space-2);
}

.stb-task__level {
  flex-shrink: 0;
  font-size: var(--stb-font-size-sm);
  font-weight: 700;
}

.stb-task__name {
  flex: 1;
  min-width: 0;
  font-size: var(--stb-font-size-sm);
  color: var(--stb-color-text);
  overflow-wrap: break-word;
}

.stb-task__status {
  flex-shrink: 0;
  font-size: var(--stb-font-size-xs);
}

.stb-task__client {
  margin-top: 2px;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-accent-soft);
}

.stb-task__row {
  display: flex;
  align-items: baseline;
  gap: var(--stb-space-2);
  margin-top: var(--stb-space-1);

  &:first-of-type {
    margin-top: var(--stb-space-2);
  }
}

.stb-task__row-key {
  flex-shrink: 0;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-accent-soft);
}

.stb-task__row-text {
  flex: 1;
  min-width: 0;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-text-dim);
  line-height: 1.5;
}
</style>
