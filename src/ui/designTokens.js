export const tokens = {
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
};

export function glassPanel(variant = 'standard') {
  const bg = variant === 'strong' ? tokens.glassStrong :
    variant === 'light' ? 'rgba(255,255,255,0.40)' :
    variant === 'opaque' ? 'rgba(255,255,255,0.92)' : tokens.glass;
  return {
    backgroundColor: bg,
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: `1px solid ${tokens.glassBorder}`,
    boxShadow: `${tokens.shadowRest}, ${tokens.shadowInner}`,
  };
}
