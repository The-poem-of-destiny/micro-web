import { computed, onBeforeUnmount, ref } from 'vue';

export type DeviceKind = 'mobile' | 'tablet' | 'desktop';

/**
 * 设备类型与视口尺寸（响应式）。
 *
 * 移动端优先：≤640px 视为手机（mobile），≤1024px 视为平板（tablet），其余桌面。
 * 视口取酒馆页面（组件 JS 运行在脚本 iframe，酒馆 window 是其 parent），
 * 尺寸与指针事件 clientX/Y 同坐标系（clientWidth/clientHeight）。
 */
export function useDevice() {
  const win = () => window.parent;
  const doc = () => win().document.documentElement;

  const viewport = ref({ w: doc().clientWidth || win().innerWidth, h: doc().clientHeight || win().innerHeight });

  function resolve(): DeviceKind {
    const w = viewport.value.w;
    if (w <= 640) return 'mobile';
    if (w <= 1024) return 'tablet';
    return 'desktop';
  }

  const device = ref<DeviceKind>(resolve());

  function update(): void {
    viewport.value = { w: doc().clientWidth || win().innerWidth, h: doc().clientHeight || win().innerHeight };
    device.value = resolve();
  }

  win().addEventListener('resize', update);
  onBeforeUnmount(() => win().removeEventListener('resize', update));

  return {
    device,
    isMobile: computed(() => device.value === 'mobile'),
    viewport,
  };
}
