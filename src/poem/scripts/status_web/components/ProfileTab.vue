<script setup lang="ts">
/**
 * partner 专属档案：人物志（命定契约徽标 + 好感刻度 + 五项白名单长文）。
 * 种族/身份/职业已在概览 meta 展示，此处不重复；字段 schema 保证（prefault 空）。
 * 长文复用 LongText；空字段整行跳过。
 */
import { computed } from 'vue';
import FaIcon from './FaIcon.vue';
import LongText from './LongText.vue';

const props = defineProps<{ unit: Record<string, any> }>();

/** 档案白名单（人物志五项；顺序即展示顺序） */
const LONG_FIELDS = ['外貌', '衣着', '性格', '行为', '背景'] as const;

const bond = computed(() => props.unit?.命定契约 === true);
const favor = computed(() => {
  const v = Number(props.unit?.好感);
  return Number.isFinite(v) ? Math.max(-100, Math.min(100, v)) : 0;
});
/** 好感刻度点位置：bar 全宽 = -100~100，中心 50% 为零点 */
const favorPos = computed(() => `${(favor.value + 100) / 2}%`);
const favorColor = computed(() =>
  favor.value < 0 ? 'var(--stb-color-danger)' : favor.value > 0 ? 'var(--stb-color-success)' : 'var(--stb-color-text-dim)',
);

const longs = computed(() =>
  LONG_FIELDS.map(key => ({ key, text: typeof props.unit?.[key] === 'string' ? props.unit[key] : '' })).filter(x => x.text),
);
</script>

<template>
  <div v-if="!longs.length && !bond" class="stb-profile__empty">暂无档案</div>

  <div v-else class="stb-profile">
    <div v-if="bond" class="stb-profile__bond">
      <FaIcon icon="star" size="sm" />
      <span>命定契约</span>
    </div>

    <div class="stb-profile__favor">
      <FaIcon icon="heart" :size="10" />
      <span class="stb-profile__favor-num">{{ favor }}</span>
      <div class="stb-profile__favor-bar">
        <span class="stb-profile__favor-dot" :style="{ left: favorPos, background: favorColor }" />
      </div>
    </div>

    <div v-for="long in longs" :key="long.key" class="stb-profile__row">
      <span class="stb-profile__row-key">{{ long.key }}</span>
      <LongText class="stb-profile__row-text" :text="long.text" :lines="2" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.stb-profile__empty {
  padding: var(--stb-space-5) 0;
  text-align: center;
  color: var(--stb-color-text-dim);
  font-size: var(--stb-font-size-sm);
}

.stb-profile__bond {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border: 1px solid var(--stb-color-accent-soft);
  border-radius: 999px;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-accent);
}

.stb-profile__favor {
  display: flex;
  align-items: center;
  gap: var(--stb-space-1);
  margin-top: var(--stb-space-2);
  color: var(--stb-color-text-dim);
}

.stb-profile__favor-num {
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-text);
}

/* 刻度条：全宽 = -100~100，中心线为零点；点偏移即好感极性与幅度 */
.stb-profile__favor-bar {
  position: relative;
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: var(--stb-color-bar-track);

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: -2px;
    bottom: -2px;
    width: 1px;
    background: rgba(255, 255, 255, 0.25);
  }
}

.stb-profile__favor-dot {
  position: absolute;
  top: -2px;
  width: 7px;
  height: 7px;
  margin-left: -3.5px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--stb-color-bg-panel);
}

.stb-profile__row {
  display: flex;
  align-items: baseline;
  gap: var(--stb-space-2);
  margin-top: var(--stb-space-2);
}

.stb-profile__row-key {
  flex-shrink: 0;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-accent-soft);
}

.stb-profile__row-text {
  flex: 1;
  min-width: 0;
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-text-dim);
  line-height: 1.5;
}
</style>
