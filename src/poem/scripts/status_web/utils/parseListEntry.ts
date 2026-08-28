/**
 * 通用卡列表条目解析（物品 / 技能 / buff / 资产共用）。
 * 字段按白名单路由（生成规则见变量更新规则）：
 * - 品质（普通~唯一）→ 品质色徽标；buff 类型（增益/减益）→ 状态色徽标
 * - 短字段（类型/消耗/层数/剩余时间）→ 头行灰徽标
 * - 效果（record「效果名: 效果」）→ 正文逐条效果行
 * - 空间（{分区, 空闲面积, 规模}）/ 经营（{状态, 估价, 收益, 结算日}）→ 结构化块
 * - 长文字段（描述/来源…）→ label + 截断行
 * 数量挂名称旁 ×N（=1 省略）；未识别字段兜底路由，不丢数据。
 */

/** 品质 → CSS 变量（token 定义于 styles/index.scss） */
const QUALITY_VAR: Record<string, string> = {
  普通: 'var(--stb-quality-normal)',
  优良: 'var(--stb-quality-fine)',
  稀有: 'var(--stb-quality-rare)',
  史诗: 'var(--stb-quality-epic)',
  传说: 'var(--stb-quality-legend)',
  神话: 'var(--stb-quality-mythic)',
  唯一: 'var(--stb-quality-unique)',
};

/** 品质展示权重（列表降序用）：唯一置顶（剧情收藏品），普通~神话按强度，无品质垫底 */
export const QUALITY_RANK: Record<string, number> = {
  唯一: 7,
  神话: 6,
  传说: 5,
  史诗: 4,
  稀有: 3,
  优良: 2,
  普通: 1,
};

/** buff 类型 → 状态色（特殊 → 默认灰） */
const BUFF_TYPE_VAR: Record<string, string> = {
  增益: 'var(--stb-color-success)',
  减益: 'var(--stb-color-danger)',
};

/** 头行徽标短字段（按此优先级排列） */
const BADGE_ORDER = ['品质', '类型', '消耗', '层数', '剩余时间', '状态'];

/** 长文字段 → 截断行数 */
const LONG_LINES: Record<string, number> = { 描述: 2, 空间: 3, 来源: 2 };

export interface Badge {
  text: string;
  color?: string;
}
export interface EffectLine {
  key: string;
  val: string;
}
export interface LongLine {
  key: string;
  text: string;
  lines: number;
}
/** 空间分区（键为分区名） */
export interface SpaceArea {
  name: string;
  rooms: string;
  area: string;
}
/** 资产空间：分区列表 + 空闲面积 + 规模 */
export interface SpaceInfo {
  areas: SpaceArea[];
  freeArea: string;
  scale: string;
}
/** 资产经营：状态/估价/收益/结算日 */
export interface ManageInfo {
  status: string;
  valuation: string;
  income: string;
  settleDay: string;
}
export interface ListItem {
  name: string;
  count: number;
  badges: Badge[];
  effects: EffectLine[];
  longs: LongLine[];
  /** 资产空间块（仅资产条目） */
  space?: SpaceInfo;
  /** 资产经营块（仅资产条目） */
  manage?: ManageInfo;
  /** 品质排序权重（无品质 = 0） */
  quality: number;
  /** 类型文本（技能/物品的类型、buff 的增益/减益/特殊；排序分组用） */
  type: string;
}

/** 列表排序：品质降序（唯一置顶）→ 同品质内类型相邻 → 保持 AI 原序（稳定排序）。
 * 类型比较用码点序（确定性，不依赖 ICU/拼音）：恰好使 buff 序为 减益→增益→特殊（负面优先） */
export function compareItems(a: ListItem, b: ListItem): number {
  const q = b.quality - a.quality;
  if (q !== 0) return q;
  if (a.type !== b.type) return a.type < b.type ? -1 : 1;
  return 0;
}

/** 值 → 展示字符串（嵌套 object 拼串兜底） */
function formatVal(v: unknown): string {
  if (v !== null && typeof v === 'object') {
    return Object.entries(v as Record<string, unknown>)
      .map(([k, val]) => `${k}=${String(val)}`)
      .join(' ');
  }
  return String(v);
}

