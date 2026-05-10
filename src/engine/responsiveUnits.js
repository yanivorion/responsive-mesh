/**
 * Responsive unit engine.
 *
 * Converts authored values expressed in responsive units (SPX, VW, %, FR, PX, AUTO)
 * into concrete pixel values at a given canvas/viewport width.
 *
 * Each element stores its properties per breakpoint as { value, unit } pairs.
 * At render time we resolve them to px using resolveUnit().
 */

export const UNITS = ['px', 'spx', 'vw', '%', 'fr', 'auto'];

export const UNIT_LABELS = {
  px: 'PX',
  spx: 'SPX',
  vw: 'VW',
  '%': '%',
  fr: 'FR',
  auto: 'AUTO',
};

export const UNIT_DESCRIPTIONS = {
  px: 'Absolute pixels — fixed across all widths',
  spx: 'Scaled pixels — proportional to reference width',
  vw: 'Viewport width — scales with canvas',
  '%': 'Parent-relative — fraction of parent',
  fr: 'Grid fraction — divides available space',
  auto: 'Content-driven — shrinks to fit',
};

const DEFAULT_REFERENCE_WIDTH = 1280;

/**
 * Resolve a { value, unit } pair to a concrete pixel number.
 */
export function resolveUnit(prop, ctx) {
  if (!prop || prop.unit === 'auto') return 'auto';
  const v = prop.value;
  const ref = ctx.referenceWidth || DEFAULT_REFERENCE_WIDTH;

  switch (prop.unit) {
    case 'px':
      return v;
    case 'spx':
      return v * (ctx.canvasWidth / ref);
    case 'vw':
      return (v / 100) * ctx.canvasWidth;
    case '%':
      return (v / 100) * (ctx.parentWidth || ctx.canvasWidth);
    case 'fr': {
      const totalFr = ctx.totalFr || 1;
      const available = ctx.availablePx || ctx.parentWidth || ctx.canvasWidth;
      return (v / totalFr) * available;
    }
    default:
      return v;
  }
}

export function rv(value, unit = 'px') {
  return { value, unit };
}

export function defaultElementProps(x, y, w, h) {
  return {
    x: rv(x, 'px'),
    y: rv(y, 'px'),
    width: rv(w, 'px'),
    height: rv(h, 'px'),
    minWidth: rv(0, 'auto'),
    minHeight: rv(0, 'auto'),
    paddingTop: rv(0, 'px'),
    paddingRight: rv(0, 'px'),
    paddingBottom: rv(0, 'px'),
    paddingLeft: rv(0, 'px'),
    marginTop: rv(0, 'px'),
    marginRight: rv(0, 'px'),
    marginBottom: rv(0, 'px'),
    marginLeft: rv(0, 'px'),
  };
}

// ── Responsive behaviors (packages) ──

export const RESPONSIVE_BEHAVIORS = {
  scaleProportionally: { label: 'Scale Proportionally', heightUnit: 'spx', widthUnit: 'spx' },
  relativeWidth:       { label: 'Relative Width',       heightUnit: 'px',  widthUnit: 'spx' },
  fixed:               { label: 'Fixed',                heightUnit: 'px',  widthUnit: 'px'  },
  fixedHeight:         { label: 'Fixed Height',         heightUnit: 'px',  widthUnit: 'vw'  },
  stretch:             { label: 'Stretch',              heightUnit: '%',   widthUnit: '%'   },
  hug:                 { label: 'Hug',                  heightUnit: 'auto', widthUnit: 'auto' },
  wrap:                { label: 'Wrap',                 heightUnit: 'auto', widthUnit: 'spx' },
};

