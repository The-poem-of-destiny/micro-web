import {
  ATTRIBUTE_CAP,
  ATTRIBUTES,
  ATTRIBUTE_POINTS_PER_LEVEL,
  MAX_LEVEL,
  TIER_ATTRIBUTE_BONUS,
  expNeed,
  isAscensionGate,
  tierOf,
} from './config';

/** 登神门槛条件：突破门槛等级所需的前置 */
function gatePassed(gate: number, ascension: Record<string, any>): boolean {
  const recordSize = (key: string) => _.size(_.get(ascension, key, {}));
  const hasText = (key: string) => !_.isEmpty(_.get(ascension, key, ''));
  switch (gate) {
    case 12:
      return recordSize('要素') > 0; // 至少 1 要素
    case 16:
      return recordSize('权能') > 0; // 3 要素融合为权能
    case 20:
      return recordSize('法则') > 0; // 权能 + 法则源质 → 法则
    case 24:
      return recordSize('法则') > 0 && hasText('神位'); // 依法则完成登神仪式
    default:
      return true;
  }
}

/** 一次结算产生的升级 / 层级突破事件 */
export interface LevelUpEvent {
  name?: string; // 主角省略；伙伴为角色名
  prevLevel: number;
  level: number;
  prevTier: string;
  tier: string;
}

/** 将一点属性补给当前最低的属性（平均加权：永不溢出，并列取 str→dex→con→int→wis 顺序）；已满属性不重复加 */
function boostLowestAttribute(attr: Record<string, any>, points: number): void {
  for (let i = 0; i < points; i++) {
    const lowest = _.minBy(
      ATTRIBUTES.filter(key => Number(attr[key] || 0) < ATTRIBUTE_CAP),
      key => Number(attr[key] || 0),
    );
    if (lowest === undefined) break; // 五维全满
    attr[lowest] = Number(attr[lowest] || 0) + 1;
  }
}

/** 层级突破：全属性 +amount（clamp 至上限） */
function boostAllAttributes(attr: Record<string, any>, amount: number): void {
  for (const key of ATTRIBUTES) {
    attr[key] = _.clamp(Number(attr[key] || 0) + amount, 0, ATTRIBUTE_CAP);
  }
}

/**
 * 单个角色等级结算（user 与 partner 通用）。
 *
 * 设计约定：`经验` 为「当前等级进度」，由 AI 按格式输出当前值；
 * 脚本以「上一轮影像」为基准逐级结算并写回，AI 直接修改 `_等级` 会被纠正覆盖。
 * 经验满则升级并结转余量；登神门槛未达成则锁级（经验保留，条件满足后自动突破）。
 * 属性成长：每级 +1 点补给当前最低属性；层级突破时全属性 +1。
 *
 * @param applyGate 是否应用登神门槛（仅 <user>；partner 不按登神路线推进，不受限制）
 * @returns 本次结算产生的升级事件（无则返回 null）
 */
export function settleCharacter(
  unit: Record<string, any>,
  prevUnit?: Record<string, any>,
  name?: string,
  applyGate = true,
): LevelUpEvent | null {
  const before = prevUnit ?? unit; // 无前值（首轮/新增角色）时以当前值为基线，不产生升级
  const prevLevel = _.clamp(Number(_.get(before, '_等级', 1)) || 1, 1, MAX_LEVEL);
  const prevTier = _.get(before, '_生命层级', '') || tierOf(prevLevel);

  let level = prevLevel;
  let exp = Math.max(0, Number(_.get(unit, '经验', 0)) || 0);
  const attr = _.get(unit, '属性', {});

  while (level < MAX_LEVEL) {
    const need = expNeed(level);
    if (need === null || exp < need) break;
    if (applyGate && isAscensionGate(level) && !gatePassed(level, _.get(unit, '登神长阶', {}))) break;
    exp -= need;
    level += 1;
    // 属性成长：每级 +1 补给最低属性；层级突破时全属性 +1
    boostLowestAttribute(attr, ATTRIBUTE_POINTS_PER_LEVEL);
    const tier = tierOf(level);
    const prevTierAtLevel = tierOf(level - 1);
    if (tier !== prevTierAtLevel) {
      boostAllAttributes(attr, TIER_ATTRIBUTE_BONUS[level] ?? 0);
    }
  }

  _.set(unit, '_等级', level);
  _.set(unit, '经验', exp);
  const tier = tierOf(level);
  _.set(unit, '_生命层级', tier);

  if (level === prevLevel && tier === prevTier) return null;
  return { name, prevLevel, level, prevTier, tier };
}

/**
 * 结算所有角色（主角 + 全部伙伴），并汇总升级事件。
 */
export function settleAll(data: Record<string, any>, prevStat?: Record<string, any>): {
  userEvents: LevelUpEvent[];
  partnerEvents: LevelUpEvent[];
} {
  const prev = prevStat ?? {};
  const userEvents: LevelUpEvent[] = [];
  const partnerEvents: LevelUpEvent[] = [];

  const userEvent = settleCharacter(_.get(data, 'user', {}), _.get(prev, 'user'));
  if (userEvent) userEvents.push(userEvent);

  _.forOwn(_.get(data, 'partner', {}), (unit, partnerName) => {
    // partner 不受登神门槛限制（AI 直接设定 NPC 等级，不按 <user> 登神路线推进）
    const event = settleCharacter(unit, _.get(prev, `partner.${partnerName}`), partnerName, false);
    if (event) partnerEvents.push(event);
  });

  return { userEvents, partnerEvents };
}