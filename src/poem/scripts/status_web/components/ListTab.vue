<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed } from 'vue';
import type { Badge, ListItem } from '../utils/parseListEntry';
import { compareItems, parseEntry } from '../utils/parseListEntry';
import FaIcon from './FaIcon.vue';
import LongText from './LongText.vue';

/**
 * 通用卡列表（物品 / 技能 / buff / 资产 共用）。
 * 条目解析见 utils/parseListEntry.ts（白名单字段路由）。
 * 叙事长文默认截断（描述 2 行/规模 2 行），点击展开全文、再点收起（评论区式）。
 */

const props = defineProps<{
  record?: Record<string, any>;
  assets?: Record<string, any>;
  empty: string;
}>();

/** money 大字卡数值（千分位；仅 >0 时显示） */
const money = computed(() => {
  if (props.assets === undefined) return null;
  const m = Number(props.assets.money);
  return Number.isFinite(m) && m > 0 ? m.toLocaleString('zh-Hans-CN') : null;
});

const items = computed<ListItem[]>(() => {
  const source: Record<string, any> | undefined =
    props.assets !== undefined
      ? Object.fromEntries(Object.entries(props.assets).filter(([k]) => k !== 'money'))
      : props.record;
  return Object.entries(source ?? {})
    .map(([name, raw]) => parseEntry(name, raw))
    .sort(compareItems);
});

const isEmpty = computed(() => money.value === null && items.value.length === 0);

/** 彩色徽标：同色文字 + 15% 同色底 */
function badgeStyle(badge: Badge): CSSProperties {
  if (!badge.color) return {};
  return {
    color: badge.color,
    background: `color-mix(in srgb, ${badge.color} 15%, transparent)`,
  };
}
</script>

<template>
  <div v-if="money !== null" class="stb-list__money">
    <FaIcon icon="coins" size="lg" class="stb-list__money-icon" />
    <span class="stb-list__money-num">{{ money }}</span>
  </div>

  <div
    v-for="item in items"
    :key="item.name"
    class="stb-list__card"
    :class="{
      'stb-list__card--solo': item.effects.length === 0 && item.longs.length === 0 && !item.space && !item.manage,
    }"
  >
    <div class="stb-list__head">
      <span class="stb-list__name">{{ item.name }}</span>
      <span v-if="item.count > 1" class="stb-list__count">×{{ item.count }}</span>
      <span v-for="(badge, i) in item.badges" :key="i" class="stb-list__badge" :style="badgeStyle(badge)">{{
        badge.text
      }}</span>
    </div>

    <div v-for="(eff, i) in item.effects" :key="i" class="stb-list__effect">
      <span class="stb-list__effect-key">{{ eff.key }}</span>
      <span class="stb-list__effect-val">{{ eff.val }}</span>
    </div>

    <!-- 空间块（资产）：分区列表 + 空闲面积 + 规模 -->
    <div v-if="item.space" class="stb-list__space">
      <div v-for="(a, i) in item.space.areas" :key="i" class="stb-list__space-row">
        <span class="stb-list__space-name">{{ a.name }}</span>
        <span v-if="a.rooms" class="stb-list__space-rooms">{{ a.rooms }}</span>
        <span v-if="a.area" class="stb-list__space-area">{{ a.area }}m²</span>
      </div>
      <div v-if="item.space.freeArea" class="stb-list__space-row">
        <span class="stb-list__space-name">空闲面积</span>
        <span class="stb-list__space-area">{{ item.space.freeArea }}m²</span>
      </div>
      <div v-if="item.space.scale" class="stb-list__long-wrap">
        <span class="stb-list__long-key">规模</span>
        <LongText class="stb-list__long-text" :text="item.space.scale" :lines="2" />
      </div>
    </div>

    <!-- 经营块（资产）：状态徽标 + 估价/收益/结算日 -->
    <div v-if="item.manage" class="stb-list__manage">
      <span v-if="item.manage.status" class="stb-list__badge">{{ item.manage.status }}</span>
      <span v-if="item.manage.valuation" class="stb-list__manage-item">估价 {{ item.manage.valuation }}G</span>
      <span v-if="item.manage.income" class="stb-list__manage-item">{{ item.manage.income }}</span>
      <span v-if="item.manage.settleDay" class="stb-list__manage-item">结算日 {{ item.manage.settleDay }}</span>
    </div>

    <div v-for="(long, i) in item.longs" :key="i" class="stb-list__long-wrap">
      <span v-if="long.key" class="stb-list__long-key">{{ long.key }}</span>
      <LongText class="stb-list__long-text" :text="long.text" :lines="long.lines" />
    </div>
  </div>

  <div v-if="isEmpty" class="stb-list__empty">{{ empty }}</div>
