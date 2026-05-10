import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { PreviewRegistry } from '../previews/PreviewRegistry.jsx';
import { resolveElementProps, BREAKPOINTS, RESPONSIVE_BEHAVIORS } from '../engine/responsiveUnits.js';
import { tokens } from './designTokens.js';
import { buildSnapTargets, snapPosition, snapResize } from '../engine/snapEngine.js';
import { layoutMesh } from '../engine/meshLayout.js';
import { GridlineOverlay } from './GridlineOverlay.jsx';

const PL_GAP = 16;
const PL_MIN_HEIGHT = 200;

export function CanvasArea({
  canvasHeight,
  elements,
  sections,
  selectedElementId,
  onSelectElement,
  onMoveElement,
  onResizeElement,
  onDropComponent,
  onUnparkElement,
  onAddSection,
  onRemoveSection,
  breakpointId,
  referenceWidth,
  isGenerating,
  uniqueId,
  onOpenInspiration,
  previewMode,
  meshMode = true,
  showGridlines = false,
  isHighestBreakpoint = true,
  children,
}) {
  const bp = BREAKPOINTS[breakpointId] || BREAKPOINTS.desktop;
  const frameWidth = bp.defaultWidth;
  const canvasRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const ctx = useMemo(() => ({
    canvasWidth: frameWidth, parentWidth: frameWidth, referenceWidth,
  }), [frameWidth, referenceWidth]);

  const [snapGuides, setSnapGuides] = useState({ x: null, y: null });

  const stageElements = elements.filter((el) => el.location !== 'parkingLot');
  const hasParkedLeft = elements.some((el) => el.location === 'parkingLot' && (el.parkingSide || 'left') === 'left');
  const hasParkedRight = elements.some((el) => el.location === 'parkingLot' && (el.parkingSide || 'left') === 'right');
  const hasStageElements = stageElements.length > 0 || isGenerating;

  const resolvedElements = useMemo(() => stageElements.map((el) => {
    const r = resolveElementProps(el, breakpointId, ctx);
    return {
      ...el,
      _resolvedX: r.x === 'auto' ? 0 : r.x,
      _resolvedY: r.y === 'auto' ? 0 : r.y,
      _resolvedW: r.width === 'auto' ? 280 : r.width,
      _resolvedH: r.height === 'auto' ? 200 : r.height,
    };
  }), [stageElements, breakpointId, ctx]);

  const clearGuides = useCallback(() => setSnapGuides({ x: null, y: null }), []);

  // --- Drop from Add Elements panel ---
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    try {
      const parsed = JSON.parse(data);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let dropSectionId = sections?.[0]?.id;
      if (sections && sections.length > 0) {
        let yAcc = 0;
        for (const sec of sections) {
          const secH = sec.height || 200;
          if (y >= yAcc && y < yAcc + secH + 30) {
            dropSectionId = sec.id;
            break;
          }
          yAcc += secH + 30;
        }
      }
      onDropComponent(parsed.componentId, parsed.componentName, x, y, parsed.defaultW, parsed.defaultH, dropSectionId);
    } catch (_) {}
  }, [onDropComponent, sections]);

  const handleCanvasClick = useCallback((e) => {
    if (e.target === e.currentTarget || e.target.dataset?.canvasBg) {
      onSelectElement(null);
    }
  }, [onSelectElement]);

  // Elements are only parked via explicit actions (Inspector buttons).
  // Dragging near the edge just moves the element — no auto-park.

  return (
    <div style={styles.root}>
      <div style={{
        ...styles.scrollArea,
        ...(previewMode ? { background: '#FFFFFF', padding: 0, justifyContent: 'center' } : {}),
      }}>
        <div style={styles.stageRow}>

          {/* Left Parking Lot — only on highest breakpoint */}
          {!previewMode && isHighestBreakpoint && hasParkedLeft && (
            <ParkingLotZone
              side="left"
              elements={elements}
              selectedElementId={selectedElementId}
              onSelectElement={onSelectElement}
              onMoveElement={onMoveElement}
              onResizeElement={onResizeElement}
              onUnparkElement={onUnparkElement}
              breakpointId={breakpointId}
              ctx={ctx}
              frameHeight={canvasHeight}
            />
          )}

          {/* Main Canvas */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {!previewMode && (
              <div style={styles.bpLabel}>
                {bp.label}
                <span style={{ fontWeight: 400, opacity: 0.6, marginLeft: 6 }}>{frameWidth}px</span>
              </div>
            )}

            <div
              ref={canvasRef}
              style={{
                ...styles.canvas,
                width: frameWidth,
                minHeight: canvasHeight,
                outline: !previewMode && dragOver ? `2px dashed ${tokens.accent}` : 'none',
                outlineOffset: -2,
                boxShadow: previewMode ? 'none' : styles.canvas.boxShadow,
                borderRadius: previewMode ? 0 : styles.canvas.borderRadius,
              }}
              onDragOver={previewMode ? undefined : handleDragOver}
              onDragLeave={previewMode ? undefined : handleDragLeave}
              onDrop={previewMode ? undefined : handleDrop}
              onClick={previewMode ? undefined : handleCanvasClick}
            >
              {!hasStageElements && !previewMode && (
                <EmptyState onOpenInspiration={onOpenInspiration} />
              )}
              {isGenerating && <LoadingState uniqueId={uniqueId} />}

              {/* Render sections */}
              {(sections && sections.length > 0) ? sections.map((sec, secIdx) => {
                const sectionEls = stageElements.filter((el) => el.sectionId === sec.id);
                const secHeight = sec.height || 200;
                const sectionCtx = { ...ctx, parentHeight: secHeight };
                const meshPositions = meshMode
                  ? layoutMesh(sectionEls, breakpointId, sectionCtx, true)
                  : null;
                const meshMap = meshPositions
                  ? new Map(meshPositions.map(p => [p.id, p]))
                  : null;
                return (
                  <React.Fragment key={sec.id}>
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      minHeight: secHeight,
                      borderBottom: previewMode ? 'none' : `1px dashed ${tokens.controlBorder}`,
                    }}>
                      {!previewMode && (
                        <div style={styles.sectionLabel}>{sec.label || `Section ${secIdx + 1}`}</div>
                      )}
                      {sectionEls.map((el) => (
                        <StageElement
                          key={el.id}
                          element={el}
                          isSelected={!previewMode && selectedElementId === el.id}
                          onSelect={previewMode ? undefined : () => onSelectElement(el.id)}
                          onMove={previewMode ? undefined : (dx, dy) => onMoveElement(el.id, dx, dy)}
                          onResize={previewMode ? undefined : (dw, dh, dx, dy) => onResizeElement(el.id, dw, dh, dx, dy)}
                          breakpointId={breakpointId}
                          ctx={sectionCtx}
                          frameWidth={frameWidth}
                          frameHeight={secHeight}
                          previewMode={previewMode}
                          resolvedElements={resolvedElements}
                          onSnapGuides={setSnapGuides}
                          onClearGuides={clearGuides}
                          meshOverride={meshMap ? meshMap.get(el.id) : null}
                        />
                      ))}
                      {!previewMode && showGridlines && meshMode && meshPositions && meshPositions.length > 0 && (
                        <GridlineOverlay
                          positions={meshPositions}
                          sectionHeight={secHeight}
                          sectionWidth={frameWidth}
                          elements={sectionEls}
                        />
                      )}
                      {!previewMode && sectionEls.length === 0 && (
                        <div style={styles.sectionEmpty}>Drop elements here</div>
                      )}
                    </div>
                    {!previewMode && onAddSection && (
                      <button
                        onClick={() => onAddSection(sec.id)}
                        style={styles.addSectionBtn}
                      >
                        + Add Section
                      </button>
                    )}
                  </React.Fragment>
                );
              }) : (
                /* Fallback: flat rendering for elements without sections */
                stageElements.map((el) => (
                  <StageElement
                    key={el.id}
                    element={el}
                    isSelected={!previewMode && selectedElementId === el.id}
                    onSelect={previewMode ? undefined : () => onSelectElement(el.id)}
                    onMove={previewMode ? undefined : (dx, dy) => onMoveElement(el.id, dx, dy)}
                    onResize={previewMode ? undefined : (dw, dh, dx, dy) => onResizeElement(el.id, dw, dh, dx, dy)}
                    breakpointId={breakpointId}
                    ctx={ctx}
                    frameWidth={frameWidth}
                    frameHeight={canvasHeight}
                    previewMode={previewMode}
                    resolvedElements={resolvedElements}
                    onSnapGuides={setSnapGuides}
                    onClearGuides={clearGuides}
                  />
                ))
              )}

              {/* Snap Guide Lines */}
              {snapGuides.x !== null && (
                <div style={{
                  position: 'absolute', left: snapGuides.x, top: 0,
                  width: 1, height: '100%',
                  backgroundColor: tokens.accent,
                  pointerEvents: 'none', zIndex: 9998,
                  opacity: 0.7,
                }} />
              )}
              {snapGuides.y !== null && (
                <div style={{
                  position: 'absolute', top: snapGuides.y, left: 0,
                  height: 1, width: '100%',
                  backgroundColor: tokens.accent,
                  pointerEvents: 'none', zIndex: 9998,
                  opacity: 0.7,
                }} />
              )}
            </div>
          </div>

          {/* Right Parking Lot — only on highest breakpoint */}
          {!previewMode && isHighestBreakpoint && hasParkedRight && (
            <ParkingLotZone
              side="right"
              elements={elements}
              selectedElementId={selectedElementId}
              onSelectElement={onSelectElement}
              onMoveElement={onMoveElement}
              onResizeElement={onResizeElement}
              onUnparkElement={onUnparkElement}
              breakpointId={breakpointId}
              ctx={ctx}
              frameHeight={canvasHeight}
            />
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

// ═══════════════════════════════════════════
// PARKING LOT ZONE
// ═══════════════════════════════════════════
function ParkingLotZone({
  side, elements, selectedElementId, onSelectElement,
  onMoveElement, onResizeElement, onUnparkElement,
  breakpointId, ctx, frameHeight,
}) {
  const parkedElements = elements.filter((el) => el.location === 'parkingLot');
  const sideElements = parkedElements.filter((el) => (el.parkingSide || 'left') === side);
  if (sideElements.length === 0) return null;

  const plWidth = ctx.canvasWidth;
  const maxBottom = sideElements.reduce((acc, el) => {
    const r = resolveElementProps(el, breakpointId, ctx);
    const eY = r.y === 'auto' ? 0 : r.y;
    const eH = r.height === 'auto' ? 200 : r.height;
    return Math.max(acc, eY + eH + 24);
  }, PL_MIN_HEIGHT);
  const plHeight = Math.max(frameHeight, maxBottom);

  return (
    <div style={{
      width: plWidth,
      height: plHeight,
      position: 'relative',
      backgroundColor: 'rgba(245, 245, 248, 0.6)',
      borderRadius: tokens.radiusLg,
      border: `1px dashed ${tokens.controlBorder}`,
      flexShrink: 0,
      overflow: 'visible',
    }}>
      <div style={styles.plLabel}>
        <span>Parking Lot</span>
      </div>
      {sideElements.map((el) => (
        <StageElement
          key={el.id}
          element={el}
          isSelected={selectedElementId === el.id}
          onSelect={() => onSelectElement(el.id)}
          onMove={(dx, dy) => onMoveElement(el.id, dx, dy)}
          onResize={(dw, dh, dx, dy) => onResizeElement(el.id, dw, dh, dx, dy)}
          breakpointId={breakpointId}
          ctx={ctx}
          frameWidth={plWidth}
          frameHeight={plHeight}
          isInParkingLot={true}
          onUnpark={onUnparkElement ? () => onUnparkElement(el.id) : undefined}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// STAGE ELEMENT
// ═══════════════════════════════════════════
function StageElement({ element, isSelected, onSelect, onMove, onResize, breakpointId, ctx, frameWidth, frameHeight, isInParkingLot, onUnpark, previewMode, resolvedElements, onSnapGuides, onClearGuides, meshOverride }) {
  const resolved = resolveElementProps(element, breakpointId, ctx);
  const dragRef = useRef(null);
  const contentRef = useRef(null);
  const [interacting, setInteracting] = useState(false);
  const [renderedHeight, setRenderedHeight] = useState(null);

  const rawX = resolved.x === 'auto' ? 0 : resolved.x;
  const rawY = resolved.y === 'auto' ? 0 : resolved.y;
  const rawW = resolved.width === 'auto' ? 280 : resolved.width;
  const rawH = resolved.height === 'auto' ? 200 : resolved.height;

  const x = meshOverride ? meshOverride.x : rawX;
  const y = meshOverride ? meshOverride.y : rawY;
  const w = meshOverride ? meshOverride.w : rawW;
  const h = meshOverride ? meshOverride.h : rawH;

  const isParked = isInParkingLot || element.location === 'parkingLot';

  const beh = element.behavior && RESPONSIVE_BEHAVIORS[element.behavior];
  const isWrap = element.behavior === 'wrap';
  const isTextElement = ['title', 'paragraph', 'text'].includes(element.componentId);
  const autoHeight = (beh && beh.heightUnit === 'auto') || isTextElement;
  const fontScale = (!isWrap && beh && (beh.widthUnit === 'spx' || beh.heightUnit === 'spx') && ctx.referenceWidth)
    ? ctx.canvasWidth / ctx.referenceWidth
    : 1;

  useEffect(() => {
    if (!autoHeight || !contentRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setRenderedHeight(entry.contentRect.height);
      }
    });
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [autoHeight]);

  const actualH = autoHeight && renderedHeight ? renderedHeight : h;
  const geomRef = useRef({ x, y, w, h: actualH });
  geomRef.current = { x, y, w, h: actualH };

  const handleMouseDown = useCallback((e) => {
    if (!onMove) return;
    if (e.target.closest?.('[data-resize-handle]')) return;
    e.stopPropagation();
    if (onSelect) onSelect();
    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;
    let snapDx = 0, snapDy = 0;
    setInteracting(true);
    const { x: ox, y: oy, w: ow, h: oh } = geomRef.current;
    const targets = resolvedElements ? buildSnapTargets(frameWidth, frameHeight, resolvedElements, element.id) : null;
    const move = (ev) => {
      moved = true;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const proposedX = ox + dx;
      const proposedY = oy + dy;
      if (targets && onSnapGuides) {
        const snap = snapPosition(proposedX, proposedY, ow, oh, targets);
        snapDx = snap.x - proposedX;
        snapDy = snap.y - proposedY;
        onSnapGuides(snap.guides);
        if (dragRef.current) dragRef.current.style.transform = `translate(${snap.x}px, ${snap.y}px)`;
      } else {
        snapDx = 0; snapDy = 0;
        if (dragRef.current) dragRef.current.style.transform = `translate(${proposedX}px, ${proposedY}px)`;
      }
    };
    const up = (ev) => {
      setInteracting(false);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      if (onClearGuides) onClearGuides();
      if (!moved) return;
      const dx = ev.clientX - startX + snapDx;
      const dy = ev.clientY - startY + snapDy;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) onMove(dx, dy);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, [onSelect, onMove, resolvedElements, frameWidth, frameHeight, element.id, onSnapGuides, onClearGuides]);

  const makeResizeHandler = useCallback((edges) => (e) => {
    if (!onResize) return;
    e.stopPropagation();
    e.preventDefault();
    if (onSelect) onSelect();
    const startMX = e.clientX;
    const startMY = e.clientY;
    const { left, right, top, bottom } = edges;
    const { x: ox, y: oy, w: ow, h: oh } = geomRef.current;
    setInteracting(true);
    const targets = resolvedElements ? buildSnapTargets(frameWidth, frameHeight, resolvedElements, element.id) : null;

    const handle = `${top ? 'n' : ''}${bottom ? 's' : ''}${left ? 'w' : ''}${right ? 'e' : ''}`;
    let lastSnap = null;

    const calc = (ev) => {
      const rawDx = ev.clientX - startMX;
      const rawDy = ev.clientY - startMY;
      let dw = 0, dh = 0;
      if (right) dw = rawDx;
      if (left) dw = -rawDx;
      if (bottom) dh = rawDy;
      if (top) dh = -rawDy;
      let newW = Math.max(60, ow + dw);
      let newH = Math.max(40, oh + dh);
      let posX = left ? ox + (ow - newW) : ox;
      let posY = top ? oy + (oh - newH) : oy;

      if (targets && onSnapGuides) {
        const snap = snapResize(handle, posX, posY, newW, newH, targets);
        lastSnap = snap;
        onSnapGuides(snap.guides);
        return { newW: snap.w, newH: snap.h, posX: snap.x, posY: snap.y };
      }
      return { newW, newH, posX, posY };
    };
    const move = (ev) => {
      const { newW, newH, posX, posY } = calc(ev);
      if (dragRef.current) {
        dragRef.current.style.width = `${newW}px`;
        if (!autoHeight) dragRef.current.style.height = `${newH}px`;
        dragRef.current.style.transform = `translate(${posX}px, ${posY}px)`;
      }
    };
    const up = (ev) => {
      setInteracting(false);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      if (onClearGuides) onClearGuides();
      const { newW, newH, posX, posY } = calc(ev);
      onResize(newW - ow, autoHeight ? 0 : newH - oh, posX - ox, autoHeight ? 0 : posY - oy);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, [onSelect, onResize, resolvedElements, frameWidth, frameHeight, element.id, onSnapGuides, onClearGuides, autoHeight]);

  return (
    <div
      ref={dragRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: 0, top: 0,
        transform: `translate(${x}px, ${y}px)`,
        width: w,
        height: autoHeight ? 'auto' : h,
        zIndex: isSelected ? 999 : (element.zIndex || 1),
        cursor: previewMode ? 'default' : interacting ? 'grabbing' : 'grab',
        boxShadow: previewMode ? 'none' : isSelected ? `0 0 0 2px ${tokens.accent}, ${tokens.shadowRest}` : isTextElement ? 'none' : tokens.shadowSubtle,
        borderRadius: previewMode ? 0 : tokens.radiusSm,
        overflow: 'visible',
        backgroundColor: previewMode || isTextElement ? 'transparent' : '#FFFFFF',
        transition: interacting ? 'none' : `box-shadow ${tokens.durMedium} ${tokens.easeOut}`,
        userSelect: 'none',
        pointerEvents: previewMode ? 'none' : 'auto',
      }}
    >
      <div ref={contentRef} style={{ pointerEvents: 'none', width: '100%', height: autoHeight ? 'auto' : '100%', overflow: autoHeight ? 'visible' : 'hidden', borderRadius: tokens.radiusSm }}>
        <PreviewRegistry
          id={element.componentId}
          width={Math.round(w)}
          height={Math.round(h)}
          props={element.props}
          elementId={element.id}
          fontScale={fontScale}
        />
      </div>
      {!previewMode && <div style={{
        ...styles.nameTag,
        backgroundColor: isParked ? `${tokens.text3}dd` : `${tokens.accent}dd`,
      }}>{element.name}</div>}
      {isSelected && isParked && onUnpark && (
        <button
          onClick={(e) => { e.stopPropagation(); onUnpark(); }}
          style={styles.unparkBtn}
        >
          Move to Stage
        </button>
      )}
      {isSelected && (
        <>
          <div style={styles.unitBadgeX}>
            {formatProp(element, breakpointId, 'x')} , {formatProp(element, breakpointId, 'y')}
          </div>
          <div style={styles.unitBadgeSize}>
            {formatProp(element, breakpointId, 'width')} x {autoHeight && renderedHeight ? `${Math.round(renderedHeight)}px` : formatProp(element, breakpointId, 'height')}
          </div>
          <div data-resize-handle="true" onMouseDown={makeResizeHandler({ right: true, bottom: true })} style={styles.cornerSE} />
          <div data-resize-handle="true" onMouseDown={makeResizeHandler({ right: true, top: true })} style={styles.cornerNE} />
          <div data-resize-handle="true" onMouseDown={makeResizeHandler({ left: true, bottom: true })} style={styles.cornerSW} />
          <div data-resize-handle="true" onMouseDown={makeResizeHandler({ left: true, top: true })} style={styles.cornerNW} />
          <div data-resize-handle="true" onMouseDown={makeResizeHandler({ top: true })} style={styles.edgeMidTop} />
          <div data-resize-handle="true" onMouseDown={makeResizeHandler({ bottom: true })} style={styles.edgeMidBottom} />
          <div data-resize-handle="true" onMouseDown={makeResizeHandler({ left: true })} style={styles.edgeMidLeft} />
          <div data-resize-handle="true" onMouseDown={makeResizeHandler({ right: true })} style={styles.edgeMidRight} />
        </>
      )}
    </div>
  );
}

function formatProp(element, breakpointId, key) {
  const cascade = breakpointId === 'mobile'
    ? ['mobile', 'tablet', 'desktop']
    : breakpointId === 'tablet'
    ? ['tablet', 'desktop']
    : ['desktop'];
  for (const bp of cascade) {
    const p = element.responsiveProps?.[bp]?.[key];
    if (p) return `${Math.round(p.value)}${p.unit}`;
  }
  return 'auto';
}

function EmptyState({ onOpenInspiration }) {
  return (
    <div style={styles.empty} data-canvas-bg="true">
      <div style={styles.emptyIcon}>
        <Sparkles size={32} color={tokens.text3} strokeWidth={1.5} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={styles.emptyTitle}>Your canvas is empty</p>
        <p style={styles.emptyDesc}>Drag components or click Browse</p>
      </div>
      <button onClick={onOpenInspiration} style={styles.browseBtn}>
        <Sparkles size={16} color="#FFFFFF" strokeWidth={1.5} />
        Browse
      </button>
    </div>
  );
}

function LoadingState({ uniqueId }) {
  return (
    <div style={styles.loading}>
      <div style={styles.loadingContent}>
        <div style={{
          width: 40, height: 40,
          border: `3px solid ${tokens.border}`,
          borderTopColor: tokens.accent,
          borderRadius: '50%',
          animation: `${uniqueId}-spin 1s linear infinite`,
        }} />
        <span style={{ fontSize: 14, color: tokens.text3 }}>Generating...</span>
      </div>
    </div>
  );
}

const handleBase = {
  position: 'absolute',
  border: '2px solid #FFFFFF',
  boxShadow: '0 0 0 1px rgba(59,130,246,0.3)',
  backgroundColor: tokens.accent,
  zIndex: 5,
};

const cornerHandle = { ...handleBase, width: 14, height: 14, borderRadius: 3 };
const edgeMidHandle = { ...handleBase, width: 12, height: 12, borderRadius: '50%' };

const styles = {
  root: {
    flex: 1, display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'hidden',
  },
  scrollArea: {
    flex: 1, overflow: 'auto',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    background: tokens.bgPageGradient,
    padding: '24px 24px 60px',
  },
  stageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: PL_GAP,
  },
  canvas: {
    position: 'relative',
    backgroundColor: tokens.canvasBg,
    borderRadius: tokens.radiusLg,
    boxShadow: `${tokens.shadowRest}, 0 0 0 1px ${tokens.border}`,
    flexShrink: 0,
    overflow: 'hidden',
  },
  bpLabel: {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
    color: tokens.text3,
    padding: '4px 10px', marginBottom: 8,
    borderRadius: tokens.radiusFull,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignSelf: 'flex-start',
  },

  // ── Parking Lot ──
  plLabel: {
    position: 'absolute', top: 8, left: 12,
    fontSize: 10, fontWeight: 600, color: tokens.text3,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    pointerEvents: 'none', opacity: 0.7,
  },
  unparkBtn: {
    position: 'absolute', top: -28, right: 0,
    padding: '4px 10px', fontSize: 10, fontWeight: 600,
    backgroundColor: tokens.accent, color: '#fff',
    border: 'none', borderRadius: tokens.radiusMd,
    cursor: 'pointer', whiteSpace: 'nowrap', zIndex: 10,
    boxShadow: tokens.shadowSubtle,
  },

  // ── Stage element ──
  nameTag: {
    position: 'absolute', top: 4, left: 4,
    fontSize: 10, fontWeight: 600, color: '#FFFFFF',
    backgroundColor: `${tokens.accent}dd`,
    padding: '2px 6px', borderRadius: tokens.radiusSm,
    pointerEvents: 'none', letterSpacing: '0.02em',
  },
  unitBadgeX: {
    position: 'absolute', bottom: -20, left: 0,
    fontSize: 10, color: tokens.accent,
    fontFamily: 'monospace', whiteSpace: 'nowrap', pointerEvents: 'none',
  },
  unitBadgeSize: {
    position: 'absolute', bottom: -20, right: 0,
    fontSize: 10, color: tokens.accent,
    fontFamily: 'monospace', whiteSpace: 'nowrap', pointerEvents: 'none',
  },
  cornerSE: { ...cornerHandle, right: -7, bottom: -7, cursor: 'nwse-resize' },
  cornerNE: { ...cornerHandle, right: -7, top: -7, cursor: 'nesw-resize' },
  cornerSW: { ...cornerHandle, left: -7, bottom: -7, cursor: 'nesw-resize' },
  cornerNW: { ...cornerHandle, left: -7, top: -7, cursor: 'nwse-resize' },
  edgeMidTop:    { ...edgeMidHandle, top: -6, left: '50%', marginLeft: -6, cursor: 'ns-resize' },
  edgeMidBottom: { ...edgeMidHandle, bottom: -6, left: '50%', marginLeft: -6, cursor: 'ns-resize' },
  edgeMidLeft:   { ...edgeMidHandle, left: -6, top: '50%', marginTop: -6, cursor: 'ew-resize' },
  edgeMidRight:  { ...edgeMidHandle, right: -6, top: '50%', marginTop: -6, cursor: 'ew-resize' },
  empty: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 16,
    backgroundColor: '#FAFAFA',
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 14, color: tokens.text1, margin: '0 0 4px 0', fontWeight: 500 },
  emptyDesc: { fontSize: 12, color: tokens.text3, margin: 0 },
  browseBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '10px 16px',
    backgroundColor: tokens.neutralDark,
    border: 'none', borderRadius: tokens.radiusXl,
    cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#FFFFFF',
  },
  loading: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingContent: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
  },
  sectionLabel: {
    position: 'absolute', top: 4, left: 8, zIndex: 10,
    fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
    color: tokens.text3, textTransform: 'uppercase',
    pointerEvents: 'none', opacity: 0.6,
  },
  sectionEmpty: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: 80, fontSize: 11, color: tokens.text3,
    pointerEvents: 'none',
  },
  addSectionBtn: {
    width: '100%', padding: '6px 0',
    border: 'none', background: 'transparent',
    cursor: 'pointer', fontSize: 11, fontWeight: 500,
    color: tokens.accent, textAlign: 'center',
    transition: `background-color 150ms ${tokens.easeOut}`,
  },
};
