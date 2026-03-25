# Font System Guidelines

## Primary Font Stack

**System Font:** Segoe UI (Windows native)

```css
"Segoe UI", Roboto, Helvetica, Arial, sans-serif
```

## Implementation

### Global Configuration

Font is applied globally via `@layer base` in `globals.css`:

```css
@layer base {
  * {
    font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-weight: 400;
  }
  body {
    @apply bg-background text-foreground;
    font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
}
```

### Theme Variable

```css
--font-sans: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

### Font Weights

- **Normal:** 400 (default)
- **Bold:** 700 (use `.force-bold` class)

### Rules

1. Do NOT add redundant `font-family` declarations to individual components
2. The global `*` selector already applies the font to all elements
3. Use `.force-bold` class for bold text (font-weight: 700)
4. Print styles should inherit the global font

### Maintenance

- Keep Segoe UI as the primary system font for Windows users
- Roboto serves as fallback for Android/Chrome OS
- Helvetica/Arial as final fallbacks for macOS and older systems

## Font Size System

### Base Size

- **Root:** 14px (base for all rem calculations)
- **Body:** 14px (0.875rem)

### Type Scale

| Size | rem       | px   | Usage             |
| ---- | --------- | ---- | ----------------- |
| xs   | 0.75rem   | 12px | Captions, badges  |
| sm   | 0.8125rem | 13px | Secondary text    |
| base | 0.875rem  | 14px | Body text, inputs |
| md   | 1rem      | 16px | Emphasis          |
| lg   | 1.125rem  | 18px | Subheadings       |
| xl   | 1.25rem   | 20px | Headings          |
| 2xl  | 1.5rem    | 24px | Page titles       |

### Implementation

```css
@layer base {
  html {
    font-size: 14px;
  }
  body {
    font-size: 0.875rem;
  }
}
```

### Rules

1. Use rem units for all font sizes (based on 14px root)
2. Avoid px units for fonts - use the scale above
3. Print styles: reduce to 9pt-10pt for tables
