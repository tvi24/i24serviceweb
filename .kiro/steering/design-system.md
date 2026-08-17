---
inclusion: always
---

# Incident Management — Design System

Project-specific design decisions and token map for the AI-Assisted Incident Management portal. Runtime source of truth for values is `apps/web/src/styles/tokens.css`. Keep this file and that CSS in sync (HARD RULE #2). Framework rules live in `.kiro/steering/design-system-policies.md`.

## Direction (D3-12)

Clean enterprise operations console. Light mode default, WCAG 2.2 AA, generous whitespace, soft cards, subtle depth. No emoji anywhere — use Lucide SVG icons (ISC/MIT). Font: Inter (OFL). Character comes from a calm blue brand plus a disciplined priority/status color system, not from random accents.

## Color tokens

Semantic and brand colors (light mode). All component colors reference these variables; never hardcode hex in components.

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#f6f8fb` | page base |
| `--color-surface` | `#ffffff` | cards / panels |
| `--color-surface-2` | `#eef2f7` | section tint / table header |
| `--color-border` | `#dbe2ea` | hairline borders |
| `--color-text` | `#0f1b2d` | primary text |
| `--color-text-muted` | `#566072` | secondary text |
| `--color-primary` | `#1f5fd6` | brand primary / actions |
| `--color-primary-hover` | `#1a4fb3` | hover |
| `--color-primary-weak` | `#e7effb` | primary tint bg |
| `--color-focus` | `#1f5fd6` | focus-visible ring |
| `--color-success` | `#1f8a53` | success |
| `--color-warning` | `#b7791f` | warning / at-risk |
| `--color-danger` | `#c23b3b` | danger / breach |
| `--color-info` | `#2b6cb0` | info |

Priority colors (paired with icon + label, never color-only — WCAG):

| Token | Value | Priority |
|---|---|---|
| `--color-p1` | `#c23b3b` | P1 (red) |
| `--color-p2` | `#d97706` | P2 (orange) |
| `--color-p3` | `#b7791f` | P3 (amber) |
| `--color-p4` | `#64748b` | P4 (slate) |

SLA state: within_target → success, at_risk → warning, breached → danger. Each shown with a distinct icon shape + text label.

## Typography

| Token | Value |
|---|---|
| `--font-sans` | `'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif` |
| `--fs-xs` | `12px` |
| `--fs-sm` | `14px` |
| `--fs-md` | `16px` (base) |
| `--fs-lg` | `20px` |
| `--fs-xl` | `26px` |
| `--fs-2xl` | `34px` |
| `--fw-regular` | `400` |
| `--fw-medium` | `500` |
| `--fw-semibold` | `600` |
| `--fw-bold` | `700` |

## Layout / radius / shadow / motion

| Token | Value |
|---|---|
| `--container-max` | `1200px` |
| `--space-1..6` | `4 / 8 / 12 / 16 / 24 / 32 px` |
| `--radius-sm` | `6px` |
| `--radius-md` | `10px` |
| `--radius-lg` | `16px` |
| `--shadow-sm` | `0 1px 2px rgba(15,27,45,.06)` |
| `--shadow-md` | `0 4px 12px rgba(15,27,45,.08)` |
| `--shadow-lg` | `0 12px 28px rgba(15,27,45,.10)` |
| `--dur-fast` | `120ms` |
| `--dur-base` | `200ms` |
| `--ease-out` | `cubic-bezier(.2,.7,.3,1)` |

Motion respects `prefers-reduced-motion`. Tap targets ≥ 44px. Every interactive element has `:focus-visible` ring using `--color-focus`.

## Component conventions

- **Buttons**: primary (brand fill), secondary (surface + border), ghost, danger. States: hover/active/focus-visible/disabled.
- **Cards**: `--color-surface`, `--radius-md`, `--shadow-sm`, hover lift to `--shadow-md`.
- **Badges**: PriorityBadge (P1–P4 color + icon + label), StatusBadge, SlaBadge (icon + label + state color).
- **Tables**: sticky header `--color-surface-2`, row hover, horizontal scroll only inside its own container on small screens.
- **Icons**: Lucide via `currentColor`; sizes 16 (inline), 20 (nav/actions), 24 (headers).

## Logo & responsive

- App wordmark rendered as text ("Incident Management") + a generic Lucide shield/activity mark; no third-party logos.
- Mobile-first responsive: sidebar/nav collapses to a drawer + hamburger below `768px`; multi-column grids collapse to single column; fluid type/spacing; no horizontal page scroll.

## Page blueprints

- **AppShell**: top bar (wordmark, role nav, AlertCenter bell with unread count, user menu) + centered `--container-max` content, section gaps of `--space-5`.
- **Login**: centered card.
- **Intake**: single-column form card, inline validation, success panel with ticket id.
- **Control Tower / My Incidents**: filter bar + incident table with Priority/SLA/Status badges.
- **Incident Workspace**: two-column (detail + activity timeline) collapsing to one column; role-gated action panels.
- **Alert Center**: list of alert cards grouped by severity, acknowledge action.
- **Dashboard**: KPI cards row + charts + no-data states.
- **SLA Config**: form of editable targets/matrix/routing (manager only).
