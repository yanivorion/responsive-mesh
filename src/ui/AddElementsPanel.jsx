import React, { useState, useCallback } from 'react';
import {
  Search, X, HelpCircle,
  Image, Type, AlignLeft,
  MousePointer2, Square, Minus,
  LayoutGrid, ListOrdered, Video,
  Code,
  Layers, Package, PanelTop, Puzzle, LayoutTemplate,
  BoxSelect, Ruler, TypeIcon, RectangleHorizontal,
  Menu, ImageIcon, Gem, Mail, Globe,
  FormInput, BookOpen, ShoppingBag, CalendarDays,
  CalendarCheck, UsersRound, Languages, UtensilsCrossed,
  Database, Hexagon, Play, Repeat,
} from 'lucide-react';
import { tokens, glassPanel } from './designTokens.js';
import { LAYOUT_PRESETS, SECTION_PRESETS } from '../data/layoutPresets.js';

const CATEGORIES = [
  { id: 'quick-add', label: 'Quick Add' },
  { id: 'layouts', label: 'Layouts' },
  { id: 'assets', label: 'Assets' },
  { id: 'sections', label: 'Sections' },
  { id: 'design-kits', label: 'Design Kits' },
  { id: 'wireframes', label: 'Wireframes' },
  { id: 'containers', label: 'Containers' },
  { id: 'layout-tools', label: 'Layout Tools' },
  { id: 'text', label: 'Text' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'menu-search', label: 'Menu & Search' },
  { id: 'media', label: 'Media' },
  { id: 'decorative', label: 'Decorative' },
  { id: 'contact-forms', label: 'Contact & Forms' },
  { id: 'embed-social', label: 'Embed & Social' },
  { id: 'input', label: 'Input' },
  { id: 'blog', label: 'Blog' },
  { id: 'store', label: 'Store' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'events', label: 'Events' },
  { id: 'community', label: 'Community' },
  { id: 'multilingual', label: 'Multilingual' },
  { id: 'restaurants', label: 'Restaurants' },
  { id: 'cms', label: 'CMS' },
];

const QUICK_ADD_ELEMENTS = [
  { id: 'image',      name: 'Image',     icon: Image,          defaultW: 300, defaultH: 200 },
  { id: 'title',      name: 'Title',     icon: Type,           defaultW: 400, defaultH: 60 },
  { id: 'paragraph',  name: 'Paragraph', icon: AlignLeft,      defaultW: 400, defaultH: 120 },
  { id: 'button',     name: 'Button',    icon: MousePointer2,  defaultW: 160, defaultH: 48 },
  { id: 'container',  name: 'Container', icon: Square,         defaultW: 400, defaultH: 300 },
  { id: 'line',       name: 'Line',      icon: Minus,          defaultW: 300, defaultH: 4 },
  { id: 'gallery',    name: 'Gallery',   icon: LayoutGrid,     defaultW: 500, defaultH: 350 },
  { id: 'menu',       name: 'Menu',      icon: Menu,           defaultW: 400, defaultH: 48 },
  { id: 'shape',      name: 'Shape',     icon: Hexagon,        defaultW: 200, defaultH: 200 },
  { id: 'repeater',   name: 'Repeater',  icon: Repeat,         defaultW: 500, defaultH: 250 },
  { id: 'video',      name: 'Video',     icon: Play,           defaultW: 400, defaultH: 225 },
  { id: 'iframe',     name: 'IFrame',    icon: Code,           defaultW: 400, defaultH: 300 },
];

