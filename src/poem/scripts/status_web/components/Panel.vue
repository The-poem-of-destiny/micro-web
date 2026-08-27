<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed } from 'vue';
import type { Tab } from '../composables/usePanelRoute';
import { usePanelRoute } from '../composables/usePanelRoute';
import { useStatusStore } from '../store';
import AscendTab from './AscendTab.vue';
import CharList from './CharList.vue';
import FaIcon from './FaIcon.vue';
import ListTab from './ListTab.vue';
import OverviewTab from './OverviewTab.vue';
import ProfileTab from './ProfileTab.vue';
import ScopeBar from './ScopeBar.vue';
import TaskTab from './TaskTab.vue';

/**
 * 面板外壳：顶栏 + 作用域行 + 子 tab 行 + 内容区。
 * 定位/显隐由 App.vue 经 props 控制；内容区为 tab 占位，由各 Tab 组件逐步填充。
 */
const store = useStatusStore();
const { scope, tab, listOpen, scopeLabel, selectScope, toggleList, selectTab } = usePanelRoute();

defineProps<{
  setEl: (el: HTMLElement | null) => void;
  expanded: boolean;
  style: CSSProperties;
}>();

const emit = defineEmits<{ close: [] }>();

/** 当前作用域的角色数据对象（tasks 作用域为空对象） */
const unit = computed<Record<string, any>>(() => {
  if (scope.value.kind === 'user') return (store.stat.user ?? {}) as Record<string, any>;
  if (scope.value.kind === 'partner') return (store.stat.partner?.[scope.value.name] ?? {}) as Record<string, any>;
  return {};
});

/** 子 tab 集：partner 专属档案；物品/技能/buff 带计数徽标 */
const tabs = computed<{ key: Tab; count?: number }[]>(() => [
  { key: '概览' },
  ...(scope.value.kind === 'partner' ? [{ key: '档案' as Tab }] : []),
  { key: '物品', count: Object.keys(unit.value.物品 ?? {}).length },
  { key: '技能', count: Object.keys(unit.value.技能 ?? {}).length },
  { key: 'buff', count: Object.keys(unit.value.buff ?? {}).length },
  { key: '资产' },
  { key: '登神' },
]);

/** 当前角色 chip 文案：user 显示玩家名，partner 显示角色名 */
const scopeName = computed(() =>
  scope.value.kind === 'user' ? store.userName : ((scope.value as { name?: string }).name ?? ''),
);

/** 任务作用域（无子 tab）或角色列表打开时隐藏 tab 行 */
const showTabs = computed(() => scope.value.kind !== 'tasks' && !listOpen.value);
</script>

<template>
  <div v-show="expanded" :ref="el => setEl(el as HTMLElement | null)" class="stb-panel" :style="style">
    <header class="stb-panel__top">
      <button class="stb-panel__close" aria-label="收起状态栏" @click="emit('close')">
        <FaIcon icon="xmark" size="md" />
      </button>
      <div class="stb-panel__line">
        <FaIcon icon="clock" size="sm" class="stb-panel__brand" />
        <span class="stb-panel__time" :title="store.time">{{ store.time || '—' }}</span>
      </div>
      <div class="stb-panel__loc" :title="store.loc">
        <FaIcon icon="location-dot" size="sm" class="stb-panel__loc-icon" />
        <span class="stb-panel__loc-text">{{ store.loc || '未知' }}</span>
      </div>
    </header>

    <ScopeBar
      :scope="scope"
      :list-open="listOpen"
      :label="scopeLabel(store.userName)"
      @select="selectScope"
      @toggle-list="toggleList"
    />

    <nav v-if="showTabs" class="stb-panel__tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="stb-panel__tab"
        :class="{ 'stb-panel__tab--on': t.key === tab }"
        @click="selectTab(t.key)"
      >
        {{ t.key }}<span v-if="t.count !== undefined" class="stb-panel__count">{{ t.count }}</span>
      </button>
    </nav>

    <div class="stb-panel__body">
      <CharList v-if="listOpen" @select="selectScope" />
      <TaskTab v-else-if="scope.kind === 'tasks'" :tasks="store.tasks" />
      <template v-else>
        <OverviewTab v-if="tab === '概览'" :unit="unit" :name="scopeName" :is-user="scope.kind === 'user'" />
        <ListTab v-else-if="tab === '物品'" :record="unit.物品" empty="尚无物品" />
        <ListTab v-else-if="tab === '技能'" :record="unit.技能" empty="尚无技能" />
        <ListTab v-else-if="tab === 'buff'" :record="unit.buff" empty="暂无状态效果" />
        <ListTab v-else-if="tab === '资产'" :assets="unit.资产" empty="暂无资产" />
        <AscendTab v-else-if="tab === '登神'" :ascend="unit.登神长阶" />
        <ProfileTab v-else-if="tab === '档案'" :unit="unit" />
        <div v-else class="stb-panel__empty">尚无{{ tab }}</div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stb-panel {
  position: absolute;
  box-sizing: border-box;
  /* 纵向骨架：顶栏/作用域/tab 行固定，内容区独立滚动 */
  display: flex;
  flex-direction: column;
  max-height: var(--stb-panel-max-height);
  border-radius: var(--stb-radius-panel);
  border: 1px solid var(--stb-color-border);
  background: var(--stb-color-bg-panel);
  box-shadow: var(--stb-shadow-panel);
  color: var(--stb-color-text);
  font-family: var(--stb-font-family);
  z-index: var(--stb-z-panel);
  overflow: hidden;
}

