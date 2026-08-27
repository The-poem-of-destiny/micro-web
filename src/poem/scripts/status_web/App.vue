<script setup lang="ts">
import { ref } from 'vue';
import Orb from './components/Orb.vue';
import Panel from './components/Panel.vue';
import { useOrbLayout } from './composables/useOrbLayout';

const orbEl = ref<HTMLElement | null>(null);
const panelEl = ref<HTMLElement | null>(null);

const { expanded, docked, isDragging, orbStyle, panelStyle, toggle, onOrbClick, onPointerDown, onPointerMove, onPointerUp } =
  useOrbLayout(orbEl, panelEl);

const setOrbEl = (el: HTMLElement | null) => (orbEl.value = el);
const setPanelEl = (el: HTMLElement | null) => (panelEl.value = el);
</script>

<template>
  <Orb
    :set-el="setOrbEl"
    :expanded="expanded"
    :docked="docked"
    :is-dragging="isDragging"
    :style="orbStyle"
    @click="onOrbClick"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  />
  <Panel :set-el="setPanelEl" :expanded="expanded" :style="panelStyle" @close="toggle" />
</template>