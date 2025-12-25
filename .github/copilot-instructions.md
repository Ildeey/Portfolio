# Copilot Instructions for Portfolio Website

## Project Overview
Minimalist design portfolio for Ilya Klimov (Russian designer). Single-page site showcasing design work with project gallery, experience timeline, and tech stack. Russian/English bilingual content with modern design patterns.

## Architecture & File Structure
- **index.html**: Single-page structure with semantic sections (hero, about, work, gallery, experience, tech, footer)
- **styles.css**: All styling with CSS Grid/Flexbox, custom fonts (Montserrat + JetBrains Mono), dark theme (#000 background, light text)
- **script.js**: Lightweight utilities (barcode generation, smooth scrolling, intersection observer animations)
- **images/**: Project images for gallery (kartinka.jpg, kartinka2.jpg, kit.jpg, ktya.jpg, kit.png, vremena.png)
- **css/**: Empty directory for future modular styles

## Key Components & Patterns

### Gallery Section (`.gallery-grid`)
- **Current state**: 15 cards total (5 filled projects + 10 empty "Add Project" placeholders)
- **Structure**: Each card has `data-project-id`, image wrapper with overlay, content with title
- **Empty cards**: Marked with `.empty` class, contain "+" placeholder
- **Modal system**: Hidden `#imageModal` div with close button, navigation (prev/next), and image info display
- **Form**: `#projectForm` for adding new projects (stores to localStorage implicitly)

### Design System
- **Colors**: Black background (#000), light text (#f0f0f0), accent green (#00ff1a for header border), grays (#737373, #262626)
- **Typography**: Montserrat (default), JetBrains Mono (labels/metadata)
- **Spacing**: Container max-width 1400px, 3rem padding, consistent 1.5-2rem gaps
- **Layout**: CSS Grid for sections (`grid-template-columns: 1fr 1fr` is common), Flexbox for components
- **Animations**: Intersection observer for fade-in on scroll, transition 0.3s-0.6s for hovers, noise filter on hero

### Data Model
Gallery items stored as objects with:
- `project-id` (1-15)
- `title` (project name)
- `image` (img src path)
- `description` (optional, for modal)

Currently hardcoded in HTML; form may push to localStorage or backend.

## Developer Workflows

### Adding Gallery Features
1. **CSS styling**: All gallery CSS should go in `styles.css`. Use Grid (gap: 2rem) for responsive card layout
2. **Modal interactions**: JavaScript goes in `script.js`. Target `#imageModal`, `.modal-prev`, `.modal-next`, `.modal-close`
3. **Image navigation**: Implement by finding gallery items with `data-project-id`, cycling through on button clicks
4. **Form submission**: Hook `#projectForm` submit event to validate and inject new cards into `.gallery-grid`

### Responsive Breakpoints
- **1024px**: Reduce title sizes (4rem → 3rem), maintain grid layouts
- **768px**: Stacked grids (1 column), responsive header, hide vertical text elements
- **480px**: Further size reductions, single column everything

### Common Selectors for Gallery Work
```css
.gallery-grid { /* container */ }
.gallery-card { /* individual item */ }
.gallery-image-wrapper { /* image container */ }
.gallery-overlay { /* hover effect layer */ }
.gallery-content { /* title section */ }
.modal { /* modal backdrop */ }
.modal-content { /* modal box */ }
```

## Critical Implementation Notes

### 1. Smooth Scrolling Anchor Links
Already implemented via script.js `DOMContentLoaded` listener. All `href="#section"` links trigger `.scrollIntoView()`. Preserve this behavior.

### 2. Barcode Generation
SVG barcodes dynamically generated with random rect widths. Runs on page load for `.barcode` elements. Don't remove or rename selectors.

### 3. Section Animations (Fade-in on Scroll)
IntersectionObserver watches all `<section>` tags. Initial state: opacity 0, translateY(20px). Don't break `.style` assignments on sections.

### 4. Header Sticky Position
Header has `position: sticky`, `z-index: 1000`, blur backdrop filter. Keep z-index high for modals.

### 5. Color Theme Consistency
- Dark backgrounds (#000) + light text (#f0f0f0) is intentional (designer portfolio aesthetic)
- Accent green (#00ff1a) only on header border (tech/design statement)
- Never use random colors; reference existing palette

## Integration Points
- **Modal layer**: Fixed position overlay with semi-transparent backdrop (not yet styled in CSS)
- **Form integration**: `#projectForm` needs backend/localStorage connection for persistence
- **Social links**: All hardcoded; update in both header `.cta-wrapper` and footer `.footer-social`
- **External links**: Behance (portfolio), Telegram, GitHub, LinkedIn, Dribbble - all target="_blank"

## Common Mistakes to Avoid
1. **Grid vs Flexbox**: Gallery should use Grid (auto-fit columns). Section layouts use Grid (1fr 1fr). Don't mix unnecessarily
2. **Z-index warfare**: Modal needs z-index > 1000 to appear above header
3. **Image aspect ratios**: Gallery cards should maintain square or 1:1 ratio for consistency
4. **Font loading**: Custom fonts via @import and @font-face. Don't assume fallbacks load correctly
5. **Responsive Images**: Use `object-fit: cover` on all `.gallery-image` to maintain aspect ratio
6. **localStorage**: Currently missing—form submissions won't persist without backend

## Next Priority Features (from Russian request)
1. **CSS Grid Gallery**: Enhance `.gallery-grid` with proper responsive grid (auto-fit, minmax)
2. **Modal Image Viewing**: Populate modal from clicked gallery card, display image + metadata
3. **Navigation Controls**: Add prev/next buttons logic to cycle through gallery items

---
*Last updated: December 25, 2025. Portfolio v1.0*
