/**
 * Mesh Layout Engine
 *
 * In Mesh mode, elements form vertical anchor chains within a section.
 * Each element's Y position is computed as:
 *   anchor.bottom + topOffset
 * When an anchor grows (e.g. text wraps), everything below pushes down.
 *
 * In No-Mesh mode, elements use raw x/y as margins from the section corner.
 */

import { resolveUnit, RESPONSIVE_BEHAVIORS } from './responsiveUnits.js';

/**
 * Find the lowest element above `top` that horizontally overlaps [left, left+width].
 * Returns the element object or null.
 */
export function findAnchorAbove(laidElements, top, left, width) {
  let best = null;
  for (const el of laidElements) {
    if (el.id == null) continue;
    const elBottom = el.y + el.h;
    if (elBottom > top) continue;
    const overlaps = el.x < left + width && el.x + el.w > left;
    if (!overlaps) continue;
    const bestBottom = best ? best.y + best.h : -Infinity;
    if (!best || elBottom > bestBottom) best = el;
  }
  return best;
}

/**
 * Resolve mesh positions for all elements in a section.
 *
 * @param {Array} sectionElements - elements belonging to this section
 * @param {string} breakpointId
 * @param {object} ctx - { canvasWidth, parentWidth, referenceWidth, parentHeight }
 * @param {boolean} meshMode - when false, anchors are ignored
 * @param {Map} [naturalHeights] - measured heights for auto-height elements
 * @returns {Array<{ id, x, y, w, h, anchorId, anchorBottom }>}
 */
export function layoutMesh(sectionElements, breakpointId, ctx, meshMode = true, naturalHeights = null) {
  const cascade = breakpointId === 'mobile'
    ? ['mobile', 'tablet', 'desktop']
    : breakpointId === 'tablet'
    ? ['tablet', 'desktop']
    : ['desktop'];

  function resolveProps(el) {
    const merged = {};
    for (const bp of cascade) {
      const bpProps = el.responsiveProps?.[bp];
      if (bpProps) {
        for (const key of Object.keys(bpProps)) {
          if (bpProps[key] !== undefined) merged[key] = bpProps[key];
        }
      }
    }
    const heightCtx = ctx.parentHeight ? { ...ctx, parentWidth: ctx.parentHeight } : ctx;
    const resolved = {};
    for (const key of Object.keys(merged)) {
      const isHeightProp = key === 'height' || key === 'y';
      resolved[key] = resolveUnit(merged[key], isHeightProp ? heightCtx : ctx);
    }
    return resolved;
  }

  const byId = {};
  const laid = [];

  const sorted = topologicalSort(sectionElements);

  for (const el of sorted) {
    const r = resolveProps(el);
    const x = r.x === 'auto' ? 0 : (r.x ?? 0);
    const y = r.y === 'auto' ? 0 : (r.y ?? 0);
    const w = r.width === 'auto' ? 280 : (r.width ?? 280);
    let h = r.height === 'auto' ? 200 : (r.height ?? 200);

    const isText = ['title', 'paragraph', 'text'].includes(el.componentId);
    const beh = el.behavior && RESPONSIVE_BEHAVIORS[el.behavior];
    const autoHeight = (beh && beh.heightUnit === 'auto') || isText;
    if (autoHeight && naturalHeights) {
      const nat = naturalHeights.get(el.id);
      if (nat != null && nat > h) h = nat;
    }

    let resolvedY;
    if (meshMode && el.anchorId && byId[el.anchorId]) {
      const anchor = byId[el.anchorId];
      resolvedY = anchor.y + anchor.h + y;
    } else {
      resolvedY = y;
    }

    const entry = {
      id: el.id,
      x,
      y: resolvedY,
      w,
      h,
      anchorId: el.anchorId || null,
      anchorBottom: meshMode && el.anchorId && byId[el.anchorId]
        ? byId[el.anchorId].y + byId[el.anchorId].h
        : null,
    };
    byId[el.id] = entry;
    laid.push(entry);
  }

  return laid;
}

function topologicalSort(elements) {
  const byId = new Map(elements.map(el => [el.id, el]));
  const visited = new Set();
  const result = [];

  function visit(el) {
    if (visited.has(el.id)) return;
    visited.add(el.id);
    if (el.anchorId && byId.has(el.anchorId)) {
      visit(byId.get(el.anchorId));
    }
    result.push(el);
  }

  for (const el of elements) visit(el);
  return result;
}

/**
 * Before dragging: convert anchor-relative Y to absolute section-relative Y,
 * clear anchorId on the dragged element AND on any elements anchored to it.
 */
export function detachAnchors(elements, elId, breakpointId, ctx) {
  const sectionElements = elements.filter(el => el.sectionId === elements.find(e => e.id === elId)?.sectionId);
  const laid = layoutMesh(sectionElements, breakpointId, ctx, true);
  const laidById = new Map(laid.map(l => [l.id, l]));

  return elements.map(el => {
    if (el.id === elId) {
      const laidEl = laidById.get(elId);
      if (!laidEl || !el.anchorId) return { ...el, anchorId: null };
      const bp = breakpointId;
      const current = el.responsiveProps[bp] || el.responsiveProps.desktop || {};
      return {
        ...el,
        anchorId: null,
        responsiveProps: {
          ...el.responsiveProps,
          [bp]: {
            ...current,
            y: { value: laidEl.y, unit: current.y?.unit || 'px' },
          },
        },
      };
    }
    if (el.anchorId === elId) {
      const laidEl = laidById.get(el.id);
      if (!laidEl) return { ...el, anchorId: null };
      const bp = breakpointId;
      const current = el.responsiveProps[bp] || el.responsiveProps.desktop || {};
      return {
        ...el,
        anchorId: null,
        responsiveProps: {
          ...el.responsiveProps,
          [bp]: {
            ...current,
            y: { value: laidEl.y, unit: current.y?.unit || 'px' },
          },
        },
      };
    }
    return el;
  });
}

/**
 * After dropping: find the best anchor above and reattach.
 * Stores the Y offset from anchor bottom (not absolute Y).
 */
export function reattachAnchor(elements, elId, breakpointId, ctx) {
  const el = elements.find(e => e.id === elId);
  if (!el) return elements;

  const sectionElements = elements.filter(e =>
    e.sectionId === el.sectionId && e.location !== 'parkingLot'
  );
  const laid = layoutMesh(
    sectionElements.filter(e => e.id !== elId),
    breakpointId,
    ctx,
    true
  );

  const bp = breakpointId;
  const current = el.responsiveProps[bp] || el.responsiveProps.desktop || {};
  const elY = current.y?.value ?? 0;
  const elX = current.x?.value ?? 0;
  const elW = current.width?.value ?? 280;

  const anchor = findAnchorAbove(laid, elY, elX, elW);

  if (!anchor) return elements;

  const anchorBottom = anchor.y + anchor.h;
  const offset = Math.max(0, elY - anchorBottom);

  return elements.map(e => {
    if (e.id !== elId) return e;
    const cur = e.responsiveProps[bp] || e.responsiveProps.desktop || {};
    return {
      ...e,
      anchorId: anchor.id,
      responsiveProps: {
        ...e.responsiveProps,
        [bp]: {
          ...cur,
          y: { value: offset, unit: cur.y?.unit || 'px' },
        },
      },
    };
  });
}
