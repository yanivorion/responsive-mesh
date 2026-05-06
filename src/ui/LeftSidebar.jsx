import React, { useState } from 'react';
import { Sparkles, Plus, Clock, Layers, FileText, Users, LayoutGrid, List } from 'lucide-react';
import { tokens } from './designTokens.js';

export function LeftSidebar({ width, onOpenInspiration, onToggleAddElements, addElementsOpen }) {
  const bottomIcons = [Layers, FileText, Users, LayoutGrid, List];

  return (
    <div
      style={{
        width,
        backgroundColor: 'rgba(255,255,255,0.70)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderRight: `1px solid ${tokens.border}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '12px 0',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <SidebarButton width={width} onClick={onOpenInspiration} title="Open Inspiration Library">
          <Sparkles size={20} color={tokens.accent} strokeWidth={1.5} />
        </SidebarButton>
        <SidebarButton width={width} onClick={onToggleAddElements} title="Add Element" active={addElementsOpen}>
          <Plus size={20} color={addElementsOpen ? tokens.accent : tokens.text1} strokeWidth={1.5} />
        </SidebarButton>
        <SidebarButton width={width} title="Recent">
          <Clock size={20} color={tokens.iconDefault} strokeWidth={1.5} />
        </SidebarButton>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {bottomIcons.map((Icon, i) => (
          <SidebarButton key={i} width={width}>
            <Icon size={20} color={tokens.iconDefault} strokeWidth={1.5} />
          </SidebarButton>
        ))}
      </div>
    </div>
  );
}

function SidebarButton({ width, onClick, title, active, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width,
        height: 44,
        border: 'none',
        backgroundColor: active ? tokens.accentSoft : hovered ? tokens.accentSoft : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: `background-color ${tokens.durFast} ${tokens.easeOut}`,
        borderRadius: 0,
      }}
    >
      {children}
    </button>
  );
}
