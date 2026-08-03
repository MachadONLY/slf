# Self-Education — Design System v7

## Product position

Self-Education is a private operating system for deliberate learning: part library, part writing studio, part visual roadmap. The interface should feel like a serious instrument—quiet, precise and durable—rather than a social feed or a generic productivity template.

## Brand character

- **Intellectual, not nostalgic:** editorial typography without imitation parchment.
- **Premium, not ornamental:** hierarchy comes from space, type and contrast.
- **Calm, not empty:** dense tools stay available, but secondary actions recede.
- **Personal, not playful:** bronze accents signal importance; they do not decorate everything.

## 60–30–10 color system

### 60% — Ink
- `#070809` primary background
- `#0B0D0F` sidebar and deep canvas
- Purpose: concentration and visual continuity

### 30% — Graphite
- `#101317` primary surfaces
- `#15191E` elevated surfaces
- `#1A1F25` hover and active surfaces
- Purpose: group tools and establish depth without heavy borders

### 10% — Editorial bronze
- `#C3A56F` primary accent
- `#D5BD91` primary actions
- `rgba(195,165,111,.14)` selected surfaces
- Purpose: active state, selection, progress and primary actions

Supporting colors:
- Paper `#F2EEE6`
- Muted `#8C8A84`
- Success `#7E9D82`
- Danger `#D47E78`

## Typography

### Interface — Inter
Used for navigation, controls, labels, metadata, menus and forms. It is neutral, compact and readable at small sizes.

### Editorial — Source Serif 4
Used for document titles, project titles, reading surfaces and the writing canvas. It gives the product an academic voice without sacrificing screen legibility.

### Rules
- Avoid uppercase except for short category labels.
- Body text should not be bold by default.
- Use weight and spacing before adding color.
- The editor uses the serif family; controls always use the interface family.

## Layout principles

1. **Persistent orientation:** sidebar, breadcrumbs and selected states should always tell the user where they are.
2. **Progressive disclosure:** secondary actions appear on hover or inside contextual menus.
3. **Tool locality:** creation tools live close to the canvas; navigation controls live separately.
4. **Single primary action:** each view should have one visually dominant action.
5. **Compact rail mode:** the sidebar collapses to icons while preserving access and tooltips.
6. **Responsive continuity:** mobile changes layout, not vocabulary.

## Core components

### Sidebar
- Expanded: 304 px
- Collapsed: 72 px
- Shortcut: `Ctrl/Cmd + \`
- Collapsed state persists locally
- Active view uses a bronze indicator and a low-contrast surface
- Project hierarchy remains available in expanded mode; project icons remain visible in rail mode

### Top bar
- 50 px
- Only orientation, save state and view controls
- No duplicated page title

### Cards
- 16 px radius
- Low-contrast border
- One surface level per card
- Hover uses elevation and a subtle bronze border, not scale-heavy animation

### Editor
- Maximum reading width: 820 px
- Source Serif 4, 18 px, 1.78 line-height
- Toolbar is contextual and visually secondary to the document

### Roadmap
- Board identity in the upper-left
- Creation rail on the left
- Selection tools centered above the object
- Zoom/navigation in the lower-right
- Infinite canvas remains visually dominant

## Motion

- 160–220 ms for interface transitions
- No decorative looping animation
- Reduced-motion preference disables layout transitions
- Sidebar width and active states use restrained easing

## Accessibility

- Visible keyboard focus using the bronze accent
- Minimum usable control size of approximately 34–38 px
- Text remains neutral white/gray; bronze is never the only carrier of meaning
- Tooltips restore labels when the sidebar is collapsed
- Active navigation uses color plus shape/position

## Product rule

The interface should never compete with the user's thought. The strongest visual element must be the object currently being studied, written or mapped.
