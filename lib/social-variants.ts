import { stripMarkdown } from './xhs';

export interface SocialVariant {
  title: string;
  body: string;
}

/** X 导流短推:纯文本,标题领起 + 摘要,≤280 码点。X 无独立标题字段,title 留空。 */
export function makeXVariant(title: string, markdown: string): SocialVariant {
  const plain = stripMarkdown(markdown);
  // 摘要去掉与标题重复的开头,避免标题出现两次
  const summary = plain.startsWith(title) ? plain.slice(title.length).trim() : plain;
  const composed = summary ? `${title}\n\n${summary}` : title;
  return { title: '', body: [...composed].slice(0, 280).join('') };
}

/** Reddit:标题(≤300 码点)+ 原始 Markdown 正文(Reddit 原生渲染 MD,不转换不去标记)。 */
export function makeRedditVariant(title: string, markdown: string): SocialVariant {
  return { title: [...title].slice(0, 300).join(''), body: markdown };
}
