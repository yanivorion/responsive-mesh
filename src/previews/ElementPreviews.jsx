import React from 'react';
import {
  Image as ImageIcon, Play, Code, LayoutGrid, Menu as MenuIcon,
  Hexagon, Repeat, Minus,
} from 'lucide-react';
import { pickPlaceholder } from '../engine/imagePlaceholders.js';
import { tokens } from '../ui/designTokens.js';

const sysFont = tokens.fontUI;

// ── Real content renderers (ported from responsive-mesh-playground) ──

export function ImagePreview({ width, height, props, elementId }) {
  const p = props || {};
  const hasExplicitSrc = p.src && (p.src.startsWith('/') || p.src.startsWith('http') || p.src.startsWith('data:'));
  const seed = p.id || elementId || `${width}.${height}`;
  const src = hasExplicitSrc ? p.src : pickPlaceholder(seed);
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      borderRadius: (p.borderRadius ?? 8) + 'px', background: '#f4f4f5',
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)', pointerEvents: 'none',
      opacity: p.opacity != null ? p.opacity / 100 : 1,
    }}>
      <img
        src={src}
        alt={p.alt || p.caption || 'Placeholder'}
        draggable={false}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: p.objectFit || 'cover', objectPosition: p.objectPosition || 'center',
          display: 'block', userSelect: 'none',
        }}
      />
    </div>
  );
}

export function TitlePreview({ width, height, props, fontScale = 1 }) {
  const p = props || {};
  const text = p.text || 'Write a Title Here';
  const baseSize = p.fontSize || 44;
  return (
    <div style={{
      width: '100%', height: 'auto', padding: '2px 4px', boxSizing: 'border-box',
      fontFamily: p.fontFamily || 'Inter', fontSize: (baseSize * fontScale) + 'px',
      fontWeight: p.fontWeight || '600', color: p.color || '#0f172a',
      lineHeight: p.lineHeight || '1.1', letterSpacing: p.letterSpacing || '-0.01em',
      textAlign: p.textAlign || 'left',
      overflow: 'visible', wordBreak: 'break-word', whiteSpace: 'normal',
    }}>
      {text}
    </div>
  );
}

export function ParagraphPreview({ width, height, props, fontScale = 1 }) {
  const p = props || {};
  const text = p.text || 'Use this space to promote the business, its products or its services.';
  const baseSize = p.fontSize || 14;
  return (
    <div style={{
      width: '100%', height: 'auto', padding: '2px 4px', boxSizing: 'border-box',
      fontFamily: p.fontFamily || 'Inter', fontSize: (baseSize * fontScale) + 'px',
      fontWeight: p.fontWeight || '400', color: p.color || '#334155',
      lineHeight: p.lineHeight || '1.55', letterSpacing: p.letterSpacing || '0em',
      textAlign: p.textAlign || 'left',
      overflow: 'visible', wordBreak: 'break-word', whiteSpace: 'normal',
    }}>
      {text}
    </div>
  );
}

export function ButtonPreview({ width, height, props, fontScale = 1 }) {
  const p = props || {};
  const variant = p.variant || 'primary';
  const isPrimary = variant === 'primary';
  const padX = (p.paddingX ?? 18) * fontScale;
  const padY = (p.paddingY ?? 10) * fontScale;
  const radius = (p.radius ?? 8) * fontScale;
  const fSize = (p.fontSize || 13) * fontScale;
  const fWeight = p.fontWeight || '500';
  const color = p.color || (isPrimary ? '#fff' : tokens.text2);
  const bg = p.bgColor || (isPrimary ? tokens.accent : '#fafafa');
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button
        onClick={(e) => e.preventDefault()}
        style={{
          width: '100%', height: '100%', minHeight: 32 * fontScale,
          cursor: 'inherit', padding: `${padY}px ${padX}px`,
          border: isPrimary && !p.bgColor ? 'none' : `1px solid ${tokens.controlBorder}`,
          borderRadius: radius + 'px',
          background: bg,
          color: color,
          fontSize: fSize, fontWeight: fWeight, letterSpacing: '0.01em',
          fontFamily: sysFont,
          boxShadow: isPrimary && !p.bgColor ? '0 2px 10px rgba(59,130,246,0.30)' : 'none',
          pointerEvents: 'none',
        }}
      >
        {p.label || 'Start Now'}
      </button>
    </div>
  );
}

