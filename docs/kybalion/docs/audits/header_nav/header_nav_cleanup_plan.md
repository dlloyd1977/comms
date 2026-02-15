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
