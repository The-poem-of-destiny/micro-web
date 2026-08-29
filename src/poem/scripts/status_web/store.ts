import { Schema } from '../../schema';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * 挂载式状态栏数据源。
 * 从当前消息楼层变量 `stat_data` 读取展示字段；
 * 经 Schema.safeParse 补全默认值，解析失败（生成中的半成品数据等）时降级原始数据。
 */
export const useStatusStore = defineStore('status_web', () => {
  const stat = ref<Record<string, any>>({});

  /** 玩家在酒馆中使用的名字 */
  const userName = SillyTavern.name1 || '我';

  /** 顶栏字段 */
  const time = computed(() => (typeof stat.value.time === 'string' ? stat.value.time : ''));
  const loc = computed(() => (typeof stat.value.loc === 'string' ? stat.value.loc : ''));

  /** 角色作用域列表：user 固定首位 + partner 按键序 */
  const roleList = computed<{ kind: 'user' | 'partner'; name: string }[]>(() => [
    { kind: 'user', name: userName },
    ...Object.keys((stat.value.partner ?? {}) as Record<string, unknown>).map(name => ({
      kind: 'partner' as const,
      name,
    })),
  ]);

  /** 任务列表（全局作用域，含脚本注入的登神阶段任务） */
  const tasks = computed(() => (stat.value.tasks ?? {}) as Record<string, any>);

  /**
   * 刷新展示数据（挂载时与每次变量更新时调用，须在 MVU 初始化完成后）
   *
   * 变量更新事件传入的变量表在写回楼层前触发，此时重新读取只能得到旧数据，
   * 因此优先使用事件传入的 `variables`；仅在挂载初次拉取时读取最新楼层变量。
   */
  function refresh(variables?: Mvu.MvuData): void {
    const raw = (_.get(variables ?? Mvu.getMvuData({ type: 'message', message_id: 'latest' }), 'stat_data') ?? {}) as Record<string, any>;
    const parsed = Schema.safeParse(raw);
    if (parsed.success) {
      stat.value = parsed.data as Record<string, any>;
    } else {
      console.warn('[status_web] stat_data 解析失败，降级为原始数据', z.prettifyError(parsed.error));
      stat.value = raw;
    }
  }

  return { stat, userName, time, loc, roleList, tasks, refresh };
});
