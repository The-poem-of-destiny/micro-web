<script setup lang="ts">
/**
 * 开局表单壳：组装各 Section 组件 + 提交逻辑。
 * 数值字段（等级/层级/属性）直写 stat_data；叙事内容组 prompt 发 user 楼并 /trigger。
 */
import { reactive, ref } from 'vue';
import AttrSection from './components/AttrSection.vue';
import BasicSection from './components/BasicSection.vue';
import DemandSection from './components/DemandSection.vue';
import LevelSection from './components/LevelSection.vue';
import PlaceSection from './components/PlaceSection.vue';
import RaceSection from './components/RaceSection.vue';
import { ATTR_NAMES, talentTier, tierOf, type AttrKey } from './data';
import { createForm } from './types';

const form = reactive(createForm());
const attrRef = ref<InstanceType<typeof AttrSection>>();
const submitting = ref(false);

const raceFinal = () => (form.raceIsCustom ? form.raceCustom.trim() : form.race);
const placeFinal = () => (form.placeIsCustom ? form.placeCustom.trim() : form.place);

function buildPrompt(): string {
  const t = tierOf(form.level);
  const attrLine = (Object.keys(ATTR_NAMES) as AttrKey[]).map(k => `${k}:${attrRef.value?.attrVal(k) ?? 0}`).join(' ');
  const lines = [
    '<start_info>',
    `姓名: ${form.name.trim()}`,
    `性别: ${form.sex}`,
    `种族: ${raceFinal()}`,
    `身份: ${form.identity.trim()}`,
    form.job.trim() ? `职业: ${form.job.trim()}` : '',
    `起始等级: Lv.${form.level}（${t.name}·${t.label}）`,
    `属性: ${attrLine}（天赋${talentTier(attrRef.value?.baseTotal ?? 0)}）`,
    placeFinal() ? `开局地点: ${placeFinal()}` : '',
    form.demand.trim() ? `开局要求: ${form.demand.trim()}` : '',
    '</start_info>',
    '请依据以上设定生成开局：开场叙事、初始技能与物品（匹配身份职业与层级）、时间地点与周围环境，并在本次变量更新中建档：',
    '- user.姓名、种族、身份、职业、属性（str/dex/con/int/wis）直接写入对应字段；',
    '- _等级 与 _生命层级 为系统只读字段，请写入中转入口：update_request: { user: { _等级: ' +
      form.level +
      ", _生命层级: '" +
      t.name +
      "' } }，由系统套用；",
    '- user.经验 保持 0，不要动它；',
    '- 生成初始技能、物品、资产、time 与 loc。',
  ];
  return lines.filter(Boolean).join('\n');
}

async function submit(): Promise<void> {
  if (submitting.value) return;
  if (!form.name.trim()) {
    toastr.warning('请填写姓名');
    return;
  }
  if (!raceFinal()) {
    toastr.warning('请选择或填写种族');
    return;
  }
  const left = attrRef.value?.allocLeft ?? 0;
  if (left > 0) {
    toastr.warning(`还有 ${left} 点分配点未使用`);
    return;
  }

  submitting.value = true;
  try {
    // 全部字段统一交由 AI 在变量更新中写入（含 update_request 中转只读字段）
    await createChatMessages([{ role: 'user', message: buildPrompt() }]);
    await triggerSlash('/trigger');
    toastr.success('命运已开启');
  } catch (err) {
    console.error('[start_web] 提交失败', err);
    toastr.error('提交失败，请查看控制台');
    submitting.value = false;
  }
}
</script>

<template>
  <div class="sw">
    <header class="sw__head">
      <h1 class="sw__title">命运的开端</h1>
      <p class="sw__subtitle">设定你的身份，开启这段旅程</p>
    </header>

    <RaceSection :form="form" />
    <BasicSection :form="form" />
    <LevelSection :form="form" />
    <AttrSection ref="attrRef" :form="form" />
    <PlaceSection :form="form" />
    <DemandSection :form="form" />

    <button type="button" class="sw__submit" :disabled="submitting" @click="submit">
      {{ submitting ? '命运编织中…' : '开启命运' }}
    </button>
  </div>
</template>
