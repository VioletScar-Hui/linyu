import type { PlatformId } from '../platforms';
import type { Task } from '../tasks';

export interface FillResult {
  ok: boolean;
  /** ok 时的附加提示,如"封面需手动确认" */
  note?: string;
  failedStep?: string;
  reason?: string;
}

export interface Adapter {
  platformId: PlatformId;
  /** 当前页面是否为该平台编辑器页。适配器挂在全域名上,只在编辑器页认领任务 —
   *  未登录被重定向时任务保持"等待填充",用户登录进入编辑器后自动继续。 */
  isEditorPage(): boolean;
  /** 编辑器页层面的登录态检查(多数平台到得了编辑器即已登录,返回 true 即可) */
  checkLogin(): Promise<boolean>;
  fill(task: Task): Promise<FillResult>;
}
