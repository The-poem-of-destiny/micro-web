<script setup lang="ts">
/** 开局地点区块：预设势力/区域卡片 + 自定义输入 */
import { PLACES } from '../data';
import type { FormState } from '../types';

defineProps<{ form: FormState }>();
</script>

<template>
  <section class="sw-sec">
    <h2 class="sw-sec__title">开局地点</h2>
    <div class="sw-sec__grid">
      <button
        v-for="p in PLACES"
        :key="p.name"
        type="button"
        class="sw-card"
        :class="{ 'sw-card--on': !form.placeIsCustom && form.place === p.name }"
        @click="
          form.placeIsCustom = false;
          form.place = p.name;
        "
      >
        <span class="sw-card__name">{{ p.name }}</span>
        <span class="sw-card__trait">{{ p.trait }}</span>
      </button>
      <button
        type="button"
        class="sw-card"
        :class="{ 'sw-card--on': form.placeIsCustom }"
        @click="form.placeIsCustom = true"
      >
        <span class="sw-card__name">自定义</span>
        <span class="sw-card__trait">自由填写地点</span>
      </button>
    </div>
    <input v-if="form.placeIsCustom" v-model="form.placeCustom" class="sw-input sw-sec__mt" placeholder="输入开局地点（如：某边境村庄）" />
  </section>
</template>
