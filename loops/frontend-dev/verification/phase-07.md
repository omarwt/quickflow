# FE-07 UI/UX improvements (keyboard, mobile, feedback, copy)

Setup (done by `phase-07-seed.sh` on a fresh backend): tasks "Write report", "Pay bills" and "Call dentist" (due
today), habit "Morning run", learning cards "Spring in Action" and "Rust course" (one milestone "Ownership
chapter"), plans "Yesterday review" (completed) and "Soon". Steps marked **keyboard only** must be done with
`browser_press_key` / `browser_type` only, with no clicks. Start with a 1280x800 window and the light colour scheme.

1. Open `/tasks`, then press Tab once. Expected: a "Skip to content" link is focused and visible on screen. Press Enter. Expected: `document.activeElement.id` is `main`. [screenshot]
2. **Keyboard only.** Press Tab until "Add Task" is focused, then press Enter. Expected: the "Add task" dialog opens and the Title field has focus. Type "Keyboard task" and press Enter. Expected: the dialog closes and "Keyboard task" is listed.
3. **Keyboard only.** Press Tab until the checkbox named 'Mark "Keyboard task" done' is focused, then press Space. Expected: the checkbox is checked, a "completed" message appears, and the row shows a "Done" badge.
4. Expected: the row "Call dentist" shows a badge with the text "Due today".
5. Type "zzz" in the search box. Expected: an empty state "No matching tasks" with a "Clear filters" button. Click "Clear filters". Expected: the search box is empty and "Keyboard task", "Call dentist", "Write report" and "Pay bills" are all listed again.
6. Open `/plans`. Expected: the plan "Soon" shows "0 of 1 item done" (singular "item"), and its time line contains "Today," or "Tomorrow," followed by a time and "→".
7. Open `/learning`. Expected: "Rust course" shows "0 of 1 milestone done" and "Spring in Action" shows "0 of 0 milestones done".
8. **Keyboard only.** Press Tab until the "Show details" button of "Rust course" is focused, then press Enter. Expected: the details open (the button now reads "Hide details"). Press Tab until the checkbox "Milestone done: Ownership chapter" is focused, then press Space. Expected: "Rust course" shows "1 of 1 milestone done".
9. Resize the window to 360x740 and open `/tasks`. Expected: `document.documentElement.scrollWidth` is at most 360. The navigation (`nav[aria-label="Main"]`) is fixed to the bottom of the screen. It holds six links whose accessible names are Dashboard, Tasks, Habits, Learning Resources, Todo Plans and Settings, and each link's bounding box lies fully inside the 360 px wide viewport, so no horizontal scrolling is needed. [screenshot]
10. Still at 360x740, check every navigation link. Expected: each one's bounding box is at least 44 px tall and at least 44 px wide. Click the "Todo Plans" link. Expected: the URL is `/plans` and the heading is "Todo Plans".
11. Still at 360x740, switch to the dark colour scheme and open `/habits`. Tick "Done today" on "Morning run". Expected: the checkbox is checked and a "done for today" message appears. The message's bounding box sits above the navigation bar and doesn't overlap it. [screenshot]
12. Still at 360x740 and dark, open `/settings`. Expected: `document.documentElement.scrollWidth` is at most 360, and the "Save settings" button is fully visible after scrolling to it, not hidden behind the navigation bar. [screenshot]
