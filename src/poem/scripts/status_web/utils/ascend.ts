/**
 * 登神长阶阶段模型：变量形态 → 五节点状态机
 * 规则见 世界书/mechanism/登神长阶规则.yaml：
 * 要素(≤3) → 融合升华 → 权能(1) → 融铸法则源质 → 法则 → 登神仪式 → 神位 → 开辟 → 神国
 */

export type NodeKey = '要素' | '权能' | '法则' | '神位' | '神国';
export type NodeState = 'held' | 'consumed' | 'locked';

export interface AscendNode {
  key: NodeKey;
  state: NodeState;
  entries: Record<string, string>;
  /** locked 态门槛提示 */
  hint: string;
  /** consumed 态说明 */
  consumedNote: string;
}

export interface AscendState {
  opened: boolean;
  /** 神位名（达成后与阶段徽标并列显示） */
  divine: string;
  /** header 徽标组：如 ['要素 2/3'] / ['法则 2', '晨曦与新生之神']；未开启为 [] */
  badges: string[];
  nodes: AscendNode[];
}

const HINTS: Record<NodeKey, string> = {
  要素: '突破第四层级所需；历史感悟或从高位存在汲取',
  权能: '融合三枚要素升华；突破第五层级所需',
  法则: '权能融铸法则源质；突破第六层级所需',
  神位: '依循法则完成登神仪式证道；突破第七层级所需',
  神国: '领悟第二法则后于虚海开辟',
};

const CONSUMED_NOTES: Partial<Record<NodeKey, string>> = {
  要素: '三枚已融合升华',
  权能: '已与法则源质融铸为法则',
};

const asRecord = (v: unknown): Record<string, string> =>
  v && typeof v === 'object'
    ? Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, String(x)]))
    : {};

const size = (v: unknown): number => (v && typeof v === 'object' ? Object.keys(v).length : 0);

/** 要素收集上限（空槽展示用） */
export const ELEMENT_CAP = 3;

export function calcAscend(raw: unknown): AscendState {
  const src = (raw ?? {}) as Record<string, unknown>;
  const opened = src._已开启 === true;
  const 要素 = asRecord(src.要素);
  const 权能 = asRecord(src.权能);
  const 法则 = asRecord(src.法则);
  const 神国 = asRecord(src.神国);
  const divine = typeof src.神位 === 'string' ? src.神位 : '';

  if (!opened) {
    return { opened: false, divine: '', badges: [], nodes: [] };
  }

  const elemN = size(要素);
  const powN = size(权能);
  const lawN = size(法则);
  const hasPower = powN > 0;
  const hasLaw = lawN > 0 || divine !== '' || size(神国) > 0;

  // header 徽标：当前阶段名；证得神位后由神位名顶替（神国不再更换，神位即终点头衔）
  const badges: string[] = [];
  if (divine) {
    badges.push(divine);
  } else if (hasLaw) {
    badges.push('法则');
  } else if (hasPower) {
    badges.push('权能');
  } else {
    badges.push(`要素 ${elemN}/${ELEMENT_CAP}`);
  }

  const node = (key: NodeKey, state: NodeState, entries: Record<string, string>): AscendNode => ({
    key,
    state,
    entries,
    hint: HINTS[key],
    consumedNote: CONSUMED_NOTES[key] ?? '',
  });

  const nodes: AscendNode[] = [
    // 要素：无更高阶段时恒为收集中（含空槽）；已被升华则 consumed
    node('要素', hasPower || hasLaw ? 'consumed' : 'held', 要素),
    node('权能', hasPower ? 'held' : hasLaw ? 'consumed' : 'locked', 权能),
    node('法则', hasLaw ? 'held' : 'locked', 法则),
    node('神位', divine ? 'held' : 'locked', divine ? { [divine]: '' } : {}),
    node('神国', size(神国) > 0 ? 'held' : 'locked', 神国),
  ];

  return { opened: true, divine, badges, nodes };
}
