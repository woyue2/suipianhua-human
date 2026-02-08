import { toast } from 'sonner';

/**
 * Toast 通知工具函数
 * 封装 sonner toast，提供统一的通知接口
 */

/**
 * 成功提示
 */
export function toastSuccess(message: string) {
  toast.success(message);
}

/**
 * 错误提示
 */
export function toastError(message: string) {
  toast.error(message);
}

/**
 * 信息提示
 */
export function toastInfo(message: string) {
  toast.info(message);
}

/**
 * 警告提示
 */
export function toastWarning(message: string) {
  toast.warning(message);
}

/**
 * 加载中提示（自动关闭）
 */
export function toastLoading(message: string) {
  return toast.loading(message);
}

/**
 * Promise 包装 - 自动显示成功/失败提示
 */
export async function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
): Promise<T> {
  const result = await toast.promise(promise, messages);
  return result as T;
}

/**
 * 保存成功提示
 */
export function toastSaveSuccess() {
  toastSuccess('保存成功');
}

/**
 * 保存失败提示
 */
export function toastSaveError(error?: string) {
  toastError(error || '保存失败，请稍后重试');
}

/**
 * 导入成功提示
 */
export function toastImportSuccess() {
  toastSuccess('导入成功');
}

/**
 * 导入失败提示
 */
export function toastImportError(error?: string) {
  toastError(error || '导入失败，文件格式不正确');
}

/**
 * 导出成功提示
 */
export function toastExportSuccess() {
  toastSuccess('导出成功');
}

/**
 * 导出失败提示
 */
export function toastExportError(error?: string) {
  toastError(error || '导出失败');
}

/**
 * 操作成功提示
 */
export function toastOperationSuccess(operation: string) {
  toastSuccess(`${operation}成功`);
}

/**
 * 操作失败提示
 */
export function toastOperationError(operation: string, error?: string) {
  toastError(error || `${operation}失败`);
}
