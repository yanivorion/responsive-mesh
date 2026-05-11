import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { Sparkles, Monitor, Tablet, Smartphone, Plus, ChevronUp, ChevronDown, Globe } from 'lucide-react';
import { PreviewRegistry } from '../previews/PreviewRegistry.jsx';
import { resolveElementProps, BREAKPOINTS, RESPONSIVE_BEHAVIORS } from '../engine/responsiveUnits.js';
import { tokens } from './designTokens.js';
import { layoutMesh } from '../engine/meshLayout.js';
import { GridlineOverlay } from './GridlineOverlay.jsx';

const DOT_SPACING = 20;
const DOT_RADIUS = 0.6;
const DOT_COLOR = 'rgba(0,0,0,0.08)';
const BP_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
const FRAME_GAP = 48;

function useDotPattern() {
  return useMemo(() => ({
    backgroundImage: `radial-gradient(circle, ${DOT_COLOR} ${DOT_RADIUS}px, transparent ${DOT_RADIUS}px)`,
    backgroundSize: `${DOT_SPACING}px ${DOT_SPACING}px`,
    backgroundPosition: `${DOT_SPACING / 2}px ${DOT_SPACING / 2}px`,
  }), []);
}

const PL_MIN_HEIGHT = 200;

export function CanvasArea({
  canvasHeight,
  elements,
  sections,
  selectedElementId,
  selectedElementIds = new Set(),
  onSelectElement,
  onMoveElement,
  onMoveElementToSection,
  onResizeElement,
  onDropComponent,
  onParkElement,
  onUnparkElement,
  onDropToParkingLot,
  onAddSection,
  onRemoveSection,
  breakpointId,
  referenceWidth,
  isGenerating,
  uniqueId,
  zoom,
  onZoomChange,
  onOpenInspiration,
  focusedBp,
  activeBreakpoints,
  onFocus,
  onExitFocus,
  onAddBreakpoint,
  meshMode = true,
  showGridlines = false,
  isHighestBreakpoint = true,
  allBpMap,
  children,
}) {
  const containerRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef({ active: false, startX: 0, startY: 0, panXStart: 0, panYStart: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const dotPattern = useDotPattern();
  const scale = zoom / 100;

  // Reset pan when switching between overview/focus
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
  }, [focusedBp]);

  // --- Wheel: Cmd/Ctrl = zoom, plain = pan (Figma-style) ---
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const raw = -e.deltaY;
      const delta = Math.sign(raw) * Math.min(Math.abs(raw) * 0.3, 4);
      onZoomChange(Math.max(15, Math.min(200, zoom + delta)));
    } else {
      setPanOffset((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, [zoom, onZoomChange]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // --- Pan: spacebar + drag (secondary method) ---
  useEffect(() => {
    const down = (e) => {
      if (e.code === 'Space' && !e.repeat && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsPanning(true);
      }
    };
    const up = (e) => { if (e.code === 'Space') { setIsPanning(false); panRef.current.active = false; } };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const handlePanMouseDown = useCallback((e) => {
    if (!isPanning) return;
    e.preventDefault();
    panRef.current = { active: true, startX: e.clientX, startY: e.clientY, panXStart: panOffset.x, panYStart: panOffset.y };
  }, [isPanning, panOffset]);
  const handlePanMouseMove = useCallback((e) => {
    if (!panRef.current.active) return;
    setPanOffset({
      x: panRef.current.panXStart + (e.clientX - panRef.current.startX),
      y: panRef.current.panYStart + (e.clientY - panRef.current.startY),
    });
  }, []);
  const handlePanMouseUp = useCallback(() => { panRef.current.active = false; }, []);

  // Click outside frame in focus mode => exit
  const handleScrollAreaClick = useCallback((e) => {
    if (focusedBp && e.target === e.currentTarget) {
      onExitFocus();
    }
  }, [focusedBp, onExitFocus]);

  const hasElements = elements.length > 0;
  const showTabletAdd = !activeBreakpoints.includes('tablet');

  return (
    <div style={styles.root}>
      <div
        ref={containerRef}
        style={{
          ...styles.canvasViewport,
          ...dotPattern,
          cursor: isPanning ? (panRef.current.active ? 'grabbing' : 'grab') : 'default',
        }}
        onMouseDown={handlePanMouseDown}
        onMouseMove={handlePanMouseMove}
        onMouseUp={handlePanMouseUp}
        onMouseLeave={handlePanMouseUp}
        onClick={handleScrollAreaClick}
      >
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
            transformOrigin: 'top center',
            transition: panRef.current.active ? 'none' : `transform 200ms ${tokens.easeOut}`,
            display: 'flex',
            gap: FRAME_GAP,
            alignItems: 'flex-start',
            padding: '24px 60px 60px',
            willChange: 'transform',
          }}
        >
          {focusedBp ? (
            // ──────── FOCUS MODE ────────
            <FocusedFrame
              bpId={focusedBp}
              canvasHeight={canvasHeight}
              elements={elements}
              sections={sections}
              selectedElementId={selectedElementId}
              selectedElementIds={selectedElementIds}
              onSelectElement={onSelectElement}
              onMoveElement={onMoveElement}
              onMoveElementToSection={onMoveElementToSection}
              onResizeElement={onResizeElement}
              onDropComponent={onDropComponent}
              onParkElement={onParkElement}
              onUnparkElement={onUnparkElement}
              onDropToParkingLot={onDropToParkingLot}
              onAddSection={onAddSection}
              onRemoveSection={onRemoveSection}
              referenceWidth={referenceWidth}
              scale={scale}
              isPanning={isPanning}
              isGenerating={isGenerating}
              uniqueId={uniqueId}
              onOpenInspiration={onOpenInspiration}
              hasElements={hasElements}
              meshMode={meshMode}
              showGridlines={showGridlines}
              allBpMap={allBpMap}
              isHighestBreakpoint={isHighestBreakpoint}
            />
          ) : (
            // ──────── OVERVIEW MODE ────────
            <>
              {activeBreakpoints.map((bpId, idx) => {
                const bpMap = allBpMap || BREAKPOINTS;
                const bp = bpMap[bpId] || BREAKPOINTS[bpId];
                if (!bp) return null;
                const Icon = BP_ICONS[bpId] || Monitor;
                const w = bp.defaultWidth;

                return (
                  <React.Fragment key={bpId}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                      <div style={styles.overviewLabel}>
                        <Icon size={12} strokeWidth={2} color={tokens.text3} />
                        <span>{bp.label}</span>
                        <span style={{ fontWeight: 400, opacity: 0.6 }}>{w}px</span>
                      </div>

                      <div
                        onDoubleClick={() => onFocus(bpId)}
                        style={{ ...styles.overviewFrame, width: w, height: canvasHeight, cursor: 'pointer' }}
                      >
                        <div style={styles.canvasBody}>
                          {!hasElements && !isGenerating && bpId === 'desktop' && (
                            <EmptyState onOpenInspiration={onOpenInspiration} />
                          )}
                          {!hasElements && !isGenerating && bpId !== 'desktop' && (
                            <div style={styles.emptyMirror} data-canvas-bg="true">
                              <span style={{ fontSize: 12, color: tokens.text3 }}>
                                Double-click to edit
                              </span>
                            </div>
                          )}
                          {elements.filter((el) => el.location !== 'parkingLot').map((el) => (
                              <StageElement
                                key={el.id}
                                element={el}
                                isSelected={false}
                                breakpointId={bpId}
                                ctx={{ canvasWidth: w, parentWidth: w, referenceWidth }}
                                scale={scale}
                                isPanning={false}
                                isActive={false}
                                frameWidth={w}
                                frameHeight={canvasHeight}
                              />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Add Breakpoint button between desktop and mobile */}
                    {showTabletAdd && bpId === 'desktop' && idx < activeBreakpoints.length - 1 && (
                      <div style={styles.addBpWrap}>
                        <button onClick={onAddBreakpoint} style={styles.addBpBtn}>
                          <Plus size={14} strokeWidth={2} />
                          <span>Tablet</span>
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

// ═══════════════════════════════════════════
// FOCUSED FRAME (with edge handles)
// ═══════════════════════════════════════════
function FocusedFrame({
  bpId, canvasHeight, elements, sections, selectedElementId, selectedElementIds = new Set(),
  onSelectElement, onMoveElement, onMoveElementToSection, onResizeElement, onDropComponent,
  onParkElement, onUnparkElement, onDropToParkingLot,
  onAddSection, onRemoveSection,
  referenceWidth, scale, isPanning, isGenerating, uniqueId, onOpenInspiration, hasElements,
  meshMode = true, showGridlines = false, allBpMap, isHighestBreakpoint = true,
}) {
  const bpMap = allBpMap || BREAKPOINTS;
  const bp = bpMap[bpId] || BREAKPOINTS[bpId] || BREAKPOINTS.desktop;
  const Icon = BP_ICONS[bpId] || Monitor;
  const defaultWidth = bp.defaultWidth;
  const canvasRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragWidth, setDragWidth] = useState(null);
  const [springing, setSpringing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isElementDragging, setIsElementDragging] = useState(false);
  const frameRef = useRef(null);
  const [marquee, setMarquee] = useState(null);
  const [frameVisible, setFrameVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setFrameVisible(true)));
  }, []);

  const [hoveredSectionId, setHoveredSectionId] = useState(null);
  const dragSourceSectionId = useRef(null);

  useEffect(() => {
    const onElStart = (ev) => {
      setIsElementDragging(true);
      const el = elements.find(e => e.id === ev.detail.elementId);
      dragSourceSectionId.current = el?.sectionId || null;
    };
    const onElEnd = () => {
      setIsElementDragging(false);
      dragSourceSectionId.current = null;
      setHoveredSectionId(null);
    };
    document.addEventListener('element-drag-start', onElStart);
    document.addEventListener('element-drag-end', onElEnd);
    return () => {
      document.removeEventListener('element-drag-start', onElStart);
      document.removeEventListener('element-drag-end', onElEnd);
    };
  }, [elements]);

  useEffect(() => {
    if (!isElementDragging) return;
    const onMove = (ev) => {
      if (!canvasRef.current) return;
      const secs = canvasRef.current.querySelectorAll('[data-section-id]');
      let found = null;
      for (const sec of secs) {
        const r = sec.getBoundingClientRect();
        if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
          const secId = sec.getAttribute('data-section-id');
          if (secId !== dragSourceSectionId.current) {
            found = secId;
          }
          break;
        }
      }
      setHoveredSectionId(found);
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, [isElementDragging]);

  const frameWidth = dragWidth !== null ? dragWidth : defaultWidth;
  const ctx = useMemo(() => ({
    canvasWidth: frameWidth, parentWidth: frameWidth, referenceWidth,
  }), [frameWidth, referenceWidth]);

  // --- Drop ---
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
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
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
  }, [onDropComponent, scale, sections]);

  const handleCanvasClick = useCallback((e) => {
    if (marqueeDidDrag.current) { marqueeDidDrag.current = false; return; }
    if (e.target.closest?.('[data-el-id]')) return;
    if (e.target.closest?.('[data-resize-handle]')) return;
    onSelectElement(null);
  }, [onSelectElement]);

  // --- Marquee box selection ---
  const marqueeRef = useRef(null);
  const marqueeDidDrag = useRef(false);

  const handleCanvasPointerDown = useCallback((e) => {
    if (isPanning || e.button !== 0) return;
    if (e.target.closest?.('[data-el-id]')) return;
    if (e.target.closest?.('[data-resize-handle]')) return;
    const area = canvasRef.current;
    if (!area) return;
    const rect = area.getBoundingClientRect();
    const localScale = rect.width / frameWidth;
    const ox = (e.clientX - rect.left) / localScale;
    const oy = (e.clientY - rect.top) / localScale;
    let started = false;
    marqueeDidDrag.current = false;

    const onMove = (ev) => {
      const cx = (ev.clientX - rect.left) / localScale;
      const cy = (ev.clientY - rect.top) / localScale;
      if (!started && (Math.abs(cx - ox) > 5 || Math.abs(cy - oy) > 5)) {
        started = true;
        marqueeDidDrag.current = true;
      }
      if (started) {
        const m = {
          x: Math.min(ox, cx), y: Math.min(oy, cy),
          w: Math.abs(cx - ox), h: Math.abs(cy - oy),
        };
        setMarquee(m);
        marqueeRef.current = m;
      }
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      if (started && marqueeRef.current) {
        const m = marqueeRef.current;
        const freshRect = area.getBoundingClientRect();
        const sc = freshRect.width / frameWidth;
        const stageEls = elements.filter((el) => el.location !== 'parkingLot');
        const hitIds = [];
        for (const el of stageEls) {
          const node = area.querySelector(`[data-el-id="${el.id}"]`);
          if (!node) continue;
          const nr = node.getBoundingClientRect();
          const ex = (nr.left - freshRect.left) / sc;
          const ey = (nr.top - freshRect.top) / sc;
          const ew = nr.width / sc;
          const eh = nr.height / sc;
          if (!(ex + ew < m.x || ex > m.x + m.w || ey + eh < m.y || ey > m.y + m.h)) {
            hitIds.push(el.id);
          }
        }
        if (hitIds.length > 0) {
          onSelectElement(null, { lasso: true, ids: hitIds });
        }
      }
      setMarquee(null);
      marqueeRef.current = null;
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [isPanning, frameWidth, elements, onSelectElement]);

  // --- Edge handle drag ---
  const handleEdgeDrag = useCallback((e, side) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = frameWidth;
    setIsResizing(true);

    const onMove = (ev) => {
      const dx = (ev.clientX - startX) / scale;
      const delta = side === 'right' ? dx * 2 : -dx * 2;
      setDragWidth(Math.max(280, Math.min(1600, startWidth + delta)));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      setIsResizing(false);
      setSpringing(true);
      setDragWidth(defaultWidth);
      setTimeout(() => {
        setSpringing(false);
        setDragWidth(null);
      }, 350);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [frameWidth, defaultWidth, scale]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 0, flexShrink: 0, alignItems: 'center',
      opacity: frameVisible ? 1 : 0,
      transform: frameVisible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 400ms cubic-bezier(0.22,1,0.36,1), transform 400ms cubic-bezier(0.22,1,0.36,1)',
    }}>
      {/* URL bar mock */}
      <div style={styles.urlBar}>
        <Globe size={12} strokeWidth={1.5} color="#999" />
        <span style={styles.urlText}>https://mysite.com/home</span>
        <span style={styles.urlDomain}>Connect Domain</span>
      </div>

      <div ref={frameRef} style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
        {/* Left edge handle */}
        <div
          onMouseDown={(e) => handleEdgeDrag(e, 'left')}
          style={styles.edgeHandle}
        >
          <div style={styles.edgeHandleBar} />
        </div>

        {/* Frame */}
        <div style={{
          ...styles.focusFrame,
          width: frameWidth,
          minHeight: canvasHeight,
          transition: springing ? `width 350ms ${tokens.easeOut}` : 'none',
        }}>
          <div
            ref={canvasRef}
            style={{
              ...styles.canvasBody,
              outline: dragOver ? `2px dashed ${tokens.accent}` : 'none',
              outlineOffset: -2,
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={isPanning ? undefined : handleCanvasClick}
            onPointerDown={isPanning ? undefined : handleCanvasPointerDown}
          >
            {!hasElements && !isGenerating && (
              <EmptyState onOpenInspiration={onOpenInspiration} />
            )}
            {isGenerating && <LoadingState uniqueId={uniqueId} />}
            {(sections && sections.length > 0) ? sections.map((sec, secIdx) => {
              const sectionEls = elements.filter((el) => el.sectionId === sec.id && el.location !== 'parkingLot');
              const secHeight = sec.height || 200;
              const sectionCtx = { ...ctx, parentHeight: secHeight };
              const meshPositions = meshMode
                ? layoutMesh(sectionEls, bpId, sectionCtx, true)
                : null;
              const meshMap = meshPositions
                ? new Map(meshPositions.map(p => [p.id, p]))
                : null;
              return (
                <React.Fragment key={sec.id}>
                  <div data-section-container data-section-id={sec.id} style={{
                    position: 'relative',
                    width: '100%',
                    minHeight: secHeight,
                    marginBottom: 16,
                    borderBottom: `1px solid rgba(255,255,255,0.04)`,
                    outline: hoveredSectionId === sec.id ? `2px solid ${tokens.accent}` : 'none',
                    outlineOffset: -2,
                    transition: 'outline-color 150ms ease',
                    overflow: 'visible',
                  }}>
                    <div style={styles.sectionLabel}>{sec.label || `Section ${secIdx + 1}`}</div>
                    {/* Section reorder arrows */}
                    <div style={styles.sectionArrows}>
                      {secIdx > 0 && (
                        <button style={styles.sectionArrowBtn} title="Move section up">
                          <ChevronUp size={12} strokeWidth={2} color="#999" />
                        </button>
                      )}
                      {secIdx < sections.length - 1 && (
                        <button style={styles.sectionArrowBtn} title="Move section down">
                          <ChevronDown size={12} strokeWidth={2} color="#999" />
                        </button>
                      )}
                    </div>
                    {sectionEls.map((el) => {
                      const meshPos = meshMap ? meshMap.get(el.id) : null;
                      return (
                        <StageElement
                          key={el.id}
                          element={el}
                          isSelected={selectedElementId === el.id || selectedElementIds.has(el.id)}
                          selectedElementIds={selectedElementIds}
                          canvasRef={canvasRef}
                          onSelect={(opts) => onSelectElement(el.id, opts)}
                          onMove={(dx, dy) => onMoveElement(el.id, dx, dy)}
                          onResize={(dw, dh, dx, dy) => onResizeElement(el.id, dw, dh, dx, dy)}
                          breakpointId={bpId}
                          ctx={sectionCtx}
                          scale={scale}
                          isPanning={isPanning}
                          isActive={true}
                          frameWidth={frameWidth}
                          frameHeight={secHeight}
                          meshOverride={meshPos}
                        />
                      );
                    })}
                    {showGridlines && meshMode && meshPositions && meshPositions.length > 0 && (
                      <GridlineOverlay
                        positions={meshPositions}
                        sectionHeight={secHeight}
                        sectionWidth={frameWidth}
                        elements={sectionEls}
                      />
                    )}
                    {sectionEls.length === 0 && (
                      <div style={styles.sectionEmpty}>Drop elements here</div>
                    )}
                    {/* Bottom hover zone with grip + add section pill */}
                    {onAddSection && (
                      <SectionBottomHandle
                        sectionId={sec.id}
                        onAddSection={onAddSection}
                      />
                    )}
                  </div>
                </React.Fragment>
              );
            }) : elements.filter((el) => el.location !== 'parkingLot').map((el) => {
              return (
                <StageElement
                  key={el.id}
                  element={el}
                  isSelected={selectedElementId === el.id || selectedElementIds.has(el.id)}
                  selectedElementIds={selectedElementIds}
                  canvasRef={canvasRef}
                  onSelect={(opts) => onSelectElement(el.id, opts)}
                  onMove={(dx, dy) => onMoveElement(el.id, dx, dy)}
                  onResize={(dw, dh, dx, dy) => onResizeElement(el.id, dw, dh, dx, dy)}
                  breakpointId={bpId}
                  ctx={ctx}
                  scale={scale}
                  isPanning={isPanning}
                  isActive={true}
                  frameWidth={frameWidth}
                  frameHeight={canvasHeight}
                />
              );
            })}
            {selectedElementIds.size > 1 && <MultiSelectBounds selectedIds={selectedElementIds} canvasRef={canvasRef} />}
            {marquee && (
              <div style={{
                position: 'absolute',
                left: marquee.x, top: marquee.y,
                width: marquee.w, height: marquee.h,
                border: `1.5px solid ${tokens.accent}`,
                background: 'rgba(60,103,255,0.08)',
                borderRadius: 2,
                pointerEvents: 'none',
                zIndex: 9999,
              }} />
            )}
          </div>
        </div>

        {/* Right edge handle */}
        <div
          onMouseDown={(e) => handleEdgeDrag(e, 'right')}
          style={styles.edgeHandle}
        >
          <div style={styles.edgeHandleBar} />
        </div>

        {/* Parking lot overlays — absolutely positioned inside frame container */}
        {isHighestBreakpoint && !isResizing && !springing && (
          <ParkingLotOverlays
            elements={elements}
            sections={sections}
            selectedElementId={selectedElementId}
            selectedElementIds={selectedElementIds}
            onSelectElement={onSelectElement}
            onMoveElement={onMoveElement}
            onMoveElementToSection={onMoveElementToSection}
            onResizeElement={onResizeElement}
            onParkElement={onParkElement}
            onUnparkElement={onUnparkElement}
            onDropToParkingLot={onDropToParkingLot}
            breakpointId={bpId}
            ctx={ctx}
            frameHeight={canvasHeight}
            frameWidth={frameWidth}
            scale={scale}
            isPanning={isPanning}
            isElementDragging={isElementDragging}
            canvasRef={canvasRef}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PARKING LOT OVERLAYS
// ═══════════════════════════════════════════
function ParkingLotOverlays({
  elements, sections, selectedElementId, selectedElementIds = new Set(), onSelectElement,
  onMoveElement, onMoveElementToSection, onResizeElement, onParkElement, onUnparkElement,
  onDropToParkingLot,
  breakpointId, ctx, frameHeight, frameWidth, scale, isPanning,
  isElementDragging, canvasRef,
}) {
  const [cursorSide, setCursorSide] = useState(null);

  useEffect(() => {
    if (!isElementDragging) {
      setCursorSide(null);
      return;
    }
    const onMove = (ev) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (ev.clientX < rect.left) setCursorSide('left');
      else if (ev.clientX > rect.right) setCursorSide('right');
      else setCursorSide(null);
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, [isElementDragging, canvasRef]);

  const leftZoneRef = useRef(null);
  const rightZoneRef = useRef(null);

  useEffect(() => {
    const onEnd = (ev) => {
      const detail = ev.detail;
      const { elementId, clientX, clientY, grabOffsetX = 0, grabOffsetY = 0 } = detail;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const el = elements.find((e) => e.id === elementId);
      const isParked = el?.location === 'parkingLot';

      if (isParked) {
        if (clientX >= rect.left && clientX <= rect.right && onUnparkElement) {
          let dropX = (clientX - rect.left) / scale - grabOffsetX;
          let dropY = (clientY - rect.top) / scale - grabOffsetY;
          let targetSectionId = null;
          const sectionContainers = canvasRef.current?.querySelectorAll('[data-section-container]');
          if (sectionContainers?.length > 0) {
            for (const sec of sectionContainers) {
              const sr = sec.getBoundingClientRect();
              if (clientY >= sr.top && clientY <= sr.bottom) {
                dropX = (clientX - sr.left) / scale - grabOffsetX;
                dropY = (clientY - sr.top) / scale - grabOffsetY;
                targetSectionId = sec.getAttribute('data-section-id');
                break;
              }
            }
          }
          onUnparkElement(elementId, Math.max(0, dropX), Math.max(0, dropY), targetSectionId);
          detail.zoneTransition = true;
        }
      } else {
        if (clientX < rect.left && onParkElement) {
          const zoneEl = leftZoneRef.current;
          const zr = zoneEl?.getBoundingClientRect();
          const dropX = zr ? (clientX - zr.left) / scale - grabOffsetX : 20;
          const dropY = zr ? (clientY - zr.top) / scale - grabOffsetY : 20;
          onParkElement(elementId, 'left', Math.max(0, dropX), Math.max(0, dropY));
          detail.zoneTransition = true;
        } else if (clientX > rect.right && onParkElement) {
          const zoneEl = rightZoneRef.current;
          const zr = zoneEl?.getBoundingClientRect();
          const dropX = zr ? (clientX - zr.left) / scale - grabOffsetX : 20;
          const dropY = zr ? (clientY - zr.top) / scale - grabOffsetY : 20;
          onParkElement(elementId, 'right', Math.max(0, dropX), Math.max(0, dropY));
          detail.zoneTransition = true;
        } else if (onMoveElementToSection && clientX >= rect.left && clientX <= rect.right) {
          const sectionContainers = canvasRef.current?.querySelectorAll('[data-section-container]');
          if (sectionContainers?.length > 0) {
            for (const sec of sectionContainers) {
              const sr = sec.getBoundingClientRect();
              if (clientY >= sr.top && clientY <= sr.bottom) {
                const targetSectionId = sec.getAttribute('data-section-id');
                if (targetSectionId && targetSectionId !== el.sectionId) {
                  const dropX = (clientX - sr.left) / scale - grabOffsetX;
                  const dropY = (clientY - sr.top) / scale - grabOffsetY;
                  onMoveElementToSection(elementId, targetSectionId, Math.max(0, dropX), Math.max(0, dropY));
                  detail.zoneTransition = true;
                }
                break;
              }
            }
          }
        }
      }
    };
    document.addEventListener('element-drag-end', onEnd);
    return () => document.removeEventListener('element-drag-end', onEnd);
  }, [onParkElement, onUnparkElement, onMoveElementToSection, canvasRef, elements, scale]);

  const showLeft = cursorSide === 'left';
  const showRight = cursorSide === 'right';

  const hasParkedLeft = elements.some((el) => el.location === 'parkingLot' && (el.parkingSide || 'left') === 'left');
  const hasParkedRight = elements.some((el) => el.location === 'parkingLot' && (el.parkingSide || 'left') === 'right');

  const plWidth = frameWidth;

  return (
    <>
      {(showLeft || hasParkedLeft) && (
        <ParkingLotZone
          side="left"
          dragActive={showLeft}
          elements={elements}
          selectedElementId={selectedElementId}
          selectedElementIds={selectedElementIds}
          onSelectElement={onSelectElement}
          onMoveElement={onMoveElement}
          onResizeElement={onResizeElement}
          onDropToParkingLot={onDropToParkingLot}
          breakpointId={breakpointId}
          ctx={ctx}
          frameHeight={frameHeight}
          plWidth={plWidth}
          scale={scale}
          isPanning={isPanning}
          canvasRef={canvasRef}
          zoneRefOut={leftZoneRef}
        />
      )}
      {(showRight || hasParkedRight) && (
        <ParkingLotZone
          side="right"
          dragActive={showRight}
          elements={elements}
          selectedElementId={selectedElementId}
          selectedElementIds={selectedElementIds}
          onSelectElement={onSelectElement}
          onMoveElement={onMoveElement}
          onResizeElement={onResizeElement}
          onDropToParkingLot={onDropToParkingLot}
          breakpointId={breakpointId}
          ctx={ctx}
          frameHeight={frameHeight}
          plWidth={plWidth}
          scale={scale}
          isPanning={isPanning}
          canvasRef={canvasRef}
          zoneRefOut={rightZoneRef}
        />
      )}
    </>
  );
}

function ParkingLotZone({
  side, dragActive, elements, selectedElementId, selectedElementIds = new Set(), onSelectElement,
  onMoveElement, onResizeElement, onDropToParkingLot,
  breakpointId, ctx, frameHeight, plWidth, scale, isPanning, zoneRefOut,
}) {
  const zoneRef = useRef(null);
  const [plMarquee, setPlMarquee] = useState(null);
  const plMarqueeRef = useRef(null);
  const plMarqueeDidDrag = useRef(false);

  useEffect(() => {
    if (zoneRefOut) zoneRefOut.current = zoneRef.current;
  });
  const [dragOver, setDragOver] = useState(false);

  const sideElements = elements.filter(
    (el) => el.location === 'parkingLot' && (el.parkingSide || 'left') === side
  );

  const maxBottom = sideElements.reduce((acc, el) => {
    const r = resolveElementProps(el, breakpointId, ctx);
    const eY = r.y === 'auto' ? 0 : r.y;
    const eH = r.height === 'auto' ? 200 : r.height;
    return Math.max(acc, eY + eH + 24);
  }, PL_MIN_HEIGHT);
  const plHeight = Math.max(frameHeight, maxBottom);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
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
      if (parsed.componentId && onDropToParkingLot) {
        onDropToParkingLot(parsed.componentId, parsed.componentName, side, parsed.defaultW, parsed.defaultH);
      }
    } catch (_) {}
  }, [onDropToParkingLot, side]);

  const handlePlPointerDown = useCallback((e) => {
    e.stopPropagation();
    if (isPanning || e.button !== 0) return;
    if (e.target.closest?.('[data-el-id]')) return;
    if (e.target.closest?.('[data-resize-handle]')) return;
    const zone = zoneRef.current;
    if (!zone) return;
    const rect = zone.getBoundingClientRect();
    const localScale = rect.width / plWidth;
    const ox = (e.clientX - rect.left) / localScale;
    const oy = (e.clientY - rect.top) / localScale;
    let started = false;
    plMarqueeDidDrag.current = false;

    const onMove = (ev) => {
      const cx = (ev.clientX - rect.left) / localScale;
      const cy = (ev.clientY - rect.top) / localScale;
      if (!started && (Math.abs(cx - ox) > 5 || Math.abs(cy - oy) > 5)) {
        started = true;
        plMarqueeDidDrag.current = true;
      }
      if (started) {
        const m = {
          x: Math.min(ox, cx), y: Math.min(oy, cy),
          w: Math.abs(cx - ox), h: Math.abs(cy - oy),
        };
        setPlMarquee(m);
        plMarqueeRef.current = m;
      }
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      if (started && plMarqueeRef.current) {
        const m = plMarqueeRef.current;
        const freshRect = zone.getBoundingClientRect();
        const sc = freshRect.width / plWidth;
        const hitIds = [];
        for (const el of sideElements) {
          const node = zone.querySelector(`[data-el-id="${el.id}"]`);
          if (!node) continue;
          const nr = node.getBoundingClientRect();
          const ex = (nr.left - freshRect.left) / sc;
          const ey = (nr.top - freshRect.top) / sc;
          const ew = nr.width / sc;
          const eh = nr.height / sc;
          if (!(ex + ew < m.x || ex > m.x + m.w || ey + eh < m.y || ey > m.y + m.h)) {
            hitIds.push(el.id);
          }
        }
        if (hitIds.length > 0) {
          onSelectElement(null, { lasso: true, ids: hitIds });
        }
      }
      setPlMarquee(null);
      plMarqueeRef.current = null;
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [isPanning, plWidth, sideElements, onSelectElement]);

  const showDropHint = dragActive || dragOver;

  return (
    <div
      ref={zoneRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        e.stopPropagation();
        if (plMarqueeDidDrag.current) { plMarqueeDidDrag.current = false; return; }
        if (!e.target.closest?.('[data-el-id]') && !e.target.closest?.('[data-resize-handle]')) {
          onSelectElement(null);
        }
      }}
      onPointerDown={handlePlPointerDown}
      style={{
        position: 'absolute',
        top: 0,
        [side === 'left' ? 'right' : 'left']: '100%',
        width: plWidth,
        height: plHeight,
        backgroundColor: 'transparent',
        borderRadius: showDropHint ? 6 : 0,
        border: showDropHint
          ? `2px dashed ${tokens.accent}`
          : '2px solid transparent',
        pointerEvents: sideElements.length > 0 || showDropHint ? 'auto' : 'none',
        overflow: 'visible',
        transition: `border-color 150ms ${tokens.easeOut}`,
      }}
    >
      {showDropHint && sideElements.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 5,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 500, color: tokens.accent,
            backgroundColor: 'rgba(60,103,255,0.08)',
            padding: '5px 12px', borderRadius: tokens.radiusFull,
          }}>
            Drop here
          </span>
        </div>
      )}
      {sideElements.map((el) => (
        <StageElement
          key={el.id}
          element={el}
          isSelected={selectedElementId === el.id || selectedElementIds.has(el.id)}
          selectedElementIds={selectedElementIds}
          canvasRef={zoneRef}
          onSelect={(opts) => onSelectElement(el.id, opts)}
          onMove={(dx, dy) => onMoveElement(el.id, dx, dy)}
          onResize={(dw, dh, dx, dy) => onResizeElement(el.id, dw, dh, dx, dy)}
          breakpointId={breakpointId}
          ctx={ctx}
          scale={scale}
          isPanning={isPanning}
          isActive={true}
          frameWidth={plWidth}
          frameHeight={plHeight}
        />
      ))}
      {plMarquee && (
        <div style={{
          position: 'absolute',
          left: plMarquee.x, top: plMarquee.y,
          width: plMarquee.w, height: plMarquee.h,
          border: `1.5px solid ${tokens.accent}`,
          background: 'rgba(60,103,255,0.08)',
          pointerEvents: 'none', zIndex: 9999,
        }} />
      )}
      {selectedElementIds.size > 1 && sideElements.some(el => selectedElementIds.has(el.id)) && (
        <MultiSelectBounds selectedIds={selectedElementIds} canvasRef={zoneRef} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// STAGE ELEMENT
// ═══════════════════════════════════════════
function computeOutsideRatio(elX, elY, elW, elH, frameW, frameH) {
  if (elW <= 0 || elH <= 0) return 0;
  const overlapL = Math.max(0, elX);
  const overlapT = Math.max(0, elY);
  const overlapR = Math.min(frameW, elX + elW);
  const overlapB = Math.min(frameH, elY + elH);
  const overlapW = Math.max(0, overlapR - overlapL);
  const overlapH = Math.max(0, overlapB - overlapT);
  const overlapArea = overlapW * overlapH;
  const totalArea = elW * elH;
  return 1 - (overlapArea / totalArea);
}

function SectionBottomHandle({ sectionId, onAddSection }) {
  const [hoverBottom, setHoverBottom] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHoverBottom(true)}
      onMouseLeave={() => setHoverBottom(false)}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 28,
        zIndex: 6,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      {/* Resize bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: hoverBottom ? 3 : 1,
          background: hoverBottom ? tokens.accent : 'rgba(255,255,255,0.06)',
          transition: `all 200ms ${tokens.easeOut}`,
          pointerEvents: 'none',
        }}
      />
      {/* Grip dots */}
      <div
        style={{
          position: 'absolute',
          bottom: hoverBottom ? 5 : 3,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 3,
          opacity: hoverBottom ? 1 : 0,
          transition: `opacity 200ms ${tokens.easeOut}`,
          pointerEvents: 'none',
        }}
      >
        <span style={{ width: 3, height: 3, borderRadius: 999, background: tokens.accent }} />
        <span style={{ width: 3, height: 3, borderRadius: 999, background: tokens.accent }} />
        <span style={{ width: 3, height: 3, borderRadius: 999, background: tokens.accent }} />
      </div>
      {/* + Add Section pill */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddSection(sectionId);
        }}
        style={{
          position: 'absolute',
          bottom: -14,
          left: '50%',
          zIndex: 100,
          border: 'none',
          background: tokens.accent,
          color: '#fff',
          cursor: 'pointer',
          padding: '5px 14px',
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          boxShadow: `0 4px 14px rgba(60,103,255,0.30), inset 0 1px 0 rgba(255,255,255,0.18)`,
          opacity: hoverBottom ? 1 : 0,
          transform:
            'translateX(-50%) ' +
            (hoverBottom ? 'translateY(0)' : 'translateY(-4px)'),
          transition: `all 240ms ${tokens.easeOut}`,
          pointerEvents: hoverBottom ? 'auto' : 'none',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        + Add Section
      </button>
    </div>
  );
}

const HATCH_SVG = `url("data:image/svg+xml,%3Csvg width='8' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-2 2L2-2M0 8L8 0M6 10L10 6' stroke='%23${tokens.accent.replace('#', '')}' stroke-width='1' opacity='0.25'/%3E%3C/svg%3E")`;

function StageElement({ element, isSelected, onSelect, onMove, onResize, breakpointId, ctx, scale, isPanning, isActive, frameWidth, frameHeight, meshOverride, selectedElementIds, canvasRef: parentCanvasRef }) {
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

  const isParked = element.location === 'parkingLot';

  const beh = element.behavior && RESPONSIVE_BEHAVIORS[element.behavior];
  const isWrap = element.behavior === 'wrap';
  const isHug = element.behavior === 'hug';
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
    if (!isActive || isPanning || !onMove) return;
    if (e.target.closest?.('[data-resize-handle]')) return;
    e.stopPropagation();

    const isMultiSelected = selectedElementIds && selectedElementIds.size > 1 && selectedElementIds.has(element.id);
    if (onSelect) {
      if (e.shiftKey) {
        onSelect({ shift: true });
      } else if (!isMultiSelected) {
        onSelect();
      }
    }

    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;
    let dragStarted = false;
    setInteracting(true);
    const { x: ox, y: oy } = geomRef.current;

    const elRect = dragRef.current?.getBoundingClientRect();
    const grabOffsetX = elRect ? (e.clientX - elRect.left) / scale : 0;
    const grabOffsetY = elRect ? (e.clientY - elRect.top) / scale : 0;

    const siblingStartPositions = new Map();
    if (isMultiSelected && parentCanvasRef?.current) {
      for (const sid of selectedElementIds) {
        if (sid === element.id) continue;
        const node = parentCanvasRef.current.querySelector(`[data-el-id="${sid}"]`);
        if (node) {
          const t = node.style.transform;
          const match = t.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
          if (match) siblingStartPositions.set(sid, { node, sx: parseFloat(match[1]), sy: parseFloat(match[2]) });
        }
      }
    }

    const isOnStage = element.location !== 'parkingLot';
    const clampY = isOnStage && frameHeight;
    const { h: elH } = geomRef.current;

    const move = (ev) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      if (!moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        moved = true;
        if (!dragStarted) {
          dragStarted = true;
          document.dispatchEvent(new CustomEvent('element-drag-start', { detail: { elementId: element.id } }));
        }
      }
      if (moved) {
        const minVisible = Math.max(10, elH * 0.2);
        const newY = clampY ? Math.max(-elH + minVisible, Math.min(frameHeight - minVisible, oy + dy)) : oy + dy;
        if (dragRef.current) {
          dragRef.current.style.transform = `translate(${ox + dx}px, ${newY}px)`;
        }
        for (const [, info] of siblingStartPositions) {
          const sibY = clampY ? Math.max(-elH + minVisible, Math.min(frameHeight - minVisible, info.sy + dy)) : info.sy + dy;
          info.node.style.transform = `translate(${info.sx + dx}px, ${sibY}px)`;
        }
      }
    };
    const up = (ev) => {
      setInteracting(false);
      let zoneTransition = false;
      if (dragStarted) {
        const detail = { elementId: element.id, clientX: ev.clientX, clientY: ev.clientY, grabOffsetX, grabOffsetY };
        document.dispatchEvent(new CustomEvent('element-drag-end', { detail }));
        zoneTransition = !!detail.zoneTransition;
      }
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      if (!moved || zoneTransition) return;
      const dx = (ev.clientX - startX) / scale;
      let dy = (ev.clientY - startY) / scale;
      if (clampY) {
        const minVis = Math.max(10, elH * 0.2);
        const targetY = oy + dy;
        const clampedY = Math.max(-elH + minVis, Math.min(frameHeight - minVis, targetY));
        dy = clampedY - oy;
      }
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) onMove(dx, dy);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, [onSelect, onMove, scale, isPanning, isActive, element.id, selectedElementIds, parentCanvasRef, frameHeight, element.location]);

  const makeResizeHandler = useCallback((edges) => (e) => {
    if (!isActive || isPanning || !onResize) return;
    e.stopPropagation();
    e.preventDefault();
    if (onSelect) onSelect();
    const startMX = e.clientX;
    const startMY = e.clientY;
    const { left, right, top, bottom } = edges;
    const { x: ox, y: oy, w: ow, h: oh } = geomRef.current;
    setInteracting(true);
    const calc = (ev) => {
      const rawDx = (ev.clientX - startMX) / scale;
      const rawDy = (ev.clientY - startMY) / scale;
      let dw = 0, dh = 0;
      if (right) dw = rawDx;
      if (left) dw = -rawDx;
      if (bottom) dh = rawDy;
      if (top) dh = -rawDy;
      const newW = Math.max(60, ow + dw);
      const newH = Math.max(40, oh + dh);
      const posX = left ? ox + (ow - newW) : ox;
      const posY = top ? oy + (oh - newH) : oy;
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
      const { newW, newH, posX, posY } = calc(ev);
      onResize(newW - ow, autoHeight ? 0 : newH - oh, posX - ox, autoHeight ? 0 : posY - oy);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, [onSelect, onResize, scale, isPanning, isActive, autoHeight]);

  return (
    <div
      ref={dragRef}
      onMouseDown={handleMouseDown}
      data-el-id={element.id}
      style={{
        position: 'absolute',
        left: 0, top: 0,
        transform: `translate(${x}px, ${y}px)`,
        width: w,
        height: autoHeight ? 'auto' : h,
        zIndex: isSelected ? 999 : (element.zIndex || 1),
        cursor: !isActive ? 'default' : isPanning ? 'inherit' : (interacting ? 'grabbing' : 'grab'),
        boxShadow: isSelected ? `0 0 0 2px ${tokens.accent}, ${tokens.shadowRest}` : isTextElement ? 'none' : tokens.shadowSubtle,
        borderRadius: tokens.radiusSm,
        overflow: 'visible',
        backgroundColor: isTextElement ? 'transparent' : '#FFFFFF',
        transition: interacting ? 'none' : `box-shadow ${tokens.durMedium} ${tokens.easeOut}`,
        userSelect: 'none',
        pointerEvents: isActive ? 'auto' : 'none',
      }}
    >
      <div ref={contentRef} style={{ pointerEvents: 'none', width: '100%', height: autoHeight ? 'auto' : '100%', overflow: autoHeight ? 'visible' : 'hidden', borderRadius: tokens.radiusSm, opacity: isParked ? 0.45 : 1 }}>
        <PreviewRegistry
          id={element.componentId}
          width={Math.round(w)}
          height={Math.round(h)}
          props={element.props}
          elementId={element.id}
          fontScale={fontScale}
        />
      </div>
      {isParked && (
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: tokens.radiusSm,
          backgroundImage: HATCH_SVG,
          backgroundRepeat: 'repeat',
          pointerEvents: 'none',
          zIndex: 2,
        }} />
      )}
      {isSelected && (
        <div style={styles.nameTag}>{element.name}</div>
      )}
      {isSelected && (
        <>
          <div style={styles.unitBadgeX}>
            {formatProp(element, breakpointId, 'x')} , {formatProp(element, breakpointId, 'y')}
          </div>
          <div style={styles.unitBadgeSize}>
            {formatProp(element, breakpointId, 'width')} x {autoHeight && renderedHeight ? `${Math.round(renderedHeight)}px` : formatProp(element, breakpointId, 'height')}
          </div>
          {/* Corner squares — resize both axes */}
          <div data-resize-handle="true" onMouseDown={makeResizeHandler({ right: true, bottom: true })} style={styles.cornerSE} />
          <div data-resize-handle="true" onMouseDown={makeResizeHandler({ right: true, top: true })} style={styles.cornerNE} />
          <div data-resize-handle="true" onMouseDown={makeResizeHandler({ left: true, bottom: true })} style={styles.cornerSW} />
          <div data-resize-handle="true" onMouseDown={makeResizeHandler({ left: true, top: true })} style={styles.cornerNW} />
          {/* Edge-mid circles — single axis */}
          <div data-resize-handle="true" onMouseDown={makeResizeHandler({ top: true })} style={styles.edgeMidTop} />
          <div data-resize-handle="true" onMouseDown={makeResizeHandler({ bottom: true })} style={styles.edgeMidBottom} />
          <div data-resize-handle="true" onMouseDown={makeResizeHandler({ left: true })} style={styles.edgeMidLeft} />
          <div data-resize-handle="true" onMouseDown={makeResizeHandler({ right: true })} style={styles.edgeMidRight} />
        </>
      )}
    </div>
  );
}

function MultiSelectBounds({ selectedIds, canvasRef }) {
  const [bounds, setBounds] = useState(null);
  useEffect(() => {
    const area = canvasRef?.current;
    if (!area || selectedIds.size < 2) { setBounds(null); return; }
    const areaRect = area.getBoundingClientRect();
    const sc = areaRect.width > 0 ? areaRect.width / area.offsetWidth : 1;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const id of selectedIds) {
      const node = area.querySelector(`[data-el-id="${id}"]`);
      if (!node) continue;
      const nr = node.getBoundingClientRect();
      const ex = (nr.left - areaRect.left) / sc;
      const ey = (nr.top - areaRect.top) / sc;
      const ew = nr.width / sc;
      const eh = nr.height / sc;
      minX = Math.min(minX, ex);
      minY = Math.min(minY, ey);
      maxX = Math.max(maxX, ex + ew);
      maxY = Math.max(maxY, ey + eh);
    }
    if (!isFinite(minX)) { setBounds(null); return; }
    setBounds({ x: minX - 4, y: minY - 4, w: maxX - minX + 8, h: maxY - minY + 8 });
  });
  if (!bounds) return null;
  return (
    <div style={{
      position: 'absolute',
      left: bounds.x, top: bounds.y,
      width: bounds.w, height: bounds.h,
      border: `1.5px dashed ${tokens.accent}`,
      pointerEvents: 'none',
      zIndex: 998,
      borderRadius: 4,
    }} />
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

const cornerHandle = {
  ...handleBase,
  width: 14, height: 14,
  borderRadius: 3,
};

const edgeMidHandle = {
  ...handleBase,
  width: 12, height: 12,
  borderRadius: '50%',
};

const styles = {
  root: {
    flex: 1, display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'hidden',
  },
  canvasViewport: {
    flex: 1, overflow: 'hidden',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    background: '#2E2E30',
  },
  canvasBody: {
    flex: 1, position: 'relative',
    backgroundColor: tokens.canvasBg, overflow: 'hidden',
  },

  // ── Overview ──
  overviewLabel: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
    color: tokens.text3,
    padding: '4px 10px',
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.activePill,
    alignSelf: 'flex-start',
  },
  overviewFrame: {
    backgroundColor: tokens.canvasBg,
    borderRadius: tokens.radiusLg,
    boxShadow: `${tokens.shadowRest}, 0 0 0 1px ${tokens.border}`,
    display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'visible', flexShrink: 0,
    transition: `box-shadow ${tokens.durNormal} ${tokens.easeOut}`,
  },
  emptyMirror: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: tokens.canvasBg,
  },
  addBpWrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
  },
  addBpBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '12px 16px',
    border: `2px dashed ${tokens.controlBorder}`,
    borderRadius: tokens.radiusXl,
    backgroundColor: tokens.pillBg,
    cursor: 'pointer',
    fontSize: 11, fontWeight: 500, color: tokens.text3,
    transition: `all ${tokens.durFast} ${tokens.easeOut}`,
  },

  // ── Focus mode ──
  urlBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 14px',
    backgroundColor: '#2A2A2B',
    border: '1px solid #3C3C3D',
    borderBottom: 'none',
    borderRadius: '8px 8px 0 0',
    alignSelf: 'center',
    minWidth: 320,
    justifyContent: 'center',
  },
  urlText: {
    fontSize: 11, color: '#999',
    fontFamily: 'monospace',
    letterSpacing: '0.02em',
  },
  urlDomain: {
    fontSize: 10, color: tokens.accent,
    fontWeight: 500,
    marginLeft: 'auto',
    cursor: 'pointer',
  },
  focusFrame: {
    backgroundColor: tokens.canvasBg,
    borderRadius: 0,
    boxShadow: `0 0 0 1px #3C3C3D, ${tokens.shadowRest}`,
    display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'visible', flexShrink: 0,
  },
  edgeHandle: {
    width: 10, cursor: 'ew-resize',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, zIndex: 10,
  },
  edgeHandleBar: {
    width: 2, height: 40,
    borderRadius: 1,
    backgroundColor: '#666',
    opacity: 0.5,
    transition: `opacity ${tokens.durFast} ${tokens.easeOut}`,
  },

  // ── Section arrows ──
  sectionArrows: {
    position: 'absolute', top: '50%', left: -28,
    transform: 'translateY(-50%)',
    display: 'flex', flexDirection: 'column', gap: 2,
    zIndex: 10,
  },
  sectionArrowBtn: {
    width: 22, height: 22,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid #3C3C3D',
    borderRadius: 4,
    backgroundColor: '#2A2A2B',
    cursor: 'pointer',
    padding: 0,
  },

  // ── Parking Lot ──
  plLabel: {
    position: 'absolute', top: 8, left: 12,
    fontSize: 10, fontWeight: 600, color: tokens.text3,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    pointerEvents: 'none', opacity: 0.7,
  },

  // ── Stage element ──
  nameTag: {
    position: 'absolute', top: -16, left: 4,
    fontSize: 10, fontWeight: 600, color: '#FFFFFF',
    backgroundColor: `${tokens.accent}dd`,
    padding: '2px 6px', borderRadius: tokens.radiusSm,
    pointerEvents: 'none', letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
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
  // Corner squares — resize both axes
  cornerSE: { ...cornerHandle, right: -7, bottom: -7, cursor: 'nwse-resize' },
  cornerNE: { ...cornerHandle, right: -7, top: -7, cursor: 'nesw-resize' },
  cornerSW: { ...cornerHandle, left: -7, bottom: -7, cursor: 'nesw-resize' },
  cornerNW: { ...cornerHandle, left: -7, top: -7, cursor: 'nwse-resize' },
  // Edge-mid circles — single axis
  edgeMidTop:    { ...edgeMidHandle, top: -6, left: '50%', marginLeft: -6, cursor: 'ns-resize' },
  edgeMidBottom: { ...edgeMidHandle, bottom: -6, left: '50%', marginLeft: -6, cursor: 'ns-resize' },
  edgeMidLeft:   { ...edgeMidHandle, left: -6, top: '50%', marginTop: -6, cursor: 'ew-resize' },
  edgeMidRight:  { ...edgeMidHandle, right: -6, top: '50%', marginTop: -6, cursor: 'ew-resize' },
  empty: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 16,
    backgroundColor: tokens.canvasBg,
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: tokens.pillBg,
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
    backgroundColor: tokens.canvasBg,
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
    display: 'none',
  },
};
