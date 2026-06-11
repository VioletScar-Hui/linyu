import type { PlatformId } from './platforms';
import type { Task, PlatformStatus } from './tasks';

/** composer → background:发起填充(登记并打开平台页) */
export interface StartFillMsg {
  kind: 'start-fill';
  platformId: PlatformId;
  taskId: string;
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

export type Msg = StartFillMsg | ClaimTaskMsg | ReportFillMsg;
