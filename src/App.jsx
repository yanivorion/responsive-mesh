import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { generativeComponents, generativeArtImages } from './data/components.js';
import { TopNav } from './ui/TopNav.jsx';
import { LeftSidebar } from './ui/LeftSidebar.jsx';
import { InspirationPanel } from './ui/InspirationPanel.jsx';
import { Copilot } from './ui/Copilot.jsx';
import { CanvasArea } from './ui/CanvasArea.jsx';
import { InspectorPanel } from './ui/InspectorPanel.jsx';
import { AddElementsPanel } from './ui/AddElementsPanel.jsx';
import { createElement, rv, BREAKPOINTS, RESPONSIVE_BEHAVIORS, defaultMarginUnit, pxToUnit } from './engine/responsiveUnits.js';
import { applyHeuristics } from './engine/heuristics.js';
import { parseLayoutText, layoutToElements } from './engine/layoutParser.js';
import { tokens } from './ui/designTokens.js';

export const MANIFEST = {
  type: 'Editor.WixStudioInspiration',
  description: 'Wix Studio editor with drag-and-drop canvas and responsive units',
  editorElement: '.wix-studio-inspiration',
  displayName: 'Wix Studio Inspiration',
  archetype: 'container',
  data: {
    canvasWidth: {
      dataType: 'select',
      displayName: 'Canvas Width',
      defaultValue: '1080',
      options: ['900', '960', '1020', '1080', '1140', '1200'],
      group: 'Canvas',
    },
    canvasHeight: {
      dataType: 'select',
      displayName: 'Canvas Height',
      defaultValue: '660',
      options: ['580', '620', '660', '700', '740'],
      group: 'Canvas',
    },
  },
  layout: {
    resizeDirection: 'horizontalAndVertical',
    contentResizeDirection: 'vertical',
  },
};

