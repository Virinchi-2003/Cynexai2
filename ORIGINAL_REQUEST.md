# Original User Request

## Initial Request — 2026-07-07T14:05:04+05:30

Rebuild the entire student portal of the CynexAI ERP web app into a world-class LMS experience inspired by Duolingo (gamification, module map path), Coursera (clean dashboard, progress tracking), and modern bootcamp portals. All data must come from the existing Turso SQLite database — no hardcoded values.

Working directory: `C:\Users\kk\.gemini\antigravity\scratch\cynexai-website`

---

## Context & What Exists

The student portal lives in:
- `src/pages/student/` — StudentPortal.tsx, ModuleMap.tsx, ClassFlow.tsx, MockInterview.tsx, ReferralCenter.tsx, CareerCenter.tsx
- `src/components/layout/StudentLayout.tsx` — dark sidebar layout (`#0F172A` bg)
- `src/lib/api/student.ts` — DB queries (uses `executeWithRetry` → Turso)
- `src/lib/api/ux.ts` — badges, QR attendance

Database tables available: `students`, `courses`, `modules`, `course_module_mapping`, `classes`, `student_progress`, `erp_users`, `timetable_slots`, `attendance`, `gamification_settings`, `referrals`, `referral_gifts`, `mock_tests`, `mock_test_questions`, `test_results`, `badges`, `announcements`, `notifications`

The app uses **React + TypeScript + Vite + Tailwind CSS**. Routing is in `src/App.tsx` with `RequireAuth`. Student routes are protected by `allowedRoles={['Student']}`.

**Current problems:**
1. `StudentPortal.tsx` — plain white page, just a module list with progress bars, no visual wow
2. `ModuleMap.tsx` — Duolingo-style path exists but is too minimal
3. `StudentLayout.tsx` — hardcoded coin values (12, 1,240) not from DB; missing nav items
4. `ClassFlow.tsx` — needs YouTube embed + Q&A + QR attendance properly integrated
5. No leaderboard page exists
6. `MockInterview.tsx` — stub only
7. No attendance history page

---

## Requirements

### R1. Premium StudentLayout Redesign
Redesign `StudentLayout.tsx` completely:
- Dark gradient sidebar (`#0F172A` → `#1E293B`) with glowing accent colors
- Nav items: Home, Attendance, Mock Interview, Refer & Earn, Career, Leaderboard
- Live coins + streak pulled **from DB** (`students` table: `streak`, `coins` columns) not hardcoded
- Animated XP/level bar at bottom of sidebar showing student's level based on classes completed
- Notification bell with count badge from `announcements` table

### R2. Student Dashboard (StudentPortal.tsx) — Full Redesign
Build a premium, visually stunning dashboard with these sections in order:
1. **Hero welcome section** — personalized greeting with avatar initials, course name, today's date, and a "Continue Learning" CTA button that goes to the next incomplete class
2. **Today's Stats row** — 4 cards: 🔥 Streak, 🪙 Coins, 📚 Classes Completed, 🏆 Badges — all from DB
3. **Live class banner** (if class in_progress) — sticky top, pulsing red dot, "Join Now" button
4. **Course Progress section** — overall course progress % + module breakdown
5. **Module Map overview** — horizontal scrollable row of module cards. Each card: icon, module name, X/Y classes done, color-coded progress ring. Click → navigate to `/student/module/:id`
6. **Upcoming schedule** — next 3 timetable slots from `timetable_slots` table
7. **Recent Achievements** — latest 3 badges earned from `badges` table
8. All data from DB via `src/lib/api/student.ts` — extend this file with new query functions as needed

### R3. Module Map (ModuleMap.tsx) — Enhanced Path
Keep the Duolingo-style zigzag path but add:
- Header with module title, total classes, completion %, teacher name (join `modules` → `erp_users` on `instructor_id`)
- Each node shows class number AND title label clearly
- Completed nodes: gold star ⭐
- Current "START HERE" node with bounce + pulsing glow ring
- Locked nodes: lock icon, greyed out
- Live nodes: pulsing red LIVE badge
- Progress bar at top showing X/Y classes completed

### R4. Class Flow (ClassFlow.tsx) — Production Level
The class detail page must have:
- **Left panel**: YouTube video embed (use `youtube_video_id` from DB), fallback placeholder if no video
- **Right panel**: class title, description, AI summary (collapsible), teacher info
- **Q&A section**: list of `class_questions` from DB, each expandable with answer
- **QR Attendance button**: opens a modal with text input for QR code
- **Navigation**: Previous/Next class buttons based on `order_index`
- **Mark Complete button**: calls `updateStudentProgress`

### R5. Attendance Page (new: `src/pages/student/AttendancePage.tsx`)
Create a new page at route `/student/attendance`:
- Monthly calendar view showing which days the student attended (colored dots)
- Attendance % badge
- Recent attendance log: date, class name, status
- QR scan section at top with "Mark Today's Attendance" button
- Add route to `App.tsx`

### R6. Leaderboard Page (new: `src/pages/student/Leaderboard.tsx`)
Create a new page at route `/student/leaderboard`:
- Top 10 students ranked by total coins (query `students` table ORDER BY coins DESC)
- Current student highlighted
- Rank medals: 🥇 🥈 🥉 for top 3
- Cards showing: rank, avatar initials, name, coin count, streak count
- Add route to `App.tsx`

### R7. Mock Interview (MockInterview.tsx) — Functional
Build a functional mock interview UI:
- Role/topic selector: Data Science, Python, SQL, Machine Learning, Power BI, Excel
- "Start Interview" launches timed Q&A (5 questions from `mock_test_questions` table)
- Display one question at a time, student types answer, submits
- After all 5: show score, correct answers, save to `test_results` table
- If table empty: use hardcoded fallback questions per topic

### R8. StudentLayout Nav Updates
Add these routes to sidebar:
- `/student` → Home (🏠)
- `/student/attendance` → Attendance (📋)
- `/student/leaderboard` → Leaderboard (🏆)
- `/student/interview` → Mock Interview (🎙️)
- `/student/referrals` → Refer & Earn (🎁)
- `/student/career` → Career (⭐)

---

## Acceptance Criteria

### Visual Quality
- [ ] Student dashboard has at least 4 distinct visual sections (hero, stats, modules, schedule)
- [ ] All student pages use the dark theme (`#0F172A` base) consistently
- [ ] Module nodes in ModuleMap have distinct visual states: completed (gold), current (green glow), locked (grey), live (red)
- [ ] No plain white background on any student page

### Data Integration
- [ ] `students.streak` and `students.coins` fetched from DB, displayed in sidebar (not hardcoded)
- [ ] Dashboard module cards show real progress from `student_progress` table
- [ ] Leaderboard ranks by real `coins` column from DB

### Feature Completeness
- [ ] `npm run build` completes with 0 TypeScript errors after all changes
- [ ] Route `/student/attendance` exists and renders without crashing
- [ ] Route `/student/leaderboard` exists and renders without crashing
- [ ] Mock interview can complete a 5-question session and show a score
- [ ] QR attendance modal opens from both dashboard and ClassFlow page

### Navigation
- [ ] All 6 nav items in sidebar are clickable and navigate to real routes
- [ ] "Continue Learning" CTA on dashboard navigates to the correct next incomplete class