</template>

<style lang="scss" scoped>
.stb-list__money {
  display: flex;
  align-items: center;
  gap: var(--stb-space-2);
  margin-bottom: var(--stb-space-3);
  padding: var(--stb-space-3) var(--stb-space-4);
  border: 1px solid var(--stb-color-border-soft);
  border-radius: var(--stb-radius-card);
  background: var(--stb-color-bg-card);
}

.stb-list__money-icon {
  color: var(--stb-color-accent);
}

.stb-list__money-num {
  font-family: var(--stb-font-family-display);
  font-size: var(--stb-font-size-lg);
  color: var(--stb-color-accent);
}

// ---------- 卡片 ----------
.stb-list__card {
  padding: var(--stb-space-2) var(--stb-space-3);

  & + & {
    margin-top: var(--stb-space-2);
  }

  border-radius: var(--stb-radius-card);
  background: var(--stb-color-bg-card);
}

/* 无正文：单行卡更紧凑 */
.stb-list__card--solo {
  padding: var(--stb-space-1) var(--stb-space-3);
}

.stb-list__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--stb-space-1) var(--stb-space-2);
}

.stb-list__name {
  font-size: var(--stb-font-size-sm);
  color: var(--stb-color-text);
}

.stb-list__count {
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-text-dim);
}

.stb-list__badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 1.5;
  color: var(--stb-color-text-dim);
  background: rgba(255, 255, 255, 0.06);
}

// ---------- 效果行（效果名: 效果） ----------
.stb-list__effect {
  display: flex;
  align-items: baseline;
  gap: var(--stb-space-2);
  margin-top: var(--stb-space-1);

  &:first-of-type {
    margin-top: var(--stb-space-2);
  }
}

.stb-list__effect-key {
  flex-shrink: 0;
  max-width: 45%;
  overflow-wrap: break-word;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-text);
}

.stb-list__effect-val {
  flex: 1;
  min-width: 0;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-text-dim);
  line-height: 1.5;
}

// ---------- 长文行（label + 文本；展开/收起钮 inline 跟随文本末尾，B 站式） ----------
.stb-list__long-wrap {
  display: flex;
  align-items: baseline;
  gap: var(--stb-space-2);
  margin-top: var(--stb-space-1);

  &:first-of-type {
    margin-top: var(--stb-space-2);
  }
}

.stb-list__long-key {
  flex-shrink: 0;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-accent-soft);
}

.stb-list__long-text {
  flex: 1;
  min-width: 0;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-text-dim);
  line-height: 1.5;
}

// ---------- 空间块（资产）：分区列表 + 空闲面积 + 规模 ----------
.stb-list__space {
  margin-top: var(--stb-space-1);
  padding: var(--stb-space-1) var(--stb-space-2);
  border-left: 1px solid var(--stb-color-border-soft);
}

.stb-list__space-row {
  display: flex;
  align-items: baseline;
  gap: var(--stb-space-2);
  font-size: var(--stb-font-size-xs);
  line-height: 1.5;
}

.stb-list__space-name {
  flex-shrink: 0;
  color: var(--stb-color-accent-soft);
}

.stb-list__space-rooms {
  flex: 1;
  min-width: 0;
  color: var(--stb-color-text-dim);
}

.stb-list__space-area {
  flex-shrink: 0;
  color: var(--stb-color-text-dim);
}

// ---------- 经营块（资产）：状态徽标 + 估价/收益/结算日 ----------
.stb-list__manage {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--stb-space-1) var(--stb-space-2);
  margin-top: var(--stb-space-1);
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-text-dim);
}

.stb-list__empty {
  padding: var(--stb-space-5) 0;
  text-align: center;
  color: var(--stb-color-text-dim);
  font-size: var(--stb-font-size-sm);
}
</style>
