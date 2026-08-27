/**
 * 开局设定预设数据与派生函数。
 * 种族与地点摘自 世界书/race/种族概览.yaml 与 世界书/world/{势力概览,世界主设定}.yaml。
 */

export interface RaceOption {
  name: string;
  /** 一行特质描述 */
  trait: string;
  /** 分组：主流文明种族 / 特色种族 / 异类挑战 */
  group: '主流' | '特色' | '异类';
}

export const RACES: RaceOption[] = [
  { name: '人类', trait: '适应性强 · 分布最广', group: '主流' },
  { name: '兽族', trait: '兽耳/幻身种 · 草原霸权', group: '主流' },
  { name: '精灵', trait: '魔力亲和 · 千年长生', group: '主流' },
  { name: '翼民', trait: '背生双翼 · 辉煌信徒', group: '主流' },
  { name: '矮人', trait: '敦实强壮 · 精于锻造', group: '主流' },
  { name: '人鱼', trait: '人身鱼尾 · 自由艺术', group: '主流' },
  { name: '北境龙裔', trait: '巨龙血脉 · 崇尚力量', group: '特色' },
  { name: '东方龙裔', trait: '神龙血脉 · 御气占星', group: '特色' },
  { name: '血族', trait: '永生不死 · 苍白魅惑', group: '特色' },
  { name: '光翅妖精', trait: '体型娇小 · 自然幻术', group: '特色' },
  { name: '汐海妖精', trait: '水母触手 · 浮空游动', group: '特色' },
  { name: '魔造生物', trait: '禁忌实验 · 血肉人造', group: '特色' },
  { name: '构装体', trait: '无魂魔像 · 严守指令', group: '异类' },
  { name: '元素生物', trait: '纯粹能量 · 契约精神', group: '异类' },
  { name: '植物生物', trait: '觉醒植株 · 再生畏火', group: '异类' },
  { name: '不定形生物', trait: '半液态 · 吞噬分解', group: '异类' },
  { name: '不死生物', trait: '死骸活化 · 畏惧正能', group: '异类' },
  { name: '亚龙', trait: '淡薄龙血 · 低智狡诈', group: '异类' },
];

export interface PlaceOption {
  name: string;
  trait: string;
}

export const PLACES: PlaceOption[] = [
  { name: '奥古斯提姆帝国', trait: '东部平原 · 人类霸主' },
  { name: '瓦伦蒂亚公国', trait: '无尽地城 · 冒险者圣地' },
  { name: '索伦蒂斯王国', trait: '东南沿海 · 商贸水乡' },
  { name: '诺斯加德联盟', trait: '北方联邦 · 航海商贸' },
  { name: '翼民圣国梵尼亚', trait: '天空圣域 · 神权教国' },
  { name: '精灵王庭', trait: '古老半岛 · 世界树' },
  { name: '兽族联盟·卡拉什利亚斯', trait: '中西部草原 · 自由传统' },
  { name: '萨赫拉联邦', trait: '东南沙漠 · 财富为尊' },
  { name: '伯伦斯法环', trait: '东北沿海 · 魔法自治' },
  { name: '永冻冰原', trait: '极北绝境 · 冰雪挑战' },
];

/** 属性键 → 中文名（schema: str/dex/con/int/wis） */
export const ATTR_NAMES: Record<'str' | 'dex' | 'con' | 'int' | 'wis', string> = {
  str: '力量',
  dex: '敏捷',
  con: '体质',
  int: '智力',
  wis: '精神',
};

export type AttrKey = keyof typeof ATTR_NAMES;

/** v-for 用条目（键类型保留） */
export const ATTR_ENTRIES = Object.entries(ATTR_NAMES) as [AttrKey, string][];

/** 基础点总和档位（角色辅助指导：天赋定位） */
export function talentTier(total: number): string {
  if (total <= 5) return '弱小';
  if (total <= 10) return '平凡';
  if (total <= 15) return '正常';
  if (total <= 20) return '优良';
  return '异禀';
}

/** 等级 → 生命层级（生命层级与社会阶级.yaml：一1-4 二5-8 三9-12 四13-16） */
export function tierOf(level: number): { tier: number; name: string; label: string } {
  if (level <= 4) return { tier: 1, name: '第一层级', label: '普通' };
  if (level <= 8) return { tier: 2, name: '第二层级', label: '中坚' };
  if (level <= 12) return { tier: 3, name: '第三层级', label: '精英' };
  return { tier: 4, name: '第四层级', label: '史诗' };
}

/** 层级描述（等级 slider 联动文案） */
export function tierDesc(level: number): string {
  const t = tierOf(level);
  const map: Record<number, string> = {
    1: '普通人。少数拥有攻击技能',
    2: '能量初步离体，拥有个人战斗风格',
    3: '踏入超凡，以一敌百',
    4: '一人即军，登神长阶开启，可掌握要素',
  };
  return `${t.name} · ${t.label} —— ${map[t.tier]}`;
}
