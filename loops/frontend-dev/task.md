# Tasks — frontend-dev

Input: `PRD.md` · Mode: prd · Status: **in_progress**

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

## FE-06 UI/UX audit and design system (done)

- [x] T1 Baseline audit: Lighthouse (ux-audit.py) plus headless screenshots at 390 and 1280 px, findings ranked in docs/ui-ux-plan.md
- [x] T2 Design tokens for colour, type scale, spacing, radius, elevation and motion, in light and dark
- [x] T3 Shared components: Button variants and sizes, IconButton, Icon set, Badge, Card, Menu, Skeleton
- [x] T4 Move existing pages onto tokens and components with no behaviour change
- [x] T5 Verify: build, FE-01..05 Playwright regression, dark-theme scenario
- [x] T6 Document phase

## FE-07 UI/UX improvements to existing pages (done)

- [x] T1 Fix contrast and focus findings, add skip link and landmarks
- [x] T2 Mobile navigation without horizontal scroll, layouts from 360 px, touch targets
- [x] T3 Skeleton loading without layout shift, pending buttons, immediate toggle feedback
- [x] T4 Copy fixes: plurals, relative dates, clearer empty states and confirmations
- [x] T5 Verify: build, UX scenario (keyboard-only, 360 px, dark), FE-01..05 regression, ux-audit on the five pages
- [x] T6 Document phase

## FE-08 Responsive layouts for all screen sizes (done)

- [x] T1 Breakpoint system as tokens: phone <480, large phone 480-759, tablet 760-1023, laptop 1024-1439, wide 1440+, plus fluid type and spacing with clamp()
- [x] T2 Tablet layout: collapsible icon-rail sidebar, two-column grids; wide layout: wider content, three-column card grids, list rows with inline meta
- [x] T3 Phones: dialogs become bottom sheets, toolbar filters collapse into a Filters sheet, landscape phones keep the tab bar usable
- [x] T4 Reflow at 320 CSS px and 200% zoom (WCAG 1.4.10), long titles and numbers wrap without overflow
- [x] T5 Verify: screenshot matrix (320, 390, 768, 1024, 1440, 1920), responsive scenario, FE-01..07 regression, ux-audit mobile + desktop
- [x] T6 Document phase

## FE-09 Page transitions and navigation feel (in_progress)

- [x] T1 Route transitions with the View Transitions API (React Router viewTransition), shell and navigation stay still, content cross-fades and slides
- [x] T2 Prefetch a page's data when its nav link is hovered or focused, and keep previous data, so pages open without a loading flash
- [x] T3 Focus and announcement on navigation: move focus to the page heading, per-page document.title, scroll to top; motion for dialogs, sheets, toasts and list add/remove
- [x] T4 Respect prefers-reduced-motion (no movement, instant or fade only) and keep CLS 0 during navigation
- [ ] T5 Verify: transition scenario (titles, focus, no loading flash after prefetch, reduced motion), Chrome DevTools performance trace (INP under 200 ms, no layout shift), FE-01..07 regression
- [ ] T6 Document phase

## FE-10 Dashboard page and Settings completion (pending)

- [ ] T1 Greeting and the four summary cards (tasks, habits, plans, learning) with their numbers
- [ ] T2 Today's tasks, overdue, completed today, and the habit checklist (active and done today)
- [ ] T3 Active plans with live rest time and progress, the next upcoming plan, and a learning snapshot (cards in progress with milestone progress, milestones this week)
- [ ] T4 Quick-add menu for task, habit, learning card and plan
- [ ] T5 Settings: profile summary (initials, name, email, member since, data counts), notification behaviour (browser permission, allow, test notification), theme preference (system/light/dark), local-time preview for the timezone
- [ ] T6 Verify: dashboard + settings scenario, FE-01..09 regression, ux-audit on all six pages
- [ ] T7 Document phase

## FE-11 End-to-end journey and UX acceptance (pending)

- [ ] T1 Full PRD journey on a fresh database
- [ ] T2 Reload persistence, keyboard-only and 360 px mobile run
- [ ] T3 Journey on phone, tablet and desktop sizes with page transitions
- [ ] T4 ux-audit on all six pages, mobile and desktop
- [ ] T5 Verify with Playwright MCP
- [ ] T6 Document phase
