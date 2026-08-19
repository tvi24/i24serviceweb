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

## Add-on — Dark theme & Localization (R16, R17)

Approved 2026-08-17. Light mode remains the default (framework HARD RULE #7). Dark is opt-in via a toggle and follows OS preference on first load when no stored choice exists.

### Dark palette (`[data-theme="dark"]` in `tokens.css`)

Color tokens only are overridden; layout/typography/radius/motion tokens are shared. All values chosen for WCAG 2.2 AA text/background contrast.

| Token | Dark value |
|---|---|
| `--color-bg` | `#0f1420` |
| `--color-surface` | `#171e2e` |
| `--color-surface-2` | `#1f2838` |
| `--color-border` | `#2c3648` |
| `--color-text` | `#e7ecf3` |
| `--color-text-muted` | `#9aa7bd` |
| `--color-primary` | `#5b8def` |
| `--color-primary-hover` | `#7aa4f2` |
| `--color-primary-weak` | `#1a2740` |
| `--color-focus` | `#5b8def` |
| `--color-success` | `#3fae6f` |
| `--color-success-weak` | `#132a20` |
| `--color-warning` | `#d99e3a` |
| `--color-warning-weak` | `#2e2413` |
| `--color-danger` | `#e06b6b` |
| `--color-danger-weak` | `#2e1717` |
| `--color-info` | `#5aa2e0` |
| `--color-info-weak` | `#132433` |
| `--color-p1` | `#e06b6b` |
| `--color-p2` | `#e8933f` |
| `--color-p3` | `#d9a441` |
| `--color-p4` | `#8a97ad` |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,.4)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,.45)` |
| `--shadow-lg` | `0 12px 28px rgba(0,0,0,.5)` |

### Controls
- **ThemeToggle** — Lucide `Sun`/`Moon`, in AppShell bar + Login. Keyboard operable, `:focus-visible` ring, `aria-label` reflects current state. Persist to `localStorage['im.theme']`.
- **LanguageSwitch** — TH/EN segmented control, in AppShell bar + Login. Keyboard operable, `aria-label`. Persist to `localStorage['im.lang']`. No emoji flags (use text `TH`/`EN`).

### Localization notes
- Interface strings only; user-entered incident content preserved as entered.
- Enum display labels (Status/Priority/SlaState/Role) localized via helper maps; stored values unchanged.
- Missing key → English fallback, never a raw key.
