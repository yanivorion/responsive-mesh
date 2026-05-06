/**
 * V14 Layout Parser
 * 
 * Parses V14 layout spec objects and converts them to the editor's
 * element model with responsive behaviors and real content props.
 */

import { rv, RESPONSIVE_BEHAVIORS, ARCHETYPES, defaultPropsFor, defaultMarginUnit, defaultElementProps } from './responsiveUnits.js';

let _importId = 10000;
function genId() { return `el-imp-${_importId++}-${Date.now()}`; }

function pxToUnit(px, unit, refWidth, currentWidth) {
  if (unit === 'spx') return px * (refWidth / currentWidth);
  if (unit === 'vw') return (px / currentWidth) * 100;
  if (unit === '%') return (px / currentWidth) * 100;
  return px;
}

/**
 * Parse raw text (pasted V14 layout specs) into layout objects.
 */
export function parseLayoutText(raw) {
  let t = String(raw || '').trim();
  if (!t) throw new Error('Paste a layout spec first.');
  t = t.replace(/^```(?:[a-zA-Z]+)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();

  const declRe = /(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*/g;
  const allHeads = [...t.matchAll(declRe)];

  const sliceBody = (i) => {
    const m = allHeads[i];
    const start = m.index + m[0].length;
    const end = i + 1 < allHeads.length ? allHeads[i + 1].index : t.length;
    return t.slice(start, end);
  };

  const looksLikeLayout = (body) => {
    const trimmed = body.replace(/^\s+/, '');
    if (!trimmed.startsWith('{')) return false;
    return /\bsections\s*:/.test(body);
  };

  const evalBody = (body) => {
    const stripped = body.replace(/;\s*$/, '').trim();
    return new Function('return (' + stripped + ')')();
  };

  const candidates = allHeads
    .map((m, i) => ({ head: m, body: sliceBody(i), idx: i }))
    .filter(c => looksLikeLayout(c.body));

  if (candidates.length > 0) {
    return candidates.map(c => {
      const val = evalBody(c.body);
      if (!val || !Array.isArray(val.sections) || val.sections.length === 0) {
        throw new Error(`${c.head[1]}: must contain a non-empty sections array.`);
      }
      return { name: val.meta?.name || c.head[1], value: val };
    });
  }

  const val = evalBody(t);
  if (val && Array.isArray(val.sections) && val.sections.length > 0) {
    return [{ name: val.meta?.name || 'Imported Layout', value: val }];
  }

  throw new Error('No valid layout spec found.');
}

/**
 * Convert a parsed V14 layout spec into editor elements.
 */
export function layoutToElements(spec, canvasWidth = 1280) {
  const refWidth = parseInt(spec.meta?.refWidth) || 1280;
  const elements = [];

  let yAccum = 0;

  for (const sec of spec.sections) {
    const sectionH = sec.height || 480;

    for (const child of (sec.children || [])) {
      const archetype = child.archetype;
      if (!archetype) continue;

      const archetypeDef = ARCHETYPES[archetype];
      let behaviorKey = child.behavior || archetypeDef?.defaultBehavior || 'scaleProportionally';
      if (archetypeDef && !archetypeDef.behaviors.includes(behaviorKey)) {
        behaviorKey = archetypeDef.defaultBehavior;
      }
      const beh = RESPONSIVE_BEHAVIORS[behaviorKey];

      const cx = child.x ?? 0;
      const cy = (child.y ?? 0) + yAccum;
      const cw = child.w === 'auto' ? (archetypeDef?.defaultSize?.w || 280) : (child.w ?? 280);
      const ch = child.h === 'auto' ? (archetypeDef?.defaultSize?.h || 200) : (child.h ?? 200);

      const marginUnit = defaultMarginUnit(behaviorKey);
      const xVal = pxToUnit(cx, marginUnit, refWidth, canvasWidth);
      const yVal = pxToUnit(cy, marginUnit, refWidth, canvasWidth);
      const wVal = (beh.widthUnit === 'auto' || beh.widthUnit === '%') ? cw : pxToUnit(cw, beh.widthUnit, refWidth, canvasWidth);
      const hVal = (beh.heightUnit === 'auto' || beh.heightUnit === '%') ? ch : pxToUnit(ch, beh.heightUnit, refWidth, canvasWidth);

      const desktopProps = defaultElementProps(
        xVal, yVal, wVal, hVal
      );
      desktopProps.x = rv(xVal, marginUnit);
      desktopProps.y = rv(yVal, marginUnit);
      desktopProps.width = rv(wVal, beh.widthUnit === 'auto' ? 'px' : beh.widthUnit);
      desktopProps.height = rv(hVal, beh.heightUnit === 'auto' ? 'px' : beh.heightUnit);

      const props = { ...defaultPropsFor(archetype), ...(child.props || {}) };
      const componentId = archetype;

      elements.push({
        id: genId(),
        componentId,
        archetype,
        name: archetypeDef?.label || archetype,
        behavior: behaviorKey,
        props,
        responsiveProps: { desktop: desktopProps },
        zIndex: child.z ?? 0,
      });
    }

    yAccum += sectionH;
  }

  return elements;
}
