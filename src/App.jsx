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
import { BottomToolbar } from './ui/BottomToolbar.jsx';
import { createElement, rv, BREAKPOINTS, RESPONSIVE_BEHAVIORS, defaultMarginUnit, pxToUnit, resolveUnit, createBreakpointSet } from './engine/responsiveUnits.js';
import { applyHeuristics } from './engine/heuristics.js';
import { parseLayoutText, layoutToElements } from './engine/layoutParser.js';
import { detachAnchors, reattachAnchor } from './engine/meshLayout.js';
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
  const [selectedElementIds, setSelectedElementIds] = useState(new Set());
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [addElementsOpen, setAddElementsOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [zoom, setZoom] = useState(100);

  // Always in focus mode — one breakpoint at a time (Wix Studio style)
  const [focusedBp, setFocusedBp] = useState('desktop');
  // Which breakpoints are shown in overview (tablet is optional)
  const [activeBreakpoints, setActiveBreakpoints] = useState(['desktop', 'mobile']);
  const [customBreakpoints, setCustomBreakpoints] = useState([]);
  const [meshMode, setMeshMode] = useState(true);
  const [showGridlines, setShowGridlines] = useState(false);

  const { allBpMap, allBpIds } = useMemo(
    () => createBreakpointSet(customBreakpoints),
    [customBreakpoints]
  );

  // breakpointId is derived: in focus mode it's the focused bp, in overview it's desktop
  const breakpointId = focusedBp || 'desktop';

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

  const handleSelectElement = useCallback((id, opts) => {
    if (opts?.lasso) {
      setSelectedElementIds(new Set(opts.ids));
      setSelectedElementId(opts.ids.length > 0 ? opts.ids[opts.ids.length - 1] : null);
      return;
    }
    if (id === null) {
      setSelectedElementId(null);
      setSelectedElementIds(new Set());
      return;
    }
    if (opts?.shift) {
      setSelectedElementIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          if (selectedElementId === id) {
            const remaining = [...next];
            setSelectedElementId(remaining.length > 0 ? remaining[remaining.length - 1] : null);
          }
        } else {
          next.add(id);
          if (selectedElementId) next.add(selectedElementId);
          setSelectedElementId(id);
        }
        return next;
      });
      return;
    }
    setSelectedElementId(id);
    setSelectedElementIds(new Set([id]));
  }, [selectedElementId]);

  // --- Focus mode handlers ---
  const handleFocusBreakpoint = useCallback((bpId) => {
    setFocusedBp(bpId);
    setSelectedElementId(null);
    setSelectedElementIds(new Set());
    setZoom(100);
  }, []);

  const handleExitFocus = useCallback(() => {
    setFocusedBp('desktop');
    setSelectedElementId(null);
    setSelectedElementIds(new Set());
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
      const { allBpIds: tempIds } = createBreakpointSet([...customBreakpoints, newBp]);
      return tempIds.filter((bpId) => all.includes(bpId) || bpId === id);
    });
  }, [customBreakpoints]);

  const handleRemoveCustomBreakpoint = useCallback((bpId) => {
    setCustomBreakpoints((prev) => prev.filter((b) => b.id !== bpId));
    setActiveBreakpoints((prev) => prev.filter((b) => b !== bpId));
    if (focusedBp === bpId) handleExitFocus();
  }, [focusedBp, handleExitFocus]);

  // TopNav breakpoint click enters focus mode
  const handleBreakpointChange = useCallback((newBp) => {
    if (!activeBreakpoints.includes(newBp)) return;
    handleFocusBreakpoint(newBp);
  }, [activeBreakpoints, handleFocusBreakpoint]);

  const handleToggleAddElements = useCallback(() => setAddElementsOpen((v) => !v), []);

  const ctx = useMemo(() => {
    const bpDef = focusedBp
      ? (allBpMap[focusedBp] || BREAKPOINTS[focusedBp] || BREAKPOINTS.desktop)
      : BREAKPOINTS.desktop;
    const fw = bpDef.defaultWidth;
    return { canvasWidth: fw, parentWidth: fw, referenceWidth: 1280, allBpIds };
  }, [focusedBp, allBpMap, allBpIds]);

  const handleAddElementFromPanel = useCallback((componentId, componentName, defaultW, defaultH) => {
    const w = defaultW || 280;
    const selectedEl = selectedElementId ? elements.find((e) => e.id === selectedElementId) : null;
    const targetParking = selectedEl?.location === 'parkingLot';

    if (targetParking) {
      const el = applyHeuristics(createElement(componentId, componentName, 40, 40, w, defaultH || 200));
      el.location = 'parkingLot';
      el.parkingSide = selectedEl.parkingSide || 'left';
      setElements((prev) => [...prev, el]);
      setAddElementsOpen(false);
      return;
    }

    const bpDef = allBpMap[breakpointId] || BREAKPOINTS[breakpointId] || BREAKPOINTS.desktop;
    const desktopWidth = bpDef.defaultWidth;
    const cx = desktopWidth / 2 - w / 2;
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
    if (!focusedBp) handleFocusBreakpoint('desktop');
  }, [elements, selectedElementId, focusedBp, handleFocusBreakpoint, meshMode, breakpointId, ctx, allBpMap, sections]);

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
        const idsToMove = selectedElementIds.size > 1 && selectedElementIds.has(elId)
          ? selectedElementIds
          : new Set([elId]);

        let updated = prev;
        if (meshMode) {
          for (const id of idsToMove) {
            updated = detachAnchors(updated, id, breakpointId, ctx);
          }
        }

        updated = updated.map((el) => {
          if (!idsToMove.has(el.id)) return el;
          if (el.location === 'parkingLot') {
            const bp = breakpointId;
            const current = el.responsiveProps[bp] || el.responsiveProps.desktop || {};
            const oldX = current.x?.value ?? 0;
            const oldY = current.y?.value ?? 0;
            return {
              ...el,
              responsiveProps: {
                ...el.responsiveProps,
                [bp]: { ...current, x: rv(oldX + dx, current.x?.unit || 'px'), y: rv(oldY + dy, current.y?.unit || 'px') },
              },
            };
          }
          const bp = breakpointId;
          const current = el.responsiveProps[bp] || el.responsiveProps.desktop || {};
          const oldX = current.x?.value ?? 0;
          const oldY = current.y?.value ?? 0;
          const sec = sections.find((s) => s.id === el.sectionId);
          const secH = sec?.height || 600;
          const elH = current.height?.value ?? 200;
          const minVisible = Math.max(10, elH * 0.2);
          const newY = Math.max(-elH + minVisible, Math.min(secH - minVisible, oldY + dy));
          return {
            ...el,
            responsiveProps: {
              ...el.responsiveProps,
              [bp]: {
                ...current,
                x: rv(oldX + dx, current.x?.unit || 'px'),
                y: rv(newY, current.y?.unit || 'px'),
              },
            },
          };
        });

        if (meshMode) {
          for (const id of idsToMove) {
            updated = reattachAnchor(updated, id, breakpointId, ctx);
          }
        }
        return updated;
      });
    },
    [breakpointId, meshMode, ctx, selectedElementIds]
  );

  const handleMoveElementToSection = useCallback(
    (elId, newSectionId, dropX, dropY) => {
      setElements((prev) => {
        let updated = prev;
        if (meshMode) {
          updated = detachAnchors(updated, elId, breakpointId, ctx);
        }
        updated = updated.map((el) => {
          if (el.id !== elId) return el;
          const bp = breakpointId;
          const current = el.responsiveProps[bp] || el.responsiveProps.desktop || {};
          return {
            ...el,
            sectionId: newSectionId,
            responsiveProps: {
              ...el.responsiveProps,
              [bp]: {
                ...current,
                x: rv(dropX, current.x?.unit || 'px'),
                y: rv(dropY, current.y?.unit || 'px'),
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

  const handleUpdateElementProps = useCallback(
    (propKey, value) => {
      if (!selectedElementId) return;
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedElementId) return el;
          return {
            ...el,
            props: { ...el.props, [propKey]: value },
          };
        })
      );
    },
    [selectedElementId]
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
    if (selectedElementIds.size > 0) {
      setElements((prev) => prev.filter((el) => !selectedElementIds.has(el.id)));
      setSelectedElementId(null);
      setSelectedElementIds(new Set());
    } else if (selectedElementId) {
      setElements((prev) => prev.filter((el) => el.id !== selectedElementId));
      setSelectedElementId(null);
    }
  }, [selectedElementId, selectedElementIds]);

  const handleUpdateDocking = useCallback((elId, mode) => {
    const newUnit = mode === 'dock' ? 'px' : 'spx';
    const refW = referenceWidth;
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== elId) return el;
        const bp = breakpointId;
        const current = el.responsiveProps[bp] || el.responsiveProps.desktop || {};
        const xPx = resolveUnit(current.x, { canvasWidth: refW, parentWidth: refW, referenceWidth: refW }) || 0;
        const yPx = resolveUnit(current.y, { canvasWidth: refW, parentWidth: refW, referenceWidth: refW }) || 0;
        const xVal = newUnit === 'spx' ? pxToUnit(xPx, 'spx', refW, refW, refW) : xPx;
        const yVal = newUnit === 'spx' ? pxToUnit(yPx, 'spx', refW, refW, refW) : yPx;
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

  const handleDropToParkingLot = useCallback((componentId, componentName, side, defaultW, defaultH) => {
    const w = defaultW || 280;
    const h = defaultH || 200;
    const el = applyHeuristics(createElement(componentId, componentName, 40, 40, w, h));
    el.location = 'parkingLot';
    el.parkingSide = side || 'left';
    setElements((prev) => [...prev, el]);
    setAddElementsOpen(false);
  }, []);

  const handleParkElement = useCallback((elId, side, dropX, dropY) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== elId) return el;
        const bp = breakpointId;
        const current = el.responsiveProps[bp] || el.responsiveProps.desktop || {};
        const updates = { ...current };
        if (dropX != null && dropY != null) {
          updates.x = rv(dropX, 'px');
          updates.y = rv(dropY, 'px');
        }
        return {
          ...el,
          location: 'parkingLot',
          parkingSide: side || 'left',
          responsiveProps: { ...el.responsiveProps, [bp]: updates },
        };
      })
    );
  }, [breakpointId]);

  const handleUnparkElement = useCallback((elId, dropX, dropY, targetSectionId) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== elId) return el;
        const fallbackSection = sections[0]?.id || 'sec-default';
        const bp = breakpointId;
        const current = el.responsiveProps[bp] || el.responsiveProps.desktop || {};
        const updates = { ...current };
        if (dropX != null && dropY != null) {
          updates.x = rv(dropX, 'px');
          updates.y = rv(dropY, 'px');
        }
        return {
          ...el,
          location: 'stage',
          parkingSide: undefined,
          sectionId: targetSectionId || el.sectionId || fallbackSection,
          responsiveProps: { ...el.responsiveProps, [bp]: updates },
        };
      })
    );
  }, [sections, breakpointId]);

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
      setSelectedElementIds(new Set());
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
      setSelectedElementIds(new Set());
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

  // --- Keyboard ---
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (previewMode) setPreviewMode(false);
        else if (inspirationPanelOpen) setInspirationPanelOpen(false);
        else if (addElementsOpen) setAddElementsOpen(false);
        else if (copilotExpanded) handleCollapse();
        else if (focusedBp) handleExitFocus();
        else { setSelectedElementId(null); setSelectedElementIds(new Set()); }
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
      {!previewMode && (
        <TopNav
          breakpointId={breakpointId}
          onBreakpointChange={handleBreakpointChange}
          activeBreakpoints={activeBreakpoints}
          allBpMap={allBpMap}
          focusedBp={focusedBp}
          onExitFocus={handleExitFocus}
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
            onToggleAddElements={handleToggleAddElements}
            addElementsOpen={addElementsOpen}
            onToggleLayers={() => setLayersOpen((v) => !v)}
            layersOpen={layersOpen}
          />
        )}
        <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
          {!previewMode && (
            <AddElementsPanel
              open={addElementsOpen}
              onClose={() => setAddElementsOpen(false)}
              onAddElement={handleAddElementFromPanel}
              onAddLayout={handleAddLayout}
              onAddSection={handleAddSectionFromPreset}
            />
          )}
          {!previewMode && (
            <LayersPanel
              open={layersOpen}
              onClose={() => setLayersOpen(false)}
              elements={elements}
              selectedElementId={selectedElementId}
              selectedElementIds={selectedElementIds}
              onSelectElement={handleSelectElement}
            />
          )}
          <CanvasArea
            canvasHeight={canvasHeight}
            elements={elements}
            sections={sections}
            selectedElementId={previewMode ? null : selectedElementId}
            selectedElementIds={previewMode ? new Set() : selectedElementIds}
            onSelectElement={previewMode ? () => {} : handleSelectElement}
            onMoveElement={handleMoveElement}
            onMoveElementToSection={handleMoveElementToSection}
            onResizeElement={handleResizeElement}
            onDropComponent={handleDropComponent}
            onParkElement={handleParkElement}
            onUnparkElement={handleUnparkElement}
            onDropToParkingLot={handleDropToParkingLot}
            onAddSection={handleAddSection}
            onRemoveSection={handleRemoveSection}
            breakpointId={breakpointId}
            referenceWidth={referenceWidth}
            isGenerating={isGenerating}
            uniqueId={uniqueId}
            zoom={previewMode ? 100 : zoom}
            onZoomChange={setZoom}
            onOpenInspiration={handleOpenInspiration}
            focusedBp={previewMode ? (focusedBp || 'desktop') : focusedBp}
            activeBreakpoints={activeBreakpoints}
            onFocus={handleFocusBreakpoint}
            onExitFocus={handleExitFocus}
            onAddBreakpoint={handleAddBreakpoint}
            previewMode={previewMode}
            meshMode={meshMode}
            showGridlines={showGridlines}
            isHighestBreakpoint={isHighestBreakpoint}
            allBpMap={allBpMap}
          >
            {!previewMode && (
              <div style={{ position: 'absolute', bottom: 64, left: '50%', transform: 'translateX(-50%)', zIndex: 100, pointerEvents: 'auto' }}>
                <BottomToolbar />
              </div>
            )}
            {/* Copilot hidden for now */}
            {previewMode && (
              <button
                onClick={() => setPreviewMode(false)}
                style={{
                  position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                  padding: '8px 20px', fontSize: 13, fontWeight: 500, color: '#fff',
                  backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 20,
                  cursor: 'pointer', zIndex: 200, backdropFilter: 'blur(8px)',
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
            onUpdateElementProps={handleUpdateElementProps}
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

      <style>{`
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
