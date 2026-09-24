# Tasks — frontend-dev

Input: `PRD.md` · Mode: prd · Status: **ready**

`[ ]` not started · `[-]` in progress · `[x]` completed · `[!]` blocked

## FE-01 App shell and settings (done)

- [x] T1 Choose stack and record it in docs/architecture.md
- [x] T2 Project setup and API client from OpenAPI
- [x] T3 Layout with persistent navigation to six pages
- [x] T4 Shared loading, error, empty states and dialogs
- [x] T5 Settings page
- [x] T6 Verify with Playwright MCP
- [x] T7 Document phase

## FE-02 Tasks page (done)

- [x] T1 Task list with search, filters, sort
- [x] T2 Add/edit form with validation
- [x] T3 Complete, archive, restore, delete
- [x] T4 Empty state
- [x] T5 Verify with Playwright MCP
- [x] T6 Document phase

## FE-03 Habits page (done)

- [x] T1 Habit cards with toggle, frequency, streak
- [x] T2 Add/edit form
- [x] T3 Deactivate and remove
- [x] T4 Empty state
- [x] T5 Verify with Playwright MCP
- [x] T6 Document phase

## FE-04 Learning resources page (done)

- [x] T1 Card grid and add form
- [x] T2 Expandable card with milestones
- [x] T3 Notes
- [x] T4 Remove card, empty state
- [x] T5 Verify with Playwright MCP
- [x] T6 Document phase

## FE-05 Todo plans page (done)

- [x] T1 Plan builder picking existing items
- [x] T2 Plan list grouped active/upcoming and completed
- [x] T3 Live rest time and progress
- [x] T4 Item toggles and remove
- [x] T5 Start-time notification
- [x] T6 Verify with Playwright MCP
- [x] T7 Document phase

## FE-06 UI/UX audit and design system (pending)

- [ ] T1 Baseline audit: Lighthouse (ux-audit.py) plus headless screenshots at 390 and 1280 px, findings ranked in docs/ui-ux-plan.md
- [ ] T2 Design tokens for colour, type scale, spacing, radius, elevation and motion, in light and dark
- [ ] T3 Shared components: Button variants and sizes, IconButton, Icon set, Badge, Card, Menu, Skeleton
- [ ] T4 Move existing pages onto tokens and components with no behaviour change
- [ ] T5 Verify: build, FE-01..05 Playwright regression, dark-theme scenario
- [ ] T6 Document phase

## FE-07 UI/UX improvements to existing pages (pending)

- [ ] T1 Fix contrast and focus findings, add skip link and landmarks
- [ ] T2 Mobile navigation without horizontal scroll, layouts from 360 px, touch targets
- [ ] T3 Skeleton loading without layout shift, pending buttons, immediate toggle feedback
- [ ] T4 Copy fixes: plurals, relative dates, clearer empty states and confirmations
- [ ] T5 Verify: build, UX scenario (keyboard-only, 360 px, dark), FE-01..05 regression, ux-audit on the five pages
- [ ] T6 Document phase

## FE-08 Dashboard page (pending)

- [ ] T1 Greeting and summary cards
- [ ] T2 Today's tasks, overdue, habit checklist
- [ ] T3 Active plans with live rest time, learning snapshot
- [ ] T4 Quick-add actions
- [ ] T5 Verify with Playwright MCP and ux-audit on /dashboard
- [ ] T6 Document phase

## FE-09 End-to-end journey and UX acceptance (pending)

- [ ] T1 Full PRD journey on a fresh database
- [ ] T2 Reload persistence, keyboard-only and 360 px mobile run
- [ ] T3 ux-audit on all six pages, mobile and desktop
- [ ] T4 Verify with Playwright MCP
- [ ] T5 Document phase
