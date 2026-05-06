/**
 * Mobile Heuristic Engine — Studio 2.0
 *
 * Auto-generates mobile breakpoint props from desktop props based on 115 rules
 * from the Heuristics Builder specification.
 *
 * Each rule has: when (element type), in (context), if (condition), action, parameters, priority.
 * Rules are sorted by priority (1 first, then 2) and applied sequentially.
 * Later rules can override earlier ones for the same property.
 */

import { rv, BREAKPOINTS } from './responsiveUnits.js';

const MOBILE_W = BREAKPOINTS.mobile.defaultWidth;
const DESKTOP_W = BREAKPOINTS.desktop.defaultWidth;

// ──────────────────────────────────────────────────────
// Element type classification helpers
// ──────────────────────────────────────────────────────

const FORM_TYPES = new Set([
  'address-input', 'text-input', 'dropdown', 'text-box-form',
  'radio-buttons', 'rich-text', 'checkboxes', 'date-picker',
  'multi-checkboxes', 'signature', 'tags', 'upload-button',
  'ratings', 'recaptcha', 'slider', 'switch', 'progress-bar',
  'breadcrumbs', 'site-search', 'audio-player',
]);

const EMBED_MEDIA_TYPES = new Set([
  'lottie', 'video', 'transparent-video', 'video-player',
  'custom-element', 'embed', 'iframe',
]);

const CONTAINER_TYPES = new Set([
  'repeater', 'lightbox', 'tabs', 'accordion', 'container',
]);

function isImage(id) { return id === 'image'; }
function isText(id) { return id === 'title' || id === 'paragraph' || id === 'text'; }
function isButton(id) { return id === 'button'; }
function isBox(id) { return id === 'container' || id === 'box'; }
function isLine(id) { return id === 'line' || id === 'horizontal-line'; }
function isShape(id) { return id === 'shape'; }
function isSocialBar(id) { return id === 'social-bar'; }
function isGoogleMaps(id) { return id === 'google-maps'; }
function isFormElement(id) { return FORM_TYPES.has(id); }
function isEmbedMedia(id) { return EMBED_MEDIA_TYPES.has(id); }
function isContainer(id) { return CONTAINER_TYPES.has(id); }
function isMenu(id) { return id === 'menu' || id === 'hamburger-menu'; }
function isGallery(id) { return id === 'gallery'; }
function isVideo(id) { return id === 'video' || id === 'iframe'; }

// ──────────────────────────────────────────────────────
// Core heuristic: generate mobile props from desktop
// ──────────────────────────────────────────────────────

/**
 * Given an element's desktop props and its component type,
 * returns the mobile breakpoint props that should be auto-set.
 *
 * @param {string} componentId  - The element's component type id
 * @param {object} desktopProps - The desktop responsiveProps (keyed by prop name, each { value, unit })
 * @param {object} [options]    - Optional context: { inSection, inHeader, isFirst, isLast, rotation }
 * @returns {object} mobileProps - The mobile responsiveProps to merge
 */
