# FE-04 Learning resources page

## Requirements covered

- UX-LRN
- US-LRN-1
- US-LRN-2
- US-LRN-3
- US-LRN-4
- US-LRN-5

## Tasks

- T1 Card grid and add form
- T2 Expandable card with milestones
- T3 Notes
- T4 Remove card, empty state
- T5 Verify with Playwright MCP
- T6 Document phase

## Implementation

- **Card grid (UX-LRN).** Each card shows the title, description/source, an inline status select (Not started / In progress / Completed, I-17), a milestone progress bar, and "N of M milestones done" (US-LRN-1).
- **Expandable details.** "Show details" / "Hide details" (with `aria-expanded`) reveals:
  - **Milestones** (US-LRN-3, US-LRN-4): a done checkbox that PATCHes `done`, the title (struck through when done), a target-date badge, and Remove; plus an inline add form with title and optional target date.
  - **Notes** (US-LRN-5): the text with its timestamp and Remove; plus an inline add form.
- **Validation.** The card title is required (BR-8). Blank milestone titles and blank notes are caught before sending, and server errors show as toasts.
- **Remove card** (US-LRN-2) sits behind a confirmation that warns the milestones and notes go too.
- **Empty state.** It offers Add Learning Card (NFR-6).
- Every nested mutation returns the whole card from the API, and the page then refreshes the learning, dashboard and plans data.

## Files changed

- `frontend/src/pages/LearningPage.tsx`, `frontend/src/components/LearningCardForm.tsx`
- `frontend/src/index.css` (learning styles; grid `align-items: start`)
- `loops/frontend-dev/verification/phase-04.md`

## APIs / components

Uses `GET /api/learning-cards`, `POST /api/learning-cards`, `PUT /api/learning-cards/{id}` (status), `DELETE /api/learning-cards/{id}`, `POST /api/learning-cards/{id}/milestones`, `PATCH` and `DELETE /api/learning-cards/{id}/milestones/{milestoneId}`, `POST /api/learning-cards/{id}/notes`, and `DELETE /api/learning-cards/{id}/notes/{noteId}`. Components: `LearningPage`, `CardView`, `LearningCardForm`.

## Tests and verification

Trial 1 passed with 2 checks: `npm run build`, and the headless Playwright MCP scenario `verification/phase-04.md` (child session `ea62f35f-5ea6-4f35-985c-5c824629fb8f`). All 12 steps passed:

- the empty state appears, and an empty card title gives an inline error;
- two cards are added, and the details show empty milestone and note sections;
- an empty milestone title gives an error;
- two milestones are added, one with a target date;
- ticking a milestone strikes it through and moves progress to 1 of 2;
- removing a milestone gives 1 of 1;
- notes are added and removed;
- a status change, the milestone and the note all survive a reload;
- removing a card asks for confirmation.

Screenshots: `outputs/evidence/phase-04/01-empty-state.png`, `08-chapter1-done.png`, `11-after-reload.png`.

## Problems found and fixes

1. **Card heights.** The step 8 screenshot showed the grid stretching the shorter card to the height of the expanded one. I added `align-items: start` to `.grid`. It's a CSS-only change made after the passing run, and it applies to the Habits grid too.

## Final status

Done. Verified on trial 1.
