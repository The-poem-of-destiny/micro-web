import { computed, nextTick, onBeforeUnmount, ref, type CSSProperties, type Ref } from 'vue';
import { useDevice } from './useDevice';

/** 悬浮球直径 (px)：食指指腹大小，移动端触摸目标（与 styles/index.scss 的 --stb-orb-size 一致） */
export const ORB_SIZE = 40;
/** 面板固定宽度 (px)：移动端标准卡片放大；小屏手机取 min(360, 92vw) */
export const PANEL_W = 360;
/** 面板与球的间距 (px) */
const GAP = 8;

/**
 * 挂载式状态栏布局：自实现 pointer 拖动、贴边吸附、展开/收起。
 *
 * 坐标约定：x/y 一律为酒馆文档坐标（absolute 定位），
 * 拖动 delta 用视口坐标差（拖动期间页面不滚动，两者等价），
 * 贴边判定用视口坐标（clientX 相对酒馆视口）。
 *
 * 面板：高度自适应内容（上限见 CSS --stb-panel-max-height，超出滚动）；
 * 移动端固定居中；非移动端按球位置哪边空间大向哪边展开。
 *
 * 不用 useDraggable 的原因：球所在的挂载容器随球移动时，
 * 其基于 clientX 的相对位移计算会形成坐标反馈循环（跳来跳去）；
 * 自实现 pointer 事件 + setPointerCapture 无容器随动问题且天然跟手。
 */
