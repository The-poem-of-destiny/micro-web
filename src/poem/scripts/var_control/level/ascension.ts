import { expNeed } from './config';

/** 登神阶段任务定义（与《登神长阶》条目五阶段对应）
 * 任务对象为 looseObject，除 schema 声明外可携带 简介/奖励 等额外字段
 * 简介 = 仪式感短句（晦涩）；说明 = 通俗行动指引；奖励 = 完成后所得 */
const ASCENSION_TASKS: Record<string, { 简介: string; 说明: string; 奖励: string; 状态: string }> = {
  '登神·启明之阶': {
    简介: '以一枚要素点燃登神之火，让长阶回应你的名。',
    说明: '等级已锁，无法获取经验，需满足条件：获取至少 1 个要素。',
    奖励: '长阶初启，神火与要素共鸣。',
    状态: '进行中',
  },
  '登神·铸权之仪': {
    简介: '三要素归一，淬炼成唯一权能。',
    说明: '等级已锁，无法获取经验，需满足条件：融合 3 个要素为 1 个权能。',
    奖励: '权能成形，诸力归位于你。',
    状态: '进行中',
  },
  '登神·定律誓约': {
    简介: '寻得法则源质，与权能相合，点燃法则真名。',
    说明: '等级已锁，无法获取经验，需满足条件：用权能与法则源质相融合，铸成法则。',
    奖励: '法则凝就，秩序向你低首。',
    状态: '进行中',
  },
  '登神·登神仪式': {
    简介: '行登神之礼，确立神位。',
    说明: '等级已锁，无法获取经验，需满足条件：获得神位。',
    奖励: '神位应诺，尊名刻入天穹。',
    状态: '进行中',
  },
  '登神·神国初立': {
    简介: '赐予神国之名，令其在诸界立足。',
    说明: '完成条件：建立神国。',
    奖励: '神国初立，法则之缚自此尽解。',
    状态: '进行中',
  },
};

/** 法则源质：物品名称固定格式 ༺${名称}༻（《登神长阶》条目强制格式） */
const SOURCE_ITEM_RE = /^༺.+༻$/;

/** 物品中是否持有法则源质 */
function hasSourceItem(unit: Record<string, any>): boolean {
  return _.keys(_.get(unit, '物品', {})).some(name => SOURCE_ITEM_RE.test(name));
}

/**
 * 登神长阶机制同步（置于等级结算之后）：
 * - 已开启：≥13 级或 12 级经验满时自动开启，开启后不回退（user 与 partner 一致，确定性行为，不依赖 AI）
 * - 阶段任务 / 防幻觉 / 源质消耗：仅 user（partner 不按登神路线推进，不做任务注入）
 *
 * @returns 是否持有法则源质（供 _internal.ascensionLawReady 使用）
 */

/** 登神长阶开启管理：≥13 级或 12 级经验满自动开启，开启后不回退 */
function openDivinityFor(unit: Record<string, any>): void {
  const level = Number(_.get(unit, '_等级', 1)) || 1;
  const need = expNeed(level);
  const expFull = need !== null && Number(_.get(unit, '经验', 0)) >= need;
  if (level >= 13 || (level === 12 && expFull)) {
    _.set(_.get(unit, '登神长阶', {}) as Record<string, any>, '_已开启', true);
  }
}

export function syncAscension(data: Record<string, any>, prevStat?: Record<string, any>): boolean {
  const user = _.get(data, 'user', {}) as Record<string, any>;
  const level = Number(_.get(user, '_等级', 1)) || 1;
  const need = expNeed(level);
  const expFull = need !== null && Number(_.get(user, '经验', 0)) >= need;
  const asc = _.get(user, '登神长阶', {}) as Record<string, any>;
  const tasks = _.get(data, 'tasks', {}) as Record<string, any>;

  // 1. 开启管理：user 与 partner 一致（确定性行为，开启后不回退）
  openDivinityFor(user);
  _.forOwn(_.get(data, 'partner', {}), (partner: any) => openDivinityFor(partner));

  // 2. 登神进度统计
  const elementCount = _.size(_.get(asc, '要素', {}));
  const powerCount = _.size(_.get(asc, '权能', {}));
  const lawCount = _.size(_.get(asc, '法则', {}));
  const hasGodPosition = !_.isEmpty(_.get(asc, '神位', ''));
  const hasGodRealm = !_.isEmpty(_.get(asc, '神国', {}));

  // 3. 阶段任务注入 / 移除
  const syncTask = (name: string, active: boolean) => {
    if (active) _.set(tasks, name, ASCENSION_TASKS[name]);
    else _.unset(tasks, name);
  };
  syncTask('登神·启明之阶', level === 12 && expFull && elementCount === 0);
  syncTask('登神·铸权之仪', level === 16 && expFull && elementCount === 3 && powerCount === 0);
  syncTask('登神·定律誓约', level === 20 && expFull && powerCount >= 1 && lawCount === 0);
  syncTask('登神·登神仪式', level === 24 && expFull && lawCount >= 1 && !hasGodPosition);
  syncTask('登神·神国初立', level === 25 && lawCount >= 2 && !hasGodRealm);

  // 4. 防幻觉：20 级持法则但无源质证据则清空
  const prevUser = _.get(prevStat ?? {}, 'user', {});
  if (level === 20 && lawCount > 0 && !hasSourceItem(user) && !hasSourceItem(prevUser)) {
    _.set(asc, '法则', {});
  }

  // 5. 法则首次生成时消耗源质（上轮无法则 → 本轮有法则）
  //    背包中恰好 1 个源质才自动消耗；≥2 个时不自动处理，留给剧情
  const prevLawCount = _.size(_.get(prevUser, '登神长阶.法则', {}));
  const curLawCount = _.size(_.get(asc, '法则', {}));
  if (prevLawCount === 0 && curLawCount > 0) {
    const sourceNames = _.keys(_.get(user, '物品', {})).filter(name => SOURCE_ITEM_RE.test(name));
    if (sourceNames.length === 1) {
      _.unset(user, `物品.${sourceNames[0]}`);
    }
  }

  return hasSourceItem(user);
}
