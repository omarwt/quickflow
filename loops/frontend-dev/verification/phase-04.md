# FE-04 Learning Resources page

Backend starts from a fresh database.

1. Open `/learning`. Expected: heading "Learning Resources" and an empty state "No learning cards yet" with an "Add Learning Card" button. [screenshot]
2. Click "Add Learning Card", leave Title empty, click "Add card". Expected: inline error "Title is required"; the dialog stays open.
3. Enter Title "Spring in Action", Description "Book by Craig Walls", keep status "Not started", click "Add card". Expected: a card "Spring in Action" showing the description, status "Not started", and "0 of 0 milestones done".
4. Add a second card "Rust course" with status "In progress". Expected: two cards.
5. On "Spring in Action" click "Show details". Expected: sections "Milestones" ("No milestones yet…") and "Notes" ("No notes yet.").
6. Click "Add milestone" with an empty title. Expected: the error "Milestone title is required".
7. Add milestone "Chapter 1" with target date 2026-12-01, then milestone "Chapter 2" with no date. Expected: both listed, "Chapter 1" shows a target date badge, the card shows "0 of 2 milestones done".
8. Tick "Chapter 1". Expected: it is struck through and the card shows "1 of 2 milestones done" with a partly filled progress bar. [screenshot]
9. Remove "Chapter 2". Expected: only "Chapter 1" remains and the card shows "1 of 1 milestones done".
10. Add note "Dependency injection explained in ch. 1". Expected: the note is listed with a date/time. Add a second note "Revisit ch. 1 exercises" and then remove it. Expected: only the first note remains.
11. Change the status select of "Spring in Action" to "In progress". Expected: after a reload of the page, the status still shows "In progress" and, after "Show details", the milestone and note are still there. [screenshot]
12. Click "Remove" on "Rust course". Expected: a confirmation dialog "Remove learning card". Confirm. Expected: only "Spring in Action" remains.
