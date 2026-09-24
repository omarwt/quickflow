# OR-01 Requirements analysis

## Requirements covered

- PRD.md (whole document)

## Tasks

- T1 Read the full PRD
- T2 Give every requirement an ID
- T3 Record ambiguities and chosen interpretations
- T4 Assign each requirement to backend, frontend or both
- T5 Verify coverage of the PRD
- T6 Document phase output

## Implementation

### The product in brief

QuickFlow is a single-user productivity app with six pages: Dashboard, Tasks, Habits, Learning
Resources, Todo Plans and Settings. The distinctive feature is the **plan**. A plan bundles existing
tasks, habits and learning cards into a time-boxed block with an estimated duration, a start/end
date-time and a priority order. While a plan is running it shows live progress (done items ÷ all
items) and a live "rest time" countdown, and the dashboard rolls everything up.

Owner column: **BE** = backend-dev, **FE** = frontend-dev, **BE+FE** = both.

### User stories (PRD §5)

| ID | Story | Owner | Traces to |
|---|---|---|---|
| US-TASK-1 | create a task | BE+FE | FR-01, BR-1, BR-2 |
| US-TASK-2 | edit a task | BE+FE | FR-01, BR-1, BR-2, BR-3 |
| US-TASK-3 | mark a task as completed | BE+FE | FR-01, BR-5 |
| US-TASK-4 | delete or archive a task | BE+FE | FR-01, BR-4, BR-14 |
| US-TASK-5 | filter tasks by status and priority | BE+FE | FR-02 |
| US-TASK-6 | search my tasks | BE+FE | FR-02 |
| US-TASK-7 | see overdue tasks | BE+FE | FR-02, FR-09 |
| US-HAB-1 | create a recurring habit | BE+FE | FR-03, BR-6 |
| US-HAB-2 | choose daily or weekly recurrence | BE+FE | FR-03 |
| US-HAB-3 | mark a habit complete for today | BE+FE | FR-04, BR-7 |
| US-HAB-4 | see my current habit completion progress | BE+FE | FR-04 |
| US-HAB-5 | remove a habit I no longer track | BE+FE | FR-03 |
| US-LRN-1 | add a learning resource as a card | BE+FE | FR-05, BR-8 |
| US-LRN-2 | remove a learning card | BE+FE | FR-05 |
| US-LRN-3 | add milestones under a card | BE+FE | FR-06, BR-9 |
| US-LRN-4 | mark milestones complete | BE+FE | FR-06 |
| US-LRN-5 | attach free-form notes to a card | BE+FE | FR-06 |
| US-PLAN-1 | create a plan from existing tasks, habits and/or learning resources | BE+FE | FR-07, BR-10 |
| US-PLAN-2 | set an estimated time for a plan | BE+FE | FR-07 |
| US-PLAN-3 | set a start and end date/time | BE+FE | FR-07, BR-11 |
| US-PLAN-4 | set a priority order relative to other plans | BE+FE | FR-07 |
| US-PLAN-5 | mark individual plan items done | BE+FE | FR-07, FR-08, BR-13 |
| US-PLAN-6 | remove a plan | BE+FE | FR-07 |
| US-PLAN-7 | be notified when a plan's start time arrives | BE+FE | FR-08 |
| US-PLAN-8 | see a live rest-time indicator from start to end | BE+FE | FR-08, BR-12, NFR-2 |
| US-PLAN-9 | see plan progress based on items done | BE+FE | FR-08 |
| US-PLAN-10 | see a history of past plans and how much of each was completed | BE+FE | FR-08 |
| US-DASH-1 | see today's tasks right after opening the app | BE+FE | FR-09 |
| US-DASH-2 | see overdue tasks | BE+FE | FR-09 |
| US-DASH-3 | see today's habits | BE+FE | FR-09 |
| US-DASH-4 | see a simple completion percentage | BE+FE | FR-09 |
| US-DASH-5 | see active plans and their rest time at a glance | BE+FE | FR-08, FR-09 |
| US-DASH-6 | see a snapshot of learning progress | BE+FE | FR-09 |

### Functional requirements (PRD §6)

