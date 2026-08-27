import { isAscensionGate, expNeed } from '../../var_control/level/config';

/**
 * 经验条三态计算（纯函数）。
 * - normal：常规进度（exp / expNeed(level)）
 * - locked：登神门槛锁级（仅 user；12/16/20/24 级经验满，settle 升级被门槛拦截）
 * - max：满级（25 级，expNeed 返回 null）
 * partner 不受门槛锁级（settle applyGate=false），不会停留于门槛满经验态。
 */

export interface ExpState {
  mode: 'normal' | 'locked' | 'max';
  exp: number;
  need: number | null;
  /** 进度百分比 0~100 */
  pct: number;
}

export function calcExpState(unit: Record<string, any>, isUser: boolean): ExpState {
  const exp = Math.max(0, Number(unit.经验) || 0);
  const level = Number(unit._等级) || 1;
  const need = expNeed(level);

  if (need === null) {
    return { mode: 'max', exp, need, pct: 100 };
  }
  const pct = Math.min(100, Math.round((exp / need) * 100));
  const full = exp >= need;
  const locked = isUser && full && isAscensionGate(level);
  return { mode: locked ? 'locked' : 'normal', exp, need, pct: locked ? 100 : pct };
}
