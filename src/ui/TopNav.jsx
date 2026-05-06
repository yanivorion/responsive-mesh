import React from 'react';
import { Monitor, Tablet, Smartphone, ChevronDown, Eye, ArrowLeft } from 'lucide-react';
import { BREAKPOINTS } from '../engine/responsiveUnits.js';
import { tokens, glassPanel } from './designTokens.js';

const BP_ICONS = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

export function TopNav({
  breakpointId, onBreakpointChange,
  activeBreakpoints = ['desktop', 'mobile'],
  focusedBp, onExitFocus,
  elementCount,
}) {
  return (
    <div style={styles.root}>
      <div style={styles.left}>
        {focusedBp ? (
          <button onClick={onExitFocus} style={styles.backBtn}>
            <ArrowLeft size={14} strokeWidth={2} />
            <span>Overview</span>
          </button>
        ) : (
          <button style={styles.logoBtn}>
            <div style={styles.logoBox}>
              <div style={styles.logoGrid}>
                <div style={styles.logoDot} />
                <div style={styles.logoDot} />
                <div style={styles.logoDot} />
                <div style={{ width: 5, height: 5, borderRadius: 1, backgroundColor: 'transparent' }} />
              </div>
            </div>
            <ChevronDown size={12} color={tokens.text4} />
          </button>
        )}

        <button style={styles.pageBtn}>
          Homepage
          <ChevronDown size={12} color={tokens.text4} />
        </button>

        {elementCount > 0 && (
          <span style={styles.elCount}>{elementCount} element{elementCount !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div style={styles.center}>
        <div style={styles.bpSwitcher}>
          {activeBreakpoints.map((bp) => {
            const isFocused = bp === focusedBp;
            const Icon = BP_ICONS[bp];
            return (
              <button
                key={bp}
                onClick={() => onBreakpointChange(bp)}
                style={{
                  ...styles.bpBtn,
                  backgroundColor: isFocused ? '#FFFFFF' : 'transparent',
                  boxShadow: isFocused ? tokens.shadowSubtle : 'none',
                  color: isFocused ? tokens.text1 : tokens.text3,
                  fontWeight: isFocused ? 500 : 400,
                }}
              >
                <Icon size={14} strokeWidth={isFocused ? 2 : 1.5} />
                <span>{BREAKPOINTS[bp].label}</span>
              </button>
            );
          })}
        </div>

        <div style={styles.modeSwitcher}>
          <button style={styles.modeActive}>Design</button>
          <button style={styles.modeInactive}>Code</button>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.avatar}>Y</div>
        <button style={styles.previewBtn}>
          <Eye size={16} color={tokens.text4} />
          <ChevronDown size={10} color={tokens.text4} />
        </button>
        <button style={styles.publishBtn}>Publish</button>
      </div>
    </div>
  );
}

const styles = {
  root: {
    height: 48,
    ...glassPanel('strong'),
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: `1px solid ${tokens.border}`,
    borderRadius: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    flexShrink: 0,
    fontFamily: tokens.fontUI,
  },
  left: { display: 'flex', alignItems: 'center', gap: 4 },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 10px',
    borderRadius: tokens.radiusMd,
    border: 'none',
    backgroundColor: 'rgba(0,0,0,0.04)',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    color: tokens.text2,
    transition: `background-color ${tokens.durFast} ${tokens.easeOut}`,
  },
  logoBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px',
    borderRadius: tokens.radiusMd,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  logoBox: {
    width: 24,
    height: 24,
    borderRadius: tokens.radiusMd,
    backgroundColor: tokens.neutralDark,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGrid: { display: 'grid', gridTemplateColumns: '5px 5px', gap: 2 },
  logoDot: { width: 5, height: 5, borderRadius: 1, backgroundColor: '#FAFAF9' },
  pageBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: tokens.radiusMd,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: tokens.text1,
  },
  elCount: {
    fontSize: 10,
    fontWeight: 500,
    color: tokens.text3,
    backgroundColor: tokens.accentSoft,
    padding: '3px 8px',
    borderRadius: tokens.radiusFull,
    marginLeft: 4,
    letterSpacing: '0.02em',
  },
  center: { display: 'flex', alignItems: 'center', gap: 12 },
  bpSwitcher: {
    display: 'flex',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: tokens.radiusLg,
    padding: 3,
    gap: 2,
  },
  bpBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 12px',
    borderRadius: 5,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    transition: `all ${tokens.durFast} ${tokens.easeOut}`,
  },
  modeSwitcher: {
    display: 'flex',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: tokens.radiusLg,
    padding: 3,
  },
  modeActive: {
    padding: '5px 14px',
    borderRadius: 5,
    border: 'none',
    backgroundColor: '#FFFFFF',
    boxShadow: tokens.shadowSubtle,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    color: tokens.text1,
  },
  modeInactive: {
    padding: '5px 14px',
    borderRadius: 5,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 400,
    color: tokens.text3,
  },
  right: { display: 'flex', alignItems: 'center', gap: 8 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: 600,
  },
  previewBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 8px',
    borderRadius: tokens.radiusMd,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  publishBtn: {
    padding: '8px 16px',
    borderRadius: tokens.radiusLg,
    border: 'none',
    backgroundColor: tokens.accent,
    cursor: 'pointer',
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: 500,
    transition: `background-color ${tokens.durFast} ${tokens.easeOut}`,
  },
};