| ID | Summary | Backend | Frontend |
|---|---|---|---|
| FR-01 | Task (Id, Title, Description, Status Todo/In Progress/Done, Priority Low/Medium/High, DueDate, CreatedAt, UpdatedAt, IsArchived); create, read, update, archive, restore, delete | entity, CRUD, archive/restore/complete endpoints | Tasks page, add/edit form, row actions |
| FR-02 | Search by title; filter by status, priority, due date; sort by due or creation date | list endpoint with query parameters | search box, filters, sort |
| FR-03 | Habit (Id, Name, Description, Frequency Daily/Weekly, CreatedAt, IsActive); create, update, deactivate, delete | entity + endpoints | Habits page, habit cards |
| FR-04 | HabitCompletion (Id, HabitId, CompletionDate); complete for a date; duplicates per habit/date prevented | unique (HabitId, CompletionDate), 409 on duplicate | completion toggle, streak indicator |
| FR-05 | LearningCard (Id, Title, Description/source, CreatedAt, Status Not Started/In Progress/Completed); add, remove | entity + endpoints | card grid |
| FR-06 | Milestones (title, IsDone, optional target date) and notes (text, timestamp) per card; add/complete/remove milestones, add/remove notes | child entities, nested endpoints | expandable card with milestone and note controls |
| FR-07 | Plan (Id, Title, items referencing Task/Habit/LearningResource with their own IsDone, EstimatedDuration, StartDateTime, EndDateTime, PriorityOrder, Status, CreatedAt); create from existing items, mark an item done, remove | entities, validation of referenced items | plan builder, plan list |
| FR-08 | Notify at StartDateTime; live rest time between start and end; completion % = done ÷ total; automatic status Not Started → In Progress → Completed; item changes reflected immediately in the plan and the dashboard | status/progress/rest-time rules, start-notification data | countdown, notification, cross-page refresh |
| FR-09 | Dashboard: tasks due today, overdue tasks, tasks completed today, active habits and habits completed today, task completion %, in-progress plans with rest time and progress, learning snapshot | aggregate endpoint | Dashboard page |

### Business rules (PRD §7)

| ID | Rule | Enforced |
|---|---|---|
| BR-1 | Task title required, max 200 characters | BE validation (400) + FE form |
| BR-2 | Task description optional, max 2,000 characters | BE + FE |
| BR-3 | Task status and priority must be valid values | BE (400) |
| BR-4 | Archived tasks are excluded from the default task list | BE default query |
| BR-5 | A completed task has status Done | BE |
| BR-6 | Habit name required, max 150 characters | BE + FE |
| BR-7 | Only one completion per habit per date | DB unique constraint + BE (409) |
| BR-8 | Learning card title required | BE + FE |
| BR-9 | A milestone belongs to exactly one learning card | BE (required parent, nested routes) |
| BR-10 | A plan must reference at least one existing task, habit or learning item | BE |
| BR-11 | A plan's EndDateTime must be after its StartDateTime | BE (400) + FE |
| BR-12 | Rest time is only shown between StartDateTime and EndDateTime | BE rule + FE display |
| BR-13 | Marking a plan item done doesn't change the original entity, unless the item *is* that entity's own completion action (e.g. a task item completes the task) | BE, one place only (see I-6) |
| BR-14 | Deleted resources are not returned by normal queries | BE |

### Non-functional requirements (PRD §10)

| ID | Area | Requirement | Owner |
|---|---|---|---|
| NFR-1 | Performance | typical actions (create/update/delete/filter) under 500 ms | BE+FE |
| NFR-2 | Performance | live rest time updates at least once a minute while in progress | FE |
| NFR-3 | Reliability | state persists between sessions | BE |
| NFR-4 | Reliability | plan status is computed consistently from stored times and item completion, even after the app is reopened | BE |
| NFR-5 | Usability | every list page supports adding and removing items directly | FE |
| NFR-6 | Usability | empty states lead the user to the relevant "add" action | FE |
| NFR-7 | Maintainability | domain rules are testable and separate from presentation | BE+FE |
| NFR-8 | Maintainability | no duplicated completion logic between plan items and their source entities | BE |

### UX requirements (PRD §8)

