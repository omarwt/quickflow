# FE-05 Todo Plans page

Setup (already done through the API by `phase-05-seed.sh` on a fresh backend): tasks "Write report" and "Pay bills",
habit "Morning run", learning card "Spring in Action", a finished plan "Yesterday review", and a plan "Soon" that
starts about 90 seconds after setup. Date/time inputs are local time in the format YYYY-MM-DDTHH:mm; use
browser_evaluate to read the browser's current local time when you need it.

1. Open `/plans`. Expected: heading "Todo Plans", sections "Active and upcoming" (showing "Soon" as "Not started" with "Starts in …") and "Completed" (showing "Yesterday review" at "0% complete"). [screenshot]
2. Click "Create Plan", then "Create plan" with nothing filled in. Expected: errors "Title is required" and "Pick at least one task, habit or learning resource".
3. Enter Title "Deep work", tick "Write report", "Morning run" and "Spring in Action", set End to a time BEFORE Start, click "Create plan". Expected: error "End date/time must be after the start date/time".
4. Set Start to 10 minutes before the current local time and End to 50 minutes after it, Estimated duration 45, Priority order 1, click "Create plan". Expected: a "Plan "Deep work" created" message; "Deep work" appears under "Active and upcoming" as "In progress", listed before "Soon", with "Rest time:" around 49–50 minutes, "0% complete · 0 of 3 items done" and three items (Task, Habit, Learning badges). [screenshot]
5. Read the rest time, wait 5 seconds, read it again. Expected: the value decreased (it counts down live).
6. Tick the item "Write report" in "Deep work". Expected: "33% complete · 1 of 3 items done".
7. Tick "Morning run" and "Spring in Action". Expected: "Deep work" shows "100% complete", its status becomes "Completed" and it moves to the "Completed" section. [screenshot]
8. Untick "Write report" in "Deep work". Expected: it shows "67% complete" and moves back to "Active and upcoming" as "In progress".
9. Open `/tasks`. Expected: "Write report" is not done (unticking the plan item reopened it). Tick nothing; go back to `/plans`.
10. Click "Create Plan" and create "Standup" with the existing task "Pay bills". Start is the next full minute in local time (for example, at 10:41:20 use 10:42), End is 30 minutes after Start, the estimate is 15 and the priority 4. Expected: "Standup" is listed as "Not started" with "Starts in …". Stay on `/plans` and check every 2 seconds (for up to 150 seconds) for the message 'Plan "Standup" has started'. Expected: the message appears (messages close on their own after 5 seconds, so keep checking every 2 seconds), and "Standup" shows "In progress" with a rest time and a "Just started" badge. [screenshot]
11. Click "Remove" on "Yesterday review". Expected: a confirmation dialog "Remove plan"; confirm. Expected: "Yesterday review" is gone from the page.
12. Reload the page. Expected: "Deep work" (67%), "Soon" and "Standup" are still listed, and no second 'has started' message appears for "Standup" within 20 seconds.
