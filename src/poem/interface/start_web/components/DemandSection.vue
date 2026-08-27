<script setup lang="ts">
/** 开局要求区块：选填自由文本（外貌/性格倾向、过往、基调、目标） */
import type { FormState } from '../types';

defineProps<{ form: FormState }>();
</script>

<template>
  <section class="sw-sec">
    <h2 class="sw-sec__title">开局要求 <span class="sw-sec__opt">选填</span></h2>
    <textarea v-model="form.demand" class="sw-input sw-sec__textarea" rows="4" placeholder="对开局的额外要求：外貌性格倾向、过往经历、剧情基调、初始目标……"></textarea>
  </section>
</template>