| ID | Page | Requirement | Owner |
|---|---|---|---|
| UX-NAV | all | persistent navigation to the six pages | FE |
| UX-DASH | Dashboard | greeting, summary cards (tasks, habits, plans, learning), today's tasks, habit checklist, active plans with live progress/rest time, quick-add actions | FE |
| UX-TASK | Tasks | search, status and priority filters, Add Task, list with edit/delete/archive, empty state | FE |
| UX-HAB | Habits | Add Habit, cards with completion toggle, frequency label, streak indicator, edit/deactivate/remove, empty state | FE |
| UX-LRN | Learning | Add Learning Card, card grid, expandable cards with milestones and notes, add/remove controls, empty state | FE |
| UX-PLAN | Todo Plans | builder that picks existing items; duration, start, end, priority fields; list grouped active/upcoming vs completed with progress and live rest time; per-item toggles; remove; start-time notification/highlight; empty state | FE |
| UX-SET | Settings | profile information; preferences (notification behaviour, default view) | BE+FE |

### UI/UX quality requirements (added 2026-09-24)

The user asked for these after FE-05, as a UI/UX improvement plan across the frontend. UX-SIZES and UX-MOTION were added during FE-07, when the user asked for phases covering different screen sizes and smoother movement between pages. They aren't
in the PRD. They make PRD §8 and NFR-5/NFR-6 measurable, and [docs/ui-ux-plan.md](../../../docs/ui-ux-plan.md)
explains the reasons for each. The baseline audit is in `loops/frontend-dev/outputs/evidence/ux-baseline/`.

| ID | Area | Requirement | Owner |
|---|---|---|---|
| UX-DS | Design system | one documented token set (colour, type scale, spacing, radius, elevation, motion) and shared components (button variants/sizes, icon buttons, badge, card, menu, skeleton); no ad-hoc colours or sizes in pages | FE |
| UX-A11Y | Accessibility | WCAG 2.2 AA: text contrast ≥ 4.5:1 (3:1 for large text and UI parts), visible focus, full keyboard use, labelled controls, landmarks; Lighthouse accessibility ≥ 95 on every page | FE |
| UX-RESP | Responsive | usable from 360 px to 1440 px with no horizontal page scroll; mobile navigation reaches all six pages without horizontal scrolling; touch targets ≥ 24 px; CLS ≤ 0.1 | FE |
| UX-FEED | Feedback | skeleton loading that keeps the layout, pending state on every submitting button, immediate feedback on toggles, consistent toasts/confirmations, correct plurals and dates in copy | FE |
| UX-THEME | Theme | light and dark themes that follow the system setting, both meeting UX-A11Y contrast | FE |
| UX-AUDIT | Quality gate | `loops/_lib/ux-audit.py` (Lighthouse through Chrome DevTools MCP) passes on all six pages, mobile and desktop: accessibility ≥ 95, best practices ≥ 95, SEO ≥ 90, CLS ≤ 0.1 | FE |
| UX-SIZES | Screen sizes | layouts designed for phones (320–479 px), large phones (480–759), tablets (760–1023), laptops (1024–1439) and wide screens (1440 px+), including landscape phones; fluid type and spacing; dialogs as bottom sheets on phones; content reflows at 320 CSS px and 200% zoom (WCAG 1.4.10) | FE |
| UX-MOTION | Page transitions | moving between pages feels continuous: the shell stays still while content transitions (View Transitions API), data is prefetched from navigation so pages open without a loading flash, focus moves to the new page heading and the title updates; all motion respects `prefers-reduced-motion`; no layout shift and INP under 200 ms during navigation | FE |

### Testing requirements and definition of done (PRD §11, §13)

| ID | Requirement | Where it's checked |
|---|---|---|
| TR-1 | unit tests for task/habit/plan validation, rest-time computation and completion roll-up | backend-dev |
| TR-2 | tests for plan progress and rest time across Not Started → In Progress → Completed | backend-dev |
| TR-3 | tests confirming dashboard metrics match the underlying data | backend-dev (curl cross-check) |
| TR-4 | end-to-end: create and complete a task, create and complete a habit, add a learning card with milestones, build a plan from existing items, mark items done, see the plan and dashboard update | frontend-dev final phase (Playwright MCP) |
| DoD-1 | all six pages implemented and reachable from persistent navigation | frontend-dev |
| DoD-2 | automated tests pass | OR-05 |

Acceptance criteria (PRD §12) are covered by the stories and rules above. Each worker phase copies
the criteria for its area into its own acceptance list.

## Ambiguities and interpretations

The PRD doesn't decide these. In each case I took the most conservative reading and made it easy to
change later.

