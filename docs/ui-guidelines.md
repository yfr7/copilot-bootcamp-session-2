# UI Guidelines

## General Principles

- **Consistency:** All UI elements should follow a unified visual language across the application.
- **Simplicity:** Keep the interface clean and minimal; avoid unnecessary visual clutter.
- **Accessibility:** The app must be usable by people with diverse abilities. Follow WCAG 2.1 AA standards.
- **Responsiveness:** The layout should adapt gracefully to different screen sizes (mobile, tablet, desktop).

## Layout

- Use a single-column, centered layout for the TODO list with a maximum width of **720px**.
- The main content area should have consistent padding of **16px** on mobile and **32px** on larger screens.
- Use a sticky header for the app title and primary actions.

## Color Palette

| Token            | Light Mode   | Dark Mode    | Usage                        |
| ---------------- | ------------ | ------------ | ---------------------------- |
| `--color-primary`   | `#1976D2`    | `#90CAF9`    | Primary actions, links       |
| `--color-secondary` | `#FF9800`    | `#FFB74D`    | Accents, highlights          |
| `--color-bg`        | `#FAFAFA`    | `#121212`    | Page background              |
| `--color-surface`   | `#FFFFFF`    | `#1E1E1E`    | Cards, input fields          |
| `--color-text`      | `#212121`    | `#E0E0E0`    | Primary text                 |
| `--color-text-sec`  | `#757575`    | `#9E9E9E`    | Secondary/helper text        |
| `--color-error`     | `#D32F2F`    | `#EF5350`    | Error states, delete actions |
| `--color-success`   | `#388E3C`    | `#66BB6A`    | Success states, completed    |

## Typography

- **Font Family:** Use the system font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
- **Heading (App Title):** 24px, bold (600 weight).
- **Body Text:** 16px, regular (400 weight).
- **Small/Helper Text:** 12px, regular (400 weight).
- Line height should be at least **1.5** for body text to ensure readability.

## Components

### Buttons

- **Primary Button:** Filled with `--color-primary`, white text, 8px border-radius, 12px vertical / 24px horizontal padding.
- **Secondary Button:** Outlined with `--color-primary` border, transparent background.
- **Danger Button:** Filled with `--color-error` for destructive actions (e.g., delete).
- All buttons should have a visible focus outline for keyboard navigation.
- Minimum touch target size: **44×44px**.

### Input Fields

- Use a bottom-border or outlined style with `--color-primary` on focus.
- Placeholder text should use `--color-text-sec`.
- Validation error messages appear below the input in `--color-error` with a 12px font size.

### Todo Item Card

- Each Todo item should be displayed as a card on `--color-surface` with a subtle box shadow (`0 1px 3px rgba(0,0,0,0.12)`).
- Cards should have **12px** padding and **8px** border-radius.
- Spacing between cards: **8px**.
- Completed items should have a strikethrough on the title and reduced opacity (0.6).

### Checklist (Sub-tasks)

- Display sub-tasks as an indented list within the Todo card.
- Each sub-task has a checkbox and a text label.
- Checked sub-tasks should show strikethrough text.
- A "+ Add task" link/button appears at the bottom of the checklist.

### Icons

- Use simple, recognizable icons (e.g., from Material Icons or a lightweight SVG icon set).
- Icon size: **24px** for actions, **20px** for inline indicators.
- Icons must have accessible labels (`aria-label` or `title` attribute).

## Spacing & Sizing

- Follow an **8px** spacing grid (8, 16, 24, 32, 48, 64…).
- Use consistent margin and padding values aligned to the grid.

## Animations & Transitions

- Use subtle transitions for hover/focus states (e.g., `transition: all 0.2s ease`).
- Avoid animations that are distracting or trigger motion sickness. Respect the `prefers-reduced-motion` media query.

## Accessibility

- All interactive elements must be reachable and operable via keyboard.
- Color contrast ratios must meet at least **4.5:1** for normal text and **3:1** for large text.
- Use semantic HTML elements (`<button>`, `<input>`, `<label>`, `<ul>`, `<li>`) instead of generic `<div>` or `<span>` where appropriate.
- Provide visible focus indicators on all focusable elements.
- Form inputs must have associated `<label>` elements.

## Dark Mode

- Support a dark mode toggle or respect the user's system preference via `prefers-color-scheme`.
- All color tokens should switch between light and dark values accordingly.
