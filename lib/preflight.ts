import type { Task } from './tasks';
import type { PlatformId } from './platforms';

export type Level = 'error' | 'warn';
export interface PreflightIssue { level: Level; msg: string }
export type PreflightResult = Partial<Record<PlatformId, PreflightIssue[]>>;

const cp = (s: string) => [...s].length; // 码点长度

/** 长文平台通用检查:标题、正文、缺图 */
function longform(task: Task, missing: string[]): PreflightIssue[] {
  const out: PreflightIssue[] = [];
  if (!task.title.trim()) out.push({ level: 'error', msg: '标题为空' });
  if (!task.markdown.trim()) out.push({ level: 'error', msg: '正文为空' });
  if (missing.length) out.push({ level: 'warn', msg: `缺图:${missing.join('、')}` });
  return out;
}

/** 发布前体检:逐平台返回需注意的问题(error 阻断性 / warn 提醒);无问题则该平台为空数组。 */
export function preflight(task: Task, missing: string[]): PreflightResult {
  const r: PreflightResult = {};

  r.zhihu = longform(task, missing);
  r.woshipm = longform(task, missing);

  const wx = longform(task, missing);
  if (!task.coverFilename) wx.push({ level: 'warn', msg: '未选封面' });
  r.weixin = wx;

  const bz = longform(task, missing);
  if (task.images.length) bz.push({ level: 'warn', msg: 'B站图片需在编辑器内确认/重传' });
  r.bilibili = bz;

  const xhs: PreflightIssue[] = [];
  const xv = task.variants.xiaohongshu;
  if (!xv?.title?.trim()) xhs.push({ level: 'error', msg: '小红书标题未填' });
  else if (cp(xv.title) > 20) xhs.push({ level: 'error', msg: `标题超 20 字(${cp(xv.title)})` });
  if (!xv?.body?.trim()) xhs.push({ level: 'error', msg: '小红书正文未填' });
  else if (cp(xv.body) > 1000) xhs.push({ level: 'error', msg: `正文超 1000 字(${cp(xv.body)})` });
  if (task.images.length === 0) xhs.push({ level: 'error', msg: '图文笔记至少需 1 张图' });
  r.xiaohongshu = xhs;

  const x: PreflightIssue[] = [];
  const xvar = task.variants.x;
  if (!xvar?.body?.trim()) x.push({ level: 'error', msg: 'X 推文未填' });
  else if (cp(xvar.body) > 280) x.push({ level: 'error', msg: `推文超 280 字(${cp(xvar.body)})` });
  r.x = x;

  const rd: PreflightIssue[] = [];
  const rv = task.variants.reddit;
  if (!rv?.title?.trim()) rd.push({ level: 'error', msg: 'Reddit 标题未填' });
  else if (cp(rv.title) > 300) rd.push({ level: 'warn', msg: `标题超 300 字(${cp(rv.title)})` });
  if (!rv?.body?.trim()) rd.push({ level: 'warn', msg: 'Reddit 正文为空' });
  r.reddit = rd;

  return r;
}

/** 汇总某平台最高级别:error > warn > ok(无问题) */
export function worstLevel(issues: PreflightIssue[] | undefined): Level | 'ok' {
  if (!issues || issues.length === 0) return 'ok';
  return issues.some((i) => i.level === 'error') ? 'error' : 'warn';
}
