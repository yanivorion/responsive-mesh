export const lightTokens = {
  accent: '#3b82f6',
  accentSoft: 'rgba(59, 130, 246, 0.08)',
  accentGlow: 'rgba(59, 130, 246, 0.14)',

  text1: '#0f172a',
  text2: '#334155',
  text3: '#94a3b8',
  text4: '#64748b',

  bgPage: '#eef2f7',
  bgPageGradient: 'linear-gradient(145deg, #eef2f7, #e8edf5, #f0f3f8)',

  glass: 'rgba(255, 255, 255, 0.52)',
  glassStrong: 'rgba(255, 255, 255, 0.70)',
  glassBorder: 'rgba(255, 255, 255, 0.48)',
  border: 'rgba(0, 0, 0, 0.05)',
  controlBorder: 'rgba(0, 0, 0, 0.07)',

  danger: '#dc2626',
  dangerBg: '#fef2f2',
  success: '#22c55e',
  neutralDark: '#18181B',
  neutralMid: '#71717A',

  shadowSubtle: '0 1px 3px rgba(0,0,0,0.02)',
  shadowRest: '0 4px 24px rgba(0,0,0,0.045), 0 1px 3px rgba(0,0,0,0.02)',
  shadowHover: '0 8px 32px rgba(0,0,0,0.07)',
  shadowElevated: '0 12px 48px rgba(0,0,0,0.12)',
  shadowInner: 'inset 0 1px 0 rgba(255,255,255,0.55)',

  radiusSm: 4,
  radiusMd: 6,
  radiusLg: 8,
  radiusXl: 12,
  radius2xl: 16,
  radiusFull: 9999,

  easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeSmooth: 'cubic-bezier(0.4, 0, 0.2, 1)',

  durFast: '150ms',
  durNormal: '250ms',
  durMedium: '350ms',
  durSlow: '450ms',

  fontUI: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif",

  iconDefault: '#6b7280',
  iconHover: '#1f2937',

  canvasBg: '#FFFFFF',
  activePill: '#FFFFFF',
  pillBg: 'rgba(0,0,0,0.04)',
  inputBg: 'rgba(0,0,0,0.03)',
};

export const darkTokens = {
  accent: '#6366f1',
  accentSoft: 'rgba(99,102,241,0.12)',
  accentGlow: 'rgba(99,102,241,0.18)',

  text1: '#f8fafc',
  text2: '#cbd5e1',
  text3: '#64748b',
  text4: '#94a3b8',

  bgPage: '#1a1a2e',
  bgPageGradient: 'linear-gradient(145deg, #1a1a2e, #16213e, #1a1a2e)',

  glass: 'rgba(30,30,50,0.72)',
  glassStrong: 'rgba(30,30,50,0.85)',
  glassBorder: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.06)',
  controlBorder: 'rgba(255,255,255,0.10)',

  danger: '#ef4444',
  dangerBg: 'rgba(239,68,68,0.12)',
  success: '#22c55e',
  neutralDark: '#f8fafc',
  neutralMid: '#94a3b8',

  shadowSubtle: '0 1px 3px rgba(0,0,0,0.15)',
  shadowRest: '0 4px 24px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.1)',
  shadowHover: '0 8px 32px rgba(0,0,0,0.25)',
  shadowElevated: '0 12px 48px rgba(0,0,0,0.35)',
  shadowInner: 'inset 0 1px 0 rgba(255,255,255,0.04)',

  radiusSm: 4,
  radiusMd: 6,
  radiusLg: 8,
  radiusXl: 12,
  radius2xl: 16,
  radiusFull: 9999,

  easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeSmooth: 'cubic-bezier(0.4, 0, 0.2, 1)',

  durFast: '150ms',
  durNormal: '250ms',
  durMedium: '350ms',
  durSlow: '450ms',

  fontUI: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif",

  iconDefault: '#94a3b8',
  iconHover: '#f8fafc',

  canvasBg: '#FFFFFF',
  activePill: 'rgba(255,255,255,0.12)',
  pillBg: 'rgba(255,255,255,0.06)',
  inputBg: 'rgba(255,255,255,0.06)',
};

export const tokens = darkTokens;

export function glassPanel(variant = 'standard') {
  const bg = variant === 'strong' ? tokens.glassStrong :
    variant === 'light' ? (tokens === darkTokens ? 'rgba(30,30,50,0.5)' : 'rgba(255,255,255,0.40)') :
    variant === 'opaque' ? (tokens === darkTokens ? 'rgba(26,26,46,0.95)' : 'rgba(255,255,255,0.92)') : tokens.glass;
  return {
    backgroundColor: bg,
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: `1px solid ${tokens.glassBorder}`,
    boxShadow: `${tokens.shadowRest}, ${tokens.shadowInner}`,
  };
}