export const ARCHETYPES = {
  container: {
    label: 'Container',
    behaviors: ['scaleProportionally', 'relativeWidth', 'fixed', 'stretch', 'wrap'],
    defaultBehavior: 'scaleProportionally',
    defaultSize: { w: 400, h: 300 },
  },
  image: {
    label: 'Image',
    behaviors: ['scaleProportionally', 'relativeWidth', 'fixed', 'stretch'],
    defaultBehavior: 'scaleProportionally',
    defaultSize: { w: 300, h: 200 },
  },
  text: {
    label: 'Text',
    behaviors: ['scaleProportionally', 'fixed', 'hug', 'wrap'],
    defaultBehavior: 'wrap',
    defaultSize: { w: 320, h: 80 },
  },
  button: {
    label: 'Button',
    behaviors: ['scaleProportionally', 'relativeWidth', 'fixed', 'hug', 'wrap'],
    defaultBehavior: 'fixed',
    defaultSize: { w: 160, h: 48 },
  },
  line:      { label: 'Line',      behaviors: ['fixed', 'relativeWidth', 'stretch'], defaultBehavior: 'relativeWidth', defaultSize: { w: 300, h: 4 } },
  gallery:   { label: 'Gallery',   behaviors: ['scaleProportionally', 'stretch', 'wrap'], defaultBehavior: 'scaleProportionally', defaultSize: { w: 500, h: 350 } },
  menu:      { label: 'Menu',      behaviors: ['fixed', 'relativeWidth', 'stretch'], defaultBehavior: 'relativeWidth', defaultSize: { w: 400, h: 48 } },
  shape:     { label: 'Shape',     behaviors: ['scaleProportionally', 'fixed'], defaultBehavior: 'scaleProportionally', defaultSize: { w: 200, h: 200 } },
  repeater:  { label: 'Repeater',  behaviors: ['scaleProportionally', 'stretch', 'wrap'], defaultBehavior: 'scaleProportionally', defaultSize: { w: 500, h: 250 } },
  video:     { label: 'Video',     behaviors: ['scaleProportionally', 'relativeWidth', 'fixed', 'stretch'], defaultBehavior: 'scaleProportionally', defaultSize: { w: 400, h: 225 } },
  iframe:    { label: 'IFrame',    behaviors: ['scaleProportionally', 'relativeWidth', 'fixed', 'stretch'], defaultBehavior: 'scaleProportionally', defaultSize: { w: 400, h: 300 } },
};

export function defaultMarginUnit(behaviorKey) {
  return behaviorKey === 'scaleProportionally' ? 'spx' : 'px';
}

export function pxToUnit(px, unit, refWidth, currentWidth, parentSize) {
  if (unit === 'spx') return px * (refWidth / currentWidth);
  if (unit === 'vw') return (px / currentWidth) * 100;
  if (unit === '%') return (px / (parentSize ?? currentWidth)) * 100;
  return px;
}

export function defaultPropsFor(archetype) {
  if (archetype === 'text' || archetype === 'title' || archetype === 'paragraph') {
    return archetype === 'title'
      ? { text: 'Write a Title Here', fontFamily: 'Inter', fontSize: 44, fontWeight: '600', lineHeight: '1.1', letterSpacing: '-0.01em', color: '#0f172a', textAlign: 'left' }
      : archetype === 'paragraph'
      ? { text: 'Use this space to promote the business, its products or its services. Help people become familiar with the business and its offerings, creating a sense of connection and trust.', fontFamily: 'Inter', fontSize: 14, fontWeight: '400', lineHeight: '1.55', color: '#334155', textAlign: 'left' }
      : { text: 'Add paragraph text. Click to edit.', fontFamily: 'Inter', fontSize: 16, fontWeight: '400', color: '#0f172a', lineHeight: '1.5', letterSpacing: '0em', textAlign: 'left' };
  }
  if (archetype === 'button') return { label: 'Start Now', variant: 'primary', radius: 8, paddingX: 18, paddingY: 10 };
  if (archetype === 'image') return { objectPosition: 'center' };
  return { background: 'rgba(15,23,42,0.04)', borderColor: 'rgba(15,23,42,0.08)', borderRadius: 12 };
}

export const BREAKPOINT_IDS = ['desktop', 'tablet', 'mobile'];

export const BASE_BREAKPOINTS = {
  desktop: { id: 'desktop', label: 'Desktop', min: 1001, defaultWidth: 1280, lucideIcon: 'Monitor' },
  tablet:  { id: 'tablet',  label: 'Tablet',  min: 751, max: 1000, defaultWidth: 768, lucideIcon: 'Tablet' },
  mobile:  { id: 'mobile',  label: 'Mobile',  min: 320, max: 750, defaultWidth: 390, lucideIcon: 'Smartphone' },
};