| # | Question | Interpretation |
|---|---|---|
| I-1 | Authentication: one user, no security section, multi-user is a non-goal | No login. "User/profile information" on Settings is a local profile (display name, optional email). Security means input validation, parameterised queries, CORS limited to the frontend origin, and no secrets in the repo. |
| I-2 | What "today" means for due today, overdue, habits and the dashboard | Day boundaries follow a timezone stored in Settings, defaulting to the server's zone. The backend decides "today". |
| I-3 | Is DueDate a date or a date-time? | A date. A task is overdue when its due date is before today, its status isn't Done, and it isn't archived. |
| I-4 | Delete vs archive vs BR-14 | Delete is permanent. Archive hides a task from the default list, and restore brings it back. |
| I-5 | A plan item whose source was later deleted | The item keeps a copy of the title and is flagged as unavailable. It still counts toward progress, so the plan keeps its history and never drops to zero items. |
| I-6 | BR-13: which plan items change their source? | A **task** item marked done completes the task; un-marked, the task reopens (Todo). A **habit** item marked done records today's completion (no duplicate); un-marked, it removes today's completion. A **learning** item doesn't change the card, since one study block doesn't finish a resource. Changes only flow from plan item to source. |
| I-7 | How status changes over time | Worked out on every read: before start → Not Started; all items done → Completed; at or after end → Completed with whatever % was reached; otherwise In Progress. |
| I-8 | Rest time | End time minus now, only while In Progress; otherwise none (BR-12). The UI counts down every second from the server's end time. |
| I-9 | What "notified" means | An in-app notification, plus a browser notification if Settings allow it. It's shown once per plan. Plans that started while the app was closed notify the next time it opens. |
| I-10 | EstimatedDuration | Whole minutes, greater than zero. It isn't forced to fit the start–end window, but the UI warns when it's longer. |
| I-11 | PriorityOrder | A positive integer where 1 is the highest priority. Ties are allowed and broken by start time. |
| I-12 | Weekly habits and "complete for today" | A completion is always recorded for a specific date. A weekly habit counts as done for the week (Monday start) once any day in it is completed. Streaks count consecutive days for daily habits and consecutive weeks for weekly ones. |
| I-13 | Which dates a habit can be completed for | Today or earlier, never in the future. Inactive habits can't be completed. |
| I-14 | "Completed tasks today" needs a completion time | Add CompletedAt to Task, set when it becomes Done and cleared when it leaves Done. |
| I-15 | "Milestones completed recently" | Add CompletedAt to milestones. "Recently" means the last 7 days. |
| I-16 | Task completion percentage | Done ÷ all non-archived tasks, rounded. 0 when there are no tasks. |
| I-17 | Learning card status | Set by the user, not worked out from milestones, because the PRD lists it as a field of the card. |
| I-18 | What the plan builder can pick | Non-archived tasks, active habits and all learning cards. Each at most once per plan. |
| I-19 | Editing a plan after creation | Not asked for (the PRD only covers create, mark items and remove). Left out of the MVP. |
| I-20 | Shape of the due-date filter | A from/to date range, plus shortcuts: today, overdue, upcoming, no due date. |

## Files changed

- `loops/orchestrator/plan.json`: orchestrator phase plan
- `loops/orchestrator/outputs/phase-01-requirements-analysis.md`: this document
- `loops/orchestrator/verification/phase-01.py`: coverage check used to verify this phase

## APIs / components

None. This is an analysis phase; APIs are designed in the backend-dev phases.

## Tests and verification

`loops/orchestrator/verification/phase-01.py PRD.md <this file>` checks, generically, that:
- every explicit ID in the PRD (FR-01 … FR-09) appears here;
- the number of US- IDs is at least the number of "As a user, I want" lines in the PRD (33);
- every numbered business rule has a matching BR- row (BR-1 … BR-14);
- every NFR area heading (Performance, Reliability, Usability, Maintainability) is covered;
- an ambiguities section exists.

The result of each trial is recorded in `progress.md`, with the log in `outputs/evidence/`.

## Problems found and fixes

None in the analysis itself. Two housekeeping fixes came up while starting the phase:
`execution-tracking.csv` had two empty rows, which I removed, and the prompt hook was saving IDE
context tags along with the prompt text, so it now strips them.

## Final status

Analysis complete. The coverage check passed (see progress.md), and the phase is ready for OR-02,
the dependency graph.
