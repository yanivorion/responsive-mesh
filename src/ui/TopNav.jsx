import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, ChevronDown, Eye, Grid3x3, Link, Unlink, Plus, X } from 'lucide-react';
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
  allBpMap,
  elementCount,
  onTogglePreview,
  meshMode = true,
  onToggleMesh,
  showGridlines = false,
  onToggleGridlines,
  onAddCustomBreakpoint,
  onRemoveCustomBreakpoint,
}) {
  const [showBpPopover, setShowBpPopover] = useState(false);
  const [bpWidthInput, setBpWidthInput] = useState('1440');
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!showBpPopover) return;
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setShowBpPopover(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showBpPopover]);

  const bpMap = allBpMap || BREAKPOINTS;

  return (
    <div style={styles.root}>
      <div style={styles.left}>
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
          {activeBreakpoints.map((bpId) => {
            const isActive = bpId === breakpointId;
            const bpDef = bpMap[bpId] || BREAKPOINTS[bpId];
            if (!bpDef) return null;
            const Icon = BP_ICONS[bpId] || Monitor;
            const isCustom = bpDef.isCustom;
            return (
              <button
                key={bpId}
                onClick={() => onBreakpointChange(bpId)}
                style={{
                  ...styles.bpBtn,
                  backgroundColor: isActive ? tokens.activePill : 'transparent',
                  boxShadow: isActive ? tokens.shadowSubtle : 'none',
                  color: isActive ? tokens.text1 : tokens.text3,
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <Icon size={14} strokeWidth={isActive ? 2 : 1.5} />
                <span>{bpDef.label}</span>
                {isCustom && onRemoveCustomBreakpoint && (
                  <span
                    onClick={(e) => { e.stopPropagation(); onRemoveCustomBreakpoint(bpId); }}
                    style={styles.removeBpX}
                    title="Remove breakpoint"
                  >
                    <X size={10} strokeWidth={2} />
                  </span>
                )}
              </button>
            );
          })}
          {onAddCustomBreakpoint && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowBpPopover((v) => !v)}
                style={styles.addBpBtnSmall}
                title="Add breakpoint"
              >
                <Plus size={12} strokeWidth={2} />
              </button>
              {showBpPopover && (
                <div ref={popoverRef} style={styles.bpPopover}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: tokens.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add Breakpoint</span>
                  <input
                    type="number"
                    value={bpWidthInput}
                    onChange={(e) => setBpWidthInput(e.target.value)}
                    placeholder="Width (px)"
                    style={styles.bpPopoverInput}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const w = parseInt(bpWidthInput);
                        if (w > 0) { onAddCustomBreakpoint(w); setShowBpPopover(false); setBpWidthInput('1440'); }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const w = parseInt(bpWidthInput);
                      if (w > 0) { onAddCustomBreakpoint(w); setShowBpPopover(false); setBpWidthInput('1440'); }
                    }}
                    style={styles.bpPopoverBtn}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.modeSwitcher}>
          <button style={styles.modeActive}>Design</button>
          <button style={styles.modeInactive}>Code</button>
        </div>

        <div style={styles.meshSwitcher}>
          <button
            onClick={onToggleMesh}
            style={{
              ...styles.meshBtn,
              backgroundColor: meshMode ? tokens.activePill : 'transparent',
              boxShadow: meshMode ? tokens.shadowSubtle : 'none',
              color: meshMode ? tokens.text1 : tokens.text3,
            }}
            title={meshMode ? 'Mesh On' : 'Mesh Off'}
          >
            {meshMode ? <Link size={13} strokeWidth={2} /> : <Unlink size={13} strokeWidth={1.5} />}
            <span>{meshMode ? 'Mesh' : 'No Mesh'}</span>
          </button>
          <button
            onClick={onToggleGridlines}
            style={{
              ...styles.meshBtn,
              backgroundColor: showGridlines ? tokens.activePill : 'transparent',
              boxShadow: showGridlines ? tokens.shadowSubtle : 'none',
              color: showGridlines ? tokens.accent : tokens.text3,
            }}
            title={showGridlines ? 'Hide Gridlines' : 'Show Gridlines'}
          >
            <Grid3x3 size={13} strokeWidth={showGridlines ? 2 : 1.5} />
          </button>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.avatar}>Y</div>
        <button onClick={onTogglePreview} style={styles.previewBtn} title="Preview">
          <Eye size={16} color={tokens.text4} />
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
    backgroundColor: tokens.accent,
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
    alignItems: 'center',
    backgroundColor: tokens.pillBg,
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
  removeBpX: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    padding: 1,
    borderRadius: 3,
    cursor: 'pointer',
    opacity: 0.5,
  },
  addBpBtnSmall: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: 5,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: tokens.text3,
    transition: `all ${tokens.durFast} ${tokens.easeOut}`,
  },
  bpPopover: {
    position: 'absolute',
    top: 36,
    right: 0,
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 10,
    borderRadius: tokens.radiusLg,
    ...glassPanel('opaque'),
    minWidth: 140,
  },
  bpPopoverInput: {
    padding: '5px 8px',
    borderRadius: tokens.radiusMd,
    border: `1px solid ${tokens.controlBorder}`,
    backgroundColor: tokens.inputBg,
    color: tokens.text1,
    fontSize: 12,
    fontFamily: 'monospace',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  bpPopoverBtn: {
    padding: '5px 10px',
    borderRadius: tokens.radiusMd,
    border: 'none',
    backgroundColor: tokens.accent,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  modeSwitcher: {
    display: 'flex',
    backgroundColor: tokens.pillBg,
    borderRadius: tokens.radiusLg,
    padding: 3,
  },
  modeActive: {
    padding: '5px 14px',
    borderRadius: 5,
    border: 'none',
    backgroundColor: tokens.activePill,
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
  meshSwitcher: {
    display: 'flex',
    backgroundColor: tokens.pillBg,
    borderRadius: tokens.radiusLg,
    padding: 3,
    gap: 2,
  },
  meshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 10px',
    borderRadius: 5,
    border: 'none',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 500,
    transition: `all ${tokens.durFast} ${tokens.easeOut}`,
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
