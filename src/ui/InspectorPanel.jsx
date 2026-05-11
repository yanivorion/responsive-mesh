import React, { useCallback, useState } from 'react';
import { Monitor, Tablet, Smartphone, Trash2, ChevronDown, ChevronRight, ChevronLeft, PanelRightOpen, ParkingCircle, Anchor, Move, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { UNITS, UNIT_LABELS, BREAKPOINTS, BREAKPOINT_IDS, RESPONSIVE_BEHAVIORS, ARCHETYPES } from '../engine/responsiveUnits.js';
import { STOCK_IMAGES, PLACEHOLDER_IMAGES } from '../engine/imagePlaceholders.js';
import { tokens } from './designTokens.js';

const BP_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };

export function InspectorPanel({ open, onToggle, element, breakpointId, onUpdateProp, onUpdateElementProps, onChangeBehavior, onRemoveElement, onParkElement, onUnparkElement, onUpdateDocking, isHighestBreakpoint = true }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const bpProps = element?.responsiveProps?.[breakpointId] || {};
  const desktopProps = element?.responsiveProps?.desktop || {};
  const effectiveProps = { ...desktopProps, ...bpProps };

  const isParked = element?.location === 'parkingLot';
  const archetype = element?.archetype || element?.componentId;
  const archetypeDef = archetype ? ARCHETYPES[archetype] : null;
  let allowedBehaviors = archetypeDef?.behaviors || Object.keys(RESPONSIVE_BEHAVIORS);
  if (isParked) {
    allowedBehaviors = allowedBehaviors.filter((b) => b !== 'stretch');
  }
  const currentBehavior = element?.behavior || archetypeDef?.defaultBehavior || 'scaleProportionally';
  const beh = RESPONSIVE_BEHAVIORS[currentBehavior];

  return (
    <div style={{ position: 'relative', display: 'flex', flexShrink: 0, width: open ? 260 : 28, transition: 'width 300ms cubic-bezier(0.22,1,0.36,1)' }}>
      {/* Chevron toggle tab — always visible */}
      <button onClick={onToggle} style={styles.toggleTab}>
        {open
          ? <ChevronRight size={14} strokeWidth={2} color={tokens.text3} />
          : <PanelRightOpen size={14} strokeWidth={1.5} color={tokens.text3} />
        }
      </button>

      <div style={{
        ...styles.panel,
        width: open ? 260 : 0,
        borderLeftWidth: open ? 1 : 0,
        opacity: open ? 1 : 0,
        transform: open ? 'translateX(0)' : 'translateX(8px)',
        transition: 'width 300ms cubic-bezier(0.22,1,0.36,1), opacity 250ms cubic-bezier(0.22,1,0.36,1), transform 300ms cubic-bezier(0.22,1,0.36,1), margin-left 300ms cubic-bezier(0.22,1,0.36,1)',
        pointerEvents: open ? 'auto' : 'none',
        overflow: 'hidden',
        marginLeft: open ? 0 : 28,
      }}>
        {!open ? null : !element ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: 12, color: tokens.text3 }}>Select an element to inspect</span>
          </div>
        ) : (<>
      <div style={styles.header}>
        <div>
          <div style={styles.name}>{element.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={styles.id}>{element.componentId}</span>
            {isParked && (
              <span style={styles.parkedBadge}>Parked</span>
            )}
          </div>
        </div>
      </div>
      {isHighestBreakpoint && isParked && onUnparkElement && (
        <button
          onClick={() => onUnparkElement(element.id)}
          style={styles.moveToStageBtn}
        >
          Move to Stage
        </button>
      )}
      {isHighestBreakpoint && !isParked && onParkElement && (
        <button
          onClick={() => onParkElement(element.id, 'left', 40, 40)}
          style={styles.moveToParkingBtn}
        >
          Move to Parking Lot
        </button>
      )}

      <div style={styles.bpIndicator}>
        {BREAKPOINT_IDS.map((bp) => {
          const Icon = BP_ICONS[bp];
          const active = bp === breakpointId;
          return (
            <span
              key={bp}
              style={{
                ...styles.bpDot,
                backgroundColor: active ? tokens.accent : tokens.inputBg,
                color: active ? '#FFFFFF' : tokens.text3,
              }}
            >
              <Icon size={12} strokeWidth={active ? 2 : 1.5} />
            </span>
          );
        })}
        <span style={styles.bpLabel}>{BREAKPOINTS[breakpointId].label}</span>
      </div>

      <div style={styles.scrollBody}>
        {/* Responsive Package (Behavior) */}
        <SectionHeader title="Responsive" />
        <div style={styles.behaviorRow}>
          {allowedBehaviors.map((bKey) => {
            const b = RESPONSIVE_BEHAVIORS[bKey];
            if (!b) return null;
            const active = bKey === currentBehavior;
            return (
              <button
                key={bKey}
                onClick={() => onChangeBehavior && onChangeBehavior(bKey)}
                style={{
                  ...styles.behaviorBtn,
                  backgroundColor: active ? tokens.accent : tokens.inputBg,
                  color: active ? '#fff' : tokens.text2,
                  borderColor: active ? tokens.accent : tokens.controlBorder,
                }}
              >
                {b.label}
              </button>
            );
          })}
        </div>
        {beh && (
          <div style={styles.behaviorInfo}>
            <span>W: {beh.widthUnit.toUpperCase()}</span>
            <span style={{ margin: '0 6px', opacity: 0.3 }}>|</span>
            <span>H: {beh.heightUnit.toUpperCase()}</span>
          </div>
        )}

        <SectionHeader title="Position" />
        <div style={styles.propRow}>
          <PropInput label="X" prop={effectiveProps.x} onChange={(v) => onUpdateProp('x', v)} />
          <PropInput label="Y" prop={effectiveProps.y} onChange={(v) => onUpdateProp('y', v)} />
        </div>
        {onUpdateDocking && (
          <DockingToggle
            xUnit={effectiveProps.x?.unit || 'px'}
            yUnit={effectiveProps.y?.unit || 'px'}
            onToggle={(mode) => onUpdateDocking(element.id, mode)}
          />
        )}

        <SectionHeader title="Size" />
        <div style={styles.propRow}>
          <PropInput label="W" prop={effectiveProps.width} onChange={(v) => onUpdateProp('width', v)} />
          <PropInput label="H" prop={effectiveProps.height} onChange={(v) => onUpdateProp('height', v)} />
        </div>

        {/* Component-specific properties */}
        {onUpdateElementProps && (
          <ComponentProps
            element={element}
            onUpdate={onUpdateElementProps}
          />
        )}

        {/* Advanced toggle for manual unit control */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={styles.advancedToggle}
        >
          {showAdvanced ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span>Advanced</span>
        </button>

        {showAdvanced && (
          <>
            <SectionHeader title="Padding" />
            <div style={styles.propRow}>
              <PropInput label="T" prop={effectiveProps.paddingTop} onChange={(v) => onUpdateProp('paddingTop', v)} />
              <PropInput label="R" prop={effectiveProps.paddingRight} onChange={(v) => onUpdateProp('paddingRight', v)} />
            </div>
            <div style={styles.propRow}>
              <PropInput label="B" prop={effectiveProps.paddingBottom} onChange={(v) => onUpdateProp('paddingBottom', v)} />
              <PropInput label="L" prop={effectiveProps.paddingLeft} onChange={(v) => onUpdateProp('paddingLeft', v)} />
            </div>

            <SectionHeader title="Margin" />
            <div style={styles.propRow}>
              <PropInput label="T" prop={effectiveProps.marginTop} onChange={(v) => onUpdateProp('marginTop', v)} />
              <PropInput label="R" prop={effectiveProps.marginRight} onChange={(v) => onUpdateProp('marginRight', v)} />
            </div>
            <div style={styles.propRow}>
              <PropInput label="B" prop={effectiveProps.marginBottom} onChange={(v) => onUpdateProp('marginBottom', v)} />
              <PropInput label="L" prop={effectiveProps.marginLeft} onChange={(v) => onUpdateProp('marginLeft', v)} />
            </div>
          </>
        )}

        <div style={{ marginTop: 16, padding: '0 12px' }}>
          <button onClick={onRemoveElement} style={styles.removeBtn}>
            <Trash2 size={14} strokeWidth={1.5} />
            Remove Element
          </button>
        </div>
      </div>
      </>)}
      </div>
    </div>
  );
}

