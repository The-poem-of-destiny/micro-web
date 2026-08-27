/** 长文本按字数截断（B 站评论区式）：与展开阈值同源，不精确按行但按钮恒贴文本尾 */

/** 面板内每行约 20 个中文字符 */
export const CHARS_PER_LINE = 20;

/** 文本超折叠容量时才提供展开钮 */
export function needsToggle(text: string, lines: number): boolean {
  return text.length > lines * CHARS_PER_LINE;
}

/** 折叠态显示文本：截断 + 省略号 */
export function clampText(text: string, lines: number): string {
  const max = lines * CHARS_PER_LINE;
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