export function ContainerPreview({ width, height, props }) {
  const p = props || {};
  return (
    <div style={{
      width: '100%', height: '100%', minHeight: 60,
      background: p.background || 'rgba(15,23,42,0.04)',
      border: `${p.borderWidth ?? 1}px dashed ${p.borderColor || 'rgba(15,23,42,0.08)'}`,
      borderRadius: (p.borderRadius || 12) + 'px',
      boxSizing: 'border-box', pointerEvents: 'none',
      opacity: p.opacity != null ? p.opacity / 100 : 1,
    }} />
  );
}

export function LinePreview({ width, height, props }) {
  const p = props || {};
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', height: p.thickness ?? 2, backgroundColor: p.color || tokens.text3, borderRadius: 1 }} />
    </div>
  );
}

export function GalleryPreview({ width, height, props }) {
  const p = props || {};
  const cols = p.cols ?? (width > 350 ? 3 : 2);
  const gap = p.gap ?? 6;
  const rows = height > 250 ? 2 : 1;
  const radius = p.borderRadius ?? 4;
  return (
    <div style={{
      width: '100%', height: '100%', padding: gap,
      display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`, gap, backgroundColor: '#f8fafc',
    }}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div key={i} style={{
          backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: radius,
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          <img
            src={pickPlaceholder(`gallery-${i}`)}
            alt="" draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      ))}
    </div>
  );
}

export function MenuPreview({ width, height, props }) {
  const p = props || {};
  const items = p.items || ['Home', 'About', 'Services', 'Contact'];
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 24, backgroundColor: p.bgColor || '#fff',
      borderBottom: `1px solid ${tokens.border}`,
    }}>
      {items.map((item, i) => (
        <span key={i} style={{ fontSize: 13, color: p.textColor || tokens.text2, fontWeight: 500, whiteSpace: 'nowrap' }}>{item}</span>
      ))}
    </div>
  );
}

export function ShapePreview({ width, height, props }) {
  const p = props || {};
  const size = Math.min(width, height) * 0.6;
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#f8fafc',
      opacity: p.opacity != null ? p.opacity / 100 : 1,
    }}>
      <div style={{
        width: size, height: size, borderRadius: (p.borderRadius ?? size * 0.15) + 'px',
        backgroundColor: p.background || 'rgba(59, 130, 246, 0.12)',
        border: `${p.borderWidth ?? 2}px solid ${p.borderColor || tokens.accent}`,
      }} />
    </div>
  );
}

export function RepeaterPreview({ width, height }) {
  const cols = width > 350 ? 3 : 2;
  return (
    <div style={{ width: '100%', height: '100%', padding: 8, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8, backgroundColor: '#f8fafc' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} style={{
          backgroundColor: '#fff', borderRadius: 6,
          border: `1px solid ${tokens.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 40 }}>
            <img src={pickPlaceholder(`repeater-${i}`)} alt="" draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ padding: '6px 8px' }}>
            <div style={{ height: 6, width: '70%', backgroundColor: 'rgba(0,0,0,0.10)', borderRadius: 3 }} />
            <div style={{ height: 4, width: '90%', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2, marginTop: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function VideoPreview({ width, height, props }) {
  const p = props || {};
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: (p.borderRadius ?? 4) + 'px' }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Play size={24} color="#fff" fill="#fff" strokeWidth={0} style={{ marginLeft: 3 }} />
      </div>
    </div>
  );
}

export function IFramePreview({ width, height }) {
  return (
    <div style={{
      width: '100%', height: '100%', border: `2px dashed ${tokens.border}`,
      backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 4,
    }}>
      <Code size={28} color={tokens.text3} strokeWidth={1.2} />
      <span style={{ fontSize: 11, color: tokens.text3, fontWeight: 500 }}>Embed / IFrame</span>
    </div>
  );
}