function DockingToggle({ xUnit, yUnit, onToggle }) {
  const isDocked = xUnit === 'px' && yUnit === 'px';
  const isFloat = xUnit === 'spx' && yUnit === 'spx';
  const mode = isDocked ? 'dock' : isFloat ? 'float' : 'mixed';

  return (
    <div style={styles.dockingRow}>
      <button
        onClick={() => onToggle('float')}
        style={{
          ...styles.dockBtn,
          backgroundColor: mode === 'float' ? tokens.accentSoft : tokens.inputBg,
          color: mode === 'float' ? tokens.accent : tokens.text3,
          borderColor: mode === 'float' ? tokens.accent : tokens.controlBorder,
        }}
        title="Float — position scales proportionally (spx)"
      >
        <Move size={11} strokeWidth={2} />
        <span>Float</span>
      </button>
      <button
        onClick={() => onToggle('dock')}
        style={{
          ...styles.dockBtn,
          backgroundColor: mode === 'dock' ? tokens.accentSoft : tokens.inputBg,
          color: mode === 'dock' ? tokens.accent : tokens.text3,
          borderColor: mode === 'dock' ? tokens.accent : tokens.controlBorder,
        }}
        title="Dock — position is fixed in px"
      >
        <Anchor size={11} strokeWidth={2} />
        <span>Dock</span>
      </button>
    </div>
  );
}

