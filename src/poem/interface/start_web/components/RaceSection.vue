<script setup lang="ts">
/** 种族区块：预设卡片三组（主流/特色/异类）+ 自定义输入 */
import { RACES } from '../data';
import type { FormState } from '../types';

defineProps<{ form: FormState }>();
</script>

<template>
  <section class="sw-sec">
    <h2 class="sw-sec__title">种族</h2>
    <div v-for="group in (['主流', '特色', '异类'] as const)" :key="group" class="sw-sec__group">
      <div class="sw-sec__group-label">{{ group }}</div>
      <div class="sw-sec__grid">
        <button
          v-for="r in RACES.filter(x => x.group === group)"
          :key="r.name"
          type="button"
          class="sw-card"
          :class="{ 'sw-card--on': !form.raceIsCustom && form.race === r.name }"
          @click="
            form.raceIsCustom = false;
            form.race = r.name;
          "
        >
          <span class="sw-card__name">{{ r.name }}</span>
          <span class="sw-card__trait">{{ r.trait }}</span>
        </button>
        <button
          v-if="group === '异类'"
          type="button"
          class="sw-card"
          :class="{ 'sw-card--on': form.raceIsCustom }"
          @click="form.raceIsCustom = true"
        >
          <span class="sw-card__name">自定义</span>
          <span class="sw-card__trait">自由填写种族</span>
        </button>
      </div>
    </div>
    <input v-if="form.raceIsCustom" v-model="form.raceCustom" class="sw-input sw-sec__mt" placeholder="输入种族名（如：半精灵）" />
  </section>
</template>