// ---------- 顶栏（上下两行，左对齐：时间 / 地点；关闭钮悬浮右上） ----------
.stb-panel__top {
  position: relative;
  flex-shrink: 0;
  padding: var(--stb-space-3) var(--stb-space-4);
  border-bottom: 1px solid var(--stb-color-border-soft);
}

.stb-panel__line {
  display: flex;
  align-items: center;
  gap: var(--stb-space-2);
  /* 避开右侧关闭钮（32px + 间隙），长文本可换行 */
  padding-right: 40px;
}

/* 行首时钟与地点图标统一 12px 宽 + 8px 间距，两行文字起点对齐 */
.stb-panel__brand {
  flex-shrink: 0;
  line-height: 1.4;
  color: var(--stb-color-accent);
}

.stb-panel__time {
  min-width: 0;
  overflow-wrap: break-word;
  white-space: normal;
  font-size: var(--stb-font-size-sm);
}

.stb-panel__loc {
  display: flex;
  align-items: flex-start;
  gap: var(--stb-space-2);
  margin-top: var(--stb-space-1);
  padding-right: 40px;
  overflow: hidden;
  font-size: var(--stb-font-size-sm);
  color: var(--stb-color-text-dim);
}

.stb-panel__loc-icon {
  flex-shrink: 0;
  line-height: 1;
  color: var(--stb-color-accent-soft);
}

.stb-panel__loc-text {
  min-width: 0;
  overflow-wrap: break-word;
  white-space: normal;
}

.stb-panel__close {
  position: absolute;
  right: var(--stb-space-2);
  top: 50%;
  transform: translateY(-50%);
  /* 扩大点击区到 32px（移动端触控），flex 居中图标 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  padding: 0;
  line-height: 1;
  color: var(--stb-color-text-dim);
  cursor: pointer;

  &:hover {
    color: var(--stb-color-text);
  }
}

// ---------- 子 tab 行 ----------
.stb-panel__tabs {
  flex-shrink: 0;
  display: flex;
  gap: var(--stb-space-1);
  padding: 0 var(--stb-space-3);
  border-bottom: 1px solid var(--stb-color-border-soft);
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.stb-panel__tab {
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  min-height: 36px;
  padding: 0 var(--stb-space-2);
  border: none;
  background: transparent;
  color: var(--stb-color-text-dim);
  font-size: var(--stb-font-size-sm);
  cursor: pointer;
}

.stb-panel__tab--on {
  color: var(--stb-color-accent);

  &::after {
    content: '';
    position: absolute;
    left: var(--stb-space-1);
    right: var(--stb-space-1);
    bottom: 0;
    height: 2px;
    border-radius: 1px;
    background: var(--stb-color-accent);
  }
}

.stb-panel__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--stb-color-bg-card);
  font-size: 10px;
  line-height: 1;
}

.stb-panel__tab--on .stb-panel__count {
  background: var(--stb-color-accent);
  color: #171a24;
}

// ---------- 内容区 ----------
.stb-panel__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--stb-space-3) var(--stb-space-4);
}

.stb-panel__empty {
  padding: var(--stb-space-5) 0;
  text-align: center;
  color: var(--stb-color-text-dim);
  font-size: var(--stb-font-size-sm);
}
</style>
