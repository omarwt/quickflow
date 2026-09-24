# FE-11 End-to-end journey and UX acceptance

The backend starts from a **fresh, empty database** (default settings: name "QuickFlow user", timezone UTC).
Nothing is seeded, and every item is created through the UI. Use `browser_resize` for the sizes and
`browser_evaluate` for measurements.

**Desktop, 1280x800 (TR-4 journey)**

1. Open `/`. Expected: you land on `/dashboard`. The Tasks card shows "0%" and "0 of 0 done", "Nothing due today." is shown, and the Habits card shows "0/0". [screenshot]
2. Go to Tasks with the navigation. Add the task "Prepare slides", priority High, due today. Expected: it is listed with "Due today" and "High priority". Tick it. Expected: it shows "Done" and is struck through.
3. Go to Habits. Add the daily habit "Read 20 minutes". Tick "Done today". Expected: "1-day streak".
4. Go to Learning Resources. Add the card "TypeScript deep dive". Open "Show details" and add the milestones "Generics" and "Decorators". Tick "Generics". Expected: "1 of 2 milestones done".
5. Go to Tasks and add a second task "Email team" (no due date). Go to Todo Plans and click "Create Plan". Title "Morning block". Tick the existing items "Email team", "Read 20 minutes" and "TypeScript deep dive". Start 5 minutes before now, end 55 minutes after now, estimate 50, priority 1. Create it. Expected: "Morning block" is "In progress", shows a live "Rest time" and "0 of 3 items done". [screenshot]
6. Tick the plan item "Email team". Expected: "33% complete · 1 of 3 items done". Open Tasks. Expected: "Email team" is now Done (the plan item completed its task).
7. Open Dashboard. Expected: the Tasks card shows "100%" and "2 of 2 done", the Habits card "1/1", and the Plans card "1" in progress. "Active plans" shows "Morning block" with a rest time. The Learning card shows "1 of 2 milestones". [screenshot]
8. Reload the page. Expected: all the values from step 7 are unchanged (the data persisted). Open Todo Plans. Expected: "Morning block" still shows "1 of 3 items done".

**Keyboard only, 1280x800**

9. On `/dashboard`, use only the keyboard. Tab to the "Tasks" navigation link and press Enter. Expected: focus is on the "Tasks" heading. Tab to "Add Task", press Enter, type "Keyboard only" and press Enter. Expected: the task is listed. Tab to its checkbox and press Space. Expected: it is done.

**Phone 360x740, tablet 768x1024 and wide 1440x900**

10. Resize to 360x740. Open each of the six pages with the bottom navigation. On each one, `document.documentElement.scrollWidth` must be at most 360 and the page heading visible. On Todo Plans, "Morning block" must show its rest time. [screenshot]
11. Still at 360x740, on Tasks, tap "Filters", choose Status "Done" and tap "Show tasks". Expected: only done tasks are listed ("Prepare slides", "Email team", "Keyboard only").
12. Resize to 768x1024. Expected: the navigation is an icon rail. Click "Expand navigation", then "Learning Resources". Expected: `/learning` opens and the rail collapses. "TypeScript deep dive" shows "1 of 2 milestones done".
13. Resize to 1440x900 and open Dashboard with the navigation. Expected: the URL changes without a full page reload (`performance.getEntriesByType('navigation').length` stays 1), `document.title` is "Dashboard · QuickFlow", and focus is on the "Dashboard" heading. [screenshot]
