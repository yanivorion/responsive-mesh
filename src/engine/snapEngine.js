const SNAP_THRESHOLD = 6; // px distance to trigger snap

/**
 * Build snap targets from the canvas and other elements.
 * Returns arrays of { value, type, label } for X and Y axes.
 */
export function buildSnapTargets(canvasWidth, canvasHeight, elements, excludeId) {
  const xTargets = [];
  const yTargets = [];

  xTargets.push({ value: 0, type: 'canvas', label: 'left' });
  xTargets.push({ value: canvasWidth, type: 'canvas', label: 'right' });
  xTargets.push({ value: canvasWidth / 2, type: 'canvas', label: 'centerX' });

  yTargets.push({ value: 0, type: 'canvas', label: 'top' });
  yTargets.push({ value: canvasHeight, type: 'canvas', label: 'bottom' });
  yTargets.push({ value: canvasHeight / 2, type: 'canvas', label: 'centerY' });

  for (const el of elements) {
    if (el.id === excludeId) continue;
    if (el.location === 'parkingLot') continue;

    const ex = el._resolvedX ?? 0;
    const ey = el._resolvedY ?? 0;
    const ew = el._resolvedW ?? 0;
    const eh = el._resolvedH ?? 0;

    xTargets.push({ value: ex, type: 'element', label: 'left', elId: el.id });
    xTargets.push({ value: ex + ew, type: 'element', label: 'right', elId: el.id });
    xTargets.push({ value: ex + ew / 2, type: 'element', label: 'centerX', elId: el.id });

    yTargets.push({ value: ey, type: 'element', label: 'top', elId: el.id });
    yTargets.push({ value: ey + eh, type: 'element', label: 'bottom', elId: el.id });
    yTargets.push({ value: ey + eh / 2, type: 'element', label: 'centerY', elId: el.id });
  }

  return { xTargets, yTargets };
}

/**
 * Find the nearest snap for a set of candidate edges on one axis.
 * `candidates` = array of { value, edge } where edge is 'left'|'right'|'center' etc.
 * `targets`    = array of { value, type, label }
 * Returns { snapped: bool, delta, guideLine } or null.
 */
function findNearest(candidates, targets, threshold) {
  let best = null;
  let bestDist = threshold + 1;

  for (const c of candidates) {
    for (const t of targets) {
      const dist = Math.abs(c.value - t.value);
      if (dist < bestDist) {
        bestDist = dist;
        best = { delta: t.value - c.value, guide: t.value, target: t, candidateEdge: c.edge };
      }
    }
  }

  if (best && bestDist <= threshold) {
    return { snapped: true, delta: best.delta, guide: best.guide, target: best.target, edge: best.candidateEdge };
  }
  return null;
}

/**
 * Compute snap adjustments for a moving element.
 * @param {number} x  - proposed element left
 * @param {number} y  - proposed element top
 * @param {number} w  - element width
 * @param {number} h  - element height
 * @param {{ xTargets, yTargets }} targets - from buildSnapTargets
 * @param {number} [threshold] - snap distance
 * @returns {{ x, y, guides: { x: number|null, y: number|null } }}
 */
export function snapPosition(x, y, w, h, targets, threshold = SNAP_THRESHOLD) {
  const xCandidates = [
    { value: x, edge: 'left' },
    { value: x + w, edge: 'right' },
    { value: x + w / 2, edge: 'center' },
  ];
  const yCandidates = [
    { value: y, edge: 'top' },
    { value: y + h, edge: 'bottom' },
    { value: y + h / 2, edge: 'center' },
  ];

  const xSnap = findNearest(xCandidates, targets.xTargets, threshold);
  const ySnap = findNearest(yCandidates, targets.yTargets, threshold);

  return {
    x: xSnap ? x + xSnap.delta : x,
    y: ySnap ? y + ySnap.delta : y,
    guides: {
      x: xSnap ? xSnap.guide : null,
      y: ySnap ? ySnap.guide : null,
    },
  };
}

/**
 * Compute snap adjustments for a resizing element edge.
 * Only snaps the moving edge(s), not the whole element.
 * @param {string} handle - e.g. 'n','s','e','w','ne','nw','se','sw'
 * @param {number} x - proposed left
 * @param {number} y - proposed top
 * @param {number} w - proposed width
 * @param {number} h - proposed height
 * @param {{ xTargets, yTargets }} targets
 * @param {number} [threshold]
 * @returns {{ x, y, w, h, guides: { x: number|null, y: number|null } }}
 */
export function snapResize(handle, x, y, w, h, targets, threshold = SNAP_THRESHOLD) {
  let guideX = null;
  let guideY = null;

  const hasE = handle.includes('e') || handle === 'e';
  const hasW = handle.includes('w') || handle === 'w';
  const hasN = handle.includes('n') || handle === 'n';
  const hasS = handle.includes('s') || handle === 's';

  if (hasE) {
    const right = x + w;
    const snap = findNearest([{ value: right, edge: 'right' }], targets.xTargets, threshold);
    if (snap) { w += snap.delta; guideX = snap.guide; }
  }
  if (hasW) {
    const snap = findNearest([{ value: x, edge: 'left' }], targets.xTargets, threshold);
    if (snap) { x += snap.delta; w -= snap.delta; guideX = snap.guide; }
  }
  if (hasS) {
    const bottom = y + h;
    const snap = findNearest([{ value: bottom, edge: 'bottom' }], targets.yTargets, threshold);
    if (snap) { h += snap.delta; guideY = snap.guide; }
  }
  if (hasN) {
    const snap = findNearest([{ value: y, edge: 'top' }], targets.yTargets, threshold);
    if (snap) { y += snap.delta; h -= snap.delta; guideY = snap.guide; }
  }

  return { x, y, w, h, guides: { x: guideX, y: guideY } };
}
