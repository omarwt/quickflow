# FE-01 App shell and settings

Backend starts from a fresh database (default settings: name "QuickFlow user", timezone UTC, default view Dashboard).

1. Open `/`. Expected: the URL becomes `/dashboard` and a "Dashboard" heading is shown. [screenshot]
2. The navigation contains exactly these links: Dashboard, Tasks, Habits, Learning Resources, Todo Plans, Settings.
3. Click each navigation link in turn. Expected: the URL changes to the matching route (/tasks, /habits, /learning, /plans, /settings, /dashboard) and the page heading matches the link text ("Todo Plans" for /plans, "Learning Resources" for /learning).
4. On Settings, the form shows Display name "QuickFlow user", Timezone "UTC", Default view "Dashboard", and the notification checkbox checked.
5. Clear Display name and click "Save settings". Expected: the inline error "Display name is required" appears and nothing is saved. [screenshot]
6. Enter Display name "Omar" and Email "not-an-email", click "Save settings". Expected: an inline error under Email from the server ("Email must be a valid address").
7. Set Email to "omar@example.com", Timezone "Asia/Dubai", Default view "Todo Plans", untick the notification checkbox, click "Save settings". Expected: a "Settings saved" message appears. [screenshot]
8. Reload the page on /settings. Expected: the saved values are still shown (Omar, omar@example.com, Asia/Dubai, Todo Plans, checkbox unticked).
9. Open `/`. Expected: the app now opens on `/plans` (the default view).
10. Resize the browser to 390x844. Expected: the navigation is still visible and usable as a tab bar fixed to the bottom of the screen with all six pages (click "Tasks" and the Tasks heading shows). [screenshot]
