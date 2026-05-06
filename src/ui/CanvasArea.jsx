import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { Sparkles, Monitor, Tablet, Smartphone, Plus } from 'lucide-react';
import { PreviewRegistry } from '../previews/PreviewRegistry.jsx';
import { resolveElementProps, BREAKPOINTS, RESPONSIVE_BEHAVIORS } from '../engine/responsiveUnits.js';
import { tokens } from './designTokens.js';

const DOT_SPACING = 20;
const DOT_RADIUS = 0.6;
const DOT_COLOR = 'rgba(0,0,0,0.08)';
const BP_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
const FRAME_GAP = 48;
const PL_GAP = 16;
const PL_MIN_HEIGHT = 200;

function useDotPattern() {
  return useMemo(() => ({
    backgroundImage: `radial-gradient(circle, ${DOT_COLOR} ${DOT_RADIUS}px, transparent ${DOT_RADIUS}px)`,
    backgroundSize: `${DOT_SPACING}px ${DOT_SPACING}px`,
    backgroundPosition: `${DOT_SPACING / 2}px ${DOT_SPACING / 2}px`,
  }), []);
}

export function CanvasArea({
  canvasHeight,
  elements,
  selectedElementId,
  onSelectElement,
  onMoveElement,
  onResizeElement,
  onDropComponent,
  onParkElement,
  onUnparkElement,
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
              selectedElementId={selectedElementId}
              onSelectElement={onSelectElement}
              onMoveElement={onMoveElement}
              onResizeElement={onResizeElement}
              onDropComponent={onDropComponent}
              onParkElement={onParkElement}
              onUnparkElement={onUnparkElement}
              referenceWidth={referenceWidth}
              scale={scale}
              isPanning={isPanning}
              isGenerating={isGenerating}
              uniqueId={uniqueId}
              onOpenInspiration={onOpenInspiration}
              hasElements={hasElements}
            />
          ) : (
            // ──────── OVERVIEW MODE ────────
            <>
              {activeBreakpoints.map((bpId, idx) => {
                const bp = BREAKPOINTS[bpId];
                const Icon = BP_ICONS[bpId];
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
// PARKING LOT ZONE
// ═══════════════════════════════════════════
function ParkingLotZone({
  side, elements, selectedElementId, onSelectElement,
  onMoveElement, onResizeElement, onUnparkElement,
  breakpointId, ctx, scale, isPanning, frameHeight,
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
          scale={scale}
          isPanning={isPanning}
          isActive={true}
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
// FOCUSED FRAME (with edge handles + parking lot)
// ═══════════════════════════════════════════
function FocusedFrame({
  bpId, canvasHeight, elements, selectedElementId,
  onSelectElement, onMoveElement, onResizeElement, onDropComponent,
  onParkElement, onUnparkElement,
  referenceWidth, scale, isPanning, isGenerating, uniqueId, onOpenInspiration, hasElements,
}) {
  const bp = BREAKPOINTS[bpId];
  const Icon = BP_ICONS[bpId];
  const defaultWidth = bp.defaultWidth;
  const canvasRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragWidth, setDragWidth] = useState(null);
  const [springing, setSpringing] = useState(false);

  const frameWidth = dragWidth !== null ? dragWidth : defaultWidth;
  const ctx = useMemo(() => ({
    canvasWidth: frameWidth, parentWidth: frameWidth, referenceWidth,
  }), [frameWidth, referenceWidth]);

  const stageElements = elements.filter((el) => el.location !== 'parkingLot');
  const hasParkedLeft = elements.some((el) => el.location === 'parkingLot' && (el.parkingSide || 'left') === 'left');
  const hasParkedRight = elements.some((el) => el.location === 'parkingLot' && (el.parkingSide || 'left') === 'right');
  const stageHasElements = stageElements.length > 0 || isGenerating;

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
      onDropComponent(parsed.componentId, parsed.componentName, x, y, parsed.defaultW, parsed.defaultH);
    } catch (_) {}
  }, [onDropComponent, scale]);

  const handleCanvasClick = useCallback((e) => {
    if (e.target === e.currentTarget || e.target.dataset?.canvasBg) {
      onSelectElement(null);
    }
  }, [onSelectElement]);

  // --- Edge handle drag ---
  const handleEdgeDrag = useCallback((e, side) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = frameWidth;

    const onMove = (ev) => {
      const dx = (ev.clientX - startX) / scale;
      const delta = side === 'right' ? dx * 2 : -dx * 2;
      setDragWidth(Math.max(280, Math.min(1600, startWidth + delta)));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
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

  // Detect when a stage element is dragged past the frame boundary and auto-park it
  const handleMoveWithBoundary = useCallback((elId, dx, dy) => {
    const el = elements.find((e) => e.id === elId);
    if (!el) return;
    if (el.location === 'parkingLot') {
      onMoveElement(elId, dx, dy);
      return;
    }
    const r = resolveElementProps(el, bpId, ctx);
    const newX = (r.x === 'auto' ? 0 : r.x) + dx;
    const newY = (r.y === 'auto' ? 0 : r.y) + dy;
    const elW = r.width === 'auto' ? 280 : r.width;
    const elH = r.height === 'auto' ? 200 : r.height;
    const outsideRatio = computeOutsideRatio(newX, newY, elW, elH, frameWidth, canvasHeight);

    if (outsideRatio > 0.6 && onParkElement) {
      const side = (newX + elW / 2) < frameWidth / 2 ? 'left' : 'right';
      const plX = Math.max(16, Math.min(frameWidth - elW - 16, newX < 0 ? Math.abs(newX) : newX - frameWidth));
      const plY = Math.max(32, newY < 0 ? 16 : newY);
      onParkElement(elId, side, plX, plY);
    } else {
      onMoveElement(elId, dx, dy);
    }
  }, [elements, bpId, ctx, frameWidth, canvasHeight, onMoveElement, onParkElement]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignItems: 'center' }}>
      <div style={styles.focusLabel}>
        <Icon size={12} strokeWidth={2} />
        {bp.label}
        <span style={{ fontWeight: 400, opacity: 0.7 }}>{Math.round(frameWidth)}px</span>
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: PL_GAP }}>
        {/* Left Parking Lot */}
        {hasParkedLeft && (
          <ParkingLotZone
            side="left"
            elements={elements}
            selectedElementId={selectedElementId}
            onSelectElement={onSelectElement}
            onMoveElement={onMoveElement}
            onResizeElement={onResizeElement}
            onUnparkElement={onUnparkElement}
            breakpointId={bpId}
            ctx={ctx}
            scale={scale}
            isPanning={isPanning}
            frameHeight={canvasHeight}
          />
        )}

        <div style={{ display: 'flex', alignItems: 'stretch' }}>
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
            height: canvasHeight,
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
            >
              {!stageHasElements && !isGenerating && (
                <EmptyState onOpenInspiration={onOpenInspiration} />
              )}
              {isGenerating && <LoadingState uniqueId={uniqueId} />}
              {stageElements.map((el) => {
                const r = resolveElementProps(el, bpId, ctx);
                const eX = r.x === 'auto' ? 0 : r.x;
                const eY = r.y === 'auto' ? 0 : r.y;
                const eW = r.width === 'auto' ? 280 : r.width;
                const eH = r.height === 'auto' ? 200 : r.height;
                return (
                  <StageElement
                    key={el.id}
                    element={el}
                    isSelected={selectedElementId === el.id}
                    onSelect={() => onSelectElement(el.id)}
                    onMove={(dx, dy) => handleMoveWithBoundary(el.id, dx, dy)}
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
            </div>
          </div>

          {/* Right edge handle */}
          <div
            onMouseDown={(e) => handleEdgeDrag(e, 'right')}
            style={styles.edgeHandle}
          >
            <div style={styles.edgeHandleBar} />
          </div>
        </div>

        {/* Right Parking Lot */}
        {hasParkedRight && (
          <ParkingLotZone
            side="right"
            elements={elements}
            selectedElementId={selectedElementId}
            onSelectElement={onSelectElement}
            onMoveElement={onMoveElement}
            onResizeElement={onResizeElement}
            onUnparkElement={onUnparkElement}
            breakpointId={bpId}
            ctx={ctx}
            scale={scale}
            isPanning={isPanning}
            frameHeight={canvasHeight}
          />
        )}
      </div>
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

const HATCH_SVG = `url("data:image/svg+xml,%3Csvg width='8' height='8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-2 2L2-2M0 8L8 0M6 10L10 6' stroke='%23${tokens.accent.replace('#', '')}' stroke-width='1' opacity='0.25'/%3E%3C/svg%3E")`;

function StageElement({ element, isSelected, onSelect, onMove, onResize, breakpointId, ctx, scale, isPanning, isActive, frameWidth, frameHeight, isInParkingLot, onUnpark }) {
  const resolved = resolveElementProps(element, breakpointId, ctx);
  const dragRef = useRef(null);
  const [interacting, setInteracting] = useState(false);

  const x = resolved.x === 'auto' ? 0 : resolved.x;
  const y = resolved.y === 'auto' ? 0 : resolved.y;
  const w = resolved.width === 'auto' ? 280 : resolved.width;
  const h = resolved.height === 'auto' ? 200 : resolved.height;

  const isParked = isInParkingLot || element.location === 'parkingLot';

  const beh = element.behavior && RESPONSIVE_BEHAVIORS[element.behavior];
  const isWrap = element.behavior === 'wrap';
  const isHug = element.behavior === 'hug';
  const autoHeight = beh && beh.heightUnit === 'auto';
  const fontScale = (!isWrap && beh && (beh.widthUnit === 'spx' || beh.heightUnit === 'spx') && ctx.referenceWidth)
    ? ctx.canvasWidth / ctx.referenceWidth
    : 1;

  const geomRef = useRef({ x, y, w, h });
  geomRef.current = { x, y, w, h };

  const handleMouseDown = useCallback((e) => {
    if (!isActive || isPanning || !onMove) return;
    if (e.target.closest?.('[data-resize-handle]')) return;
    e.stopPropagation();
    if (onSelect) onSelect();
    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;
    setInteracting(true);
    const { x: ox, y: oy } = geomRef.current;
    const move = (ev) => {
      moved = true;
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      if (dragRef.current) dragRef.current.style.transform = `translate(${ox + dx}px, ${oy + dy}px)`;
    };
    const up = (ev) => {
      setInteracting(false);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      if (!moved) return;
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) onMove(dx, dy);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, [onSelect, onMove, scale, isPanning, isActive]);

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
        dragRef.current.style.height = `${newH}px`;
        dragRef.current.style.transform = `translate(${posX}px, ${posY}px)`;
      }
    };
    const up = (ev) => {
      setInteracting(false);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      const { newW, newH, posX, posY } = calc(ev);
      onResize(newW - ow, newH - oh, posX - ox, posY - oy);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, [onSelect, onResize, scale, isPanning, isActive]);

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
        minHeight: autoHeight ? Math.min(h, 40) : undefined,
        zIndex: isSelected ? 999 : (element.zIndex || 1),
        cursor: !isActive ? 'default' : isPanning ? 'inherit' : (interacting ? 'grabbing' : 'grab'),
        boxShadow: isSelected ? `0 0 0 2px ${tokens.accent}, ${tokens.shadowRest}` : tokens.shadowSubtle,
        borderRadius: tokens.radiusSm,
        overflow: 'visible',
        backgroundColor: '#FFFFFF',
        transition: interacting ? 'none' : `box-shadow ${tokens.durMedium} ${tokens.easeOut}`,
        userSelect: 'none',
        pointerEvents: isActive ? 'auto' : 'none',
      }}
    >
      <div style={{ pointerEvents: 'none', width: '100%', height: autoHeight ? 'auto' : '100%', overflow: autoHeight ? 'visible' : 'hidden', borderRadius: tokens.radiusSm }}>
        <PreviewRegistry
          id={element.componentId}
          width={Math.round(w)}
          height={Math.round(h)}
          props={element.props}
          elementId={element.id}
          fontScale={fontScale}
        />
      </div>
      <div style={{
        ...styles.nameTag,
        backgroundColor: isParked ? `${tokens.text3}dd` : `${tokens.accent}dd`,
      }}>{element.name}</div>
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
            {formatProp(element, breakpointId, 'width')} x {formatProp(element, breakpointId, 'height')}
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
    background: tokens.bgPageGradient,
  },
  canvasBody: {
    flex: 1, position: 'relative',
    backgroundColor: '#FFFFFF', overflow: 'hidden',
  },

  // ── Overview ──
  overviewLabel: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
    color: tokens.text3,
    padding: '4px 10px',
    borderRadius: tokens.radiusFull,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignSelf: 'flex-start',
  },
  overviewFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: tokens.radiusLg,
    boxShadow: `${tokens.shadowRest}, 0 0 0 1px ${tokens.border}`,
    display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'visible', flexShrink: 0,
    transition: `box-shadow ${tokens.durNormal} ${tokens.easeOut}`,
  },
  emptyMirror: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FAFAFA',
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
    backgroundColor: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontSize: 11, fontWeight: 500, color: tokens.text3,
    transition: `all ${tokens.durFast} ${tokens.easeOut}`,
  },

  // ── Focus mode ──
  focusLabel: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
    color: '#fff',
    padding: '5px 14px',
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.accent,
    alignSelf: 'center',
    boxShadow: tokens.shadowSubtle,
  },
  focusFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: tokens.radiusLg,
    boxShadow: `0 0 0 2px ${tokens.accent}, ${tokens.shadowRest}`,
    display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'visible', flexShrink: 0,
  },
  edgeHandle: {
    width: 24, cursor: 'ew-resize',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, zIndex: 10,
  },
  edgeHandleBar: {
    width: 4, height: 48,
    borderRadius: 2,
    backgroundColor: tokens.accent,
    opacity: 0.35,
    transition: `opacity ${tokens.durFast} ${tokens.easeOut}`,
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
};
