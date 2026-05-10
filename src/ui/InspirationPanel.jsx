import React from 'react';
import { X, Plus } from 'lucide-react';
import { PreviewRegistry } from '../previews/PreviewRegistry.jsx';
import { tokens, glassPanel } from './designTokens.js';

export function InspirationPanel({
  open,
  activeTab,
  onTabChange,
  onClose,
  components,
  artImages,
  hoveredComponent,
  onHoverComponent,
  onComponentClick,
  onAddToStage,
  prefersReducedMotion,
}) {
  const tabs = [
    { id: 'components', label: 'Custom Components' },
    { id: 'art', label: 'Generative Art' },
    { id: 'tools', label: 'Generative Tools' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.28)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: prefersReducedMotion ? 'none' : `opacity 300ms ${tokens.easeOut}`,
      }}
    >
      <div
        style={{
          width: '90%',
          maxWidth: 1200,
          height: '85%',
          backgroundColor: tokens.inputBg,
          borderRadius: tokens.radius2xl,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: tokens.shadowElevated,
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
          transition: prefersReducedMotion ? 'none' : `transform 400ms ${tokens.easeSmooth}`,
        }}
      >
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h2 style={styles.title}>Inspiration Library</h2>
            <div style={styles.tabBar}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: tokens.radiusLg,
                    border: 'none',
                    backgroundColor: activeTab === tab.id ? tokens.activePill : 'transparent',
                    boxShadow: activeTab === tab.id ? tokens.shadowSubtle : 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: activeTab === tab.id ? 500 : 400,
                    color: activeTab === tab.id ? tokens.text1 : tokens.text3,
                    transition: `all 200ms ${tokens.easeOut}`,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div style={styles.content}>
          {activeTab === 'components' && (
            <ComponentsGrid
              components={components}
              hoveredComponent={hoveredComponent}
              onHoverComponent={onHoverComponent}
              onComponentClick={onComponentClick}
              onAddToStage={onAddToStage}
            />
          )}
          {activeTab === 'art' && <ArtGrid images={artImages} />}
          {activeTab === 'tools' && (
            <div style={styles.placeholder}>Generative Tools coming soon...</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ComponentsGrid({ components, hoveredComponent, onHoverComponent, onComponentClick, onAddToStage }) {
  return (
    <div style={styles.grid}>
      {components.map((comp) => {
        const isHovered = hoveredComponent === comp.id;
        return (
          <div
            key={comp.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                'application/json',
                JSON.stringify({ componentId: comp.id, componentName: comp.name })
              );
              e.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={() => onComponentClick(comp)}
            onMouseEnter={() => onHoverComponent(comp.id)}
            onMouseLeave={() => onHoverComponent(null)}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: tokens.radius2xl,
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: isHovered ? tokens.shadowHover : tokens.shadowSubtle,
              transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
              transition: `all ${tokens.durNormal} ${tokens.easeSpring}`,
              border: `1px solid ${isHovered ? tokens.controlBorder : tokens.border}`,
            }}
          >
            <div style={styles.previewArea}>
              <PreviewRegistry id={comp.id} width={280} height={160} />
              <div style={{ ...styles.overlay, opacity: isHovered ? 1 : 0 }}>
                <button
                  onClick={(e) => onAddToStage(comp, e)}
                  style={styles.addBtn}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Plus size={16} color={tokens.text1} strokeWidth={1.5} />
                  Add to Stage
                </button>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                  Or click to use with Copilot
                </span>
              </div>
            </div>
            <div style={styles.cardInfo}>
              <h3 style={styles.cardName}>{comp.name}</h3>
              <p style={styles.cardDesc}>{comp.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ArtGrid({ images }) {
  return (
    <div style={styles.artGrid}>
      {images.map((img, idx) => (
        <div
          key={idx}
          style={{
            borderRadius: tokens.radiusXl,
            overflow: 'hidden',
            gridRow: img.size === 'tall' ? 'span 2' : 'span 1',
            gridColumn: img.size === 'wide' ? 'span 2' : 'span 1',
            position: 'relative',
          }}
        >
          <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}
    </div>
  );
}

function CloseButton({ onClick }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        border: 'none',
        backgroundColor: hovered ? tokens.inputBg : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: `background-color ${tokens.durFast} ${tokens.easeOut}`,
      }}
    >
      <X size={20} color={tokens.text3} strokeWidth={1.5} />
    </button>
  );
}

const styles = {
  header: {
    padding: '20px 28px',
    borderBottom: `1px solid ${tokens.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.glassStrong,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 24 },
  title: { fontSize: 18, fontWeight: 600, color: tokens.text1, margin: 0 },
  tabBar: {
    display: 'flex',
    gap: 4,
    backgroundColor: tokens.pillBg,
    borderRadius: 10,
    padding: 4,
  },
  content: { flex: 1, overflow: 'auto', padding: 24 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 20,
  },
  previewArea: {
    height: 160,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: tokens.inputBg,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    transition: `opacity 240ms ${tokens.easeOut}`,
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    backgroundColor: '#FFFFFF',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    color: tokens.text1,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: `transform ${tokens.durFast} ${tokens.easeOut}`,
  },
  cardInfo: { padding: '14px 16px' },
  cardName: { fontSize: 14, fontWeight: 600, color: tokens.text1, margin: '0 0 4px 0' },
  cardDesc: {
    fontSize: 12,
    color: tokens.text3,
    margin: 0,
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  artGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridAutoRows: 200,
    gap: 16,
  },
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    color: tokens.text3,
    fontSize: 15,
  },
};