export function generateMobileProps(componentId, desktopProps, options = {}) {
  const id = componentId.toLowerCase();
  const dw = desktopProps.width?.value ?? 280;
  const dh = desktopProps.height?.value ?? 200;
  const mobile = {};

  // ─── Priority 1 rules ───

  // Rule 1: Reset rotation on mobile (except vertical lines)
  if (options.rotation && options.rotation !== 0 && id !== 'vertical-line') {
    mobile.rotation = rv(0, 'px');
  }

  // Rules 11-12: Image sizing
  if (isImage(id)) {
    if (dw <= 200) {
      mobile.width = rv(dw, 'px');
      mobile.height = rv(dh, 'px');
    } else {
      mobile.width = rv(100, '%');
      mobile.height = rv(dh / dw * 100, '%'); // aspect ratio
    }
  }

  // Rules 13-14: Horizontal Line
  else if (isLine(id)) {
    if (dw < 200) {
      mobile.width = rv(dw, 'px');
    } else {
      mobile.width = rv(100, '%');
    }
    mobile.height = rv(dh, 'px');
  }

  // Rule 17: Social Bar
  else if (isSocialBar(id)) {
    mobile.width = rv(100, '%');
    mobile.height = rv(dh, 'px');
  }

  // Rule 18: Text → 100% width, auto height
  else if (isText(id)) {
    mobile.width = rv(100, '%');
    mobile.height = rv(0, 'auto');
  }

  // Rule 20: Button → desktop width capped at 100%, height in SPX
  else if (isButton(id)) {
    const cappedW = Math.min(dw, MOBILE_W);
    mobile.width = rv(cappedW, 'px');
    mobile.height = rv(dh, 'spx');
  }

  // Rules 21-22: Box (blank)
  else if (isBox(id)) {
    mobile.width = rv(100, '%');
    if (dh < 200) {
      mobile.height = rv(100, 'px');
    } else {
      mobile.height = rv(200, 'px');
    }
  }

  // Rules 31-34: Complex containers → 100% width, auto height
  else if (isContainer(id) || isGallery(id)) {
    mobile.width = rv(100, '%');
    mobile.height = rv(0, 'auto');
  }

  // Rules 36-55: Forms → 100% width
  else if (isFormElement(id)) {
    mobile.width = rv(100, '%');
    mobile.height = rv(dh, 'px');
  }

  // Rules 56-61: Embed/Media → 100% width, aspect ratio height
  else if (isEmbedMedia(id) || isVideo(id)) {
    mobile.width = rv(100, '%');
    mobile.height = rv(dh / dw * MOBILE_W, 'px'); // preserve aspect ratio
  }

  // Rule 62: Google Maps → 100% width, keep desktop height
  else if (isGoogleMaps(id)) {
    mobile.width = rv(100, '%');
    mobile.height = rv(dh, 'px');
  }

  // Rule 15-16: Shape (SVG) — reduce 30%, min 43px
  else if (isShape(id)) {
    if (dw <= 100) {
      mobile.width = rv(dw, 'px');
      mobile.height = rv(dh, 'px');
    } else {
      const reduced = Math.max(43, Math.round(dw * 0.7));
      const ratio = reduced / dw;
      mobile.width = rv(reduced, 'px');
      mobile.height = rv(Math.round(dh * ratio), 'px');
    }
  }

  // Rule 80: Hamburger menu
  else if (isMenu(id)) {
    mobile.width = rv(20, 'px');
    mobile.height = rv(14, 'px');
  }

  // Fallback: scale proportionally if no specific rule matched
  else {
    const ratio = MOBILE_W / DESKTOP_W;
    mobile.width = rv(Math.round(dw * ratio), 'px');
    mobile.height = rv(Math.round(dh * ratio), 'px');
  }

  // ─── Priority 1: Padding (Rule 26) — 24px L/R for all elements ───
  mobile.paddingLeft = rv(24, 'px');
  mobile.paddingRight = rv(24, 'px');

  // ─── Priority 1: Position — center horizontally in mobile frame ───
  const mobileWidth = mobile.width?.unit === '%'
    ? (mobile.width.value / 100) * MOBILE_W
    : (mobile.width?.value ?? dw);
  const centeredX = Math.max(0, Math.round((MOBILE_W - mobileWidth) / 2));
  mobile.x = rv(centeredX, 'px');

  // Keep Y proportional
  const dy = desktopProps.y?.value ?? 0;
  const yRatio = MOBILE_W / DESKTOP_W;
  mobile.y = rv(Math.round(dy * yRatio), 'px');

  // ─── Priority 2 rules (context-dependent) ───

  if (options.inSection) {
    if (options.isFirst) {
      mobile.marginTop = rv(40, 'px');   // Rule 29
    }
    if (options.isLast) {
      mobile.marginBottom = rv(40, 'px'); // Rule 30
    }
  }

  if (options.inBox) {
    if (options.isFirst) {
      mobile.marginTop = rv(24, 'px');   // Rule 27
    }
    if (options.isLast) {
      mobile.marginBottom = rv(24, 'px'); // Rule 28
    }
  }

  return mobile;
}

/**
 * Given an element with desktop props and its type,
 * returns a full responsiveProps object with both desktop and auto-generated mobile.
 */
export function applyHeuristics(element) {
  const desktopProps = element.responsiveProps?.desktop;
  if (!desktopProps) return element;

  const mobileProps = generateMobileProps(element.componentId, desktopProps);

  return {
    ...element,
    responsiveProps: {
      ...element.responsiveProps,
      mobile: {
        ...(element.responsiveProps.mobile || {}),
        ...mobileProps,
      },
    },
  };
}

// ──────────────────────────────────────────────────────
// Font size heuristic (Rules 63-76)
// Maps desktop font size ranges to mobile font size.
// The lettered "paths" from the spec are approximated
// as a smooth scaling curve that reduces large headings
// more aggressively than body text.
// ──────────────────────────────────────────────────────

export function mobileFontSize(desktopPx) {
  if (desktopPx <= 14) return desktopPx;         // Path A: keep small text
  if (desktopPx <= 19) return desktopPx - 1;     // Path B: slight reduction
  if (desktopPx <= 22) return desktopPx - 2;     // Path C
  if (desktopPx <= 26) return desktopPx - 4;     // Path D
  if (desktopPx <= 30) return desktopPx - 6;     // Path E
  if (desktopPx <= 34) return desktopPx - 8;     // Path F
  if (desktopPx <= 43) return desktopPx - 10;    // Path G
  if (desktopPx <= 64) return Math.round(desktopPx * 0.65); // Path H
  if (desktopPx <= 78) return Math.round(desktopPx * 0.55); // Path J
  if (desktopPx <= 88) return Math.round(desktopPx * 0.50); // Path K
  if (desktopPx <= 93) return Math.round(desktopPx * 0.48); // Path L
  return Math.round(desktopPx * 0.42);           // Path M/N: auto for very large
}

// ──────────────────────────────────────────────────────
// Rule catalog (for UI display / inspector)
// ──────────────────────────────────────────────────────

export const HEURISTIC_CATEGORIES = [
  'Rotation', 'Hide / Show', 'Content Order', 'Alignment',
  'Image', 'Horizontal Line', 'Shape (SVG)', 'Social Bar',
  'Text Box', 'Text Mask / Marquee', 'Button', 'Box',
  'Section / System Container', 'Padding (R/L)',
  'Box Margin T/B', 'Section Margin T/B',
  'Containers (Complex)', 'Forms / Additional',
  'Embed / Media', 'Google Maps', 'Font Algo',
  'Header & Menu', 'Pinned', 'New Heuristics',
];

export const HEURISTIC_ACTIONS = [
  'Set Size', 'Set Min Height', 'Set Margin', 'Set Padding',
  'Set Alignment', 'Set Rotation', 'Set Visibility',
  'Set Spacing', 'Set Pinned', 'Set Font Size', 'Set OOG',
];

export const RULE_COUNT = { body: 99, header: 16, total: 115 };
