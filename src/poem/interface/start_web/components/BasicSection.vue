<script setup lang="ts">
/** 基本信息区块：姓名 + 性别三选 + 身份/职业（自由填写，无预设） */
import type { FormState } from '../types';

defineProps<{ form: FormState }>();
</script>

<template>
  <section class="sw-sec">
    <h2 class="sw-sec__title">基本信息</h2>
    <div class="sw-sec__row">
      <input v-model="form.name" class="sw-input" placeholder="姓名 *" />
      <div class="sw-sec__seg">
        <button
          v-for="s in (['男', '女', '其他'] as const)"
          :key="s"
          type="button"
          class="sw-sec__seg-btn"
          :class="{ 'sw-sec__seg-btn--on': form.sex === s }"
          @click="form.sex = s"
        >
          {{ s }}
        </button>
      </div>
    </div>
    <input v-model="form.identity" class="sw-input sw-sec__mt" placeholder="身份（社会定位，如：冒险者、佣兵、学徒）" />
    <input v-model="form.job" class="sw-input sw-sec__mt" placeholder="职业（技能方向，选填，如：剑士、法师、神官）" />
  </section>
</template>
