/**
 * 任务条目解析（tasks 作用域专用）。
 * 字段结构见变量更新规则（说明/状态/委托/等级/目标/奖励）：
 * - 等级（S/A/B/C/D）→ 头行字母徽标（借用品质色阶，越红越危险；未知灰）
 * - 状态（进行中/已完成/失败）→ 头行状态徽标；非进行中沉底排列并整体淡化
 * - 委托 → 头行下方委托方行
 * - 说明/目标/奖励及其余 string 字段 → 长文行（LongText 复用，不丢数据）
 */

/** 任务等级 → CSS 变量（借用品质色阶） */
const LEVEL_VAR: Record<string, string> = {
  S: 'var(--stb-quality-mythic)',
  A: 'var(--stb-quality-legend)',
  B: 'var(--stb-quality-epic)',
  C: 'var(--stb-quality-rare)',
  D: 'var(--stb-quality-normal)',
};

/** 任务等级排序权重（降序；无等级垫底） */
const LEVEL_RANK: Record<string, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };

/** 任务状态 → CSS 变量（未知状态灰） */
const STATUS_VAR: Record<string, string> = {
  进行中: 'var(--stb-color-accent)',
  已完成: 'var(--stb-color-success)',
  失败: 'var(--stb-color-danger)',
};

/** 已知长文字段 → 展示顺序 */
const LONG_ORDER = ['说明', '目标', '奖励'];

export interface TaskItem {
  name: string;
  /** '' = 无等级字段 */
  level: string;
  /** schema 默认 '进行中' */
  status: string;
  /** 委托方，'' = 无 */
  client: string;
  /** 已完成/失败 → 沉底 + 淡化 */
  done: boolean;
  longs: { key: string; text: string }[];
}

/** 等级徽标色（模板用；未知等级返回 undefined → 灰样式兜底） */
export function levelVar(level: string): string | undefined {
  return LEVEL_VAR[level];
}

/** 状态徽标色（模板用） */
export function statusVar(status: string): string | undefined {
  return STATUS_VAR[status];
}

export function parseTasks(record: unknown): TaskItem[] {
  const src = (record && typeof record === 'object' ? record : {}) as Record<string, unknown>;
  const items = Object.entries(src).map(([name, raw]) => {
    const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const level = typeof v.等级 === 'string' ? v.等级 : '';
    const status = typeof v.状态 === 'string' ? v.状态 : '进行中';
    const client = typeof v.委托 === 'string' ? v.委托 : '';

    const known = new Set(['状态', '等级', '委托']);
    const longs: { key: string; text: string }[] = [];
    for (const key of LONG_ORDER) {
      if (typeof v[key] === 'string' && v[key]) longs.push({ key, text: v[key] as string });
      known.add(key);
    }
    // 未知 string 字段兜底追加（不丢数据）
    for (const [key, val] of Object.entries(v)) {
      if (!known.has(key) && typeof val === 'string' && val) longs.push({ key, text: val });
    }

    return { name, level, status, client, done: status !== '进行中', longs };
  });

  return items.sort(compareTasks);
}

/** 排序：进行中在前、已完成/失败沉底；组内等级降序；同级保持插入序（sort 稳定） */
export function compareTasks(a: TaskItem, b: TaskItem): number {
  if (a.done !== b.done) return a.done ? 1 : -1;
  return (LEVEL_RANK[b.level] ?? 0) - (LEVEL_RANK[a.level] ?? 0);
}
