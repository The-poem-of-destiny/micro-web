<script setup lang="ts">
/** 属性分配区块：基础(天赋) + 层级点(自动) + 分配(等级池)，算式透明 */
import { computed } from 'vue';
import { ATTR_ENTRIES, talentTier, tierOf, type AttrKey } from '../data';
import type { FormState } from '../types';

const props = defineProps<{ form: FormState }>();

const tier = computed(() => tierOf(props.form.level));
const baseTotal = computed(() => Object.values(props.form.base).reduce((a, b) => a + b, 0));
const allocPool = computed(() => props.form.level - 1);
const allocLeft = computed(() => allocPool.value - Object.values(props.form.alloc).reduce((a, b) => a + b, 0));

/** 单项最终值 = 基础 + 层级点 + 分配 */
function attrVal(key: AttrKey): number {
  return props.form.base[key] + (tier.value.tier - 1) + props.form.alloc[key];
}

function stepBase(key: AttrKey, delta: number): void {
  const next = props.form.base[key] + delta;
  if (next < 0 || next > 6 || baseTotal.value + delta > 25) return;
  props.form.base[key] = next;
}

function stepAlloc(key: AttrKey, delta: number): void {
  if (allocLeft.value - delta < 0) return;
  if (props.form.alloc[key] + delta < 0) return;
  if (attrVal(key) + delta > 20) return;
  props.form.alloc[key] += delta;
}

defineExpose({ attrVal, baseTotal, allocLeft });
</script>

<template>
  <section class="sw-sec">
    <h2 class="sw-sec__title">属性分配</h2>
    <div class="sw-sec__pools">
      <div class="sw-sec__pool">
        <span class="sw-sec__pool-label">天赋 {{ talentTier(baseTotal) }}</span>
        <span class="sw-sec__pool-num">基础 {{ baseTotal }}/25</span>
      </div>
      <div class="sw-sec__pool">
        <span class="sw-sec__pool-label">{{ tier.name }}</span>
        <span class="sw-sec__pool-num" :class="{ 'sw-sec__pool-num--warn': allocLeft === 0 && allocPool > 0 }">分配余 {{ allocLeft }}/{{ allocPool }}</span>
      </div>
    </div>
    <div v-for="[key, label] in ATTR_ENTRIES" :key="key" class="sw-sec__attr">
      <span class="sw-sec__attr-name">{{ label }}</span>
      <span class="sw-sec__attr-step">
        <button type="button" class="sw-sec__btn-step" @click="stepBase(key, -1)">−</button>
        <span class="sw-sec__attr-base">{{ form.base[key] }}</span>
        <button type="button" class="sw-sec__btn-step" @click="stepBase(key, 1)">＋</button>
      </span>
      <span class="sw-sec__attr-plus">+{{ tier.tier - 1 }} +</span>
      <span class="sw-sec__attr-step">
        <button type="button" class="sw-sec__btn-step" @click="stepAlloc(key, -1)">−</button>
        <span class="sw-sec__attr-alloc">{{ form.alloc[key] }}</span>
        <button type="button" class="sw-sec__btn-step" @click="stepAlloc(key, 1)">＋</button>
      </span>
      <span class="sw-sec__attr-total">{{ attrVal(key) }}</span>
    </div>
  </section>
</template>