export default function Component({ config = {} }) {
  const canvasHeight = parseInt(config?.canvasHeight || '660');
  const leftSidebarWidth = 52;
  const referenceWidth = 1280;

  const [inspirationPanelOpen, setInspirationPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('components');
  const [copilotExpanded, setCopilotExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hoveredComponent, setHoveredComponent] = useState(null);

  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [addElementsOpen, setAddElementsOpen] = useState(false);
  const [zoom, setZoom] = useState(45);

  // Focus mode: null = overview, string = focused breakpoint id
  const [focusedBp, setFocusedBp] = useState(null);
  // Which breakpoints are shown in overview (tablet is optional)
  const [activeBreakpoints, setActiveBreakpoints] = useState(['desktop', 'mobile']);

  // breakpointId is derived: in focus mode it's the focused bp, in overview it's desktop
  const breakpointId = focusedBp || 'desktop';

  const inputRef = useRef(null);
  const copilotRef = useRef(null);

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const uniqueId = useMemo(
    () => `editor-${Math.random().toString(36).substr(2, 9)}`,
    []
  );
  const smoothEase = tokens.easeSmooth;

  const selectedElement = useMemo(
    () => elements.find((e) => e.id === selectedElementId) || null,
    [elements, selectedElementId]
  );

  // --- Focus mode handlers ---
  const handleFocusBreakpoint = useCallback((bpId) => {
    setFocusedBp(bpId);
    setSelectedElementId(null);
    setZoom(100);
  }, []);

  const handleExitFocus = useCallback(() => {
    setFocusedBp(null);
    setSelectedElementId(null);
    setZoom(45);
  }, []);

  const handleAddBreakpoint = useCallback(() => {
    setActiveBreakpoints((prev) => {
      if (prev.includes('tablet')) return prev;
      const idx = prev.indexOf('mobile');
      const next = [...prev];
      if (idx >= 0) next.splice(idx, 0, 'tablet');
      else next.push('tablet');
      return next;
    });
  }, []);

  const handleRemoveBreakpoint = useCallback((bpId) => {
    if (bpId === 'desktop' || bpId === 'mobile') return;
    setActiveBreakpoints((prev) => prev.filter((b) => b !== bpId));
    if (focusedBp === bpId) handleExitFocus();
  }, [focusedBp, handleExitFocus]);

  // TopNav breakpoint click enters focus mode
  const handleBreakpointChange = useCallback((newBp) => {
    if (!activeBreakpoints.includes(newBp)) return;
    handleFocusBreakpoint(newBp);
  }, [activeBreakpoints, handleFocusBreakpoint]);

  const handleToggleAddElements = useCallback(() => setAddElementsOpen((v) => !v), []);

  const handleAddElementFromPanel = useCallback((componentId, componentName, defaultW, defaultH) => {
    const w = defaultW || 280;
    const desktopWidth = BREAKPOINTS.desktop.defaultWidth;
    const cx = desktopWidth / 2 - w / 2;
    const cy = 80 + elements.length * 30;
    const el = applyHeuristics(createElement(componentId, componentName, cx, cy, w, defaultH || 200));
    setElements((prev) => [...prev, el]);
    if (!focusedBp) handleFocusBreakpoint('desktop');
  }, [elements.length, focusedBp, handleFocusBreakpoint]);

  // --- Inspiration / Copilot handlers ---
  const handleOpenInspiration = useCallback(() => setInspirationPanelOpen(true), []);
  const handleCloseInspiration = useCallback(() => setInspirationPanelOpen(false), []);

  const handleComponentClick = useCallback(
    (component) => {
      setInputValue(component.prompt);
      setInspirationPanelOpen(false);
      setCopilotExpanded(true);
      setTimeout(() => {
        setShowContent(true);
        if (inputRef.current) inputRef.current.focus();
      }, prefersReducedMotion ? 0 : 200);
    },
    [prefersReducedMotion]
  );

  const handleAddToStage = useCallback((component, e) => {
    e.stopPropagation();
    setInspirationPanelOpen(false);
    const desktopWidth = BREAKPOINTS.desktop.defaultWidth;
    const cx = desktopWidth / 2 - 140;
    const cy = 80 + elements.length * 30;
    const el = applyHeuristics(createElement(component.id, component.name, cx, cy, 280, 200));
    setElements((prev) => [...prev, el]);
    if (!focusedBp) handleFocusBreakpoint('desktop');
  }, [elements.length, focusedBp, handleFocusBreakpoint]);

  const handleCollapse = useCallback(() => {
    if (!copilotExpanded) return;
    setShowContent(false);
    setTimeout(() => {
      setCopilotExpanded(false);
      setInputValue('');
    }, prefersReducedMotion ? 0 : 150);
  }, [copilotExpanded, prefersReducedMotion]);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim()) return;
    setIsGenerating(true);
    setShowContent(false);
    setTimeout(() => {
      setCopilotExpanded(false);
      setInputValue('');
    }, prefersReducedMotion ? 0 : 150);
    setTimeout(() => {
      setIsGenerating(false);
      const match = generativeComponents.find(
        (c) =>
          inputValue.toLowerCase().includes(c.id.toLowerCase()) ||
          inputValue.toLowerCase().includes(c.name.toLowerCase())
      );
      const comp = match || generativeComponents[0];
      const desktopWidth = BREAKPOINTS.desktop.defaultWidth;
      const cx = desktopWidth / 2 - 140;
      const cy = 80 + elements.length * 30;
      const el = applyHeuristics(createElement(comp.id, comp.name, cx, cy, 320, 220));
      setElements((prev) => [...prev, el]);
      if (!focusedBp) handleFocusBreakpoint('desktop');
    }, 1200);
  }, [inputValue, prefersReducedMotion, elements.length, focusedBp, handleFocusBreakpoint]);

  const handleExpandCopilot = useCallback(() => {
    setCopilotExpanded(true);
    setTimeout(() => {
      setShowContent(true);
      if (inputRef.current) inputRef.current.focus();
    }, prefersReducedMotion ? 0 : 200);
  }, [prefersReducedMotion]);

  // --- Canvas element handlers ---
  const handleDropComponent = useCallback(
    (componentId, componentName, x, y, defaultW, defaultH) => {
      const w = defaultW || 280;
      const h = defaultH || 200;
      const el = applyHeuristics(createElement(componentId, componentName, x - w / 2, y - h / 2, w, h));
      setElements((prev) => [...prev, el]);
    },
    []
  );

  const handleMoveElement = useCallback(
    (elId, dx, dy) => {
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== elId) return el;
          const bp = breakpointId;
          const current = el.responsiveProps[bp] || el.responsiveProps.desktop || {};
          const oldX = current.x?.value ?? 0;
          const oldY = current.y?.value ?? 0;
          return {
            ...el,
            responsiveProps: {
              ...el.responsiveProps,
              [bp]: {
                ...current,
                x: rv(oldX + dx, current.x?.unit || 'px'),
                y: rv(oldY + dy, current.y?.unit || 'px'),
              },
            },
          };
        })
      );
    },
    [breakpointId]
  );

  const handleResizeElement = useCallback(
    (elId, dw, dh, dx, dy) => {
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== elId) return el;
          const bp = breakpointId;
          const current = el.responsiveProps[bp] || el.responsiveProps.desktop || {};
          const oldW = current.width?.value ?? 280;
          const oldH = current.height?.value ?? 200;
          const oldX = current.x?.value ?? 0;
          const oldY = current.y?.value ?? 0;
          const newW = Math.max(60, oldW + dw);
          const newH = Math.max(40, oldH + dh);
          const clampedDx = dx ? (oldW + dw < 60 ? 0 : dx) : 0;
          const clampedDy = dy ? (oldH + dh < 40 ? 0 : dy) : 0;
          return {
            ...el,
            responsiveProps: {
              ...el.responsiveProps,
              [bp]: {
                ...current,
                width: rv(newW, current.width?.unit || 'px'),
                height: rv(newH, current.height?.unit || 'px'),
                ...(clampedDx ? { x: rv(oldX + clampedDx, current.x?.unit || 'px') } : {}),
                ...(clampedDy ? { y: rv(oldY + clampedDy, current.y?.unit || 'px') } : {}),
              },
            },
          };
        })
      );
    },
    [breakpointId]
  );

  const handleUpdateProp = useCallback(
    (propKey, value) => {
      if (!selectedElementId) return;
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedElementId) return el;
          const bp = breakpointId;
          const current = el.responsiveProps[bp] || {};
          return {
            ...el,
            responsiveProps: {
              ...el.responsiveProps,
              [bp]: { ...current, [propKey]: value },
            },
          };
        })
      );
    },
    [selectedElementId, breakpointId]
  );

  const handleChangeBehavior = useCallback(
    (behaviorKey) => {
      if (!selectedElementId) return;
      const beh = RESPONSIVE_BEHAVIORS[behaviorKey];
      if (!beh) return;
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedElementId) return el;
          const bp = breakpointId;
          const current = el.responsiveProps[bp] || el.responsiveProps.desktop || {};
          const oldW = current.width?.value ?? 280;
          const oldH = current.height?.value ?? 200;
          const oldX = current.x?.value ?? 0;
          const oldY = current.y?.value ?? 0;
          const newMarginUnit = defaultMarginUnit(behaviorKey);
          const wValue = (beh.widthUnit === 'auto' || beh.widthUnit === '%') ? oldW : pxToUnit(oldW, beh.widthUnit, 1280, ctx.canvasWidth);
          const hValue = (beh.heightUnit === 'auto' || beh.heightUnit === '%') ? oldH : pxToUnit(oldH, beh.heightUnit, 1280, ctx.canvasWidth);
          const xValue = pxToUnit(oldX, newMarginUnit, 1280, ctx.canvasWidth);
          const yValue = pxToUnit(oldY, newMarginUnit, 1280, ctx.canvasWidth);
          return {
            ...el,
            behavior: behaviorKey,
            responsiveProps: {
              ...el.responsiveProps,
              [bp]: {
                ...current,
                width: rv(wValue, beh.widthUnit === 'auto' ? 'px' : beh.widthUnit),
                height: rv(hValue, beh.heightUnit === 'auto' ? 'px' : beh.heightUnit),
                x: rv(xValue, newMarginUnit),
                y: rv(yValue, newMarginUnit),
              },
            },
          };
        })
      );
    },
    [selectedElementId, breakpointId]
  );

  const ctx = useMemo(() => {
    const fw = focusedBp ? BREAKPOINTS[focusedBp].defaultWidth : BREAKPOINTS.desktop.defaultWidth;
    return { canvasWidth: fw, parentWidth: fw, referenceWidth: 1280 };
  }, [focusedBp]);

  const handleRemoveElement = useCallback(() => {
    if (!selectedElementId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedElementId));
    setSelectedElementId(null);
  }, [selectedElementId]);

  const handleImportLayout = useCallback((rawText) => {
    try {
      const layouts = parseLayoutText(rawText);
      if (layouts.length === 0) return;
      const spec = layouts[0].value;
      const imported = layoutToElements(spec, referenceWidth);
      const withHeuristics = imported.map((el) => applyHeuristics(el));
      setElements(withHeuristics);
      setSelectedElementId(null);
    } catch (err) {
      console.error('Layout import failed:', err);
    }
  }, [referenceWidth]);

  // --- Keyboard ---
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (inspirationPanelOpen) setInspirationPanelOpen(false);
        else if (addElementsOpen) setAddElementsOpen(false);
        else if (copilotExpanded) handleCollapse();
        else if (focusedBp) handleExitFocus();
        else setSelectedElementId(null);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId && !copilotExpanded) {
        const tag = e.target.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          handleRemoveElement();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [inspirationPanelOpen, addElementsOpen, copilotExpanded, handleCollapse, focusedBp, handleExitFocus, selectedElementId, handleRemoveElement]);

  return (
    <div
      className="wix-studio-inspiration"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: tokens.fontUI,
        background: tokens.bgPageGradient,
        overflow: 'hidden',
        position: 'relative',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
    >
      <TopNav
        breakpointId={breakpointId}
        onBreakpointChange={handleBreakpointChange}
        activeBreakpoints={activeBreakpoints}
        focusedBp={focusedBp}
        onExitFocus={handleExitFocus}
        elementCount={elements.length}
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <LeftSidebar
          width={leftSidebarWidth}
          onOpenInspiration={handleOpenInspiration}
          onToggleAddElements={handleToggleAddElements}
          addElementsOpen={addElementsOpen}
        />
        <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
          <AddElementsPanel
            open={addElementsOpen}
            onClose={() => setAddElementsOpen(false)}
            onAddElement={handleAddElementFromPanel}
          />
          <CanvasArea
            canvasHeight={canvasHeight}
            elements={elements}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onMoveElement={handleMoveElement}
            onResizeElement={handleResizeElement}
            onDropComponent={handleDropComponent}
            breakpointId={breakpointId}
            referenceWidth={referenceWidth}
            isGenerating={isGenerating}
            uniqueId={uniqueId}
            zoom={zoom}
            onZoomChange={setZoom}
            onOpenInspiration={handleOpenInspiration}
            focusedBp={focusedBp}
            activeBreakpoints={activeBreakpoints}
            onFocus={handleFocusBreakpoint}
            onExitFocus={handleExitFocus}
            onAddBreakpoint={handleAddBreakpoint}
          >
            <Copilot
              expanded={copilotExpanded}
              showContent={showContent}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onExpand={handleExpandCopilot}
              onCollapse={handleCollapse}
              onSubmit={handleSubmit}
              inputRef={inputRef}
              copilotRef={copilotRef}
              prefersReducedMotion={prefersReducedMotion}
              smoothEase={smoothEase}
            />
          </CanvasArea>
        </div>
        <InspectorPanel
          open={inspectorOpen}
          onToggle={() => setInspectorOpen((v) => !v)}
          element={selectedElement}
          breakpointId={breakpointId}
          onUpdateProp={handleUpdateProp}
          onChangeBehavior={handleChangeBehavior}
          onRemoveElement={handleRemoveElement}
        />
      </div>

      <InspirationPanel
        open={inspirationPanelOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClose={handleCloseInspiration}
        components={generativeComponents}
        artImages={generativeArtImages}
        hoveredComponent={hoveredComponent}
        onHoverComponent={setHoveredComponent}
        onComponentClick={handleComponentClick}
        onAddToStage={handleAddToStage}
        prefersReducedMotion={prefersReducedMotion}
      />

      <style>{`
        @keyframes ${uniqueId}-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .wix-studio-inspiration *::-webkit-scrollbar { width: 6px; height: 6px; }
        .wix-studio-inspiration *::-webkit-scrollbar-track { background: transparent; }
        .wix-studio-inspiration *::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.10);
          border-radius: 3px;
        }
        .wix-studio-inspiration *::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.18);
        }
        .wix-studio-inspiration textarea::placeholder { color: ${tokens.text3}; }
        @media (prefers-reduced-motion: reduce) {
          .wix-studio-inspiration *, .wix-studio-inspiration *::before, .wix-studio-inspiration *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
