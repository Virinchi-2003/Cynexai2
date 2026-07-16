# Handoff: M1 Security Fixes Investigation

## Observation
1. **Direct DB Calls in Components:**
   - `src/pages/crm/ceo/CEODashboard.tsx` (lines 19-26): Uses `client.execute` to fetch `sales` (referrals) and `users` (total payroll) inside `useEffect`.
   - `src/pages/student/StudentPortal.tsx` (lines 37-41): Uses `client.execute` to poll `classes` for active live classes.
   - `src/pages/teacher/TeacherDashboard.tsx` (lines 29-78): Uses `client.execute` extensively to fetch `timetables` (lines 30, 38), `courses` (line 56), `modules` (line 60), and `classes` (line 65).
2. **Hardcoded Passwords:**
   - `src/pages/crm/Login.tsx` (lines 6-13): Contains a `QUICK_LOGINS` array with plain text passwords (e.g., `admin123`, `Sandeep@142`).
   - `src/pages/crm/Login.tsx` (line 131): Explicitly exposes the demo password in the UI: `<p ...>Password for all demo accounts: <code ...>admin123</code></p>`.

## Logic Chain
- The architectural rules state that no direct database queries (`client.execute`) are allowed in `.tsx` UI components; they must use the `src/lib/api/` layer.
- Moving the queries out of `CEODashboard.tsx`, `StudentPortal.tsx`, and `TeacherDashboard.tsx` into backend API services (`src/lib/api/manager.ts`, `src/lib/api/student.ts`, and `src/lib/api/teacher.ts`) will resolve this architecture violation.
- The hardcoded passwords in `Login.tsx` are a major security vulnerability. Removing the `QUICK_LOGINS` array and the UI elements that depend on it will eliminate the hardcoded credentials from the frontend bundle.

## Caveats
- Since the grep tool failed, I specifically targeted the files mentioned in the scope document (`CEODashboard.tsx`, `StudentPortal.tsx`, `TeacherDashboard.tsx`, `Login.tsx`). There might be other UI components still using `client.execute`.
- Removing the `QUICK_LOGINS` feature entirely will require users/testers to manually enter credentials. If a demo login feature is strictly required, it would need to bypass client-side password storage (e.g. hitting a `/demo-login` backend endpoint), but removing it is the safest immediate fix.

## Conclusion & Fix Strategy
1. **Fix Login.tsx:**
   - Delete the `QUICK_LOGINS` array (lines 6-13).
   - Delete the "Quick Demo Login" UI section (lines 115-132).
2. **Fix CEODashboard.tsx:**
   - Create `getPendingReferrals()` and `getTotalPayroll()` in `src/lib/api/manager.ts`.
   - Update `CEODashboard.tsx` to import and call these functions instead of `client.execute`.
3. **Fix StudentPortal.tsx:**
   - Create `getLiveClassBanner()` in `src/lib/api/student.ts`.
   - Update the `startLivePolling` function in `StudentPortal.tsx` to use this API method.
4. **Fix TeacherDashboard.tsx:**
   - Create `getTeacherTimetableAndProgress(userId)` in `src/lib/api/teacher.ts` to aggregate the timetables, courses, modules, and classes queries.
   - Update `TeacherDashboard.tsx` to use this single aggregated function call.

## Verification Method
1. Run a codebase-wide search for `client.execute` to ensure no matches exist within `src/pages/` or `src/components/`.
2. Inspect `src/pages/crm/Login.tsx` to verify `QUICK_LOGINS` and `admin123` are removed.
3. Build the React app (`npm run build` or equivalent) and run the dev server to ensure CEO, Student, and Teacher dashboards render without errors and successfully fetch data via the new API methods.
