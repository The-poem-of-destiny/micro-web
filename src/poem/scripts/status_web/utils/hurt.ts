/**
 * 伤势档位映射（schema 中文 enum → token 英文键）。
 * token 定义于 styles/index.scss（$hurt-colors）。
 */
export const HURT_KEY: Record<string, string> = {
  无损: 'intact',
  轻伤: 'light',
  中伤: 'moderate',
  重伤: 'severe',
  濒死: 'critical',
  死亡: 'dead',
};

/** 伤势程度 → CSS 颜色变量（未识别档位回退中性灰） */
export function hurtColorVar(degree: string): string {
  return `var(--stb-hurt-${HURT_KEY[degree] ?? 'dead'})`;
}