export function AddElementsPanel({ open, onClose, onAddElement, onAddLayout, onAddSection }) {
  const [activeCategory, setActiveCategory] = useState('quick-add');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredEl, setHoveredEl] = useState(null);

  const filteredElements = searchQuery.trim()
    ? QUICK_ADD_ELEMENTS.filter((el) =>
        el.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : QUICK_ADD_ELEMENTS;

  const handleDragStart = useCallback((e, element) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        componentId: element.id,
        componentName: element.name,
        defaultW: element.defaultW,
        defaultH: element.defaultH,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleClickAdd = useCallback((element) => {
    onAddElement(element.id, element.name, element.defaultW, element.defaultH);
  }, [onAddElement]);

  if (!open) return null;

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>Add Elements</span>
        <div style={styles.headerActions}>
          <div style={styles.searchWrap}>
            <Search size={14} color={tokens.text3} strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <button style={styles.iconBtn} title="Help">
            <HelpCircle size={16} color={tokens.text3} strokeWidth={1.5} />
          </button>
          <button style={styles.iconBtn} onClick={onClose} title="Close">
            <X size={16} color={tokens.text3} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div style={styles.body}>
        {/* Category sidebar */}
        <div style={styles.categorySidebar}>
          {CATEGORIES.map((cat) => {
            const active = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  ...styles.categoryBtn,
                  backgroundColor: active ? tokens.accentSoft : 'transparent',
                  color: active ? tokens.accent : tokens.text2,
                  fontWeight: active ? 500 : 400,
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Elements grid */}
        <div style={styles.elementsArea}>
          {activeCategory === 'quick-add' ? (
            <div style={styles.grid}>
              {filteredElements.map((el) => {
                const Icon = el.icon;
                const isHovered = hoveredEl === el.id;
                return (
                  <div
                    key={el.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, el)}
                    onClick={() => handleClickAdd(el)}
                    onMouseEnter={() => setHoveredEl(el.id)}
                    onMouseLeave={() => setHoveredEl(null)}
                    style={{
                      ...styles.elementCard,
                      borderColor: isHovered ? tokens.accent : tokens.controlBorder,
                      boxShadow: isHovered ? tokens.shadowHover : 'none',
                      transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
                    }}
                  >
                    <Icon
                      size={24}
                      color={isHovered ? tokens.accent : tokens.text2}
                      strokeWidth={1.5}
                    />
                    <span style={{
                      ...styles.elementLabel,
                      color: isHovered ? tokens.text1 : tokens.text2,
                    }}>
                      {el.name}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : activeCategory === 'layouts' ? (
            <div style={styles.layoutGrid}>
              {LAYOUT_PRESETS.map((preset) => {
                const isHovered = hoveredEl === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => onAddLayout && onAddLayout(preset.spec)}
                    onMouseEnter={() => setHoveredEl(preset.id)}
                    onMouseLeave={() => setHoveredEl(null)}
                    style={{
                      ...styles.layoutCard,
                      borderColor: isHovered ? tokens.accent : tokens.controlBorder,
                      boxShadow: isHovered ? tokens.shadowHover : 'none',
                      transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    }}
                  >
                    <div style={styles.layoutThumb}>
                      <LayoutTemplate size={28} color={isHovered ? tokens.accent : tokens.text3} strokeWidth={1.2} />
                    </div>
                    <div style={styles.layoutInfo}>
                      <span style={{ ...styles.layoutName, color: isHovered ? tokens.accent : tokens.text1 }}>
                        {preset.name}
                      </span>
                      <span style={styles.layoutDesc}>{preset.description}</span>
                      <span style={styles.layoutCategory}>{preset.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeCategory === 'sections' ? (
            <div style={styles.layoutGrid}>
              {SECTION_PRESETS.map((preset) => {
                const isHovered = hoveredEl === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => onAddSection && onAddSection(preset.spec)}
                    onMouseEnter={() => setHoveredEl(preset.id)}
                    onMouseLeave={() => setHoveredEl(null)}
                    style={{
                      ...styles.layoutCard,
                      borderColor: isHovered ? tokens.accent : tokens.controlBorder,
                      boxShadow: isHovered ? tokens.shadowHover : 'none',
                      transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    }}
                  >
                    <div style={styles.layoutThumb}>
                      <Layers size={24} color={isHovered ? tokens.accent : tokens.text3} strokeWidth={1.2} />
                    </div>
                    <div style={styles.layoutInfo}>
                      <span style={{ ...styles.layoutName, color: isHovered ? tokens.accent : tokens.text1 }}>
                        {preset.name}
                      </span>
                      <span style={styles.layoutDesc}>{preset.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={styles.placeholder}>
              <span style={styles.placeholderText}>{CATEGORIES.find(c => c.id === activeCategory)?.label}</span>
              <span style={styles.placeholderSub}>Category content coming soon</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 10000,
    display: 'flex',
    flexDirection: 'column',
    ...glassPanel('opaque'),
    borderRadius: 0,
    borderTop: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
    fontFamily: tokens.fontUI,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: `1px solid ${tokens.border}`,
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: tokens.text1,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    backgroundColor: tokens.inputBg,
    borderRadius: tokens.radiusFull,
    border: `1px solid ${tokens.controlBorder}`,
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: 13,
    color: tokens.text1,
    width: 100,
    fontFamily: 'inherit',
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: tokens.radiusMd,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  categorySidebar: {
    width: 152,
    borderRight: `1px solid ${tokens.border}`,
    overflowY: 'auto',
    padding: '8px 0',
    flexShrink: 0,
  },
  categoryBtn: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '7px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: 13,
    borderRadius: 0,
    transition: `all ${tokens.durFast} ${tokens.easeOut}`,
    lineHeight: 1.4,
  },
  elementsArea: {
    flex: 1,
    overflowY: 'auto',
    padding: 12,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  },
  elementCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '16px 8px',
    borderRadius: tokens.radiusLg,
    border: `1px solid ${tokens.controlBorder}`,
    backgroundColor: tokens.inputBg,
    cursor: 'grab',
    transition: `all ${tokens.durNormal} ${tokens.easeSpring}`,
    userSelect: 'none',
  },
  elementLabel: {
    fontSize: 12,
    fontWeight: 400,
    textAlign: 'center',
    lineHeight: 1.2,
  },
  placeholder: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: 500,
    color: tokens.text2,
  },
  placeholderSub: {
    fontSize: 12,
    color: tokens.text3,
  },
  layoutGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  layoutCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: tokens.radiusLg,
    border: `1px solid ${tokens.controlBorder}`,
    backgroundColor: tokens.inputBg,
    cursor: 'pointer',
    transition: `all ${tokens.durNormal} ${tokens.easeSpring}`,
    userSelect: 'none',
  },
  layoutThumb: {
    width: 52, height: 52, flexShrink: 0,
    borderRadius: tokens.radiusMd,
    backgroundColor: tokens.pillBg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  layoutInfo: {
    display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0,
  },
  layoutName: {
    fontSize: 13, fontWeight: 600,
  },
  layoutDesc: {
    fontSize: 11, color: tokens.text3, lineHeight: 1.35,
  },
  layoutCategory: {
    fontSize: 10, fontWeight: 600, color: tokens.accent,
    textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2,
  },
};
