<script setup lang="ts">
/**
 * FontAwesome 图标封装。
 * 字号用 inline style 直写在 <i> 上：酒馆样式表对 .fa-solid 的直写规则
 * 带 ID 权重（1-1-0），class 选择器（含继承）无法覆盖，inline style 可稳压。
 * 额外 class/事件经 attrs 透传到 <i>。
 */
const props = withDefaults(defineProps<{ icon: string; size?: 'sm' | 'md' | 'lg' | number }>(), {
  size: 'md',
});

function fontSizePx(): string {
  const s = props.size;
  if (typeof s === 'number') return `${s}px`;
  return `var(--stb-icon-${s})`;
}
</script>

<template>
  <i class="fa-solid" :class="`fa-${icon}`" :style="{ fontSize: fontSizePx() }" aria-hidden="true" />
</template>
