import { getPlatform } from '../lib/platforms';
import { getTask, updatePlatformStatus } from '../lib/tasks';
import { setPending, claimPending, peekPending } from '../lib/pending';
import type { Msg, ClaimTaskResponse, PeekTaskResponse } from '../lib/messaging';

export default defineBackground(() => {
  // 串行化所有消息处理:storage 的读-改-写非原子,并发处理(如快速连点两个"去发布")
  // 会互相覆盖 pendingFills/tasks。单队列让写入按到达顺序依次执行。
  let queue: Promise<void> = Promise.resolve();

  browser.runtime.onMessage.addListener((msg: Msg, _sender, sendResponse) => {
    queue = queue.then(async () => {
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
      } else if (msg.kind === 'peek-task') {
        const taskId = await peekPending(msg.platformId);
        sendResponse({ hasPending: taskId !== null } satisfies PeekTaskResponse);
      } else {
        sendResponse({}); // 未知消息:直接应答,避免端口悬挂
      }
    }).catch((err) => {
      console.error('[background] message handler error', err);
      sendResponse({ error: String(err) }); // 故障路径兜底,避免发送方挂起
    });
    return true; // 异步 sendResponse
  });
});
