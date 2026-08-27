<script setup lang="ts">
import { computed } from 'vue';
import type { CSSProperties } from 'vue';
import { calcExpState } from '../utils/expState';
import { HURT_KEY, hurtColorVar } from '../utils/hurt';
import { tierOf } from '../../var_control/level/config';
import FaIcon from './FaIcon.vue';

/**
 * 概览 tab：名字/Lv、种族身份职业、层级+命运点数（user 专属）、
 * 经验条（三态）、五维属性条、伤势徽标+具名部位。
 * 分隔一律用间距，不用连接符。
 */

const props = defineProps<{
  unit: Record<string, any>;
  name: string;
  isUser: boolean;
}>();

/** 种族/身份/职业 + 层级（空段跳过，全角空格分隔；层级为空时按等级推导） */
const meta = computed(() => {
  const t = props.unit._生命层级;
  const tier = typeof t === 'string' && t ? t : tierOf(Number(props.unit._等级) || 1);
  return [props.unit.种族, props.unit.身份, props.unit.职业, tier]
    .filter((v: unknown) => typeof v === 'string' && v)
    .join('　');
});

/** 命运点数（user 专属） */
const fate = computed(() =>
  props.isUser && Number.isFinite(Number(props.unit.命运点数))
    ? Number(props.unit.命运点数)
    : null,
);

const expState = computed(() => calcExpState(props.unit, props.isUser));

/** 五维属性（0~20 横条） */
const ATTR_LABELS: Record<string, string> = {
  str: '力量',
  dex: '敏捷',
  con: '体质',
  int: '智力',
  wis: '精神',
};
const attrs = computed(() =>
  Object.entries(ATTR_LABELS).map(([key, label]) => ({
    key,
    label,
    value: Math.max(0, Math.min(20, Number(props.unit.属性?.[key]) || 0)),
  })),
);

function attrStyle(value: number): CSSProperties {
  return { width: `${(value / 20) * 100}%` };
}

/** 伤势档位（空/未知不显示徽标） */
const hurtDegree = computed(() => {
  const d = props.unit.伤势?.程度;
  return typeof d === 'string' && HURT_KEY[d] ? d : '';
});

/** 具名伤势部位：部位 → 行动限制 */
const hurtParts = computed(() =>
  Object.entries((props.unit.伤势?.部位 ?? {}) as Record<string, unknown>)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([part, limit]) => ({ part, limit: String(limit) })),
);

function hurtBadgeStyle(degree: string): CSSProperties {
  const color = hurtColorVar(degree);
  return { color, background: `color-mix(in srgb, ${color} 15%, transparent)` };
}

/** 经验数值（千分位） */
function fmt(n: number): string {
  return n.toLocaleString('zh-Hans-CN');
}
</script>

<template>
  <div class="stb-ov">
    <header class="stb-ov__head">
      <span class="stb-ov__name">{{ name }}</span>
      <span
        v-if="hurtDegree"
        class="stb-ov__hurt-badge"
        :style="hurtBadgeStyle(hurtDegree)"
      >{{ hurtDegree }}</span>
      <span class="stb-ov__lv">Lv.{{ unit._等级 ?? 1 }}</span>
    </header>

    <div v-if="meta" class="stb-ov__meta">{{ meta }}</div>

    <div v-if="fate !== null" class="stb-ov__fate">
      <span class="stb-ov__fate-label">命运</span>
      <FaIcon icon="diamond" :size="10" />
      <span>{{ fmt(fate) }}</span>
    </div>

    <!-- 经验条（三态：常规 / 门槛锁级 / 满级） -->
    <div v-if="expState.mode === 'max'" class="stb-ov__exp-max">
      <FaIcon icon="crown" :size="12" />
      <span>巅峰</span>
    </div>
    <div v-else class="stb-ov__exp">
      <div class="stb-ov__exp-label">
        <span>经验</span>
        <span class="stb-ov__exp-num">
          {{ fmt(expState.exp) }}<template v-if="expState.need !== null"> / {{ fmt(expState.need) }}</template>
        </span>
      </div>
      <div class="stb-ov__bar">
        <div
          class="stb-ov__bar-fill"
          :class="{ 'stb-ov__bar-fill--locked': expState.mode === 'locked' }"
          :style="{ width: `${expState.pct}%` }"
        ></div>
      </div>
      <div v-if="expState.mode === 'locked'" class="stb-ov__exp-note">长阶在即　完成登神任务突破</div>
    </div>

    <!-- 五维属性 -->
    <div class="stb-ov__attrs">
      <div v-for="a in attrs" :key="a.key" class="stb-ov__attr">
        <span class="stb-ov__attr-label">{{ a.label }}</span>
        <div class="stb-ov__attr-track">
          <div class="stb-ov__attr-fill" :style="attrStyle(a.value)"></div>
        </div>
        <span class="stb-ov__attr-num">{{ a.value }}</span>
      </div>
    </div>

    <!-- 伤势部位（档位胶囊在 header） -->
    <div v-for="p in hurtParts" :key="p.part" class="stb-ov__hurt-part">
      <span class="stb-ov__hurt-part-name">{{ p.part }}</span>
      <span class="stb-ov__hurt-part-limit">{{ p.limit }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stb-ov {
  display: flex;
  flex-direction: column;
  gap: var(--stb-space-3);
}

// ---------- 头部 ----------
.stb-ov__head {
  display: flex;
  align-items: center;
  gap: var(--stb-space-2);
}

.stb-ov__name {
  min-width: 0;
  overflow-wrap: break-word;
  font-size: var(--stb-font-size-lg);
  font-family: var(--stb-font-family-display);
  color: var(--stb-color-text);
}

.stb-ov__lv {
  margin-left: auto;
  flex-shrink: 0;
  font-size: var(--stb-font-size-sm);
  color: var(--stb-color-accent);
}

.stb-ov__meta {
  margin-top: calc(var(--stb-space-3) * -1 + var(--stb-space-2));
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-text-dim);
}

