/** 截断 record 至前 N 个键（用于数量上限约束） */
function sliceRecord<T>(record: Record<string, T>, limit: number): Record<string, T> {
  return _.pick(record, _.keys(record).slice(0, limit));
}

const characterBase = {
  种族: z.string().prefault(''),
  身份: z.string().prefault(''),
  职业: z.string().prefault(''),

  _生命层级: z.string().prefault(''), // 卡内专有术语，脚本只读，保留中文
  _等级: z.coerce
    .number()
    .transform(v => _.clamp(v, 1, 25))
    .prefault(1),
  经验: z.coerce
    .number()
    .transform(v => Math.max(v, 0))
    .prefault(0),

  属性: z
    .object({
      str: z.coerce
        .number()
        .transform(v => _.clamp(v, 0, 20))
        .prefault(0), // 力量
      dex: z.coerce
        .number()
        .transform(v => _.clamp(v, 0, 20))
        .prefault(0), // 敏捷
      con: z.coerce
        .number()
        .transform(v => _.clamp(v, 0, 20))
        .prefault(0), // 体质
      int: z.coerce
        .number()
        .transform(v => _.clamp(v, 0, 20))
        .prefault(0), // 智力
      wis: z.coerce
        .number()
        .transform(v => _.clamp(v, 0, 20))
        .prefault(0), // 精神
    })
    .prefault({}),

  伤势: z
    .object({
      程度: z.enum(['无损', '轻伤', '中伤', '重伤', '濒死', '死亡']).prefault('无损'), // 六档伤势阶梯
      部位: z.record(z.string().describe('部位'), z.string().describe('行动限制')).prefault({}), // 具名伤势，如 右臂: 无法持盾
    })
    .prefault({}),

  资产: z
    .looseObject({
      money: z.coerce
        .number()
        .transform(v => Math.max(v, 0))
        .prefault(0), // 钱包/金钱固定数值；其他资产自由（string 或 object）
    })
    .prefault({}),

  物品: z
    .record(z.string().describe('物品名'), z.looseObject({ 数量: z.coerce.number().prefault(1) }).prefault({}))
    .prefault({}),

  技能: z.record(z.string().describe('技能名'), z.looseObject({}).prefault({})).prefault({}),

  buff: z.record(z.string().describe('buff名'), z.looseObject({}).prefault({})).prefault({}),

  登神长阶: z
    .object({
      _已开启: z.boolean().prefault(false),
      要素: z.record(z.string(), z.string()).prefault({}),
      权能: z.record(z.string(), z.string()).prefault({}),
      法则: z.record(z.string(), z.string()).prefault({}),
      神位: z.string().prefault(''),
      神国: z.record(z.string(), z.string()).prefault({}),
    })
    .prefault({})
    // 登神长阶状态约束(数据层强制):
    // - 有法则: 权能与要素永久清空(不可再获得)；法则上限 神国∞/神位2/无1
    // - 有权能: 要素永久清空；权能上限1
    // - 正常: 仅可收集要素，上限3
    .transform(data => {
      const lawNum = _.size(data.法则);
      const powerNum = _.size(data.权能);
      const lawLimit = !_.isEmpty(data.神国) ? Number.POSITIVE_INFINITY : data.神位 ? 2 : 1;

      if (lawNum > 0) {
        return { ...data, 要素: {}, 权能: {}, 法则: sliceRecord(data.法则, lawLimit) };
      }
      if (powerNum > 0) {
        return { ...data, 要素: {}, 权能: sliceRecord(data.权能, 1), 法则: sliceRecord(data.法则, lawLimit) };
      }
      return { ...data, 要素: sliceRecord(data.要素, 3), 权能: sliceRecord(data.权能, 1), 法则: {} };
    }),
};

export const Schema = z.object({
  time: z.string().prefault(''),
  loc: z.string().prefault(''),

  // 只读变量初始化请求（AI → 脚本一次性入口）：
  // `_` 前缀变量 AI 只读，角色新建时需设定初始值（如 NPC 初始等级/层级、登神长阶开启）
  // 则写入本字段；var_control 在结算后校验目标仍为初始值才套用，并清空本字段
  update_request: z
    .object({
      user: z
        .object({
          _等级: z.coerce.number().optional(),
          _生命层级: z.string().optional(),
          登神长阶: z.object({ _已开启: z.boolean().optional() }).optional(),
        })
        .optional(),
      partner: z
        .record(
          z.string().describe('角色名'),
          z
            .object({
              _等级: z.coerce.number().optional(),
              _生命层级: z.string().optional(),
              登神长阶: z.object({ _已开启: z.boolean().optional() }).optional(),
            })
            .optional(),
        )
        .optional(),
    })
    .prefault({}),

  user: z
    .looseObject({
      ...characterBase,
      // 命运点数为 <user> 专属，partner 不拥有
      命运点数: z.coerce
        .number()
        .transform(v => Math.max(v, 0))
        .prefault(0),
    })
    .prefault({}),

  partner: z
    .record(
      z.string().describe('角色名'),
      z
        .looseObject({
          ...characterBase,
          外貌: z.string().prefault(''),
          衣着: z.string().prefault(''),
          性格: z.string().prefault(''),
          行为: z.string().prefault(''),
          命定契约: z.boolean().prefault(false),
          好感: z.coerce
            .number()
            .transform(v => _.clamp(v, -100, 100))
            .prefault(0),
          背景: z.string().prefault(''),
        })
        .prefault({}),
    )
    .prefault({}),

  tasks: z
    .record(
      z.string().describe('任务名'),
      z
        .looseObject({
          说明: z.string().prefault(''),
          状态: z.string().prefault('进行中'),
        })
        .prefault({}),
    )
    .prefault({}),
});

export type Schema = z.output<typeof Schema>;