function SectionHeader({ title }) {
  return <div style={styles.sectionHeader}>{title}</div>;
}

function PropInput({ label, prop, onChange }) {
  const value = prop?.value ?? 0;
  const unit = prop?.unit ?? 'px';

  const handleValueChange = useCallback(
    (e) => {
      const num = parseFloat(e.target.value);
      if (!isNaN(num)) onChange({ value: num, unit });
    },
    [unit, onChange]
  );

  const handleUnitChange = useCallback(
    (e) => {
      const newUnit = e.target.value;
      if (newUnit === 'auto') onChange({ value: 0, unit: 'auto' });
      else onChange({ value, unit: newUnit });
    },
    [value, onChange]
  );

  const isAuto = unit === 'auto';

  return (
    <div style={styles.propInputWrap}>
      <span style={styles.propLabel}>{label}</span>
      <input
        type="number"
        value={isAuto ? '' : Math.round(value * 100) / 100}
        onChange={handleValueChange}
        disabled={isAuto}
        style={{ ...styles.propValue, opacity: isAuto ? 0.4 : 1 }}
      />
      <select value={unit} onChange={handleUnitChange} style={styles.propUnit}>
        {UNITS.map((u) => (
          <option key={u} value={u}>{UNIT_LABELS[u]}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Component-specific property editors ────────────────────────────────

const FONT_OPTIONS = ['Inter', 'Georgia', 'Arial', 'Times New Roman', 'Courier New', 'Helvetica', 'Verdana', 'Trebuchet MS'];
const WEIGHT_OPTIONS = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];
const ALIGN_OPTIONS = [
  { value: 'left', Icon: AlignLeft },
  { value: 'center', Icon: AlignCenter },
  { value: 'right', Icon: AlignRight },
  { value: 'justify', Icon: AlignJustify },
];
const OBJECT_FIT_OPTIONS = ['cover', 'contain', 'fill', 'none'];
const OBJECT_POS_OPTIONS = ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right'];

function ComponentProps({ element, onUpdate }) {
  const p = element.props || {};
  const cid = element.componentId;
  const isText = cid === 'title' || cid === 'paragraph' || cid === 'text';
  const isButton = cid === 'button';
  const isImage = cid === 'image';
  const isContainer = cid === 'container';
  const isShape = cid === 'shape';
  const isLine = cid === 'line';
  const isVideo = cid === 'video';
  const isMenu = cid === 'menu';
  const isGallery = cid === 'gallery';

  return (
    <>
      {/* ── Text properties (title, paragraph, text) ── */}
      {isText && (
        <TextProps p={p} onUpdate={onUpdate} />
      )}

      {/* ── Button properties ── */}
      {isButton && (
        <ButtonProps p={p} onUpdate={onUpdate} />
      )}

      {/* ── Image properties ── */}
      {isImage && (
        <ImageProps p={p} onUpdate={onUpdate} />
      )}

      {/* ── Container / Shape ── */}
      {(isContainer || isShape) && (
        <BoxProps p={p} onUpdate={onUpdate} label={isShape ? 'Shape' : 'Container'} />
      )}

      {/* ── Line ── */}
      {isLine && (
        <LineProps p={p} onUpdate={onUpdate} />
      )}

      {/* ── Video ── */}
      {isVideo && (
        <VideoProps p={p} onUpdate={onUpdate} />
      )}

      {/* ── Menu ── */}
      {isMenu && (
        <MenuProps p={p} onUpdate={onUpdate} />
      )}

      {/* ── Gallery ── */}
      {isGallery && (
        <GalleryProps p={p} onUpdate={onUpdate} />
      )}
    </>
  );
}

// ── Reusable inline prop controls ──

function InlineNumber({ label, value, onChange, min, max, step = 1, unit }) {
  return (
    <div style={cpStyles.inlineField}>
      <span style={cpStyles.fieldLabel}>{label}</span>
      <input
        type="number"
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
        style={cpStyles.numberInput}
      />
      {unit && <span style={cpStyles.unitLabel}>{unit}</span>}
    </div>
  );
}

function InlineSelect({ label, value, options, onChange }) {
  return (
    <div style={cpStyles.inlineField}>
      <span style={cpStyles.fieldLabel}>{label}</span>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} style={cpStyles.selectInput}>
        {options.map((o) => {
          const val = typeof o === 'string' ? o : o.value;
          const lbl = typeof o === 'string' ? o : o.label;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
    </div>
  );
}

function InlineColor({ label, value, onChange }) {
  return (
    <div style={cpStyles.inlineField}>
      <span style={cpStyles.fieldLabel}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          style={cpStyles.colorSwatch}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={cpStyles.colorText}
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function InlineText({ label, value, onChange, placeholder }) {
  return (
    <div style={cpStyles.inlineField}>
      <span style={cpStyles.fieldLabel}>{label}</span>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={cpStyles.textInput}
      />
    </div>
  );
}

function AlignPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2, padding: '4px 12px' }}>
      {ALIGN_OPTIONS.map(({ value: v, Icon }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            ...cpStyles.iconBtn,
            backgroundColor: value === v ? tokens.accentSoft : 'transparent',
            color: value === v ? tokens.accent : tokens.text3,
          }}
        >
          <Icon size={13} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}

function FontSizeWithUnit({ fontSize, fontSizeUnit, onUpdate }) {
  const unit = fontSizeUnit || 'px';
  return (
    <div style={cpStyles.inlineField}>
      <span style={cpStyles.fieldLabel}>Size</span>
      <input
        type="number"
        value={fontSize ?? ''}
        min={1}
        step={1}
        onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) onUpdate('fontSize', v); }}
        style={cpStyles.numberInput}
      />
      <select
        value={unit}
        onChange={(e) => onUpdate('fontSizeUnit', e.target.value)}
        style={{ ...cpStyles.unitLabel, cursor: 'pointer', border: 'none', background: 'transparent', color: tokens.accent, fontWeight: 600, fontSize: 10, outline: 'none' }}
      >
        <option value="px">px</option>
        <option value="spx">spx</option>
      </select>
    </div>
  );
}

// ── Text Props ──

function TextProps({ p, onUpdate }) {
  return (
    <>
      <SectionHeader title="Typography" />
      <InlineText label="Text" value={p.text} onChange={(v) => onUpdate('text', v)} placeholder="Enter text..." />
      <InlineSelect label="Font" value={p.fontFamily} options={FONT_OPTIONS} onChange={(v) => onUpdate('fontFamily', v)} />
      <div style={cpStyles.row}>
        <FontSizeWithUnit fontSize={p.fontSize} fontSizeUnit={p.fontSizeUnit} onUpdate={onUpdate} />
      </div>
      <div style={cpStyles.row}>
        <InlineSelect label="Weight" value={p.fontWeight} options={WEIGHT_OPTIONS} onChange={(v) => onUpdate('fontWeight', v)} />
      </div>
      <div style={cpStyles.row}>
        <InlineNumber label="Line H" value={parseFloat(p.lineHeight) || undefined} onChange={(v) => onUpdate('lineHeight', String(v))} min={0.5} max={4} step={0.05} />
        <InlineNumber label="Letter" value={parseFloat(p.letterSpacing) || 0} onChange={(v) => onUpdate('letterSpacing', v + 'em')} min={-0.1} max={0.5} step={0.01} unit="em" />
      </div>
      <InlineColor label="Color" value={p.color} onChange={(v) => onUpdate('color', v)} />
      <AlignPicker value={p.textAlign} onChange={(v) => onUpdate('textAlign', v)} />
    </>
  );
}

// ── Button Props ──

function ButtonProps({ p, onUpdate }) {
  return (
    <>
      <SectionHeader title="Button" />
      <InlineText label="Label" value={p.label} onChange={(v) => onUpdate('label', v)} placeholder="Button text" />
      <div style={cpStyles.row}>
        <InlineSelect label="Style" value={p.variant} options={[{ value: 'primary', label: 'Primary' }, { value: 'secondary', label: 'Secondary' }]} onChange={(v) => onUpdate('variant', v)} />
      </div>
      <div style={cpStyles.row}>
        <InlineNumber label="Radius" value={p.radius} onChange={(v) => onUpdate('radius', v)} min={0} max={100} />
        <InlineNumber label="Pad X" value={p.paddingX} onChange={(v) => onUpdate('paddingX', v)} min={0} max={100} />
      </div>
      <div style={cpStyles.row}>
        <InlineNumber label="Pad Y" value={p.paddingY} onChange={(v) => onUpdate('paddingY', v)} min={0} max={100} />
      </div>
      <SectionHeader title="Button Text" />
      <FontSizeWithUnit fontSize={p.fontSize || 13} fontSizeUnit={p.fontSizeUnit} onUpdate={onUpdate} />
      <InlineSelect label="Weight" value={p.fontWeight || '500'} options={WEIGHT_OPTIONS} onChange={(v) => onUpdate('fontWeight', v)} />
      <InlineColor label="Color" value={p.color} onChange={(v) => onUpdate('color', v)} />
      <InlineColor label="Bg" value={p.bgColor} onChange={(v) => onUpdate('bgColor', v)} />
    </>
  );
}

// ── Image Props ──

function ImageProps({ p, onUpdate }) {
  return (
    <>
      <ImagePicker currentSrc={p.src} onSelect={(src) => onUpdate('src', src)} />
      <SectionHeader title="Image Style" />
      <div style={cpStyles.row}>
        <InlineSelect label="Fit" value={p.objectFit || 'cover'} options={OBJECT_FIT_OPTIONS} onChange={(v) => onUpdate('objectFit', v)} />
      </div>
      <div style={cpStyles.row}>
        <InlineSelect label="Position" value={p.objectPosition || 'center'} options={OBJECT_POS_OPTIONS} onChange={(v) => onUpdate('objectPosition', v)} />
      </div>
      <div style={cpStyles.row}>
        <InlineNumber label="Radius" value={p.borderRadius ?? 8} onChange={(v) => onUpdate('borderRadius', v)} min={0} max={200} />
        <InlineNumber label="Opacity" value={p.opacity ?? 100} onChange={(v) => onUpdate('opacity', v)} min={0} max={100} unit="%" />
      </div>
    </>
  );
}

// ── Container / Shape Props ──

function BoxProps({ p, onUpdate, label }) {
  return (
    <>
      <SectionHeader title={label} />
      <InlineColor label="Fill" value={p.background} onChange={(v) => onUpdate('background', v)} />
      <InlineColor label="Border" value={p.borderColor} onChange={(v) => onUpdate('borderColor', v)} />
      <div style={cpStyles.row}>
        <InlineNumber label="Radius" value={p.borderRadius ?? 12} onChange={(v) => onUpdate('borderRadius', v)} min={0} max={200} />
        <InlineNumber label="Border W" value={p.borderWidth ?? 1} onChange={(v) => onUpdate('borderWidth', v)} min={0} max={20} />
      </div>
      <div style={cpStyles.row}>
        <InlineNumber label="Opacity" value={p.opacity ?? 100} onChange={(v) => onUpdate('opacity', v)} min={0} max={100} unit="%" />
      </div>
    </>
  );
}

// ── Line Props ──

function LineProps({ p, onUpdate }) {
  return (
    <>
      <SectionHeader title="Line" />
      <InlineColor label="Color" value={p.color} onChange={(v) => onUpdate('color', v)} />
      <div style={cpStyles.row}>
        <InlineNumber label="Thick" value={p.thickness ?? 2} onChange={(v) => onUpdate('thickness', v)} min={1} max={20} unit="px" />
      </div>
    </>
  );
}

// ── Video Props ──

function VideoProps({ p, onUpdate }) {
  return (
    <>
      <SectionHeader title="Video" />
      <InlineText label="URL" value={p.url} onChange={(v) => onUpdate('url', v)} placeholder="https://..." />
      <div style={cpStyles.row}>
        <InlineNumber label="Radius" value={p.borderRadius ?? 4} onChange={(v) => onUpdate('borderRadius', v)} min={0} max={100} />
      </div>
    </>
  );
}

// ── Menu Props ──

function MenuProps({ p, onUpdate }) {
  return (
    <>
      <SectionHeader title="Menu" />
      <InlineText label="Items" value={(p.items || ['Home', 'About', 'Services', 'Contact']).join(', ')} onChange={(v) => onUpdate('items', v.split(',').map(s => s.trim()).filter(Boolean))} placeholder="Home, About, ..." />
      <InlineColor label="Color" value={p.textColor} onChange={(v) => onUpdate('textColor', v)} />
      <InlineColor label="Bg" value={p.bgColor} onChange={(v) => onUpdate('bgColor', v)} />
    </>
  );
}

// ── Gallery Props ──

function GalleryProps({ p, onUpdate }) {
  return (
    <>
      <SectionHeader title="Gallery" />
      <div style={cpStyles.row}>
        <InlineNumber label="Cols" value={p.cols ?? 3} onChange={(v) => onUpdate('cols', v)} min={1} max={6} />
        <InlineNumber label="Gap" value={p.gap ?? 6} onChange={(v) => onUpdate('gap', v)} min={0} max={40} unit="px" />
      </div>
      <div style={cpStyles.row}>
        <InlineNumber label="Radius" value={p.borderRadius ?? 4} onChange={(v) => onUpdate('borderRadius', v)} min={0} max={100} />
      </div>
    </>
  );
}

const cpStyles = {
  row: {
    display: 'flex', gap: 6, padding: '2px 12px',
  },
  inlineField: {
    flex: 1, display: 'flex', alignItems: 'center', gap: 4,
    padding: '3px 12px',
  },
  fieldLabel: {
    fontSize: 10, fontWeight: 600, color: tokens.text3,
    width: 40, flexShrink: 0,
  },
  numberInput: {
    flex: 1, width: 40, minWidth: 0,
    border: `1px solid ${tokens.controlBorder}`,
    backgroundColor: tokens.inputBg,
    borderRadius: 4, padding: '3px 4px',
    fontSize: 12, color: tokens.text1, outline: 'none',
    textAlign: 'right', fontFamily: 'monospace',
  },
  selectInput: {
    flex: 1, minWidth: 0,
    border: `1px solid ${tokens.controlBorder}`,
    backgroundColor: tokens.inputBg,
    borderRadius: 4, padding: '3px 4px',
    fontSize: 11, color: tokens.text1, outline: 'none',
    cursor: 'pointer',
  },
  textInput: {
    flex: 1, minWidth: 0,
    border: `1px solid ${tokens.controlBorder}`,
    backgroundColor: tokens.inputBg,
    borderRadius: 4, padding: '3px 6px',
    fontSize: 11, color: tokens.text1, outline: 'none',
  },
  colorSwatch: {
    width: 20, height: 20, padding: 0,
    border: `1px solid ${tokens.controlBorder}`,
    borderRadius: 4, cursor: 'pointer',
    flexShrink: 0,
  },
  colorText: {
    flex: 1, minWidth: 0,
    border: `1px solid ${tokens.controlBorder}`,
    backgroundColor: tokens.inputBg,
    borderRadius: 4, padding: '3px 4px',
    fontSize: 10, color: tokens.text1, outline: 'none',
    fontFamily: 'monospace',
  },
  unitLabel: {
    fontSize: 10, color: tokens.text3, fontWeight: 600, flexShrink: 0,
  },
  iconBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: 26, border: 'none', borderRadius: 4, cursor: 'pointer',
    transition: `all 100ms ${tokens.easeOut}`,
  },
};

const ALL_IMAGES = [...STOCK_IMAGES, ...PLACEHOLDER_IMAGES];

function ImagePicker({ currentSrc, onSelect }) {
  return (
    <>
      <SectionHeader title="Image" />
      <div style={imgPickerStyles.grid}>
        {ALL_IMAGES.map((src, i) => {
          const active = currentSrc === src;
          return (
            <button
              key={i}
              onClick={() => onSelect(src)}
              style={{
                ...imgPickerStyles.thumb,
                outline: active ? `2px solid ${tokens.accent}` : '2px solid transparent',
                outlineOffset: -2,
              }}
            >
              <img
                src={src}
                alt=""
                draggable={false}
                style={imgPickerStyles.img}
              />
            </button>
          );
        })}
      </div>
    </>
  );
}

const imgPickerStyles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 4,
    padding: '4px 12px',
  },
  thumb: {
    position: 'relative',
    aspectRatio: '16 / 10',
    border: 'none',
    borderRadius: 6,
    overflow: 'hidden',
    cursor: 'pointer',
    padding: 0,
    background: tokens.inputBg,
    transition: `outline-color 150ms ${tokens.easeOut}`,
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    userSelect: 'none',
    pointerEvents: 'none',
  },
};

