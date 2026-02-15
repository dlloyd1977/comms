# Header Navigation Cleanup Plan

## Scope
- Kybalion pages audited: 22 HTML pages under `comms/docs/kybalion/` (excluding backups and audits).
- Baseline artifacts:
  - `header_nav_inventory.csv`
  - `header_nav_audit.md`

## Cleanup Goals
1. Normalize top-level navigation controls across hub, reader, and docs pages.
2. Standardize control class/style patterns for shared controls.
3. Decide and document intentional no-header behavior for invite/quick pages.

## Naming Contract
- `main_menu_button_1` is the canonical name for the shared Kybalion Main Menu button pattern (`#menuBtn` + `#menuPanel`) used across hub, invite, quick, docs, and reader experiences.
- All future menu-button design references in audit/cleanup notes should use `main_menu_button_1` as the baseline contract name.

## Control Glossary
| Canonical Name | Selector Pattern | Visual Contract (Color/Style) | Interaction Pattern | Placement Contract | Behavior Contract |
|---|---|---|---|---|---|
| `main_menu_button_1` | Trigger: `#menuBtn.button.secondary` + Panel: `#menuPanel.menu-panel` + Sessions: `#menuSessionsBtn`/`#menuSessionsFlyout` | Pill-shaped secondary outline button; accent-colored text/border (`--accent` or `--text-link`) on light background; paired white menu panel with bordered `menu-link` items | Menu button opening a flyout/dropdown panel (`menuPanel`) with nested Sessions flyout (`menuSessionsFlyout`) | Header/topbar global control in `.menu-wrapper`, right-aligned with other header actions, consistently present on hub/invite/quick/docs/reader pages | `aria-haspopup/expanded/controls` parity, section labels (`Navigation`/`Documents`), ordered nav/doc/session links, role-aware auth/admin visibility, Sessions keyboard contracts (`Escape` close + focus return, first-item focus on open, `Tab`/`Shift+Tab` containment, `ArrowDown`/`ArrowUp`/`Home`/`End` roving focus) |

## Current Status
- Status: Phase 1 cleanup complete for structural header/menu standardization.
- Latest audit snapshot:
  - Pages scanned: 22
  - Header/menu controls found: 618
  - Pages without header/menu controls: 0
- Additional contract checks now enforced in audit output: global Main Menu presence, admin-only tagging for `Assets`/`Master Documents`, top-level auth-runtime wiring parity, and menu ordering contract (`Navigation/Documents/session sequence`).
- Additional accessibility/semantic contract now enforced in audit output: exact `menu-title` section labels (`Navigation`, `Documents`) and ARIA parity between `#menuBtn` and `#menuPanel` (`aria-controls`, `aria-haspopup`, `aria-expanded`, `role=menu`, `aria-label=Documents`).
- Additional sessions accessibility contract now enforced in audit output: `#menuSessionsBtn` ↔ `#menuSessionsFlyout` linkage with `aria-controls="menuSessionsFlyout"` and synchronized `aria-expanded` state across top-level, docs, and reader runtimes.
- Additional sessions keyboard contract now enforced in audit output: `Escape` closes sessions flyout first and returns focus to `#menuSessionsBtn` across top-level, docs, and reader runtimes (including fallback handlers).
- Additional sessions focus-loop contract now enforced in audit output: opening sessions flyout moves focus to the first flyout item, and `Tab` / `Shift+Tab` are contained within the sessions flyout interaction loop across top-level, docs, and reader runtimes (including fallback handlers).
- Additional sessions roving-focus contract now enforced in audit output: `ArrowDown` / `ArrowUp` navigation plus `Home` / `End` first-last jumps inside sessions flyout across top-level, docs, and reader runtimes (including fallback handlers).
- Additional sessions listener hardening now enforced in audit output: Tab containment + roving-focus handlers must be attached to both `#menuSessionsBtn` and `#menuSessionsFlyout` in active runtime/fallback paths.

## Priority Actions (Kickoff)