/** 单条目 → 卡片模型 */
export function parseEntry(name: string, raw: unknown): ListItem {
  const item: ListItem = { name, count: 1, badges: [], effects: [], longs: [], quality: 0, type: '' };

  // 值非对象（降级数据/简记）：整体作无标签长文
  if (raw === null || typeof raw !== 'object') {
    const text = String(raw ?? '');
    if (text) item.longs.push({ key: '', text, lines: 2 });
    return item;
  }
  const obj = { ...(raw as Record<string, any>) };

  // 数量 → 名称旁 ×N
  const count = Number(obj.数量);
  if (Number.isFinite(count) && count > 1) item.count = count;
  delete obj.数量;

  // 短字段徽标（固定优先级；值过长时降级为长文行）
  for (const field of BADGE_ORDER) {
    const v = obj[field];
    if (v === undefined || v === null || v === '') continue;
    const text = typeof v === 'string' ? v : formatVal(v);
    if (text && QUALITY_VAR[text]) {
      item.badges.push({ text, color: QUALITY_VAR[text] });
      item.quality = QUALITY_RANK[text] ?? 0;
    } else if (field === '类型' && BUFF_TYPE_VAR[text]) {
      item.badges.push({ text, color: BUFF_TYPE_VAR[text] });
      item.type = text;
    } else if (text.length <= 12) {
      item.badges.push({ text });
      if (field === '类型') item.type = text;
    } else {
      item.longs.push({ key: field, text, lines: LONG_LINES[field] ?? 2 });
    }
    delete obj[field];
  }

  // 效果：record 逐条展开为「效果名: 效果」行；string 作长文
  const eff = obj.效果;
  if (eff !== undefined && eff !== null) {
    if (typeof eff === 'object') {
      for (const [k, v] of Object.entries(eff as Record<string, unknown>)) {
        if (v === '' || v === null || v === undefined) continue;
        item.effects.push({ key: k, val: formatVal(v) });
      }
    } else if (String(eff)) {
      item.longs.push({ key: '效果', text: String(eff), lines: 2 });
    }
    delete obj.效果;
  }

  // 空间：结构化渲染（分区列表 + 空闲面积 + 规模）；非对象留给兜底路由
  const sp = obj.空间;
  if (sp !== undefined && sp !== null && typeof sp === 'object') {
    const s = sp as Record<string, any>;
    const areas = Object.entries((s.分区 as Record<string, any>) ?? {}).map(([name, v]) => {
      const a = (v && typeof v === 'object' ? v : {}) as Record<string, any>;
      return {
        name,
        rooms: Array.isArray(a.房间) ? a.房间.filter((r: unknown) => typeof r === 'string' && r).join('、') : formatVal(a.房间),
        area: typeof a.面积 === 'string' ? a.面积 : '',
      };
    });
    const freeArea = typeof s.空闲面积 === 'string' && s.空闲面积 && s.空闲面积 !== '不适用' ? s.空闲面积 : '';
    const scale = typeof s.规模 === 'string' && s.规模 && s.规模 !== '不适用' ? s.规模 : '';
    if (areas.length || freeArea || scale) item.space = { areas, freeArea, scale };
    delete obj.空间;
  }

  // 经营：状态徽标 + 估价/收益/结算日；非对象留给兜底路由
  const mg = obj.经营;
  if (mg !== undefined && mg !== null && typeof mg === 'object') {
    const m = mg as Record<string, any>;
    const status = typeof m.状态 === 'string' ? m.状态 : '';
    const valuation = typeof m.估价 === 'string' && m.估价 && m.估价 !== '不适用' ? m.估价 : '';
    const income = typeof m.收益 === 'string' ? m.收益 : '';
    const settleDay = typeof m.结算日 === 'string' ? m.结算日 : '';
    if (status || valuation || income || settleDay) item.manage = { status, valuation, income, settleDay };
    delete obj.经营;
  }

  // 剩余未识别字段：object → 效果行；string → 长文行（不丢数据）
  for (const [k, v] of Object.entries(obj)) {
    if (v === '' || v === null || v === undefined) continue;
    if (v !== null && typeof v === 'object') {
      item.effects.push({ key: k, val: formatVal(v) });
    } else {
      item.longs.push({ key: k, text: formatVal(v), lines: LONG_LINES[k] ?? 2 });
    }
  }
  return item;
}
