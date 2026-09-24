# FE-06 Design system and themes

Setup (done by `phase-06-seed.sh` on a fresh backend): tasks "Write report" and "Pay bills", habit "Morning run",
learning card "Spring in Action", plans "Yesterday review" (completed) and "Soon". Use `browser_evaluate` to read
computed styles; colours are reported as `rgb(r, g, b)`. Start with a 1280x800 window.

1. Open `/tasks` with the light colour scheme (`browser_emulate_media` colorScheme "light"). Expected: `getComputedStyle(document.documentElement).backgroundColor` is `rgb(245, 246, 248)`; the "Add Task" button contains an `svg` icon and the text "Add Task"; every navigation link contains an `svg` icon and still has its text name (Dashboard, Tasks, Habits, Learning Resources, Todo Plans, Settings). [screenshot]
2. Check the task row actions. Expected: the buttons "Edit", "Archive" and "Delete" are present on "Write report" with those accessible names, and each contains an `svg`.
3. Switch to the dark colour scheme (`browser_emulate_media` colorScheme "dark"). Expected: the html background becomes `rgb(14, 19, 26)`, the "Tasks" heading colour is `rgb(229, 233, 239)`, and a task row's background is `rgb(22, 28, 37)`. [screenshot]
4. Still dark, open `/habits`, `/learning`, `/plans` and `/settings` one after another. Expected on each: the page heading is visible, and no card or form (`.card`, `.row`) has a white (`rgb(255, 255, 255)`) background. Take a screenshot of `/plans`. [screenshot]
5. Still dark, on `/tasks` click "Add Task". Expected: the dialog's background is `rgb(22, 28, 37)`. Click "Add task" with Title empty: "Title is required" appears. Press Escape: the dialog closes.
6. Switch back to light. On `/tasks` press Tab until the "Add Task" button is focused. Expected: its computed `box-shadow` is not `none` (a visible focus ring).
7. On `/habits` (light), read the colour of the streak text of "Morning run". Expected: `rgb(138, 83, 0)`.
8. Resize the window to 390x844 and open `/tasks`. Expected: `document.documentElement.scrollWidth` is at most 390 (no horizontal page scroll), and the "Add Task" button, the search box and both task rows are visible. [screenshot]
9. Still at 390x844, open `/plans`. Expected: `document.documentElement.scrollWidth` is at most 390 and the plan "Soon" is shown with its "Remove" button. [screenshot]