### P1 — Navigation Contract
- Define mandatory global controls for top-level pages:
  - Home
  - Kybalion Home
  - Reader
  - Document Library
  - Auth action (Sign In/Create Account or Log Out)
- Decide one primary pattern:
  - Option A: Main Menu panel everywhere
  - Option B: Direct links everywhere

### P2 — Style Contract
- Standardize global control classes:
  - Primary CTA: `button primary`
  - Secondary CTA: `button secondary`
  - Menu links: `menu-link`
- Ensure consistent label casing:
  - `Main Menu`
  - `Document Library`
  - `Sign In / Create Account`

### P3 — Placement Contract
- Keep global nav in header region only.
- Keep sessions/document hierarchy within menu panel if menu pattern is chosen.
- Avoid page-specific variants for identical global controls.

## Initial Cleanup Backlog
- [x] Unify hub page (`index.html`) with chosen nav pattern.
- [x] Normalize reader/docs shared controls and class tokens.
- [x] Decide invite/quick behavior (add minimal header or explicitly document no-header design).
- [x] Re-run audit script and compare control frequency/placement deltas.

## Remaining Follow-Ups
- [x] Optional runtime parity: enforce auth-state behavior wiring contract for `Change Password` / `Log Out` on hub/invite/quick via audit assertion (IDs/default visibility/body data attrs/shared scripts).
- [ ] Optional long-tail cleanup: normalize page-specific non-global controls if a stricter token contract is desired (`view-pill-button`, reader-only tools).

## Verification
- Re-run:
  - `python3 comms/docs/kybalion/docs/audits/header_nav/run_header_audit.py`
- Confirm updates in:
  - `header_nav_inventory.csv`
  - `header_nav_audit.md`

## Final Delta Report (Initial Baseline → Current)

- Baseline commit: `a11d120` (`Add Kybalion header-nav audit artifacts and cleanup baseline`)
- Comparison target: current `main` audit snapshot (`header_nav_audit.md`)

### Headline Metrics
- Pages scanned: `22 → 22` (`Δ 0`)
- Header/menu controls found: `521 → 618` (`Δ +97`)
- Pages without header/menu controls: `3 → 0` (`Δ -3`)

### Placement Deltas
- `header_menu`: `432 → 550` (`Δ +118`)
- `header`: `84 → 63` (`Δ -21`)
- `other`: `5 → 5` (`Δ 0`)

### Global Control Frequency Deltas
- `main menu`: `18 → 22` (`Δ +4`)
- `home`: `19 → 22` (`Δ +3`)
- `reader`: `19 → 22` (`Δ +3`)
- `document library`: `19 → 22` (`Δ +3`)
- `kybalion home`: `18 → 22` (`Δ +4`)
- `sign in / create account`: `18 → 22` (`Δ +4`)
- `change password`: `18 → 22` (`Δ +4`)
- `log out`: `18 → 22` (`Δ +4`)
- `general`: `18 → 22` (`Δ +4`)
- `sessions ▸`: `18 → 22` (`Δ +4`)
- `session 1` … `session 12`: each `18 → 22` (`Δ +4` each)
- `templates`: `18 → 22` (`Δ +4`)
- `assets`: `18 → 22` (`Δ +4`)
- `master documents`: `18 → 22` (`Δ +4`)

### Structural Outcomes Confirmed by Audit Diff
- `index.html` moved from a 3-link header footprint to full shared Main Menu contract (`25` audited controls).
- `invite1/index.html`, `invite2/index.html`, and `quick/index.html` moved from no detected header/menu controls to full shared Main Menu contract (`25` controls each).
- Shared token usage normalized toward `menu-link` + `button secondary` patterns, with canonical class-token ordering reflected in artifacts.

### Handoff Summary
- PM: Phase 1 navigation standardization is complete; all Kybalion entry pages now use one shared header/menu contract, reducing UX drift and lowering future change risk/cost.
- Implementation Notes: Structural convergence is validated by `header_nav_audit.md` and `header_nav_inventory.csv`; remaining engineering scope is runtime auth-state parity checks on hub/invite/quick and optional harmonization of reader-local, non-global control tokens.
