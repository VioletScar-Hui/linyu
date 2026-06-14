import type { PlatformId } from './platforms';
import type { Task, PlatformStatus } from './tasks';

// 所有发送方均为本插件页面(manifest 无 externally_connectable),消息形状仅靠 TS 约束。

/** composer → background:发起填充(登记并打开平台页) */
export interface StartFillMsg {
  kind: 'start-fill';
  platformId: PlatformId;
  taskId: string;
  /** 可选:覆盖默认打开的 URL(如公众号指定账号 token 的编辑器地址,直达编辑器跳过首页) */
  openUrl?: string;
}

/** content script → background:认领本平台待填充任务 */
export interface ClaimTaskMsg {
  kind: 'claim-task';
  platformId: PlatformId;
}
export interface ClaimTaskResponse {
  task: Task | null;
}

/** content script → background:回报填充结果 */
export interface ReportFillMsg {
  kind: 'report-fill';
  platformId: PlatformId;
  taskId: string;
  status: PlatformStatus;
}

/** content script → background:只读探测本平台是否有待填充任务(不消耗) */
export interface PeekTaskMsg {
  kind: 'peek-task';
  platformId: PlatformId;
}
export interface PeekTaskResponse {
  hasPending: boolean;
}

export type Msg = StartFillMsg | ClaimTaskMsg | ReportFillMsg | PeekTaskMsg;
