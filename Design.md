# Design System Strategy: The Kinetic Terminal
 
## 1. Overview & Creative North Star
 
**Creative North Star: The Kinetic Terminal**
This design system is engineered to bridge the gap between the raw utility of a command-line interface and the sophisticated, fluid experience of a modern creative suite. It moves away from the "boxy" nature of traditional IDEs toward a layout that feels like a single, cohesive piece of high-performance hardware.
 
To achieve an "Editorial" look in a technical tool, we prioritize **Intentional Asymmetry** and **Tonal Depth**. While the 4px/8px grid ensures mathematical precision, the visual layout breaks the template by using exaggerated white space in sidebars and overlapping glass panels that simulate a physical workspace. We don't just display code; we curate a high-focus environment where the UI recedes and the collaboration takes center stage.
 
---
 
## 2. Colors & Surface Architecture
 
The palette is anchored in deep charcoals, using vibrant "multiplayer" accents to denote life and activity.
 
### The "No-Line" Rule
Standard UI relies on borders to separate code from file trees. This design system **prohibits 1px solid borders for structural sectioning.** Instead, boundaries are defined by shifting from `surface` (#0a0e14) to `surface_container_low` (#0f141a) or `surface_container_high` (#1b2028). Sectioning is felt through tonal shifts, not seen through lines.
 
### Surface Hierarchy & Nesting
Treat the UI as a series of nested physical layers:
*   **Base Layer:** The editor core uses `surface_dim`.
*   **Secondary Panels:** Sidebars and terminal docks use `surface_container_low`.
*   **Floating Elements:** Command palettes and hover menus use `surface_bright` with a 12% opacity `outline_variant` "Ghost Border."
 
### The Glass & Gradient Rule
To prevent a flat "utility" feel, floating UI components must utilize **Glassmorphism**. 
*   **Technique:** Use `surface_container` colors at 80% opacity with a `20px` backdrop-blur. 
*   **Vibrancy:** Primary CTAs should not be flat. Apply a subtle linear gradient from `primary_dim` (#7e51ff) to `primary` (#b6a0ff) at a 135-degree angle to provide a sense of "light-source" energy.
 
---
 
## 3. Typography: Precision & Character
 
We utilize a dual-font strategy to balance technical rigor with editorial elegance.
 
*   **Display & Headlines (Space Grotesk):** High-energy, geometric, and slightly "tech-brutalist." Use `display-lg` for welcome screens or empty states to establish an authoritative, premium tone.
*   **Interface UI (Inter):** The workhorse. Used for `body` and `label` roles. It provides maximum legibility at small sizes (11px-14px) for file trees and property panels.
*   **The Code Soul (JetBrains Mono):** Reserved strictly for code blocks and terminal input. It represents the "data" layer of the system.
 
**Editorial Tip:** Use `label-sm` in all-caps with `0.05em` letter-spacing for metadata to create a "spec-sheet" aesthetic.
 
---
 
## 4. Elevation & Depth
 
### Tonal Layering
Depth is achieved by stacking. A card component should not use a shadow to separate itself from a sidebar; instead, place a `surface_container_highest` card on a `surface_container_low` background. This creates a "soft lift."
 
### Ambient Shadows
For floating modals (e.g., "Find and Replace"), use an **Ambient Shadow**:
*   **Shadow:** `0 12px 40px rgba(0, 0, 0, 0.5)`
*   **The Ghost Border:** Apply a 1px border using `outline_variant` at 15% opacity. This acts as a "specular highlight" on the edge of the glass, mimicking how light hits a screen's edge.
 
---
 
## 5. Components
 
### Buttons
*   **Primary:** Gradient of `primary_dim` to `primary`. Roundedness: `md` (0.375rem). Text: `label-md` (Bold).
*   **Secondary:** Ghost style. No background, 1px `outline_variant` (20% opacity). On hover, transition to `surface_bright`.
*   **Multiplayer Variant:** For collaborative actions, use `secondary` (#00e3fd) to signal "live" status.
 
### The Collaborative Cursor (Signature Component)
Instead of a simple line, cursors are represented by a `2px` vertical bar of `secondary` (or `tertiary`) with a trailing `label-sm` flag containing the user’s name. The flag uses `secondary_container` with `40%` opacity and a backdrop-blur.
 
### Inputs & Search
*   **Style:** Minimalist. No bottom line or full border. Use `surface_container_highest` as a solid base.
*   **Focus State:** A 1px glow using `primary` and a `0 0 8px` outer spread of the same color.
 
### Lists & File Trees
*   **The Separation Rule:** Forbid divider lines. Use `8px` of vertical white space and a `surface_bright` background-tint on hover to indicate selection.
*   **Leading Elements:** Use `primary` or `secondary` icons at 14px size to keep the UI feeling "sharp."
 
### Tooltips
*   **Color:** `surface_container_highest` with `on_surface` text.
*   **Rounding:** `sm` (0.125rem) to maintain a "precision instrument" feel.
 
---
 
## 6. Do's and Don'ts
 
### Do
*   **Do** use `primary_fixed_dim` for subtle accents in code syntax highlighting to tie the editor to the brand.
*   **Do** use asymmetrical margins (e.g., wider left margin in the editor) to create an editorial, "magazine" feel.
*   **Do** utilize micro-interactions: panels should "slide and fade" with a `200ms` cubic-bezier (0.4, 0, 0.2, 1) curve.
 
### Don't
*   **Don't** use pure white (#FFFFFF). Always use `on_surface` (#f1f3fc) to prevent eye strain in dark environments.
*   **Don't** use 100% opaque borders to separate the sidebar from the editor. Use the "No-Line" tonal shift.
*   **Don't** use standard "Drop Shadows." Only use Ambient Shadows or Tonal Layering.
*   **Don't** overcrowd the UI. If a feature isn't active, use `on_surface_variant` to let it recede into the background.