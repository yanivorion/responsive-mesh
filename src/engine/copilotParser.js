const ELEMENT_TYPES = {
  image:     { id: 'image',     name: 'Image',     defaultW: 300, defaultH: 200 },
  img:       { id: 'image',     name: 'Image',     defaultW: 300, defaultH: 200 },
  photo:     { id: 'image',     name: 'Image',     defaultW: 300, defaultH: 200 },
  picture:   { id: 'image',     name: 'Image',     defaultW: 300, defaultH: 200 },
  title:     { id: 'title',     name: 'Title',     defaultW: 400, defaultH: 60 },
  heading:   { id: 'title',     name: 'Title',     defaultW: 400, defaultH: 60 },
  header:    { id: 'title',     name: 'Title',     defaultW: 400, defaultH: 60 },
  h1:        { id: 'title',     name: 'Title',     defaultW: 400, defaultH: 60 },
  paragraph: { id: 'paragraph', name: 'Paragraph', defaultW: 400, defaultH: 120 },
  text:      { id: 'paragraph', name: 'Paragraph', defaultW: 400, defaultH: 120 },
  button:    { id: 'button',    name: 'Button',    defaultW: 160, defaultH: 48 },
  btn:       { id: 'button',    name: 'Button',    defaultW: 160, defaultH: 48 },
  cta:       { id: 'button',    name: 'Button',    defaultW: 160, defaultH: 48 },
  container: { id: 'container', name: 'Container', defaultW: 400, defaultH: 300 },
  box:       { id: 'container', name: 'Container', defaultW: 400, defaultH: 300 },
  div:       { id: 'container', name: 'Container', defaultW: 400, defaultH: 300 },
  section:   { id: 'container', name: 'Container', defaultW: 600, defaultH: 400 },
  wrapper:   { id: 'container', name: 'Container', defaultW: 400, defaultH: 300 },
  line:      { id: 'line',      name: 'Line',      defaultW: 300, defaultH: 4 },
  divider:   { id: 'line',      name: 'Line',      defaultW: 300, defaultH: 4 },
  separator: { id: 'line',      name: 'Line',      defaultW: 300, defaultH: 4 },
  gallery:   { id: 'gallery',   name: 'Gallery',   defaultW: 500, defaultH: 350 },
  grid:      { id: 'gallery',   name: 'Gallery',   defaultW: 500, defaultH: 350 },
  menu:      { id: 'menu',      name: 'Menu',      defaultW: 400, defaultH: 48 },
  nav:       { id: 'menu',      name: 'Menu',      defaultW: 400, defaultH: 48 },
  navbar:    { id: 'menu',      name: 'Menu',      defaultW: 400, defaultH: 48 },
  navigation:{ id: 'menu',      name: 'Menu',      defaultW: 400, defaultH: 48 },
  shape:     { id: 'shape',     name: 'Shape',     defaultW: 200, defaultH: 200 },
  circle:    { id: 'shape',     name: 'Shape',     defaultW: 200, defaultH: 200 },
  repeater:  { id: 'repeater',  name: 'Repeater',  defaultW: 500, defaultH: 250 },
  list:      { id: 'repeater',  name: 'Repeater',  defaultW: 500, defaultH: 250 },
  video:     { id: 'video',     name: 'Video',     defaultW: 400, defaultH: 225 },
  iframe:    { id: 'iframe',    name: 'IFrame',    defaultW: 400, defaultH: 300 },
  embed:     { id: 'iframe',    name: 'IFrame',    defaultW: 400, defaultH: 300 },
};

const BP_ALIASES = {
  desktop: 'desktop', pc: 'desktop', web: 'desktop', wide: 'desktop',
  tablet: 'tablet', ipad: 'tablet', tab: 'tablet',
  mobile: 'mobile', phone: 'mobile', responsive: 'mobile', small: 'mobile',
};

const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  a: 1, an: 1,
};

function extractCount(text) {
  const numMatch = text.match(/\b(\d+)\b/);
  if (numMatch) return parseInt(numMatch[1], 10);
  for (const [word, num] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(text)) return num;
  }
  return 1;
}

function findElementType(text) {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  for (const word of words) {
    if (ELEMENT_TYPES[word]) return ELEMENT_TYPES[word];
  }
  for (const [alias, def] of Object.entries(ELEMENT_TYPES)) {
    if (lower.includes(alias)) return def;
  }
  return null;
}

function findBreakpoint(text) {
  const lower = text.toLowerCase();
  for (const [alias, bp] of Object.entries(BP_ALIASES)) {
    if (lower.includes(alias)) return bp;
  }
  return null;
}

/**
 * Parse a natural-language command into a structured action.
 * Returns { type, ...params } or { type: 'unknown', raw }
 */
export function parseCopilotCommand(text) {
  const lower = text.toLowerCase().trim();

  if (/^(clear|remove all|delete all|reset|empty|clean)\b/.test(lower)) {
    return { type: 'clear_all' };
  }

  if (/\b(switch|change|go|set)\b.*\b(to|breakpoint)\b/.test(lower) || /^(desktop|tablet|mobile|phone)\s*$/i.test(lower)) {
    const bp = findBreakpoint(lower);
    if (bp) return { type: 'switch_breakpoint', breakpoint: bp };
  }

  if (/\b(remove|delete|trash)\b/.test(lower)) {
    if (/\bselected\b/.test(lower) || /\b(this|current|it)\b/.test(lower)) {
      return { type: 'remove_selected' };
    }
    const elType = findElementType(lower);
    if (elType) {
      const count = extractCount(lower);
      return { type: 'remove_by_type', elementType: elType.id, count };
    }
    return { type: 'remove_selected' };
  }

  if (/\bduplicate\b|\bclone\b|\bcopy\b/.test(lower)) {
    const count = extractCount(lower);
    return { type: 'duplicate', count: Math.max(1, count) };
  }

  if (/\b(add|create|insert|place|drop|put|make)\b/.test(lower)) {
    const elType = findElementType(lower);
    if (elType) {
      const count = Math.min(extractCount(lower), 20);
      return { type: 'add_elements', elementType: elType, count };
    }
  }

  // Fallback: if the text is just an element type name
  const directType = findElementType(lower);
  if (directType) {
    const count = Math.min(extractCount(lower), 20);
    return { type: 'add_elements', elementType: directType, count };
  }

  return { type: 'unknown', raw: text };
}