export const BREAKPOINTS = { ...BASE_BREAKPOINTS };

/**
 * Create a merged breakpoint set: custom breakpoints (above desktop) + base breakpoints.
 * Custom breakpoints are sorted widest-first.
 * Returns { allBpMap, allBpIds } where allBpIds is sorted widest → narrowest.
 */
export function createBreakpointSet(customBreakpoints = []) {
  const merged = { ...BASE_BREAKPOINTS };
  for (const bp of customBreakpoints) {
    merged[bp.id] = bp;
  }
  const allBpIds = Object.values(merged)
    .sort((a, b) => b.defaultWidth - a.defaultWidth)
    .map((bp) => bp.id);
  return { allBpMap: merged, allBpIds };
}

/**
 * Dynamic cascade: from the widest breakpoint down to the current one.
 */
export function getDynamicCascade(breakpointId, allBpIds) {
  const idx = allBpIds.indexOf(breakpointId);
  if (idx === -1) return [breakpointId];
  return allBpIds.slice(0, idx + 1);
}

/**
 * Resolve element props at the active breakpoint with cascade.
 * Optionally pass allBpIds for dynamic breakpoint support.
 */
export function resolveElementProps(element, breakpointId, ctx) {
  const cascade = ctx.allBpIds
    ? getDynamicCascade(breakpointId, ctx.allBpIds)
    : getCascade(breakpointId);
  const merged = {};

  for (const bp of cascade) {
    const bpProps = element.responsiveProps?.[bp];
    if (bpProps) {
      Object.keys(bpProps).forEach((key) => {
        if (bpProps[key] !== undefined) merged[key] = bpProps[key];
      });
    }
  }

  const heightCtx = ctx.parentHeight
    ? { ...ctx, parentWidth: ctx.parentHeight }
    : ctx;

  const resolved = {};
  Object.keys(merged).forEach((key) => {
    const isHeightProp = key === 'height' || key === 'y';
    resolved[key] = resolveUnit(merged[key], isHeightProp ? heightCtx : ctx);
  });
  return resolved;
}

function getCascade(breakpointId) {
  switch (breakpointId) {
    case 'mobile': return ['desktop', 'tablet', 'mobile'];
    case 'tablet': return ['desktop', 'tablet'];
    default: return ['desktop'];
  }
}

let _nextId = 1;
/**
 * createElement is kept free of heuristic imports to avoid circular deps.
 * Call applyHeuristics(element) from App.jsx after creation to auto-generate mobile props.
 */
export function createElement(componentId, componentName, x, y, w = 280, h = 200) {
  const id = `el-${_nextId++}-${Date.now()}`;
  const archetype = ARCHETYPES[componentId] ? componentId : mapToArchetype(componentId);
  const archetypeDef = ARCHETYPES[archetype];
  const behavior = archetypeDef?.defaultBehavior || 'scaleProportionally';
  const beh = RESPONSIVE_BEHAVIORS[behavior];

  const desktopProps = defaultElementProps(x, y, w, h);
  if (beh) {
    desktopProps.width = rv(w, beh.widthUnit === 'auto' ? 'px' : beh.widthUnit);
    desktopProps.height = rv(h, beh.heightUnit === 'auto' ? 'px' : beh.heightUnit);
    const mu = defaultMarginUnit(behavior);
    desktopProps.x = rv(x, mu);
    desktopProps.y = rv(y, mu);
  }

  return {
    id,
    componentId,
    archetype,
    name: componentName,
    behavior,
    location: 'stage',
    anchorId: null,
    props: defaultPropsFor(componentId),
    responsiveProps: {
      desktop: desktopProps,
    },
    zIndex: _nextId,
  };
}

function mapToArchetype(componentId) {
  const mapping = {
    title: 'text', paragraph: 'text',
    gallery: 'gallery', menu: 'menu', shape: 'shape',
    repeater: 'repeater', video: 'video', iframe: 'iframe',
    line: 'line',
  };
  return mapping[componentId] || 'container';
}
