import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { generativeComponents, generativeArtImages } from './data/components.js';
import { TopNav } from './ui/TopNav.jsx';
import { LeftSidebar } from './ui/LeftSidebar.jsx';
import { InspirationPanel } from './ui/InspirationPanel.jsx';
import { Copilot } from './ui/Copilot.jsx';
import { CanvasArea } from './ui/CanvasArea.jsx';
import { InspectorPanel } from './ui/InspectorPanel.jsx';
import { AddElementsPanel } from './ui/AddElementsPanel.jsx';
import { LayersPanel } from './ui/LayersPanel.jsx';
import { createElement, rv, BREAKPOINTS, RESPONSIVE_BEHAVIORS, defaultMarginUnit, pxToUnit, resolveUnit, createBreakpointSet } from './engine/responsiveUnits.js';
import { applyHeuristics } from './engine/heuristics.js';
import { parseLayoutText, layoutToElements } from './engine/layoutParser.js';
import { parseCopilotCommand } from './engine/copilotParser.js';
import { detachAnchors, reattachAnchor, findAnchorAbove, layoutMesh } from './engine/meshLayout.js';
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

  const [sections, setSections] = useState([
    { id: 'sec-default', height: 800, behavior: 'auto', label: 'Section 1' },
  ]);
  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [addElementsOpen, setAddElementsOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [breakpointId, setBreakpointId] = useState('desktop');
  const [activeBreakpoints, setActiveBreakpoints] = useState(['desktop', 'mobile']);
  const [customBreakpoints, setCustomBreakpoints] = useState([]);
  const [meshMode, setMeshMode] = useState(true);
  const [showGridlines, setShowGridlines] = useState(false);

  const { allBpMap, allBpIds } = useMemo(
    () => createBreakpointSet(customBreakpoints),
    [customBreakpoints]
  );

  const isHighestBreakpoint = allBpIds.length > 0 && breakpointId === allBpIds[0];

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

  const handleBreakpointChange = useCallback((newBp) => {
    if (!activeBreakpoints.includes(newBp)) return;
    setBreakpointId(newBp);
    setSelectedElementId(null);
  }, [activeBreakpoints]);

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

  const handleAddCustomBreakpoint = useCallback((width) => {
    const id = `bp-${width}`;
    if (customBreakpoints.some((b) => b.id === id)) return;
    const newBp = {
      id,
      label: `${width}px`,
      defaultWidth: width,
      lucideIcon: 'Monitor',
      isCustom: true,
    };
    setCustomBreakpoints((prev) => [...prev, newBp]);
    setActiveBreakpoints((prev) => {
      if (prev.includes(id)) return prev;
      const all = [...prev, id];
      const { allBpMap: tempMap, allBpIds: tempIds } = createBreakpointSet([...customBreakpoints, newBp]);
      return tempIds.filter((bpId) => all.includes(bpId) || bpId === id);
    });
  }, [customBreakpoints]);

  const handleRemoveCustomBreakpoint = useCallback((bpId) => {
    setCustomBreakpoints((prev) => prev.filter((b) => b.id !== bpId));
    setActiveBreakpoints((prev) => prev.filter((b) => b !== bpId));
    if (breakpointId === bpId) setBreakpointId('desktop');
  }, [breakpointId]);

  const handleToggleAddElements = useCallback(() => setAddElementsOpen((v) => !v), []);
  const handleToggleLayers = useCallback(() => setLayersOpen((v) => !v), []);

  const ctx = useMemo(() => {
    const bpDef = allBpMap[breakpointId] || BREAKPOINTS[breakpointId] || BREAKPOINTS.desktop;
    const fw = bpDef.defaultWidth;
    return { canvasWidth: fw, parentWidth: fw, referenceWidth: 1280, allBpIds };
  }, [breakpointId, allBpMap, allBpIds]);

  const handleAddElementFromPanel = useCallback((componentId, componentName, defaultW, defaultH) => {
    const w = defaultW || 280;
    const bpDef = allBpMap[breakpointId] || BREAKPOINTS[breakpointId] || BREAKPOINTS.desktop;
    const bpWidth = bpDef.defaultWidth;
    const cx = bpWidth / 2 - w / 2;
    const sectionId = sections[sections.length - 1]?.id || 'sec-default';
    const sectionEls = elements.filter((el) => el.sectionId === sectionId);
    const cy = 80 + sectionEls.length * 30;
    const el = applyHeuristics(createElement(componentId, componentName, cx, cy, w, defaultH || 200));
    el.sectionId = sectionId;
    setElements((prev) => {
      const next = [...prev, el];
      if (meshMode) {
        return reattachAnchor(next, el.id, breakpointId, ctx);
      }
      return next;
    });
    setAddElementsOpen(false);
  }, [elements.length, breakpointId, sections, meshMode, ctx, allBpMap]);

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
  }, [elements.length]);

  const handleCollapse = useCallback(() => {
    if (!copilotExpanded) return;
    setShowContent(false);
    setTimeout(() => {
      setCopilotExpanded(false);
      setInputValue('');
    }, prefersReducedMotion ? 0 : 150);
  }, [copilotExpanded, prefersReducedMotion]);

  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, isError = false) => {
    setToast({ message, isError, key: Date.now() });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const handleDuplicateElement = useCallback(() => {
    if (!selectedElementId) return;
    setElements((prev) => {
      const src = prev.find((el) => el.id === selectedElementId);
      if (!src) return prev;
      const clone = {
        ...src,
        id: `el-dup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        responsiveProps: JSON.parse(JSON.stringify(src.responsiveProps)),
        zIndex: prev.length + 1,
      };
      const bp = breakpointId;
      const current = clone.responsiveProps[bp] || clone.responsiveProps.desktop || {};
      if (current.x) current.x = { ...current.x, value: (current.x.value ?? 0) + 20 };
      if (current.y) current.y = { ...current.y, value: (current.y.value ?? 0) + 20 };
      clone.responsiveProps[bp] = current;
      setSelectedElementId(clone.id);
      return [...prev, clone];
    });
  }, [selectedElementId, breakpointId]);

  const executeCopilotCommand = useCallback((text) => {
    const cmd = parseCopilotCommand(text);
    const bpDef = allBpMap[breakpointId] || BREAKPOINTS[breakpointId] || BREAKPOINTS.desktop;
    const bpWidth = bpDef.defaultWidth;

    switch (cmd.type) {
      case 'add_elements': {
        const targetSec = sections[sections.length - 1]?.id || 'sec-default';
        const newEls = [];
        for (let i = 0; i < cmd.count; i++) {
          const cx = bpWidth / 2 - cmd.elementType.defaultW / 2 + i * 24;
          const cy = 80 + (elements.length + i) * 30;
          const el = applyHeuristics(createElement(
            cmd.elementType.id, cmd.elementType.name,
            cx, cy, cmd.elementType.defaultW, cmd.elementType.defaultH
          ));
          el.sectionId = targetSec;
          newEls.push(el);
        }
        setElements((prev) => [...prev, ...newEls]);
        showToast(`Added ${cmd.count} ${cmd.elementType.name}${cmd.count > 1 ? 's' : ''}`);
        break;
      }
      case 'remove_selected':
        if (selectedElementId) {
          const name = elements.find((e) => e.id === selectedElementId)?.name || 'element';
          setElements((prev) => prev.filter((el) => el.id !== selectedElementId));
          setSelectedElementId(null);
          showToast(`Removed ${name}`);
        } else {
          showToast('No element selected', true);
        }
        break;
      case 'remove_by_type': {
        const toRemove = elements
          .filter((el) => el.componentId === cmd.elementType)
          .slice(0, cmd.count);
        if (toRemove.length > 0) {
          const ids = new Set(toRemove.map((el) => el.id));
          setElements((prev) => prev.filter((el) => !ids.has(el.id)));
          if (selectedElementId && ids.has(selectedElementId)) setSelectedElementId(null);
          showToast(`Removed ${toRemove.length} ${cmd.elementType}${toRemove.length > 1 ? 's' : ''}`);
        } else {
          showToast(`No ${cmd.elementType} elements found`, true);
        }
        break;
      }
      case 'clear_all':
        setElements([]);
        setSelectedElementId(null);
        showToast('Canvas cleared');
        break;
      case 'switch_breakpoint':
        if (activeBreakpoints.includes(cmd.breakpoint)) {
          setBreakpointId(cmd.breakpoint);
          setSelectedElementId(null);
          showToast(`Switched to ${BREAKPOINTS[cmd.breakpoint].label}`);
        } else {
          showToast(`${cmd.breakpoint} breakpoint not active`, true);
        }
        break;
      case 'duplicate':
        if (!selectedElementId) {
          showToast('Select an element to duplicate', true);
          break;
        }
        for (let i = 0; i < cmd.count; i++) {
          setTimeout(() => handleDuplicateElement(), i * 50);
        }
        showToast(`Duplicated ${cmd.count} time${cmd.count > 1 ? 's' : ''}`);
        break;
      default:
        showToast(`I didn't understand "${text}"`, true);
    }
  }, [elements, selectedElementId, breakpointId, activeBreakpoints, handleDuplicateElement, showToast]);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim()) return;
    setShowContent(false);
    setTimeout(() => {
      setCopilotExpanded(false);
      setInputValue('');
    }, prefersReducedMotion ? 0 : 150);
    executeCopilotCommand(inputValue);
  }, [inputValue, prefersReducedMotion, executeCopilotCommand]);

  const handleQuickCommand = useCallback((text) => {
    executeCopilotCommand(text);
  }, [executeCopilotCommand]);

  const handleExpandCopilot = useCallback(() => {
    setCopilotExpanded(true);
    setTimeout(() => {
      setShowContent(true);
      if (inputRef.current) inputRef.current.focus();
    }, prefersReducedMotion ? 0 : 200);
  }, [prefersReducedMotion]);

  // --- Canvas element handlers ---
  const handleDropComponent = useCallback(
    (componentId, componentName, x, y, defaultW, defaultH, sectionId) => {
      const w = defaultW || 280;
      const h = defaultH || 200;
      const el = applyHeuristics(createElement(componentId, componentName, x - w / 2, y - h / 2, w, h));
      el.sectionId = sectionId || sections[sections.length - 1]?.id || 'sec-default';
      setElements((prev) => {
        const next = [...prev, el];
        if (meshMode) {
          return reattachAnchor(next, el.id, breakpointId, ctx);
        }
        return next;
      });
      setAddElementsOpen(false);
    },
    [sections, meshMode, breakpointId, ctx]
  );

  const handleMoveElement = useCallback(
    (elId, dx, dy) => {
      setElements((prev) => {
        let updated = meshMode ? detachAnchors(prev, elId, breakpointId, ctx) : prev;
        updated = updated.map((el) => {
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
        });
        if (meshMode) {
          updated = reattachAnchor(updated, elId, breakpointId, ctx);
        }
        return updated;
      });
    },
    [breakpointId, meshMode, ctx]
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
          const isStretch = beh.widthUnit === '%' && beh.heightUnit === '%';
          const wValue = beh.widthUnit === '%' ? 100 : beh.widthUnit === 'auto' ? oldW : pxToUnit(oldW, beh.widthUnit, 1280, ctx.canvasWidth);
          const hValue = beh.heightUnit === '%' ? 100 : beh.heightUnit === 'auto' ? oldH : pxToUnit(oldH, beh.heightUnit, 1280, ctx.canvasWidth);
          const xValue = isStretch ? 0 : pxToUnit(oldX, newMarginUnit, 1280, ctx.canvasWidth);
          const yValue = isStretch ? 0 : pxToUnit(oldY, newMarginUnit, 1280, ctx.canvasWidth);
          return {
            ...el,
            behavior: behaviorKey,
            responsiveProps: {
              ...el.responsiveProps,
              [bp]: {
                ...current,
                width: rv(wValue, beh.widthUnit === 'auto' ? 'px' : beh.widthUnit),
                height: rv(hValue, beh.heightUnit === 'auto' ? 'px' : beh.heightUnit),
                x: rv(xValue, isStretch ? 'px' : newMarginUnit),
                y: rv(yValue, isStretch ? 'px' : newMarginUnit),
              },
            },
          };
        })
      );
    },
    [selectedElementId, breakpointId]
  );

  const handleRemoveElement = useCallback(() => {
    if (!selectedElementId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedElementId));
    setSelectedElementId(null);
  }, [selectedElementId]);

  const handleUpdateDocking = useCallback((elId, mode) => {
    const newUnit = mode === 'dock' ? 'px' : 'spx';
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== elId) return el;
        const bp = breakpointId;
        const current = el.responsiveProps[bp] || el.responsiveProps.desktop || {};
        const xPx = resolveUnit(current.x, { canvasWidth: referenceWidth, parentWidth: referenceWidth, referenceWidth }) || 0;
        const yPx = resolveUnit(current.y, { canvasWidth: referenceWidth, parentWidth: referenceWidth, referenceWidth }) || 0;
        const xVal = newUnit === 'spx' ? pxToUnit(xPx, 'spx', referenceWidth, referenceWidth, referenceWidth) : xPx;
        const yVal = newUnit === 'spx' ? pxToUnit(yPx, 'spx', referenceWidth, referenceWidth, referenceWidth) : yPx;
        return {
          ...el,
          responsiveProps: {
            ...el.responsiveProps,
            [bp]: {
              ...current,
              x: { value: xVal, unit: newUnit },
              y: { value: yVal, unit: newUnit },
            },
          },
        };
      })
    );
  }, [breakpointId, referenceWidth]);

  // --- Parking Lot handlers ---
  const handleParkElement = useCallback((elId, side, plX, plY) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== elId) return el;
        const bp = breakpointId;
        const current = el.responsiveProps[bp] || el.responsiveProps.desktop || {};
        return {
          ...el,
          location: 'parkingLot',
          parkingSide: side,
          responsiveProps: {
            ...el.responsiveProps,
            [bp]: {
              ...current,
              x: rv(plX, current.x?.unit || 'px'),
              y: rv(plY, current.y?.unit || 'px'),
            },
          },
        };
      })
    );
  }, [breakpointId]);

  const handleUnparkElement = useCallback((elId) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== elId) return el;
        const bpDef = allBpMap[breakpointId] || BREAKPOINTS[breakpointId] || BREAKPOINTS.desktop;
        const desktopWidth = bpDef.defaultWidth;
        const bp = breakpointId;
        const current = el.responsiveProps[bp] || el.responsiveProps.desktop || {};
        const elW = current.width?.value ?? 280;
        const targetSection = el.sectionId || sections[0]?.id || 'sec-default';
        return {
          ...el,
          location: 'stage',
          parkingSide: undefined,
          sectionId: targetSection,
          responsiveProps: {
            ...el.responsiveProps,
            [bp]: {
              ...current,
              x: rv(desktopWidth / 2 - elW / 2, current.x?.unit || 'px'),
              y: rv(80, current.y?.unit || 'px'),
            },
          },
        };
      })
    );
  }, [breakpointId]);

  const handleImportLayout = useCallback((rawText) => {
    try {
      const layouts = parseLayoutText(rawText);
      if (layouts.length === 0) return;
      const spec = layouts[0].value;
      const result = layoutToElements(spec, referenceWidth);
      const withHeuristics = result.elements.map((el) => applyHeuristics(el));
      setSections(result.sections);
      setElements(withHeuristics);
      setSelectedElementId(null);
    } catch (err) {
      console.error('Layout import failed:', err);
    }
  }, [referenceWidth]);

  const handleAddLayout = useCallback((spec) => {
    try {
      const result = layoutToElements(spec, referenceWidth);
      const withHeuristics = result.elements.map((el) => applyHeuristics(el));
      setSections(result.sections);
      setElements(withHeuristics);
      setSelectedElementId(null);
      setAddElementsOpen(false);
    } catch (err) {
      console.error('Layout add failed:', err);
    }
  }, [referenceWidth]);

  const handleAddSection = useCallback((afterSectionId) => {
    const newSec = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      height: 480,
      behavior: 'auto',
      label: `Section ${sections.length + 1}`,
    };
    setSections((prev) => {
      if (!afterSectionId) return [...prev, newSec];
      const idx = prev.findIndex((s) => s.id === afterSectionId);
      const out = [...prev];
      out.splice(idx + 1, 0, newSec);
      return out;
    });
  }, [sections.length]);

  const handleRemoveSection = useCallback((sectionId) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    setElements((prev) => prev.filter((el) => el.sectionId !== sectionId));
  }, []);

  const handleAddSectionFromPreset = useCallback((spec) => {
    try {
      const result = layoutToElements(spec, referenceWidth);
      const withHeuristics = result.elements.map((el) => applyHeuristics(el));
      setSections((prev) => [...prev, ...result.sections]);
      setElements((prev) => [...prev, ...withHeuristics]);
      setAddElementsOpen(false);
    } catch (err) {
      console.error('Section preset add failed:', err);
    }
  }, [referenceWidth]);

  // --- Duplicate element ---
  // --- Keyboard ---
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (previewMode) setPreviewMode(false);
        else if (inspirationPanelOpen) setInspirationPanelOpen(false);
        else if (addElementsOpen) setAddElementsOpen(false);
        else if (copilotExpanded) handleCollapse();
        else setSelectedElementId(null);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId && !copilotExpanded) {
        const tag = e.target.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          handleRemoveElement();
        }
      }
      if (e.key === 'd' && (e.metaKey || e.ctrlKey) && selectedElementId && !copilotExpanded) {
        const tag = e.target.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          e.preventDefault();
          handleDuplicateElement();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [previewMode, inspirationPanelOpen, addElementsOpen, copilotExpanded, handleCollapse, selectedElementId, handleRemoveElement, handleDuplicateElement]);

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
      {!previewMode && (
        <TopNav
          breakpointId={breakpointId}
          onBreakpointChange={handleBreakpointChange}
          activeBreakpoints={activeBreakpoints}
          allBpMap={allBpMap}
          elementCount={elements.length}
          onTogglePreview={() => setPreviewMode(true)}
          meshMode={meshMode}
          onToggleMesh={() => setMeshMode((v) => !v)}
          showGridlines={showGridlines}
          onToggleGridlines={() => setShowGridlines((v) => !v)}
          onAddCustomBreakpoint={handleAddCustomBreakpoint}
          onRemoveCustomBreakpoint={handleRemoveCustomBreakpoint}
        />
      )}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {!previewMode && (
          <LeftSidebar
            width={leftSidebarWidth}
            onOpenInspiration={handleOpenInspiration}
            onToggleAddElements={handleToggleAddElements}
            addElementsOpen={addElementsOpen}
            onToggleLayers={handleToggleLayers}
            layersOpen={layersOpen}
          />
        )}
        <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
          {!previewMode && (
            <>
              <AddElementsPanel
                open={addElementsOpen}
                onClose={() => setAddElementsOpen(false)}
                onAddElement={handleAddElementFromPanel}
                onAddLayout={handleAddLayout}
                onAddSection={handleAddSectionFromPreset}
              />
              <LayersPanel
                open={layersOpen}
                onClose={() => setLayersOpen(false)}
                elements={elements}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
              />
            </>
          )}
          <CanvasArea
            canvasHeight={canvasHeight}
            elements={elements}
            sections={sections}
            selectedElementId={previewMode ? null : selectedElementId}
            onSelectElement={previewMode ? () => {} : setSelectedElementId}
            onMoveElement={handleMoveElement}
            onResizeElement={handleResizeElement}
            onDropComponent={handleDropComponent}
            onUnparkElement={handleUnparkElement}
            onAddSection={handleAddSection}
            onRemoveSection={handleRemoveSection}
            breakpointId={breakpointId}
            referenceWidth={referenceWidth}
            isGenerating={isGenerating}
            uniqueId={uniqueId}
            onOpenInspiration={handleOpenInspiration}
            previewMode={previewMode}
            meshMode={meshMode}
            showGridlines={showGridlines}
            isHighestBreakpoint={isHighestBreakpoint}
          >
            {!previewMode && (
              <Copilot
                expanded={copilotExpanded}
                showContent={showContent}
                inputValue={inputValue}
                onInputChange={setInputValue}
                onExpand={handleExpandCopilot}
                onCollapse={handleCollapse}
                onSubmit={handleSubmit}
                onQuickCommand={handleQuickCommand}
                inputRef={inputRef}
                copilotRef={copilotRef}
                prefersReducedMotion={prefersReducedMotion}
                smoothEase={smoothEase}
              />
            )}
            {previewMode && (
              <button
                onClick={() => setPreviewMode(false)}
                style={{
                  position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                  padding: '8px 20px', fontSize: 13, fontWeight: 500, color: '#fff',
                  backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 20,
                  cursor: 'pointer', zIndex: 200, backdropFilter: 'blur(8px)',
                  transition: `opacity 200ms ${tokens.easeOut}`,
                }}
              >
                Exit Preview
              </button>
            )}
          </CanvasArea>
        </div>
        {!previewMode && (
          <InspectorPanel
            open={inspectorOpen}
            onToggle={() => setInspectorOpen((v) => !v)}
            element={selectedElement}
            breakpointId={breakpointId}
            onUpdateProp={handleUpdateProp}
            onChangeBehavior={handleChangeBehavior}
            onRemoveElement={handleRemoveElement}
            onParkElement={handleParkElement}
            onUnparkElement={handleUnparkElement}
            onUpdateDocking={handleUpdateDocking}
            isHighestBreakpoint={isHighestBreakpoint}
          />
        )}
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

      {toast && (
        <div
          key={toast.key}
          style={{
            position: 'fixed',
            bottom: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            borderRadius: tokens.radiusLg,
            backgroundColor: toast.isError ? '#EF4444' : tokens.neutralDark,
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: tokens.fontUI,
            zIndex: 9999,
            boxShadow: tokens.shadowElevated,
            animation: 'toast-in 300ms ease-out',
            pointerEvents: 'none',
          }}
        >
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes ${uniqueId}-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .wix-studio-inspiration *::-webkit-scrollbar { width: 6px; height: 6px; }
        .wix-studio-inspiration *::-webkit-scrollbar-track { background: transparent; }
        .wix-studio-inspiration *::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.10);
          border-radius: 3px;
        }
        .wix-studio-inspiration *::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.18);
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
