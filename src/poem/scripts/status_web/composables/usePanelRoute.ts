import { ref } from 'vue';

/**
 * 面板路由（面板本地 UI 状态，不进酒馆变量）：
 * 作用域（当前查看对象）+ 子 tab + 角色列表开关。
 *
 * 结构：默认直达 user；点当前角色 chip 开关角色列表（原地替换内容区）；
 * 任务是与角色平级的作用域（无子 tab）。
 */

/** 作用域：角色（user / 具名 partner）或任务 */
export type Scope = { kind: 'user' } | { kind: 'partner'; name: string } | { kind: 'tasks' };

/** 角色作用域下的子 tab */
export type Tab = '概览' | '物品' | '技能' | 'buff' | '资产' | '登神' | '档案';

export function usePanelRoute() {
  const scope = ref<Scope>({ kind: 'user' });
  const tab = ref<Tab>('概览');
  const listOpen = ref(false);
  /** 最近一次的角色作用域：任务作用域下角色 chip 仍显示它（不显示「任务」） */
  const lastCharScope = ref<Scope>({ kind: 'user' });

  /** 当前角色 chip 文案（列表打开时提示选择态） */
  function scopeLabel(userName: string): string {
    if (listOpen.value) return '选择角色';
    if (lastCharScope.value.kind === 'user') return userName;
    return (lastCharScope.value as { kind: 'partner'; name: string }).name;
  }

  /** 选作用域：关列表；档案为 partner 专属，落到 user/tasks 时回概览 */
  function selectScope(next: Scope): void {
    if (next.kind !== 'tasks') lastCharScope.value = next;
    scope.value = next;
    listOpen.value = false;
    if (next.kind !== 'partner' && tab.value === '档案') tab.value = '概览';
  }

  /** 开关角色列表 */
  function toggleList(): void {
    listOpen.value = !listOpen.value;
  }

  function selectTab(next: Tab): void {
    tab.value = next;
  }

  return { scope, tab, listOpen, scopeLabel, selectScope, toggleList, selectTab };
}
