import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { setPending, claimPending, peekPending } from '../lib/pending';

beforeEach(() => fakeBrowser.reset());

describe('pending 登记/认领', () => {
  it('claim 返回登记的 taskId 且一次性(再 claim 为 null)', async () => {
    await setPending('zhihu', 'task-1');
    expect(await claimPending('zhihu')).toBe('task-1');
    expect(await claimPending('zhihu')).toBeNull();
  });

  it('不同平台互不干扰', async () => {
    await setPending('zhihu', 't1');
    await setPending('weixin', 't2');
    expect(await claimPending('weixin')).toBe('t2');
    expect(await claimPending('zhihu')).toBe('t1');
  });

  it('未登记时 claim 为 null', async () => {
    expect(await claimPending('xiaohongshu')).toBeNull();
  });

  it('peek 不消耗登记', async () => {
    await setPending('weixin', 't9');
    expect(await peekPending('weixin')).toBe('t9');
    expect(await claimPending('weixin')).toBe('t9'); // 仍可正常认领
    expect(await peekPending('weixin')).toBeNull();
  });
});