const styles = {
  toggleTab: {
    position: 'absolute', left: 0, top: 12,
    width: 28, height: 28, zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: `1px solid ${tokens.border}`, borderRight: 'none',
    borderRadius: '6px 0 0 6px',
    backgroundColor: tokens.glassStrong,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    cursor: 'pointer',
  },
  emptyState: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, textAlign: 'center',
  },
  panel: {
    minWidth: 0,
    backgroundColor: tokens.glassStrong,
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderLeft: `1px solid ${tokens.border}`,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    fontFamily: tokens.fontUI,
  },
  header: {
    padding: '12px 12px 8px',
    borderBottom: `1px solid ${tokens.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: { fontSize: 14, fontWeight: 600, color: tokens.text1 },
  id: { fontSize: 11, color: tokens.text3, marginTop: 2 },
  closeBtn: {
    width: 28, height: 28, borderRadius: tokens.radiusMd,
    border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  bpIndicator: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '8px 12px', borderBottom: `1px solid ${tokens.border}`,
  },
  bpDot: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 24, height: 20, borderRadius: tokens.radiusSm, fontSize: 11,
  },
  bpLabel: { fontSize: 12, color: tokens.text1, fontWeight: 500, marginLeft: 4 },
  scrollBody: { flex: 1, overflowY: 'auto', paddingBottom: 16 },
  sectionHeader: {
    fontSize: 10, fontWeight: 600, color: tokens.text3,
    textTransform: 'uppercase', letterSpacing: '0.1em', padding: '12px 12px 4px',
  },
  propRow: { display: 'flex', gap: 6, padding: '2px 12px' },
  propInputWrap: {
    flex: 1, display: 'flex', alignItems: 'center', gap: 2,
    backgroundColor: tokens.inputBg, borderRadius: tokens.radiusMd,
    padding: '3px 4px', border: `1px solid ${tokens.controlBorder}`,
  },
  propLabel: {
    fontSize: 10, fontWeight: 600, color: tokens.text3,
    width: 14, textAlign: 'center', flexShrink: 0,
  },
  propValue: {
    flex: 1, width: 40, minWidth: 0,
    border: 'none', background: 'transparent',
    fontSize: 12, color: tokens.text1, outline: 'none',
    textAlign: 'right', fontFamily: 'monospace',
  },
  propUnit: {
    border: 'none', background: 'transparent',
    fontSize: 10, color: tokens.accent, fontWeight: 600,
    cursor: 'pointer', outline: 'none', paddingRight: 2,
  },
  behaviorRow: {
    display: 'flex', flexWrap: 'wrap', gap: 4, padding: '4px 12px',
  },
  behaviorBtn: {
    padding: '4px 8px', fontSize: 10, fontWeight: 500,
    border: '1px solid', borderRadius: tokens.radiusMd,
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: `all ${tokens.durFast} ${tokens.easeOut}`,
  },
  behaviorInfo: {
    padding: '2px 12px', fontSize: 10, color: tokens.text3,
    fontFamily: 'monospace', display: 'flex', alignItems: 'center',
  },
  advancedToggle: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '8px 12px', margin: '4px 12px 0',
    border: 'none', background: 'none', cursor: 'pointer',
    fontSize: 11, fontWeight: 500, color: tokens.text3,
  },
  removeBtn: {
    width: '100%', padding: '8px 0',
    border: `1px solid ${tokens.dangerBg}`, borderRadius: tokens.radiusLg,
    backgroundColor: 'transparent', color: tokens.danger,
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    transition: `background-color ${tokens.durFast} ${tokens.easeOut}`,
  },
  parkedBadge: {
    fontSize: 9, fontWeight: 600, color: tokens.text3,
    backgroundColor: tokens.inputBg,
    padding: '1px 6px', borderRadius: tokens.radiusFull,
    letterSpacing: '0.04em', textTransform: 'uppercase',
  },
  moveToStageBtn: {
    width: 'calc(100% - 24px)', margin: '0 12px', padding: '7px 0',
    border: `1px solid ${tokens.accent}`, borderRadius: tokens.radiusMd,
    backgroundColor: tokens.accentSoft, color: tokens.accent,
    fontSize: 11, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    transition: `background-color ${tokens.durFast} ${tokens.easeOut}`,
  },
  moveToParkingBtn: {
    width: 'calc(100% - 24px)', margin: '0 12px', padding: '7px 0',
    border: `1px solid ${tokens.controlBorder}`, borderRadius: tokens.radiusMd,
    backgroundColor: tokens.inputBg, color: tokens.text2,
    fontSize: 11, fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    transition: `background-color ${tokens.durFast} ${tokens.easeOut}`,
  },
  dockingRow: {
    display: 'flex', gap: 4, padding: '4px 12px',
  },
  dockBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    padding: '5px 8px', fontSize: 10, fontWeight: 600,
    border: '1px solid', borderRadius: tokens.radiusMd,
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: `all ${tokens.durFast} ${tokens.easeOut}`,
  },
};
