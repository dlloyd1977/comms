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

## Current Status
- Status: Phase 1 cleanup complete for structural header/menu standardization.
- Latest audit snapshot:
  - Pages scanned: 22
  - Header/menu controls found: 618
  - Pages without header/menu controls: 0

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
- [ ] Optional runtime parity: verify auth-state behavior wiring for `Change Password` / `Log Out` on hub/invite/quick beyond structural parity.
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

Operationally, this closes Phase 1 navigation standardization: all Kybalion entry pages now follow a single, repeatable header/menu contract, materially reducing UX inconsistency and maintenance overhead. Going forward, header-related changes can be delivered as one shared pattern update rather than multi-page rework, lowering delivery risk and review effort. Remaining work is limited to targeted runtime parity checks (auth-state behavior) and optional polish for reader-specific, non-global controls.
