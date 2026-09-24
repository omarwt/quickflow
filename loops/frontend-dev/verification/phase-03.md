# FE-03 Habits page

Backend starts from a fresh database.

1. Open `/habits`. Expected: heading "Habits" and an empty state "No habits yet" with an "Add Habit" button. [screenshot]
2. Click "Add Habit", leave Name empty, click "Add habit". Expected: inline error "Name is required"; the dialog stays open.
3. Enter Name "Morning run", Description "5 km", keep "Daily", click "Add habit". Expected: a card "Morning run" with a "Daily" label, the text "No streak yet", and an unticked "Done today" checkbox.
4. Add a second habit "Weekly review" and choose "Weekly". Expected: its card shows a "Weekly" label and "Not done this week yet". [screenshot]
5. Tick "Done today" on "Morning run". Expected: a "done for today" message, the checkbox stays ticked, and the card shows "1-day streak".
6. Reload the page. Expected: "Morning run" still shows the ticked checkbox and "1-day streak" (the completion is saved once, not duplicated).
7. Untick "Done today" on "Morning run". Expected: "No streak yet" again. Tick it again so it shows "1-day streak".
8. Tick "Done today" on "Weekly review". Expected: it shows "1-week streak" and "Done this week".
9. Click "Edit" on "Weekly review", rename it to "Weekly planning", click "Save changes". Expected: the card title is "Weekly planning".
10. Click "Deactivate" on "Weekly planning". Expected: the card moves under an "Inactive" heading, shows "Inactive: not tracked", and has no "Done today" checkbox; its button now reads "Activate". [screenshot]
11. Click "Activate" on it. Expected: it moves back to the main grid with a "Done today" checkbox.
12. Click "Remove" on "Morning run". Expected: a confirmation dialog "Remove habit". Click "Remove". Expected: the "Morning run" card is gone; only "Weekly planning" remains. [screenshot]
