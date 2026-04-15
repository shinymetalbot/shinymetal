# Design System: The Titanium Coliseum

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Machined Command Center."** 

This system is not a collection of templates; it is a high-performance instrument designed for the orchestration of AI agents. It rejects the "softness" of consumer web design in favor of industrial precision, architectural layering, and high-density data visualization. We move beyond the standard grid by utilizing intentional asymmetry—where sidebars may feel like docked hardware modules and headers function as telemetry readouts. 

The aesthetic is "Industrial Luxury": the feeling of a custom-milled aluminum chassis. We achieve this through deep tonal depth, high-voltage accents, and a total rejection of traditional structural lines in favor of material shifts.

---

## 2. Colors & Materiality
The palette is rooted in the "Titanium Coliseum" concept—heavy, cold, and professional, punctuated by the "electrical" energy of AI activity.

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders for sectioning or containment. Traditional borders feel "web-like" and fragile. Instead, boundaries must be defined solely through:
- **Background Color Shifts:** Use the `surface-container` tiers to distinguish sections (e.g., a `surface-container-low` sidebar against a `surface` main stage).
- **Tonal Transitions:** Use a 1px linear gradient that mimics a "beveled edge" rather than a flat line.

### Surface Hierarchy & Nesting
Treat the UI as a physical assembly of plates.
- **Base Layer:** `surface` (#121416). This is the "floor" of the coliseum.
- **The Pit:** `surface-container-lowest` (#0C0E10) for recessed areas like terminal consoles or log feeds.
- **The Plinth:** `surface-container-high` (#282A2C) for active workspace cards or primary interactive modules.
- **The Overlay:** `surface-container-highest` (#333537) for tooltips or floating modals.

### The "Glass & Gradient" Rule
To evoke a premium command center feel, use **Glassmorphism** for floating elements. Apply `surface-container-high` with a 70% opacity and a `backdrop-blur` of 20px. 
**Signature Glow:** Use a subtle radial gradient of `primary` (#DBFCFF) at 5% opacity in the top-left corner of primary containers to simulate the "glow" of a high-voltage screen.

---

## 3. Typography
Our typography is a dialogue between human-centric readability and machine-logic precision.

### The Mechanical & The Technical
- **Display & Headlines (Space Grotesk):** This font represents the "Engine." It is used for high-impact data points and section headers. Its mechanical character suggests precision engineering.
- **Body & Labels (Manrope):** This is the "Operator’s Manual." Manrope provides a clean, technical sans-serif look that ensures high legibility in high-density data environments.

### Editorial Scale
Use extreme contrast in your hierarchy. A `display-lg` headline should command the page, while `label-sm` metadata should be used aggressively for "technical specs" or agent telemetry.
- **Primary Headers:** `headline-lg` / `Space Grotesk` / Tracking: -0.02em.
- **Data Labels:** `label-md` / `Manrope` / Uppercase / Tracking: 0.05em / `on-surface-variant`.

---

## 4. Elevation & Depth
In this design system, elevation is an expression of **Power** rather than "shadows."

### The Layering Principle
Avoid shadows for flat cards. Instead, "stack" colors. A `surface-container-low` card sitting on a `surface` background creates a natural, sophisticated lift.

### Ambient Shadows
When an element must float (e.g., a command palette or modal), use an **Ambient Tinted Shadow**:
- **Color:** Use a 40% opacity version of `surface-container-lowest`.
- **Blur:** Large (32px - 64px) with 0 offset. 
- **Effect:** This mimics the way light is occluded by heavy, brushed metal rather than a cheap paper drop shadow.

### The "Ghost Border" Fallback
If a visual separator is strictly required for accessibility, use a **Ghost Border**: `outline-variant` (#3B494B) at 15% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons: The Power Switches
- **Primary:** Background `primary-container` (#00F0FF), Text `on-primary` (#00363A). Add a subtle `surface-tint` outer glow (4px blur) to simulate a powered-on state.
- **Secondary:** Background `surface-container-highest`, Ghost Border (15% `outline`). Text `primary`.
- **Corner Radius:** All buttons must use `md` (0.375rem / 6px).

### Input Fields: The Data Ports
Avoid the "box" look. Use `surface-container-low` with a bottom-only 2px accent of `outline-variant`. On focus, the bottom accent transitions to `primary` (#DBFCFF).

### Chips: The Status Indicators
- **Agent Status:** Use `secondary` (#FFB599) for "Warning/Attention" and `primary` for "Active."
- **Styling:** No background. Use a 1px "Ghost Border" and `label-sm` typography.

### Specialized Component: The "Telemetry Card"
For AI agent data, do not use dividers. Use vertical white space (from your `xl` spacing) and background color shifts to separate the "Header" of the card (`surface-container-highest`) from the "Content" (`surface-container-high`).

### Tooltips
Tooltips should feel like "Heads-Up Display" (HUD) elements. Use `surface-container-highest` with a `primary` top-border of 2px.

---

## 6. Do’s and Don’ts

### Do:
- **Use High-Voltage Accents Sparingly:** Use `primary` (#DBFCFF) only for active states, primary CTAs, or critical data. If everything glows, nothing is important.
- **Embrace Data Density:** Use `label-sm` and `body-sm` for technical readouts. This is a command center; the user expects to see the "inner workings."
- **Use Intentional Asymmetry:** Align high-level stats to the right and primary navigation to the left to create a "cockpit" feel.

### Don't:
- **Don't use 100% opaque borders:** This breaks the "Titanium" illusion and makes the UI feel like a standard website.
- **Don't use rounded corners over 8px:** We are building a "Coliseum," not a playground. Stay within the `sm` to `lg` range (2px to 8px).
- **Don't use pure black:** Always use `surface` (#121416) or `surface-container-lowest` to maintain the matte silver/charcoal depth. Pure black kills the "brushed metal" texture.
- **Don't use Divider Lines:** Use space or a shift from `surface-container-low` to `surface-container-high` to define content blocks.
