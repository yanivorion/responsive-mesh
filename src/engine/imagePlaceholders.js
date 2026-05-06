// Image placeholder pool · /Users/yanivo/Responsive Mesh /src/imagePlaceholders.js
//
// The playground renders every `image` archetype using one of these
// curated PNGs (snowy mountains / dunes / lilies — all tonal,
// monochrome-friendly, neutral, and FREE OF baked-in marketing text).
// They live in `public/placeholders/` so Vite serves them from
// `/placeholders/ph-NN.png` at runtime.
//
// Selection is deterministic from a seed (typically the element id) via a
// tiny string hash, so:
//   • The same element always shows the same picture across re-renders.
//   • Different elements in the same layout get different pictures (good
//     visual variety) but with stable assignment.
//
// Anything that needs a placeholder image — the canvas ImageWidget, the
// LayoutThumbnail in the library panel, future widgets — should call
// `pickPlaceholder(seed)`.
//
// NOTE: ph-04 and ph-05 were removed because they had Hebrew copy
// ("כאן תבוא הכותרת שלך" / "שם קטגוריה") baked directly into the image.
// Don't re-add a placeholder with any literal text — placeholders must
// be neutral so they read as art-direction, not as content.

// Resolve against Vite's base URL so the playground works both at the dev
// server root (`/`) and when deployed under a sub-path (e.g. GitHub Pages
// at `/responsive-mesh-playground/`).
const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
const ph = (n) => `${BASE}placeholders/ph-${n}.png`.replace(/\/{2,}/g, '/');

export const PLACEHOLDER_IMAGES = [
  ph('01'), ph('02'), ph('03'),
  ph('06'), ph('07'), ph('08'), ph('09')
];

// 32-bit FNV-1a — small, stable, no deps. Good enough for spreading element
// ids over a fixed pool. Works on any string-coercible seed.
function hashString(str) {
  const s = String(str == null ? '' : str);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function pickPlaceholder(seed) {
  if (PLACEHOLDER_IMAGES.length === 0) return '';
  const idx = hashString(seed) % PLACEHOLDER_IMAGES.length;
  return PLACEHOLDER_IMAGES[idx];
}
