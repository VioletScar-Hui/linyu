// 灵羽设计系统:颜色/圆角/阴影/字体 token + 平台品牌色 + 羽毛标识 + 通用原子组件
import type { CSSProperties, ReactNode } from 'react';
import type { PlatformId } from './platforms';

export const T = {
  ink: '#16242c',        // 墨青(深,顶栏)
  inkSoft: '#1e3a44',    // 墨青(中)
  gold: '#c9a86a',       // 鎏金(主点缀)
  goldDeep: '#b8954f',   // 鎏金(深,hover)
  goldFaint: '#f3ead7',  // 鎏金极浅(底纹)
  paper: '#f6f2ea',      // 宣纸(基底)
  card: '#ffffff',       // 卡片白
  text: '#1a2a30',       // 主文字
  textSoft: '#5c6b72',   // 次文字
  textFaint: '#93a0a6',  // 弱文字
  border: '#e8e2d6',     // 边框
  borderSoft: '#f0ebe0', // 浅边框
  ok: '#3a8a6d',         // 成功青绿
  okBg: '#e6f2ec',
  warn: '#c8924a',       // 等待琥珀
  warnBg: '#f8efe0',
  err: '#b3503e',        // 失败赭红
  errBg: '#f8e9e4',
  radiusCard: 14,
  radiusBtn: 10,
  radiusSm: 8,
  shadowCard: '0 1px 3px rgba(22,36,44,.04), 0 6px 20px rgba(22,36,44,.05)',
  shadowHover: '0 4px 24px rgba(22,36,44,.12)',
  shadowModal: '0 24px 70px rgba(10,18,22,.45)',
  fontSerif: "Georgia, 'Songti SC', 'STSong', 'Noto Serif SC', serif",
  fontSans: "system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
} as const;

export const PLATFORM_COLORS: Record<PlatformId, string> = {
  weixin: '#07c160',
  zhihu: '#0084ff',
  woshipm: '#d6541b',
  xiaohongshu: '#ff2442',
  bilibili: '#fb7299',
  x: '#14171a',
  reddit: '#ff4500',
  weibo: '#e6162d',
  jianshu: '#ea6f5a',
  juejin: '#1e80ff',
  csdn: '#fc5531',
  toutiao: '#f04142',
  douban: '#2c963f',
  medium: '#000000',
};

/** 灵羽羽毛标识(Feather 风格,单色 currentColor) */
export function LingyuMark({ size = 24, color = T.gold }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  );
}

/** 品牌标题块:羽毛 + 灵羽(宋体) + 副标题。深色底使用,文字传 light */
export function BrandHeader({ subtitle, light = true }: { subtitle: string; light?: boolean }) {
  const titleColor = light ? '#ffffff' : T.text;
  const subColor = light ? 'rgba(255,255,255,.6)' : T.textSoft;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <LingyuMark size={28} color={T.gold} />
      <div style={{ lineHeight: 1.18 }}>
        <div style={{ fontFamily: T.fontSerif, fontSize: 20, fontWeight: 500, color: titleColor, letterSpacing: 3 }}>
          灵羽
        </div>
        <div style={{ fontSize: 11, color: subColor, letterSpacing: 1 }}>{subtitle}</div>
      </div>
    </div>
  );
}

/** 白卡片容器 */
export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <section style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radiusCard,
      boxShadow: T.shadowCard, padding: '18px 20px', ...style,
    }}>
      {children}
    </section>
  );
}

/** 鎏金序号徽章 + 标题,右侧可放 extra */
export function SectionTitle({ n, title, extra }: { n?: string; title: string; extra?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      {n && (
        <span style={{
          width: 22, height: 22, borderRadius: '50%', background: T.goldFaint, color: T.goldDeep,
          fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, border: `1px solid ${T.gold}55`,
        }}>{n}</span>
      )}
      <h2 style={{
        margin: 0, fontSize: 15, fontWeight: 500, color: T.text, letterSpacing: 0.5, flex: 1,
        fontFamily: T.fontSans,
      }}>{title}</h2>
      {extra}
    </div>
  );
}

/** 按钮样式生成 */
export const btn = {
  gold: (): CSSProperties => ({
    background: T.gold, color: T.ink, border: 'none', borderRadius: T.radiusBtn,
    padding: '10px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: T.fontSans,
  }),
  ink: (): CSSProperties => ({
    background: T.ink, color: '#fff', border: 'none', borderRadius: T.radiusBtn,
    padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: T.fontSans,
  }),
  ghost: (): CSSProperties => ({
    background: T.card, color: T.text, border: `1px solid ${T.border}`, borderRadius: T.radiusSm,
    padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: T.fontSans,
  }),
};

/** 平台填充状态 pill */
export function StatusPill({ state, text }: { state: 'pending' | 'filled' | 'failed'; text: string }) {
  const map = {
    pending: { bg: T.warnBg, fg: T.warn, dot: T.warn },
    filled: { bg: T.okBg, fg: T.ok, dot: T.ok },
    failed: { bg: T.errBg, fg: T.err, dot: T.err },
  }[state];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, background: map.bg, color: map.fg,
      fontSize: 12, padding: '3px 10px', borderRadius: 20, maxWidth: 360,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: map.dot, flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</span>
    </span>
  );
}

/** 人类可读文件大小 */
export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
