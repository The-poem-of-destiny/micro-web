<script setup lang="ts">
import { computed } from 'vue';
import type { Scope } from '../composables/usePanelRoute';
import { tierOf } from '../../var_control/level/config';
import { HURT_KEY } from '../utils/hurt';
import { useStatusStore } from '../store';
import FaIcon from './FaIcon.vue';

/**
 * 角色选择列表（listOpen 时原地替换内容区）。
 * 每行带摘要（等级/层级/好感/伤势胶囊/命定星标）——列表本身就是全员总览。
 * 纵向滚动，任意角色数量不溢出。
 */

const emit = defineEmits<{ select: [scope: Scope] }>();
const store = useStatusStore();

const rows = computed(() =>
  store.roleList.map((role: { kind: 'user' | 'partner'; name: string }) => {
    const unit: Record<string, any> =
      role.kind === 'user' ? ((store.stat.user ?? {}) as Record<string, any>) : ((store.stat.partner?.[role.name] ?? {}) as Record<string, any>);
    const level = Number(unit._等级) || 1;
    const hurt = typeof unit.伤势?.程度 === 'string' ? unit.伤势.程度 : '';
    return {
      scope: (role.kind === 'user' ? { kind: 'user' } : { kind: 'partner', name: role.name }) as Scope,
      name: role.name,
      isUser: role.kind === 'user',
      level,
      tier: typeof unit._生命层级 === 'string' && unit._生命层级 ? unit._生命层级 : tierOf(level),
      favor: role.kind === 'partner' ? Number(unit.好感) || 0 : null,
      hurt,
      bond: unit.命定契约 === true,
    };
  }),
);
</script>

<template>
  <ul class="stb-charlist">
    <li v-for="row in rows" :key="row.name">
      <button class="stb-charlist__row" @click="emit('select', row.scope)">
        <span class="stb-charlist__name">
          {{ row.name }}<em v-if="row.isUser" class="stb-charlist__me">（我）</em>
          <FaIcon v-if="row.bond" icon="star" size="sm" class="stb-charlist__bond" title="命定契约" />
        </span>
        <span class="stb-charlist__meta">
          <span class="stb-charlist__lv">Lv.{{ row.level }}</span>
          <span>{{ row.tier }}</span>
          <span v-if="row.favor !== null" class="stb-charlist__favor">
            <FaIcon icon="heart" :size="10" />
            <span class="stb-charlist__favor-num">{{ row.favor }}</span>
          </span>
          <span
            v-if="row.hurt && row.hurt !== '无损' && HURT_KEY[row.hurt]"
            class="stb-charlist__hurt"
            :style="{
              color: `var(--stb-hurt-${HURT_KEY[row.hurt]})`,
              background: `color-mix(in srgb, var(--stb-hurt-${HURT_KEY[row.hurt]}) 18%, transparent)`,
            }"
          >{{ row.hurt }}</span>
        </span>
      </button>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.stb-charlist {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--stb-space-2);
}

.stb-charlist__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--stb-space-2);
  width: 100%;
  min-height: 44px;
  padding: var(--stb-space-2) var(--stb-space-3);
  border: 1px solid var(--stb-color-border-soft);
  border-radius: var(--stb-radius-card);
  background: var(--stb-color-bg-card);
  color: var(--stb-color-text);
  font-family: var(--stb-font-family);
  cursor: pointer;
  text-align: left;

  &:active {
    border-color: var(--stb-color-accent);
  }
}

.stb-charlist__name {
  min-width: 0;
  overflow-wrap: break-word;
  font-size: var(--stb-font-size-sm);
}

.stb-charlist__me {
  font-style: normal;
  color: var(--stb-color-text-dim);
}

.stb-charlist__bond {
  display: inline-flex;
  align-items: center;
  margin-left: var(--stb-space-2);
  line-height: 1;
  color: var(--stb-color-accent);
}

.stb-charlist__meta {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: var(--stb-space-2);
  font-size: var(--stb-font-size-xs);
  color: var(--stb-color-text-dim);
}

.stb-charlist__lv {
  color: var(--stb-color-text);
}

/* 好感胶囊：心形与数值成组，避免裸文字跟图标 */
.stb-charlist__favor {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--stb-color-bg-card);
  color: var(--stb-color-text-dim);

  .fa-heart {
    display: inline-flex;
    /* FA 心形字形在字体框内偏上，微调对齐文字中线 */
    transform: translateY(0.5px);
    line-height: 1;
    color: var(--stb-color-accent-soft);
  }
}

.stb-charlist__favor-num {
  font-size: 10px;
}

.stb-charlist__hurt {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 1.4;
}
</style>