export function useOrbLayout(orbEl: Ref<HTMLElement | null>, panelEl: Ref<HTMLElement | null>) {
  const { isMobile, viewport } = useDevice();
  const vw = () => viewport.value.w;
  const vh = () => viewport.value.h;
  // 文档实际宽度（防横向溢出时球定位到可视区之外）
  const docW = () => Math.max(window.parent.document.documentElement.scrollWidth || vw(), vw());
  const scrollX = () => window.parent.scrollX || 0;
  const scrollY = () => window.parent.scrollY || 0;
  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
  /** 球在文档坐标系的合法 x 范围 */
  const xRange = () => [scrollX(), Math.min(scrollX() + vw() - ORB_SIZE, docW() - ORB_SIZE)] as const;

  const expanded = ref(false);
  const docked = ref<'left' | 'right' | null>('right');
  const isDragging = ref(false);
  /** 面板实测高度（内容自适应，受 max-height 上限约束） */
  const panelH = ref(0);
  let resizeObserver: ResizeObserver | null = null;

  // 初始位置：右侧贴边、垂直居中（换算为文档坐标）
  const x = ref(scrollX() + vw() - ORB_SIZE);
  const y = ref(scrollY() + Math.round(vh() / 2 - ORB_SIZE / 2));

  let dragStart: { clientX: number; clientY: number; left: number; top: number } | null = null;
  let downTime = 0;
  let moved = false;
  /** 拖动/长按后抑制随后的 click（区分点击展开与拖动） */
  const suppressClick = ref(false);

  function onPointerDown(e: PointerEvent): void {
    if (expanded.value) return;
    dragStart = { clientX: e.clientX, clientY: e.clientY, left: x.value, top: y.value };
    downTime = Date.now();
    moved = false;
    suppressClick.value = false;
    isDragging.value = true;
    orbEl.value?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent): void {
    if (!dragStart) return;
    if (Math.abs(e.clientX - dragStart.clientX) > 4 || Math.abs(e.clientY - dragStart.clientY) > 4) {
      moved = true;
    }
    if (!moved) return;
    const [lo, hi] = xRange();
    x.value = clamp(dragStart.left + (e.clientX - dragStart.clientX), lo, hi);
    y.value = clamp(
      dragStart.top + (e.clientY - dragStart.clientY),
      scrollY(),
      scrollY() + vh() - ORB_SIZE,
    );
  }

  function onPointerUp(e: PointerEvent): void {
    if (!dragStart) return;
    const longPress = Date.now() - downTime > 400;
    if (moved || longPress) suppressClick.value = true;
    dragStart = null;
    isDragging.value = false;
    // 仅真正拖动过才吸附/停靠；点击与长按不改变位置
    if (!moved) return;
    const [lo, hi] = xRange();
    // 靠边判定：球缘距视口边缘 < 半指(ORB_SIZE/2) 才吸附
    if (e.clientX < ORB_SIZE / 2) {
      docked.value = 'left';
      x.value = lo;
    } else if (e.clientX > vw() - ORB_SIZE - ORB_SIZE / 2) {
      docked.value = 'right';
      x.value = hi;
    } else {
      docked.value = null;
    }
    y.value = clamp(y.value, scrollY(), scrollY() + vh() - ORB_SIZE);
  }

  /** 球点击：拖动/长按后的 click 被抑制，仅纯点击触发展开 */
  function onOrbClick(): void {
    if (suppressClick.value) {
      suppressClick.value = false;
      return;
    }
    toggle();
  }

  /** 球元素样式（absolute，文档坐标；缩半由 CSS 类 translate 控制，z-index 由 token 控制） */
  const orbStyle = computed<CSSProperties>(() => ({
    position: 'absolute',
    left: `${x.value}px`,
    top: `${y.value}px`,
  }));

  /** 面板实际宽度：min(360, 92vw)（小屏手机防溢出） */
  const panelW = () => Math.min(PANEL_W, Math.round(vw() * 0.92));

  /** 面板展开位置（视口坐标）：移动端固定居中；非移动端按球周空间哪边大向哪边展开 */
  const panelPos = computed(() => {
    const pw = panelW();
    const ph = panelH.value;
    if (isMobile.value) {
      return { left: (vw() - pw) / 2, top: (vh() - ph) / 2 };
    }
    const cx = x.value - scrollX(); // 球视口坐标（左上角）
    const cy = y.value - scrollY();
    const spaceRight = vw() - cx - ORB_SIZE;
    const spaceBottom = vh() - cy - ORB_SIZE;
    // 该侧空间足以放下面板，或大于对侧空间 → 向该侧展开
    const openRight = spaceRight >= pw + GAP || spaceRight >= cx;
    const openBottom = spaceBottom >= ph + GAP || spaceBottom >= cy;
    return {
      left: clamp(openRight ? cx + ORB_SIZE + GAP : cx - GAP - pw, 0, vw() - pw),
      top: clamp(openBottom ? cy + ORB_SIZE + GAP : cy - GAP - ph, 0, vh() - ph),
    };
  });

  /** 点击外部收起：目标不在面板/球内则收起（挂酒馆 document 捕获阶段，防被酒馆元素 stopPropagation） */
  function onOutsidePointer(e: PointerEvent): void {
    const t = e.target as Node | null;
    if (t && (panelEl.value?.contains(t) || orbEl.value?.contains(t))) return;
    collapse();
  }

  /** 展开：面板显示后测量高度；内容变化（ResizeObserver）时高度与位置跟随更新 */
  async function expand(): Promise<void> {
    expanded.value = true;
    window.parent.document.addEventListener('pointerdown', onOutsidePointer, true);
    await nextTick();
    const panel = panelEl.value;
    if (!panel) return;
    panelH.value = panel.offsetHeight;
    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        panelH.value = entry.target.clientHeight;
      }
    });
    resizeObserver.observe(panel);
  }

  /** 收起：仅收起面板，球停在原处 */
  function collapse(): void {
    expanded.value = false;
    window.parent.document.removeEventListener('pointerdown', onOutsidePointer, true);
    resizeObserver?.disconnect();
    resizeObserver = null;
  }

  function toggle(): void {
    if (expanded.value) collapse();
    else void expand();
  }

  /** 面板元素样式（absolute，文档坐标；宽度固定，高度由 CSS 自适应） */
  const panelStyle = computed<CSSProperties>(() => ({
    position: 'absolute',
    left: `${panelPos.value.left + scrollX()}px`,
    top: `${panelPos.value.top + scrollY()}px`,
    width: `${panelW()}px`,
  }));

  onBeforeUnmount(() => {
    window.parent.document.removeEventListener('pointerdown', onOutsidePointer, true);
    resizeObserver?.disconnect();
  });

  return {
    expanded,
    docked,
    isDragging,
    orbStyle,
    panelStyle,
    toggle,
    onOrbClick,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
