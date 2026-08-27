/**
 * 等级系统配置
 *
 * 经验语义：schema 中 `经验` 为「当前等级进度」（升到下一级所需经验），
 * 由 AI 按格式输出当前值，脚本负责校验与升级结算。
 */

/** 满级 */
export const MAX_LEVEL = 25;

/** 五维属性键（schema 使用英文键） */
export const ATTRIBUTES = ['str', 'dex', 'con', 'int', 'wis'] as const;
export type Attribute = (typeof ATTRIBUTES)[number];

/** 属性上限（与 schema 中五维 clamp 一致） */
export const ATTRIBUTE_CAP = 20;

/** 每提升一级获得的属性点：按平均加权自动补给当前最低属性（防重复堆同一属性） */
export const ATTRIBUTE_POINTS_PER_LEVEL = 1;

/** 层级突破时全属性成长（每项 +N；键与 TIER_LEVELS 阈值一致） */
export const TIER_ATTRIBUTE_BONUS: Record<number, number> = { 5: 1, 9: 1, 13: 1, 17: 1, 21: 1, 25: 1 };

/** 登神门槛等级：突破这些等级需满足登神长阶前置条件 */
export const ASCENSION_GATE_LEVELS = [12, 16, 20, 24];

/**
 * 每级所需经验表（旧累计表换算差值，1 级起）
 * 键 = 当前等级，值 = 升到下一级所需经验
 */
export const EXP_REQUIREMENTS: Record<number, number> = {
  1: 120,
  2: 240,
  3: 360,
  4: 480,
  5: 1200,
  6: 1440,
  7: 1680,
  8: 1920,
  9: 4500,
  10: 5000,
  11: 5500,
  12: 6000,
  13: 10400,
  14: 11200,
  15: 12000,
  16: 12800,
  17: 25500,
  18: 27000,
  19: 28500,
  20: 30000,
  21: 50400,
  22: 52800,
  23: 55200,
  24: 57600,
};

/** 生命层级晋升表：键 = 等级阈值，值 = 层级名 */
export const TIER_LEVELS: Record<number, string> = {
  1: '第一层级',
  5: '第二层级',
  9: '第三层级',
  13: '第四层级',
  17: '第五层级',
  21: '第六层级',
  25: '第七层级',
};

/** 该等级升到下一级所需经验；满级返回 null */
export function expNeed(level: number): number | null {
  return _.get(EXP_REQUIREMENTS, level, null);
}

/** 该等级对应的生命层级名 */
export function tierOf(level: number): string {
  const hit = _.chain(TIER_LEVELS)
    .keys()
    .map(Number)
    .filter(t => level >= t)
    .max()
    .value();
  return hit === undefined ? TIER_LEVELS[1] : TIER_LEVELS[hit];
}

/** 是否为登神门槛等级 */
export function isAscensionGate(level: number): boolean {
  return ASCENSION_GATE_LEVELS.includes(level);
}
