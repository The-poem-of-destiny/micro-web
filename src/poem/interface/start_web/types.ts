/**
 * 表单状态契约：App.vue 持有 reactive 实例，各 Section 组件接收引用直接改字段。
 */
import type { AttrKey } from './data';

export interface FormState {
  name: string;
  sex: '男' | '女' | '其他';
  race: string;
  raceCustom: string;
  raceIsCustom: boolean;
  identity: string;
  job: string;
  /** 1~10（第三层级封顶，保持成长空间） */
  level: number;
  /** 天赋基础点：每项 0-6，总和 0-25 */
  base: Record<AttrKey, number>;
  /** 等级分配点：总额 level-1 */
  alloc: Record<AttrKey, number>;
  place: string;
  placeCustom: string;
  placeIsCustom: boolean;
  /** 开局要求（选填自由文本） */
  demand: string;
}

export function createForm(): FormState {
  return {
    name: '',
    sex: '男',
    race: '人类',
    raceCustom: '',
    raceIsCustom: false,
    identity: '',
    job: '',
    level: 1,
    base: { str: 3, dex: 3, con: 3, int: 3, wis: 3 },
    alloc: { str: 0, dex: 0, con: 0, int: 0, wis: 0 },
    place: '瓦伦蒂亚公国',
    placeCustom: '',
    placeIsCustom: false,
    demand: '',
  };
}
