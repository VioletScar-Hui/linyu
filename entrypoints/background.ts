import { getPlatform } from '../lib/platforms';
import { getTask, updatePlatformStatus } from '../lib/tasks';
import { setPending, claimPending } from '../lib/pending';
import type { Msg, ClaimTaskResponse } from '../lib/messaging';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((msg: Msg, _sender, sendResponse) => {
    (async () => {
      if (msg.kind === 'start-fill') {
        await setPending(msg.platformId, msg.taskId);
        await updatePlatformStatus(msg.taskId, msg.platformId, { state: 'pending' });
        const platform = getPlatform(msg.platformId);
        if (platform) await browser.tabs.create({ url: platform.publishUrl });
        sendResponse({});
      } else if (msg.kind === 'claim-task') {
        const taskId = await claimPending(msg.platformId);
        const task = taskId ? ((await getTask(taskId)) ?? null) : null;
        sendResponse({ task } satisfies ClaimTaskResponse);
      } else if (msg.kind === 'report-fill') {
        await updatePlatformStatus(msg.taskId, msg.platformId, msg.status);
        sendResponse({});
      } else {
        sendResponse({}); // 未知消息:直接应答,避免端口悬挂
      }
    })().catch((err) => {
      console.error('[background] message handler error', err);
      sendResponse({ error: String(err) }); // 故障路径兜底,避免发送方挂起
    });
    return true; // 异步 sendResponse
  });
});
