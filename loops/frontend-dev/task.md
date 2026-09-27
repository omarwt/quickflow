# Tasks — frontend-dev

Input: `PRD.md` · Mode: PRD · Status: **in progress**

This is the frontend plan and checklist, kept by hand. Tick a task when it is finished and change
a phase's status when it starts, finishes or gets blocked. A phase can start only when every
phase it depends on is done, including its backend phase.

`[ ]` not started · `[-]` in progress · `[x]` completed · `[!]` blocked

## FE-01 App shell and settings — done

Depends on: backend-dev/BE-01

- [x] T1 Choose the stack and record it in docs/architecture.md
- [x] T2 Project setup and an API client generated from OpenAPI
- [x] T3 Layout with persistent navigation to the six pages
- [x] T4 Shared loading, error and empty states, and dialogs
- [x] T5 Settings page
- [x] T6 Verify with Playwright MCP
- [x] T7 Document phase

## FE-02 Tasks page — done

Depends on: FE-01, backend-dev/BE-02

- [x] T1 Task list with search, filters and sort
- [x] T2 Add and edit form with validation
- [x] T3 Complete, archive, restore, delete
- [x] T4 Empty state
- [x] T5 Verify with Playwright MCP
- [x] T6 Document phase

## FE-03 Habits page — done

Depends on: FE-01, backend-dev/BE-03

- [x] T1 Habit cards with toggle, frequency and streak
- [x] T2 Add and edit form
- [x] T3 Deactivate and remove
- [x] T4 Empty state
- [x] T5 Verify with Playwright MCP
- [x] T6 Document phase

## FE-04 Learning resources page — done

Depends on: FE-01, backend-dev/BE-04

- [x] T1 Card grid and add form
- [x] T2 Expandable card with milestones
- [x] T3 Notes
- [x] T4 Remove card, empty state
- [x] T5 Verify with Playwright MCP
- [x] T6 Document phase

## FE-05 Todo plans page — done

Depends on: FE-01, backend-dev/BE-05

- [x] T1 Plan builder that picks existing items
- [x] T2 Plan list grouped into active, upcoming and completed
- [x] T3 Live rest time and progress
- [x] T4 Item toggles and remove
- [x] T5 Start-time notification
- [x] T6 Verify with Playwright MCP
- [x] T7 Document phase

## FE-06 UI/UX audit and design system — done

Depends on: FE-02, FE-03, FE-04, FE-05

- [x] T1 Baseline audit: Lighthouse plus screenshots at phone and desktop width, findings ranked in docs/ui-ux-plan.md
- [x] T2 Design tokens for colour, type scale, spacing, radius, elevation and motion, in light and dark
- [x] T3 Shared components: Button, IconButton, Icon set, Badge, Card, Menu, Skeleton
- [x] T4 Move the existing pages onto tokens and components with no behaviour change
- [x] T5 Verify: build, FE-01 to FE-05 regression, dark-theme scenario
- [x] T6 Document phase

## FE-07 UI/UX improvements to existing pages — done

Depends on: FE-06

- [x] T1 Fix contrast and focus findings, add a skip link and landmarks
- [x] T2 Mobile navigation without horizontal scroll, layouts from 360 px, touch targets
- [x] T3 Skeleton loading without layout shift, pending buttons, immediate toggle feedback
- [x] T4 Copy fixes: plurals, relative dates, clearer empty states and confirmations
- [x] T5 Verify: build, UX scenario (keyboard only, 360 px, dark), FE-01 to FE-05 regression, Lighthouse on the five pages
- [x] T6 Document phase

## FE-08 Responsive layouts for all screen sizes — done

Depends on: FE-07

- [x] T1 Breakpoint tokens for phone, large phone, tablet, laptop and wide, plus fluid type and spacing
- [x] T2 Tablet layout with an icon-rail sidebar and two columns; wide layout with three-column grids
- [x] T3 Phones: dialogs as bottom sheets, filters in a sheet, usable landscape
- [x] T4 Reflow at 320 px and 200 % zoom with no overflow
- [x] T5 Verify: screenshot matrix, responsive scenario, FE-01 to FE-07 regression, Lighthouse on mobile and desktop
- [x] T6 Document phase

## FE-09 Page transitions and navigation feel — done

Depends on: FE-08

- [x] T1 Route transitions with the View Transitions API; the shell and navigation stay still
- [x] T2 Prefetch a page's data when its link is hovered or focused, and keep previous data, so pages open without a loading flash
- [x] T3 On navigation: focus the page heading, set the page title, scroll to top; motion for dialogs, sheets, toasts and lists
- [x] T4 Respect reduced motion and keep CLS at 0 during navigation
- [x] T5 Verify: transition scenario, DevTools performance trace (INP under 200 ms), FE-01 to FE-07 regression
- [x] T6 Document phase

## FE-10 Dashboard page and Settings completion — in progress

Depends on: FE-09, backend-dev/BE-06

- [x] T1 Greeting and the four summary cards: tasks, habits, plans, learning
- [x] T2 Today's tasks, overdue, completed today, and the habit checklist
- [x] T3 Active plans with live rest time and progress, the next upcoming plan, and a learning snapshot
- [x] T4 Quick-add menu for task, habit, learning card and plan
- [x] T5 Settings: profile summary, notification behaviour, theme preference, local-time preview
- [ ] T6 Verify: dashboard and settings scenario, FE-01 to FE-09 regression, Lighthouse on all six pages
- [ ] T7 Document phase

## FE-11 End-to-end journey and UX acceptance — pending

Depends on: FE-10, backend-dev/BE-07

- [ ] T1 Full PRD journey on a fresh database
- [ ] T2 Reload persistence, keyboard-only run, 360 px mobile run
- [ ] T3 The journey on phone, tablet and desktop sizes with page transitions
- [ ] T4 Lighthouse on all six pages, mobile and desktop
- [ ] T5 Verify with Playwright MCP
- [ ] T6 Document phase
