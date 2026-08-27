import { MAX_LEVEL } from './config';

/**
 * 只读变量初始化请求入口。
 *
 * MVU 中 `_` 前缀变量对 AI 只读，角色新建时如需设定初始值
 * （NPC 初始等级、初始生命层级、登神长阶开启），AI 无法直接写入，
 * 需通过 `update_request` 普通字段中转：AI 写请求 → 脚本在结算后
 * 校验目标字段仍为初始值 → 套用并清空请求。
 *
 * 与 syncAscension 的分工：本入口管「初始状态」（如建档 20 级 NPC 时
 * 同步开启登神长阶，与 _等级 同批生效）；syncAscension 管「演进状态」
 * （升级跨过 13 级时自动开启，不依赖 AI）。
 */

/** `_等级` 仍为初始状态（从未结算过）才可写 */
function canSetLevel(unit: Record<string, any>): boolean {
  return Number(_.get(unit, '_等级', 1)) === 1 && Number(_.get(unit, '经验', 0)) === 0;
}

/** `_生命层级` 为空或第一层级才可写 */
function canSetTier(unit: Record<string, any>): boolean {
  const tier = _.get(unit, '_生命层级', '');
  return _.isEmpty(tier) || tier === '第一层级';
}

/** 对单个角色套用其初始化请求 */
function applyFor(unit: Record<string, any>, reqUnit: Record<string, any> | undefined): void {
  if (!reqUnit) return;
  if (_.has(reqUnit, '_等级') && canSetLevel(unit)) {
    _.set(unit, '_等级', _.clamp(Number(_.get(reqUnit, '_等级')) || 1, 1, MAX_LEVEL));
  }
  if (_.has(reqUnit, '_生命层级') && canSetTier(unit)) {
    _.set(unit, '_生命层级', String(_.get(reqUnit, '_生命层级', '')));
  }
  const reqDivinity = _.get(reqUnit, '登神长阶');
  if (reqDivinity && _.has(reqDivinity, '_已开启') && _.get(unit, '登神长阶._已开启', false) === false) {
    _.set(unit, '登神长阶._已开启', _.get(reqDivinity, '_已开启') === true);
  }
}

/** 套用初始化请求（等级结算之后调用），随后清空请求字段 */
export function applyUpdateRequests(data: Record<string, any>): void {
  const req = _.get(data, 'update_request', {}) as Record<string, any>;
  applyFor(_.get(data, 'user', {}), _.get(req, 'user'));
  _.forOwn(_.get(req, 'partner', {}), (reqPartner, name) => {
    applyFor(_.get(data, `partner.${name}`, {}), reqPartner);
  });
  _.unset(data, 'update_request');
}
