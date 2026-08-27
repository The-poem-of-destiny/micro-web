<script setup lang="ts">
/**
 * 可展开长文本：截断态 inline 展开钮紧跟省略号，展开态收起钮跟在全文末尾。
 * 展开状态组件内自管（实例隔离，无需外部 key）；字号/颜色由调用方容器继承。
 */
import { computed, ref } from 'vue';
import { clampText, needsToggle } from '../utils/textTruncate';

const props = withDefaults(defineProps<{ text: string; lines?: number }>(), { lines: 2 });

const open = ref(false);
const toggleable = computed(() => needsToggle(props.text, props.lines));

function toggle(): void {
  open.value = !open.value;
}
</script>

<template>
  <span
    class="stb-lt"
    :class="{ 'stb-lt--toggleable': toggleable }"
    @click="toggleable && toggle()"
  >{{ open ? text : clampText(text, lines) }}<button v-if="toggleable" class="stb-lt__toggle" @click.stop="toggle()">{{ open ? '收起' : '展开' }}</button></span>
</template>

<style scoped lang="scss">
.stb-lt {
  &--toggleable {
    cursor: pointer;
  }
}

.stb-lt__toggle {
  display: inline-flex;
  align-items: baseline;
  margin-left: 2px;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 10px;
  vertical-align: baseline;
  color: var(--stb-color-accent-soft);
  cursor: pointer;

  &:active {
    color: var(--stb-color-accent);
  }
}
</style>