// ---------- 命运点数（user 专属） ----------
.stb-ov__fate {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--stb-space-1);
  padding: 1px 8px;
  border: 1px solid var(--stb-color-accent-soft);
  border-radius: 999px;
  font-size: 10px;
  line-height: 1.5;
  color: var(--stb-color-accent);

  .fa-diamond {
    color: var(--stb-color-accent-soft);
  }
}

// ---------- 经验条 ----------
.stb-ov__exp {
  display: flex;
  flex-direction: column;
  gap: var(--stb-space-1);
}

.stb-ov__exp-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-text-dim);
}

.stb-ov__exp-num {
  color: var(--stb-color-text);
}

.stb-ov__bar {
  height: 8px;
  border-radius: 4px;
  background: var(--stb-color-bar-track);
  overflow: hidden;
}

.stb-ov__bar-fill {
  height: 100%;
  border-radius: 4px;
  background: var(--stb-color-accent);
  transition: width 0.3s ease;
}

/* 门槛锁级：琥珀色满条 */
.stb-ov__bar-fill--locked {
  background: var(--stb-color-warning);
}

.stb-ov__exp-note {
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-warning);
}

/* 满级替代显示 */
.stb-ov__exp-max {
  display: inline-flex;
  align-items: center;
  gap: var(--stb-space-2);
  align-self: flex-start;
  padding: 2px 10px;
  border: 1px solid var(--stb-color-accent-soft);
  border-radius: 999px;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-accent);

  .fa-crown {
    color: var(--stb-color-accent);
  }
}

// ---------- 属性条 ----------
.stb-ov__attrs {
  display: flex;
  flex-direction: column;
  gap: var(--stb-space-2);
}

.stb-ov__attr {
  display: flex;
  align-items: center;
  gap: var(--stb-space-2);
}

.stb-ov__attr-label {
  flex-shrink: 0;
  width: 3em;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-text-dim);
}

.stb-ov__attr-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--stb-color-bar-track);
  overflow: hidden;
}

.stb-ov__attr-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--stb-color-bar-attr);
  transition: width 0.3s ease;
}

.stb-ov__attr-num {
  flex-shrink: 0;
  width: 2em;
  text-align: right;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-text);
}

// ---------- 伤势部位 ----------
.stb-ov__hurt-part {
  display: flex;
  align-items: baseline;
  gap: var(--stb-space-2);
  margin-top: calc(var(--stb-space-3) * -1 + var(--stb-space-2));
}

.stb-ov__hurt-part-name {
  flex-shrink: 0;
  max-width: 40%;
  overflow-wrap: break-word;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-text);
}

.stb-ov__hurt-part-limit {
  flex: 1;
  min-width: 0;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-text-dim);
}

.stb-ov__hurt-badge {
  flex-shrink: 0;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 1.6;
}
</style>
