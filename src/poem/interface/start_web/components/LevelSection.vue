<script setup lang="ts">
/** 起始等级区块：slider 1~10，层级描述联动 */
import { tierDesc } from '../data';
import type { FormState } from '../types';

defineProps<{ form: FormState }>();
</script>

<template>
  <section class="sw-sec">
    <h2 class="sw-sec__title">起始等级</h2>
    <div class="sw-sec__lv">
      <span class="sw-sec__lv-num">Lv.{{ form.level }}</span>
      <input v-model.number="form.level" type="range" min="1" max="10" step="1" class="sw-sec__slider" />
    </div>
    <p class="sw-sec__tier-desc">{{ tierDesc(form.level) }}</p>
  </section>
</template>
