import { Schema } from '../../schema';
import { syncAscension } from './level/ascension';
import { LevelUpEvent, settleAll } from './level/settle';
import { applyUpdateRequests } from './level/update_request';

/** 升级事件 → 播报文本 */
function eventToText(event: LevelUpEvent): string {
  const who = event.name ?? '{{user}}';
  const parts: string[] = [];
  if (event.level > event.prevLevel) {
    parts.push(`${who}的等级从${event.prevLevel}级提升到了${event.level}级`);
  }
  if (event.tier !== event.prevTier) {
    parts.push(`${who}的生命层级从${event.prevTier}突破到了${event.tier}`);
  }
  return parts.join('；');
}

/**
 * 升级播报注入：在结算后直接注入（once: true），
 * 仅下一次请求生成有效、自动失效，无需存储与清理。
 */
function announceLevelUps(userEvents: LevelUpEvent[], partnerEvents: LevelUpEvent[]): void {
  const prompts: InjectionPrompt[] = [];
  if (userEvents.length > 0) {
    prompts.push({
      id: '等级提升',
      position: 'in_chat',
      depth: 0,
      role: 'system',
      content: `important_note: ${userEvents.map(eventToText).join('；')}`,
    });
  }
  if (partnerEvents.length > 0) {
    prompts.push({
      id: 'NPC等级提升',
      position: 'in_chat',
      depth: 0,
      role: 'system',
      content: `important_note: ${partnerEvents.map(eventToText).join('；')}`,
    });
  }
  if (prompts.length > 0) {
    injectPrompts(prompts, { once: true });
  }
}

/**
 * 变量更新结束 → 等级结算流水线：
 * 清洗 stat_data（schema clamp/纠错）→ 等级结算 → 登神长阶同步 → 播报注入 → 写回
 */
function settleLevels(variables: Mvu.MvuData, variables_before: Mvu.MvuData) {
  const stat = _.get(variables, 'stat_data', {});
  const parsed = Schema.safeParse(stat);
  if (!parsed.success) {
    console.warn('[var_control] stat_data 校验失败，跳过本次结算', z.prettifyError(parsed.error));
    return;
  }
  const data = parsed.data;
  const prevStat = _.get(variables_before, 'stat_data', {});

  const { userEvents, partnerEvents } = settleAll(data, prevStat);
  const ascensionLawReady = syncAscension(data, prevStat);
  // 只读变量初始化请求：结算后套用（仅目标仍为初始值时生效），随后清空
  applyUpdateRequests(data);
  variables.stat_data = data;

  // 升级播报注入（仅下一次生成有效，自动失效）
  announceLevelUps(userEvents, partnerEvents);

  // 脚本私有状态写入 _internal（`_` 前缀只读约定，AI 不更新）
  const internal = _.get(variables, '_internal', {});
  insertOrAssignVariables({ _internal: { ...internal, ascensionLawReady } }, { type: 'message' });
}

async function init() {
  await waitGlobalInitialized('Mvu');
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, errorCatched(settleLevels));
  console.info("[var_control] 等级系统已加载 ฅ'ω'ฅ");
}

$(() => {
  errorCatched(init)();
});
