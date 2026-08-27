<script setup lang="ts">
/**
 * 登神长阶：五节点竖向阶梯（要素→权能→法则→神位→神国）。
 * 节点三态：● 持有中 / ◐ 已升华消耗 / ○ 未达；阶段模型见 utils/ascend.ts。
 * 描述长文复用 LongText 组件（点击展开/收起）。
 */
import { computed } from 'vue';
import { calcAscend, ELEMENT_CAP, type AscendState } from '../utils/ascend';
import LongText from './LongText.vue';

const props = defineProps<{ ascend: unknown }>();

const state = computed<AscendState>(() => calcAscend(props.ascend));

/** 要素空槽数（仅收集阶段显示） */
const elemSlots = computed(() => {
  const elem = state.value.nodes.find(n => n.key === '要素');
  return elem && elem.state === 'held' ? ELEMENT_CAP - Object.keys(elem.entries).length : 0;
});
</script>

<template>
  <div v-if="!state.opened" class="stb-asc__empty">登神长阶未开启</div>

  <div v-else class="stb-asc">
    <div v-if="state.badges.length" class="stb-asc__head">
      <span v-for="(b, i) in state.badges" :key="i" class="stb-asc__badge">{{ b }}</span>
    </div>

    <div v-for="node in state.nodes" :key="node.key" class="stb-asc__node" :data-state="node.state">
      <span class="stb-asc__dot">{{ node.state === 'held' ? '●' : node.state === 'consumed' ? '◐' : '○' }}</span>
      <div class="stb-asc__body">
        <span class="stb-asc__key">{{ node.key }}</span>

        <div v-for="(desc, name) in node.entries" :key="name" class="stb-asc__entry">
          <span v-if="desc" class="stb-asc__entry-name">{{ name }}</span>
          <LongText v-if="desc" class="stb-asc__entry-desc" :text="desc" :lines="2" />
          <span v-else class="stb-asc__entry-solo">{{ name }}</span>
        </div>

        <div v-if="node.key === '要素' && elemSlots > 0" class="stb-asc__slots">
          <span v-for="i in elemSlots" :key="i" class="stb-asc__slot">◌</span>
        </div>

        <span v-if="node.state === 'consumed'" class="stb-asc__note">{{ node.consumedNote }}</span>
        <span v-else-if="node.state === 'locked'" class="stb-asc__hint">{{ node.hint }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.stb-asc__empty {
  padding: var(--stb-space-5) 0;
  text-align: center;
  color: var(--stb-color-text-dim);
  font-size: var(--stb-font-size-sm);
}

.stb-asc__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--stb-space-1);
  margin-bottom: var(--stb-space-2);
}

.stb-asc__badge {
  padding: 1px 8px;
  border: 1px solid var(--stb-color-accent-soft);
  border-radius: 999px;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-accent);
}

.stb-asc__node {
  position: relative;
  display: flex;
  gap: var(--stb-space-2);
  padding-bottom: var(--stb-space-3);

  &:last-child {
    padding-bottom: 0;
  }

  /* 节点间连接线：走过的高于未走的 */
  &:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 16px;
    bottom: 2px;
    width: 1px;
    background: color-mix(in srgb, var(--stb-color-text-dim) 25%, transparent);
  }

  &[data-state='held']:not(:last-child)::before {
    background: color-mix(in srgb, var(--stb-color-accent) 45%, transparent);
  }
}

.stb-asc__dot {
  flex-shrink: 0;
  width: 11px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--stb-color-text-dim);

  .stb-asc__node[data-state='held'] & {
    color: var(--stb-color-accent);
  }

  .stb-asc__node[data-state='consumed'] & {
    color: var(--stb-color-accent-soft);
  }
}

.stb-asc__body {
  flex: 1;
  min-width: 0;
}

.stb-asc__key {
  font-size: var(--stb-font-size-sm);
  color: var(--stb-color-text);

  .stb-asc__node[data-state='locked'] & {
    color: var(--stb-color-text-dim);
  }
}

.stb-asc__entry {
  margin-top: var(--stb-space-1);
}

.stb-asc__entry-name {
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-accent-soft);
}

.stb-asc__entry-desc {
  display: block;
  margin-top: 1px;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-text-dim);
  line-height: 1.5;
}

/* 无描述条目（神位名）单独强调 */
.stb-asc__entry-solo {
  font-size: var(--stb-font-size-sm);
  color: var(--stb-color-accent);
}

.stb-asc__slots {
  margin-top: 2px;
  display: flex;
  gap: 4px;
}

.stb-asc__slot {
  font-size: 10px;
  color: color-mix(in srgb, var(--stb-color-text-dim) 55%, transparent);
}

.stb-asc__note {
  display: block;
  margin-top: 2px;
  font-size: var(--stb-font-size-xs);
  color: color-mix(in srgb, var(--stb-color-accent-soft) 80%, transparent);
}

.stb-asc__hint {
  display: block;
  margin-top: 2px;
  font-size: var(--stb-font-size-xs);
  color: color-mix(in srgb, var(--stb-color-text-dim) 70%, transparent);
}
</style>
