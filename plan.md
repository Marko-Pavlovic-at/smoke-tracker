# Description

This App aims to help the User reduce / quit Smoking

## Tech Stack

- React
- Javascript
- Backend via Supabase and cloudflare

## Features

- User can type in how many cigaretes a day they smoke and what a pack costs a pack consist of 20 cigarettes the app should calculate how much money is saved
- user picks a new number of cigaretes smoked for example 10 instead of 20 this new count needs to be checked for 2 weeks before the user can reduce again
- the app should show a timer when the user is allowed to smoke to reach their goal if the user smokes later or sononer than that time the timer should recalculate
- user has the possibilty to log a cigarete
- there should be stats of money saved over time and overall progress
- login
- mobile view

## Rules

- i will use this app personally
- i allow myself to use claude code a lot since this app is something i need learning is only secondary
- i write the code myself while claude code assists me if it gets too much i let claude code do whole chunks

## Open Questions

### Logic

1. **Timer:** Is the gap between cigarettes your waking hours divided by your daily target? If so, what are your wake and sleep times? How does it "recalculate" (spread the cigarettes you have left over the hours you have left)?
   - no clear answers but ideas set up a cycle where the app operates for example from 6 in the morning to ten in the evening or log days like user wake up start day user goes to sleep end day or the app takes a 16 hour calculation instead of 24
2. **Day start:** Does a day reset at midnight or when you wake up? Which day does a 1am cigarette count toward?
   - Answer: better at wake up see point 1
3. **2-week rule:** Do you have to stay at or under the target every day for 14 days? If you go over once, do the 2 weeks restart, pause, or does nothing happen?
   - Answer: there are warnings but not reset reset would only be if the user smokes for example the old count 20 instead of 10 only then it resets
4. **Savings:** Count from actual logged cigarettes: (starting count − smoked) × price per cigarette? What happens to past savings if the pack price changes?
   - Answer: the pack price can be edited in settings count from when the user starts using the app for example pack price 6€ user usally smokes whole pack in a day if user smoked just then they saved 3€
5. **End goal:** What happens when the target hits 0 (smoke-free streak, "days since last cigarette" counter)?
   - Answer: it counts the days if the user is smoke free since 3 months no cigarette then its a sucess the app ends here if he smokes one in 2 weeks etc the day timer restarts

### Logging

6. **Fixing mistakes:** Delete a wrong log? Add a forgotten cigarette with a past time?
   - Answer: yes both

### Tech

7. **Cloudflare:** What is it for? Just hosting (Cloudflare Pages), while Supabase does login and the database?
   - Answer: yes just hosting login handlses supabase i am honestly not sure what the best setup for this is i want to learn self hosting with own database with a vps for example but thats probably out of scope for this project
8. **Data model:** Roughly three tables, with Supabase Row Level Security (RLS) so each user only reads their own rows. OK?
   - `profiles`: starting count, pack price, wake and sleep times
   - `phases`: target count and start date (history of each step down)
   - `logs`: one row per cigarette, with a timestamp
   - Answer: not sure i am not expierrenced enough to know that
9. **Mobile:** Make it a PWA so you can install it on your home screen? Notifications when the timer runs out (more work)?
   - Answer: no pwa just a responsive site so it works both on a desktop and a phone
10. **Timezones:** Store timestamps in UTC and show them in local time?
    - Answer: since this app is just for me i dont think its necesarry

### Process

11. **Build order:** What's in the first version (MVP)? Suggested order: login → setup → logging → savings → phases → timer → stats.
    - Answer: no idea you decide

## Decisions

### Day & Timer
- Settings have a **wake time** and **sleep time** (default 06:00 – 22:00 = 16 hours)
- A day starts at wake time, not midnight. A cigarette at 01:00 counts to the previous day
- Timer: `next allowed cigarette = last cigarette + (time left until sleep / cigarettes left today)`
- Recalculated after every log, so smoking early or late fixes itself automatically
- When no cigarettes are left for today, show "done for today" instead of a timer

### Phases (2-week rule)
- Start: baseline = how many you smoke now (e.g. 20)
- You set a new target (e.g. 10). After 14 days in that phase you can lower it again
- Going over the target = warning only
- Smoking the old target or more in one day (e.g. 20 when target is 10) = the 14 days restart

### Savings
- Per day: `(baseline − smoked) × (pack price / 20)`
- Pack price is editable in settings. All savings are calculated with the current price (simple, fine for one user)

### Quit
- When the target hits 0: count smoke-free days since the last logged cigarette
- 90 days smoke-free = success
- Any logged cigarette restarts the counter

### Tech
- Supabase: login + database. Cloudflare Pages: hosting only. (VPS self-hosting = separate future project)
- Responsive website, no PWA
- Timezones: no extra work. Supabase stores time in UTC automatically and JavaScript shows it in local time

### Database
- `profiles`: baseline count, pack price, wake time, sleep time
- `phases`: target count, start date (one row per step down = your history)
- `logs`: one row per cigarette, with a timestamp (editable / deletable, can be added with a past time)
- Row Level Security on all tables: you only see your own rows

### Build Order
1. Supabase project + login
2. Setup screen (baseline, pack price, wake/sleep time) → `profiles`
3. Log a cigarette + list of today's logs (delete, add with past time) → `logs`
4. Today's count + money saved
5. Phases: set a target, 14-day check, warnings, reset
6. Timer
7. Stats (money over time, progress)
8. Quit mode (smoke-free counter, 90-day success)
9. Deploy to Cloudflare Pages

## Progress

### 1. Supabase + Login
- [x] Supabase project created
- [x] `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- [x] `@supabase/supabase-js` installed
- [x] Supabase client file (`src/supabaseClient.js`)
- [x] User created in Supabase dashboard, public sign ups turned off
- [x] Login page (`src/Login.jsx`) + session check in `src/App.jsx`

### 2. Setup screen
- [x] `profiles` table in Supabase (with Row Level Security)
- [x] Setup form (`src/Setup.jsx`), shown by `App.jsx` when no profile exists
- [ ] Later: settings page to edit pack price / wake / sleep time

### 3. Logging
- [x] `logs` table in Supabase (with Row Level Security, `user_id` defaults to `auth.uid()`)
- [x] Log button + list of today's logs (`src/Logs.jsx`)
- [x] Delete a log
- [x] Add a log with a past time

### 4. Today's count + money saved
- [ ] **Next:** show money saved today
