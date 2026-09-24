# BE-04 Learning resources

## Requirements covered

- FR-05
- FR-06
- BR-8
- BR-9
- US-LRN-1
- US-LRN-2
- US-LRN-3
- US-LRN-4
- US-LRN-5
- I-15
- I-17

## Tasks

- T1 Card, milestone and note models
- T2 Card CRUD
- T3 Milestones: add, complete, remove
- T4 Notes: add, remove
- T5 Verify with curl
- T6 Document phase

## Implementation

- **Model.** `LearningCard` owns its `Milestone` and `Note` children through JPA one-to-many with cascade and orphan removal. In the database, each child has a required foreign key with `ON DELETE CASCADE`, so a milestone belongs to exactly one card (BR-9) and removing a card removes its children.
- **Nested routes only.** Milestones and notes are only reachable under their card. A milestone ID used under the wrong card gets a 404, never a silent update.
- **Milestone done.** `Milestone.setDone` keeps `completedAt` in step with `done` (I-15), so the dashboard can show recently completed milestones. The PATCH changes only the fields that are present (done, title, targetDate).
- **Status.** The card status (NOT_STARTED / IN_PROGRESS / COMPLETED) is set by the user (I-17) and defaults to NOT_STARTED.
- **Responses.** Every mutation returns the whole card, including `milestonesDone` and `milestonesTotal`, so the UI can re-render from one response.
- **For plans.** `find(id)` is there for plan-item resolution in BE-05.

The PRD sets no lengths here, so I picked title 200, description 2000 and note 5000. They're easy to change.

## Files changed

- `backend/src/main/resources/db/migration/V4__learning.sql`
- `backend/src/main/java/com/quickflow/learning/{LearningCard,LearningCardRepository,LearningDtos,LearningService,LearningController}.java`
- `loops/backend-dev/verification/phase-04.sh`

## APIs / components

| Method | Path | Result |
|---|---|---|
| GET, POST | /api/learning-cards | 200 / 201 · 400 |
| GET, PUT, DELETE | /api/learning-cards/{id} | 200 / 200 / 204 · 404 |
| POST | /api/learning-cards/{id}/milestones | 201 card |
| PATCH, DELETE | /api/learning-cards/{id}/milestones/{milestoneId} | 200 card · 404 |
| POST | /api/learning-cards/{id}/notes | 201 card |
| DELETE | /api/learning-cards/{id}/notes/{noteId} | 200 card · 404 |

## Tests and verification

Trial 1 passed with 4 checks: build with unit tests, fresh start, the curl script, and Swagger documenting the milestone PATCH and note POST. The curl script has 32 assertions:

- **Cards:** add with trimming and defaults; add with a status; missing title; invalid status (the allowed values are listed); update the status; list.
- **Milestones:** add with and without a target date; blank title; complete (sets `completedAt`), reopen (clears it), rename and re-date; a milestone ID through the wrong card gets 404; remove, and a second remove gets 404.
- **Notes:** add with a timestamp; a blank note is rejected; a note ID through the wrong card gets 404; remove.
- **Delete:** deleting a card with children leaves it, and adding milestones to it, returning 404.

No unit tests in this phase. The logic is plain CRUD plus the `completedAt` rule, and the curl script already covers both directions of that rule.

## Problems found and fixes

None.

## Final status

Done. Verified on trial 1.
