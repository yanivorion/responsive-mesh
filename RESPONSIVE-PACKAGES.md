# Responsive Packages — Architecture & Knowledge Base

> Internal documentation for the Responsive Mesh editor's responsive system.  
> Covers units, breakpoints, cascading, heuristics, canvas rendering, and element model.

---

## Table of Contents

1. [Core Concepts](#1-core-concepts)
2. [Responsive Value Model](#2-responsive-value-model)
3. [Unit Types & Resolution](#3-unit-types--resolution)
4. [Breakpoint System](#4-breakpoint-system)
5. [Cascade & Property Merging](#5-cascade--property-merging)
6. [Element Model](#6-element-model)
7. [Mobile Heuristic Engine](#7-mobile-heuristic-engine)
8. [Canvas Rendering](#8-canvas-rendering)
9. [Inspector & Editing Flow](#9-inspector--editing-flow)
10. [Component Registry](#10-component-registry)
11. [Design Tokens](#11-design-tokens)
12. [V14 Layout Spec Integration](#12-v14-layout-spec-integration)
13. [Parking Lot (Preview Region)](#13-parking-lot-preview-region)
14. [Gaps & Future Work](#14-gaps--future-work)

---

## 1. Core Concepts

The responsive system is built around three pillars:

- **Responsive Values**: Every layout property is stored as `{ value, unit }` — never raw pixels.
- **Breakpoint Cascading**: Properties are defined per-breakpoint (desktop/tablet/mobile) and merged using a mobile-inherits-from-desktop cascade.
- **Heuristic Generation**: When elements are created, mobile properties are automatically generated from desktop values using a rule engine.

Data flows one direction:

```
createElement() → applyHeuristics() → element.responsiveProps → resolveElementProps() → pixel values
```

---

## 2. Responsive Value Model

Every layout property is stored as a **responsive value** (rv):

```js
{ value: number, unit: string }
```

Created with the `rv()` helper:

```js
rv(100, '%')   // → { value: 100, unit: '%' }
rv(24, 'px')   // → { value: 24, unit: 'px' }
rv(0, 'auto')  // → { value: 0, unit: 'auto' }
```

Properties that use this model: `x`, `y`, `width`, `height`, `minWidth`, `minHeight`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `marginTop`, `marginRight`, `marginBottom`, `marginLeft`.

---

## 3. Unit Types & Resolution

Six unit types are available:

| Unit | Label | Resolution Formula | Behavior |
|------|-------|--------------------|----------|
| `px` | PX | `value` | Absolute — same across all widths |
| `spx` | SPX | `value × (canvasWidth / referenceWidth)` | Scaled pixels — proportional to a 1280px reference |
| `vw` | VW | `(value / 100) × canvasWidth` | Viewport-relative — scales with canvas frame |
| `%` | % | `(value / 100) × parentWidth` | Parent-relative — fraction of container |
| `fr` | FR | `(value / totalFr) × availablePx` | Grid fraction — divides available space |
| `auto` | AUTO | returns `'auto'` (string) | Content-driven — size determined by content |

### Resolution context

`resolveUnit(prop, ctx)` takes a context object:

```js
{
  canvasWidth: number,     // current frame width (e.g. 1280 for desktop, 390 for mobile)
  parentWidth: number,     // parent element width (defaults to canvasWidth)
  referenceWidth: number,  // base reference for SPX (always 1280)
  totalFr: number,         // total fr units in grid row (default 1)
  availablePx: number,     // available px for fr (defaults to parentWidth)
}
```

The `referenceWidth` is always 1280 — matching the desktop default. SPX values authored on a 1280px desktop will scale proportionally on any other width.

---

## 4. Breakpoint System

Three breakpoints are defined with default rendering widths:

| ID | Label | Default Width | Icon | Min | Max |
|----|-------|--------------|------|-----|-----|
| `desktop` | Desktop | **1280px** | Monitor | 1001 | — |
| `tablet` | Tablet | **768px** | Tablet | 751 | 1000 |
| `mobile` | Mobile | **390px** | Smartphone | 320 | 750 |

The `min`/`max` values exist for metadata but are **not used** for resolution — the active frame width comes from the canvas UI (either `defaultWidth` or the user's temporary drag).

### Active breakpoints

The canvas shows a configurable set of breakpoint frames. Default: `['desktop', 'mobile']`. Tablet can be added via the "+ Tablet" button. Each frame renders at `BREAKPOINTS[id].defaultWidth`.

---

## 5. Cascade & Property Merging

Properties cascade from desktop → tablet → mobile. When resolving for a breakpoint, all ancestor values are merged, with the current breakpoint winning:

| Resolving for | Cascade order (first → last wins) |
|---------------|----------------------------------|
| Desktop | `desktop` |
| Tablet | `desktop` → `tablet` |
| Mobile | `desktop` → `tablet` → `mobile` |

This means:
- **Desktop** properties are the base — always required.
- **Tablet** inherits from desktop unless overridden.
- **Mobile** inherits from desktop (and tablet if present) unless overridden.

The `resolveElementProps()` function performs this merge, then runs `resolveUnit()` on every merged key:

```js
resolveElementProps(element, 'mobile', ctx)
// 1. Merge: desktop props → tablet props → mobile props
// 2. Resolve: each merged { value, unit } → pixel number (or 'auto')
// Returns: { x: 50, y: 30, width: 390, height: 'auto', ... }
```

### Writing vs reading

- **Writing** (Inspector, resize, move): always writes to `responsiveProps[activeBreakpoint]` only.
- **Reading** (canvas rendering): merges the full cascade via `resolveElementProps()`.

---

## 6. Element Model

Each element has this shape:

```js
{
  id: 'el-3-1717000000000',
  componentId: 'image',          // maps to preview renderer
  name: 'Image',                 // display label
  responsiveProps: {
    desktop: {                   // always present, full default geometry
      x:      { value: 100, unit: 'px' },
      y:      { value: 50,  unit: 'px' },
      width:  { value: 300, unit: 'px' },
      height: { value: 200, unit: 'px' },
      minWidth:      { value: 0, unit: 'auto' },
      minHeight:     { value: 0, unit: 'auto' },
      paddingTop:    { value: 0, unit: 'px' },
      paddingRight:  { value: 0, unit: 'px' },
      paddingBottom: { value: 0, unit: 'px' },
      paddingLeft:   { value: 0, unit: 'px' },
      marginTop:     { value: 0, unit: 'px' },
      marginRight:   { value: 0, unit: 'px' },
      marginBottom:  { value: 0, unit: 'px' },
      marginLeft:    { value: 0, unit: 'px' },
    },
    mobile: {                    // auto-generated by heuristics, partial overrides
      x:      { value: 45,  unit: 'px' },
      y:      { value: 15,  unit: 'px' },
      width:  { value: 100, unit: '%' },
      height: { value: 66.7,unit: '%' },
      paddingLeft:  { value: 24, unit: 'px' },
      paddingRight: { value: 24, unit: 'px' },
    },
    // tablet: { ... }  — only present if user adds tablet breakpoint and edits
  },
  zIndex: 3,
}
```

### Key rules

- Desktop slice is **always** created by `createElement()` with full geometry.
- Mobile slice is **auto-generated** by `applyHeuristics()` at creation time.
- Tablet slice is **never auto-generated** — it exists only when the user explicitly edits in tablet focus mode.
- Properties not present in a breakpoint's slice inherit from the cascade.

---

## 7. Mobile Heuristic Engine

Located in `src/engine/heuristics.js`. Auto-populates `responsiveProps.mobile` when elements are created.

### Element Classification

Elements are classified by their `componentId`:

| Classifier | Matches |
|-----------|---------|
| Image | `image` |
| Text | `title`, `paragraph`, `text` |
| Button | `button` |
| Box | `container`, `box` |
| Line | `line`, `horizontal-line` |
| Shape | `shape` |
| Menu | `menu`, `hamburger-menu` |
| Gallery | `gallery` |
| Social Bar | `social-bar` |
| Google Maps | `google-maps` |
| Form Elements | `address-input`, `text-input`, `dropdown`, `text-box-form`, `radio-buttons`, `rich-text`, `checkboxes`, `date-picker`, `multi-checkboxes`, `signature`, `tags`, `upload-button`, `ratings`, `recaptcha`, `slider`, `switch`, `progress-bar`, `breadcrumbs`, `site-search`, `audio-player` |
| Containers | `repeater`, `lightbox`, `tabs`, `accordion`, `container` |
| Embed/Media | `lottie`, `video`, `transparent-video`, `video-player`, `custom-element`, `embed`, `iframe` |

### Sizing Rules (Priority 1)

| Element Type | Width Rule | Height Rule |
|-------------|-----------|-------------|
| **Image** (≤200px wide) | Keep desktop px | Keep desktop px |
| **Image** (>200px) | `100%` | Aspect ratio `%` |
| **Line** (<200px) | Keep desktop px | Keep desktop px |
| **Line** (≥200px) | `100%` | Keep desktop px |
| **Text** | `100%` | `auto` |
| **Button** | `min(desktopW, 390) px` | Desktop height in `spx` |
| **Box** (height <200) | `100%` | `100px` |
| **Box** (height ≥200) | `100%` | `200px` |
| **Container/Gallery** | `100%` | `auto` |
| **Forms** | `100%` | Keep desktop px |
| **Embed/Media/Video** | `100%` | `aspect × 390` px |
| **Google Maps** | `100%` | Keep desktop px |
| **Shape** (≤100px) | Keep desktop px | Keep desktop px |
| **Shape** (>100px) | `70%` of desktop (min 43px) | Proportional |
| **Menu** | `20px` | `14px` |
| **Fallback** | Scale by `390/1280` | Scale by `390/1280` |

### Layout Rules (Priority 1, applied to all elements)

- **Horizontal padding**: 24px left, 24px right
- **Horizontal position**: Centered in 390px mobile frame
- **Vertical position**: Scaled proportionally by `390/1280`

### Context Rules (Priority 2, currently unused in runtime)

- In section, first element: `marginTop: 40px`
- In section, last element: `marginBottom: 40px`
- In box, first element: `marginTop: 24px`
- In box, last element: `marginBottom: 24px`

### Font Size Scaling

The `mobileFontSize(desktopPx)` function maps desktop font sizes to mobile equivalents:

| Desktop Range | Transformation | Example |
|--------------|---------------|---------|
| ≤14px | Keep same | 14 → 14 |
| 15–19px | −1px | 18 → 17 |
| 20–22px | −2px | 22 → 20 |
| 23–26px | −4px | 26 → 22 |
| 27–30px | −6px | 30 → 24 |
| 31–34px | −8px | 34 → 26 |
| 35–43px | −10px | 40 → 30 |
| 44–64px | ×0.65 | 60 → 39 |
| 65–78px | ×0.55 | 72 → 40 |
| 79–88px | ×0.50 | 88 → 44 |
| 89–93px | ×0.48 | 92 → 44 |
| >93px | ×0.42 | 120 → 50 |

> Note: `mobileFontSize` is exported but not currently wired into the element creation flow.

---

## 8. Canvas Rendering

### Two modes

| Mode | Trigger | What's visible | Interactive? |
|------|---------|---------------|-------------|
| **Overview** | Default, or exit focus | All active breakpoint frames side-by-side | No (pointer-events: none on elements) |
| **Focus** | Double-click a frame | Single breakpoint frame | Yes (drag, resize, select) |

### Overview mode

- Frames rendered in a horizontal flex row with 48px gap.
- Each frame renders at `BREAKPOINTS[bpId].defaultWidth × canvasHeight`.
- Elements are visible but not interactive.
- Zoom defaults to 45% to fit multiple frames.
- "+ Tablet" button appears between desktop and mobile frames when tablet isn't active.

### Focus mode

- Single frame for the focused breakpoint.
- Zoom snaps to 100% on entry.
- Side handles allow temporarily dragging the frame width (280–1600px) — snaps back to `defaultWidth` on release.
- Elements are fully interactive: drag to move, handles to resize, click to select.
- Exit via: backdrop click, TopNav "Overview" button, or Escape key.

### Element Boundary & Parking Lot

Elements can be dragged partially or fully outside the canvas frame boundary. The system uses a **50% threshold** to determine visibility:

| % of element outside frame | State | Behavior |
|---------------------------|-------|----------|
| **0–50%** | **On canvas** | Element stays in the canvas. Content clips at the frame edge (`overflow: hidden` on the canvas body). Handles remain accessible. |
| **51–100%** | **Parked** | Element enters the "parking lot." It remains visible and interactive but renders **outside** the frame boundary with a diagonal hatching overlay and reduced opacity, indicating it is hidden on the live site. |

**Visual indicators for parked elements:**
- Reduced content opacity (45%)
- Diagonal line pattern overlay using the accent color
- Fully interactive — can still be selected, moved, and resized

**Implementation:**
- `computeOutsideRatio(x, y, w, h, frameW, frameH)` calculates the ratio of element area outside the frame
- On-canvas elements render inside the `canvasBody` div (which has `overflow: hidden`)
- Parked elements render in a separate overlay layer inside the frame (which has `overflow: visible`), so they escape the clipping container

**Relationship to V14 Layout Spec:**
The parking lot is infrastructure for the Responsive Mesh playground's layout system (V14). V14 layouts use sections, anchor chains, and behaviors where elements must stay within their section bounds (V14 Rule 4). The parking lot provides a staging area for elements being repositioned or temporarily excluded from the live layout.

### Zoom & Pan

| Gesture | Action |
|---------|--------|
| Cmd/Ctrl + Scroll/Pinch | Zoom (15%–200%) |
| Two-finger trackpad scroll | Pan (Figma-style, transform-based) |
| Space + mouse drag | Pan (alternative) |

Pan is implemented via `transform: translate()` rather than native scrolling, for a smoother Figma-like experience.

### Transform pipeline

The canvas content is positioned with:

```css
transform: translate(panOffset.x, panOffset.y) scale(zoom / 100);
transform-origin: top center;
```

---

## 9. Inspector & Editing Flow

### Property display

The Inspector shows the **effective** value for the current breakpoint — desktop values merged with breakpoint overrides:

```js
effectiveProps = { ...desktopProps, ...breakpointProps }
```

### Property editing

When the user edits a property in the Inspector, the change is written **only** to `responsiveProps[activeBreakpoint]`. Desktop values are never modified when editing in tablet/mobile focus.

### Sections

- **Position**: X, Y (each with value + unit selector)
- **Size**: Width, Height (each with value + unit selector)
- **Padding**: Top, Right, Bottom, Left
- **Margin**: Top, Right, Bottom, Left
- **Actions**: Remove Element

### Element resize on canvas

Resize handles apply directional logic:
- **Right/bottom edges**: increase size, position stays fixed
- **Left/top edges**: increase size, position shifts to keep opposite edge anchored
- **Corners**: combine the two adjacent edges

---

## 10. Component Registry

### Available element types (Quick Add panel)

| Component ID | Name | Default Size |
|-------------|------|-------------|
| `image` | Image | 300 × 200 |
| `title` | Title | 400 × 60 |
| `paragraph` | Paragraph | 400 × 120 |
| `button` | Button | 160 × 48 |
| `container` | Container | 400 × 300 |
| `line` | Line | 300 × 4 |
| `gallery` | Gallery | 500 × 350 |
| `menu` | Menu | 400 × 48 |
| `shape` | Shape | 200 × 200 |
| `repeater` | Repeater | 500 × 250 |
| `video` | Video | 400 × 225 |
| `iframe` | IFrame | 400 × 300 |

### Preview rendering

`PreviewRegistry.jsx` maps `componentId` to React preview components. Quick-add types render placeholder previews from `ElementPreviews.jsx`. Generative types (physarum, boids, etc.) render canvas-based particle systems.

### Adding to canvas

Elements can be added via:
1. **Click** in the Add Elements panel → placed at canvas center
2. **Drag** from Add Elements panel → dropped at mouse position
3. **Inspiration panel** → generative component selection
4. **Copilot** → mock component generation

All paths call `createElement()` then `applyHeuristics()`.

---

## 11. Design Tokens

Centralized in `src/ui/designTokens.js`:

| Category | Examples |
|----------|---------|
| **Colors** | `accent` (#3B82F6), `text1`–`text4`, `bgPage`, `danger` |
| **Elevation** | `shadowSubtle`, `shadowRest`, `shadowHover` |
| **Radius** | `radiusSm` (6px) through `radiusFull` (9999px) |
| **Motion** | `easeOut`, `easeSpring`, `easeSmooth`, `durFast`–`durSlow` |
| **Typography** | `fontUI` (system font stack) |

`glassPanel(variant)` returns blur/saturation/border/shadow for glassmorphic panels.

---

## 12. V14 Layout Spec Integration

The editor is building toward supporting the **V14 Layout Prompt** format (`V14-LAYOUT-PROMPT.md`), a structured data model for responsive page layouts. Key connections:

| V14 Concept | Editor Equivalent |
|-------------|------------------|
| Archetypes (`text`, `image`, `button`, `container`) | Quick Add element types |
| Behaviors (`scaleProportionally`, `fixed`, `wrap`, etc.) | Higher-level abstractions over the unit system (`spx`, `px`, `vw`, `%`, `auto`) |
| Sections with children | Future: section-based canvas structure |
| Mesh anchor chains (push-cascade rails) | Future: vertical element relationships |
| `parent` nesting | Future: container-child relationships |
| Grid layouts (`2col`, `3col`, `mosaic`, etc.) | Future: grid cell placement |
| Section behaviors (`auto`, `fixedHeight`, `scaleProportionally`) | Maps to section height resolution |

The parking lot system directly supports V14's Rule 4 ("free-positioned elements stay inside the section") by providing a staging area for out-of-bounds elements.

---

## 13. Parking Lot (Preview Region)

The Parking Lot is a persistent **Preview Region** on the stage alongside the main canvas preview. It provides a dedicated space for **Parked content** — elements that exist only in the editor and are excluded from published output.

### Architecture

| Concept | Implementation |
|---------|---------------|
| **Data model** | Each element has `location: 'stage' \| 'parkingLot'` and optional `parkingSide: 'left' \| 'right'` |
| **Coordinate system** | Parking Lot zones have their own (0,0) origin, independent from the main canvas |
| **Rendering** | Left + right zones flanking the canvas frame, visible only when they contain parked elements |
| **Visibility** | PL zones only render in **focus mode** (desktop). Hidden in overview mode, preview mode, and lower breakpoints (v1) |
| **Scope** | Per-page: each page has its own Parking Lot (future multi-page support) |

### Element Lifecycle

```
Stage Element → drag past frame boundary (>60% outside) → Parked Element
Parked Element → "Move to Stage" action or drag back → Stage Element
```

Elements are transitioned via:
- **Drag boundary**: dragging a stage element >60% outside the frame auto-parks it
- **Explicit action**: "Move to Stage" / "Move to Parking Lot" buttons in Inspector and on-element UI

### Editing Parity

Parked elements support the same editing as stage elements:
- Style panels, responsive behavior, position/size
- Select, resize, move (within PL zone)
- Delete, duplicate (Cmd+D)
- Inspector property editing

### Restricted Actions

| Action | Stage | Parking Lot |
|--------|-------|-------------|
| Stretch behavior | Allowed | **Disabled** — no page layout context |
| Sticky/pinned positioning | Allowed | **Disabled** — no scrolling page context |
| CMS/data bindings | Allowed | **Disabled** in v1 |
| Resize handles (width controls) | On main frame | **Not present** on PL zones |
| Animations | Full | Metadata preserved, preview **disabled** |

### Layers Panel

The Layers panel shows a separate "Out of Page" group for parked elements, distinct from the normal page section tree.

### Open Questions (Product decisions needed)

- Snapping / smart guides within the Parking Lot
- "Fit Selected" zoom behavior for parked content
- Empty state visual design
- Lightbox mode: does lightbox get its own PL?
- Live preview: are parked elements hidden or frozen?

---

## 14. Gaps & Future Work

1. **Tablet auto-generation**: Only mobile is auto-generated by heuristics. Tablet properties must be manually set.
2. **Heuristic options**: Rotation reset and section/box margin rules are implemented but never passed from the app (no `options` parameter in `applyHeuristics`).
3. **`mobileFontSize`**: Exported but not wired into element creation or Inspector.
4. **`minWidth`/`minHeight`**: Stored in element defaults but not exposed in Inspector or enforced during canvas resize.
5. **Breakpoint `min`/`max`**: Defined but unused by the resolution engine.
6. **Element previews**: Use a separate local color palette instead of importing `designTokens.js`.
7. **`CanvasArea` `breakpointId` prop**: Passed from App but unused at the wrapper level (each frame provides its own `bpId`).
8. **V14 behaviors**: The unit system supports all V14 behavior types but lacks the higher-level `behavior` abstraction that auto-selects units.
9. **Anchor chains / Mesh**: The push-cascade rail system from V14 is not yet implemented — elements are free-positioned only.
10. **Sections**: The canvas renders a flat element list; V14's section-based structure with `auto`/`fixedHeight`/`scaleProportionally` section behaviors is not yet supported.
11. **Parking Lot cross-region drag**: Drag-back from PL to stage is currently via button only; continuous pointer drag across boundary is planned.
12. **Parking Lot multi-page**: Per-page scoping is modeled but only one page exists currently.

---

## File Map

```
src/
├── engine/
│   ├── responsiveUnits.js   # Units, breakpoints, cascade, createElement
│   └── heuristics.js        # Mobile auto-generation, font scaling, rule catalog
├── ui/
│   ├── CanvasArea.jsx        # Canvas rendering, zoom/pan, focus mode, StageElement
│   ├── InspectorPanel.jsx    # Property editing sidebar
│   ├── TopNav.jsx            # Breakpoint switcher, navigation
│   ├── AddElementsPanel.jsx  # Element type picker + drag source
│   ├── InspirationPanel.jsx  # Generative component gallery
│   ├── Copilot.jsx           # AI component input
│   ├── LayersPanel.jsx        # Layers tree with "Out of Page" section
│   └── designTokens.js       # Design system tokens
├── previews/
│   ├── PreviewRegistry.jsx   # componentId → preview component router
│   └── ElementPreviews.jsx   # Placeholder previews for quick-add types
├── data/
│   └── components.js         # Generative component metadata + images
└── App.jsx                   # State orchestration, element CRUD, breakpoint management
```
