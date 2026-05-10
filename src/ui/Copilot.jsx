import React from 'react';
import { Plus, ArrowUp, Mic } from 'lucide-react';
import { tokens, glassPanel } from './designTokens.js';

export function Copilot({
  expanded,
  showContent,
  inputValue,
  onInputChange,
  onExpand,
  onCollapse,
  onSubmit,
  onQuickCommand,
  inputRef,
  copilotRef,
  prefersReducedMotion,
  smoothEase,
}) {
  return (
    <>
      <div
        onClick={onCollapse}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.18)',
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? 'auto' : 'none',
          transition: prefersReducedMotion ? 'none' : `opacity 400ms ${smoothEase}`,
          zIndex: 100,
        }}
      />

      <div
        ref={copilotRef}
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          zIndex: 101,
          width: '100%',
          maxWidth: expanded ? 620 : 540,
          padding: '0 16px',
          boxSizing: 'border-box',
          transition: prefersReducedMotion ? 'none' : `max-width 450ms ${smoothEase}`,
        }}
      >
        <div
          onClick={!expanded ? onExpand : undefined}
          style={{
            width: '100%',
            ...glassPanel('standard'),
            borderRadius: 24,
            padding: 6,
            boxShadow: expanded ? tokens.shadowElevated : tokens.shadowHover,
            cursor: expanded ? 'default' : 'pointer',
            transition: prefersReducedMotion ? 'none' : `all 450ms ${smoothEase}`,
          }}
        >
          <div style={{ backgroundColor: tokens.glass, borderRadius: 18, overflow: 'hidden' }}>
            {!expanded && <CollapsedState onSuggestion={onQuickCommand} />}
            {expanded && (
              <ExpandedState
                showContent={showContent}
                inputValue={inputValue}
                onInputChange={onInputChange}
                onSubmit={onSubmit}
                inputRef={inputRef}
                prefersReducedMotion={prefersReducedMotion}
                smoothEase={smoothEase}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const SUGGESTIONS = [
  'Add a button',
  'Add 3 images',
  'Add a title and paragraph',
  'Switch to mobile',
  'Clear all',
];

function CollapsedState({ onSuggestion }) {
  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 15, color: tokens.text3, marginBottom: 10 }}>Message Copilot</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={(e) => { e.stopPropagation(); onSuggestion(s); }}
            style={styles.chip}
          >
            {s}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button style={styles.iconBtn}>
          <Plus size={18} color={tokens.text4} strokeWidth={1.5} />
        </button>
        <button style={styles.micBtn}>
          <Mic size={20} color={tokens.text3} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

function ExpandedState({ showContent, inputValue, onInputChange, onSubmit, inputRef, prefersReducedMotion, smoothEase }) {
  const hasValue = inputValue.trim().length > 0;

  return (
    <div
      style={{
        padding: 18,
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'translateY(0)' : 'translateY(8px)',
        transition: prefersReducedMotion ? 'none' : `all ${tokens.durMedium} ${smoothEase}`,
      }}
    >
      <textarea
        ref={inputRef}
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Describe the component you want to create..."
        style={styles.textarea}
      />
      <div style={styles.expandedFooter}>
        <button style={styles.iconBtn}>
          <Plus size={16} color={tokens.text4} strokeWidth={1.5} />
        </button>
        <button
          onClick={onSubmit}
          style={{
            ...styles.submitBtn,
            backgroundColor: hasValue ? tokens.neutralDark : 'rgba(0,0,0,0.04)',
            cursor: hasValue ? 'pointer' : 'default',
            transform: hasValue ? 'scale(1)' : 'scale(0.95)',
            transition: prefersReducedMotion ? 'none' : `all ${tokens.durNormal} ${smoothEase}`,
          }}
        >
          <ArrowUp size={18} color={hasValue ? '#FFFFFF' : tokens.text3} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 10,
    border: `1px solid ${tokens.controlBorder}`,
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  chip: {
    padding: '5px 12px',
    fontSize: 12,
    fontWeight: 500,
    color: tokens.text2,
    backgroundColor: tokens.inputBg,
    border: `1px solid ${tokens.controlBorder}`,
    borderRadius: tokens.radiusFull,
    cursor: 'pointer',
    transition: `all ${tokens.durFast} ${tokens.easeOut}`,
    whiteSpace: 'nowrap',
  },
  micBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    minHeight: 72,
    padding: 0,
    border: 'none',
    outline: 'none',
    resize: 'none',
    backgroundColor: 'transparent',
    fontSize: 15,
    color: tokens.text1,
    lineHeight: 1.5,
    fontFamily: 'inherit',
  },
  expandedFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
  },
};
