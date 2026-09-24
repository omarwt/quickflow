# FE-02 Tasks page

Backend starts from a fresh database. "Yesterday" and "today" mean dates in UTC, typed into the Due date field as YYYY-MM-DD.

1. Open `/tasks`. Expected: heading "Tasks", an empty state "No tasks yet" with an "Add Task" button. [screenshot]
2. Click "Add Task", leave Title empty, click "Add task". Expected: inline error "Title is required"; the dialog stays open.
3. Enter Title "Write report", Description "Q3 numbers", Priority "High", Due date = today, click "Add task". Expected: dialog closes, a "Task "Write report" added" message appears, the task is listed with badges "Todo", "High priority" and its due date.
4. Add a second task "Pay bills", Priority "Low", Due date = yesterday. Expected: it is listed with an "Overdue" badge.
5. Add a third task "Plan trip" with no due date and priority Medium. Expected: three tasks listed. [screenshot]
6. Type "report" in the search box. Expected: only "Write report" is listed. Clear the search.
7. Set the Priority filter to "Low". Expected: only "Pay bills". Reset it to "All priorities".
8. Set the Due date filter to "Overdue". Expected: only "Pay bills". Reset it to "Any due date".
9. Tick the checkbox of "Pay bills". Expected: a "completed" message, the task shows the "Done" badge and is struck through, the "Overdue" badge is gone.
10. Set the Status filter to "Done". Expected: only "Pay bills". Reset it to "All statuses".
11. Click "Edit" on "Plan trip", change the title to "Plan summer trip" and Status to "In progress", click "Save changes". Expected: the list shows "Plan summer trip" with "In progress".
12. Click "Archive" on "Plan summer trip". Expected: it disappears from the list. Tick "Show archived". Expected: only "Plan summer trip" is listed, with a "Restore" button. Click "Restore", untick "Show archived". Expected: it is back in the main list.
13. Click "Delete" on "Write report". Expected: a confirmation dialog "Delete task". Click "Delete". Expected: the task is gone; two tasks remain. [screenshot]
14. Reload the page. Expected: the same two tasks are still listed ("Pay bills" done, "Plan summer trip" in progress).
