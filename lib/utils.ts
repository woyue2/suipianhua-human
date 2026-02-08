import DOMPurify from 'dompurify';

/**
 * 清理 HTML 字符串，防止 XSS 攻击
 * 使用 DOMPurify 进行服务器端和客户端的安全过滤
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    // 允许的标签
    ALLOWED_TAGS: ['strong', 'em', 'mark', 'u', 'p', 'br', 'span'],
    // 允许的属性
    ALLOWED_ATTR: ['class'],
    // 允许的 CSS 属性
    ALLOWED_STYLE: [],
  });
}

/**
 * 渲染 Markdown 格式文本为安全的 HTML
 */
export function renderMarkdown(text: string): string {
  if (!text) return '';

  let html = text;

  // 荧光笔 ==text==
  html = html.replace(/==(.+?)==/g, '<mark class="bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded">$1</mark>');

  // 粗体 **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // 斜体 *text* (避免匹配 **)
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // 下划线 <u>text</u> (已经是 HTML)

  // 清理并返回安全的 HTML
  return sanitizeHTML(html);
}
