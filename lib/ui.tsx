// 灵羽设计系统:颜色/圆角/阴影/字体 token + 平台品牌色 + 羽毛标识组件
export const T = {
  ink: '#16242c',        // 墨青(深,顶栏)
  inkSoft: '#1e3a44',    // 墨青(中)
  gold: '#c9a86a',       // 鎏金(主点缀)
  goldDeep: '#b8954f',   // 鎏金(深,hover)
  paper: '#faf7f0',      // 宣纸(基底)
  card: '#ffffff',       // 卡片白
  text: '#1a2a30',       // 主文字
  textSoft: '#5c6b72',   // 次文字
  textFaint: '#93a0a6',  // 弱文字
  border: '#e8e2d6',     // 边框
  radiusCard: 14,
  radiusBtn: 10,
  radiusSm: 8,
  shadowCard: '0 2px 12px rgba(22,36,44,.06)',
  shadowHover: '0 4px 20px rgba(22,36,44,.10)',
  fontSerif: "Georgia, 'Songti SC', 'STSong', 'Noto Serif SC', serif",
  fontSans: "system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
} as const;

import type { PlatformId } from './platforms';

export const PLATFORM_COLORS: Record<PlatformId, string> = {
  weixin: '#07c160',
  zhihu: '#0084ff',
  woshipm: '#d6541b',
  xiaohongshu: '#ff2442',
  bilibili: '#fb7299',
  x: '#14171a',
  reddit: '#ff4500',
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <LingyuMark size={26} color={T.gold} />
      <div style={{ lineHeight: 1.15 }}>
        <div style={{ fontFamily: T.fontSerif, fontSize: 19, fontWeight: 500, color: titleColor, letterSpacing: 2 }}>
          灵羽
        </div>
        <div style={{ fontSize: 11, color: subColor, letterSpacing: 1 }}>{subtitle}</div>
      </div>
    </div>
  );
}
