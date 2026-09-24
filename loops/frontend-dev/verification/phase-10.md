# FE-10 Dashboard page and Settings completion

Setup (done by `phase-10-seed.sh` on a fresh backend; default settings: name "QuickFlow user", timezone UTC):
- tasks: "Write report", "Pay bills", "Call dentist" (due today), "Renew passport" (High, due yesterday, so overdue) and "Water plants" (already done);
- habit "Morning run";
- learning cards "Spring in Action" and "Rust course" (In progress, one milestone);
- plans: "Focus block" (in progress, contains "Write report"), "Soon" (starts about 90 s after setup) and "Yesterday review" (completed).

Use a 1280x800 window.

1. Open `/dashboard`. Expected: the heading "Dashboard", a line starting with "Good morning", "Good afternoon" or "Good evening" followed by ", QuickFlow user", and four summary cards named "Tasks", "Habits", "Plans" and "Learning". [screenshot]
2. Expected in the "Tasks" card: "20%" and "1 of 5 done". In the "Habits" card: "0/1". In the "Plans" card: "1" and "completed". In the "Learning" card: "0 of 1 milestone".
3. Expected: the "Today's tasks" section lists "Call dentist". The "Completed today" section lists "Water plants". The "Overdue" section lists "Renew passport" with a "High" badge and a red "Due …" badge. The "Habits today" section lists "Morning run" with an unticked "Done today". The "Active plans" section shows "Focus block" with a "Rest time" countdown and a line "Next: Soon" (unless "Soon" has already started, in which case it is listed as active). The "Learning" section shows status counts and lists "Rust course" under cards in progress with "0/1", plus "milestones completed in the last 7 days".
4. Read the rest time of "Focus block", wait 3 seconds and read it again. Expected: it went down (a live countdown).
5. Tick "Done today" for "Morning run". Expected: a "done for today" message appears and the Habits card changes to "1/1".
6. Tick the checkbox of "Call dentist" in "Today's tasks". Expected: a "completed" message appears, the Tasks card shows "40%" and "2 of 5 done", "Call dentist" is struck through, and it now also appears under "Completed today".
7. Click "Quick add". Expected: a menu with "Add task", "Add habit", "Add learning card" and "Create plan", with focus on the first item. Press ArrowDown twice, then Enter. Expected: the "Add learning card" dialog opens. Add the title "Go course" and submit. Expected: a message that "Go course" was added, and the dialog closes. [screenshot]
8. Click "Quick add", choose "Add task", enter the title "From dashboard" and submit. Expected: the Tasks card shows "2 of 6 done". Open `/tasks`. Expected: "From dashboard" is listed.
9. Go back to `/dashboard` and click the "Open plans" link in the Plans card. Expected: the URL is `/plans` and "Focus block" is listed.
10. Resize to 390x844 and open `/dashboard`. Expected: `document.documentElement.scrollWidth` is at most 390, the summary cards are in one column (the same left edge), and "Quick add" is visible. Resize to 1440x900. Expected: the "Today's tasks", "Overdue" and "Habits today" sections sit side by side in one row (same top edge). [screenshot]

**Settings**

11. Resize to 1280x800 and open `/settings`. Expected: a profile summary with the initials "QU", the name "QuickFlow user", "No email added", a "Using QuickFlow since" date, and the data counts "6 tasks", "1 habit", "3 learning cards" (including "Go course" from step 7) and "3 plans". The form still shows Display name "QuickFlow user", Timezone "UTC", Default view "Dashboard" and the notification checkbox checked. The Timezone hint includes "Time there now:". [screenshot]
12. Change the display name to "Omar". Expected: "Unsaved changes" and a "Discard" button appear. Click "Discard". Expected: the field shows "QuickFlow user" again and "Unsaved changes" is gone. Change the name to "Omar" again and click "Save settings". Expected: a "Settings saved" message, and the profile summary shows "Omar" with initials "O". Open `/dashboard`. Expected: the greeting ends with ", Omar".
13. On `/settings`, change Timezone to "Asia/Dubai". Expected: the "Time there now" hint changes to a time 4 hours ahead of UTC. Set it back to "UTC" and save.
14. In Notifications, expected: a status badge for the browser permission (for example "Browser notifications not set up" or "Blocked in the browser") and a "Send test notification" button. Click it. Expected: a message containing 'Plan "Example" has started' appears.
15. In Theme, choose "Dark". Expected: `document.documentElement.dataset.theme` is "dark" and the page background becomes `rgb(14, 19, 26)`. Reload the page. Expected: still dark, and "Dark" is selected. Choose "Match system". Expected: the `data-theme` attribute is removed. [screenshot]
