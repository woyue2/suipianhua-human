/**
 * 生成唯一标识符
 * 使用 crypto.randomUUID() 生成符合 RFC 4122 标准的 UUID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * 生成短 ID（用于显示或特殊情况）
 * 取 UUID 的前 8 位
 */
export function generateShortId(): string {
  return crypto.randomUUID().split('-')[0];
}
