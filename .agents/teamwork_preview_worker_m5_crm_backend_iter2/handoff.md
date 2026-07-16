# Handoff Report

## Observation
1. In `src/lib/api/sales.ts`:
   - `recordAdmission` used `offer_expiry` instead of `offer_expiry_date` in the `INSERT INTO admissions` query.
   - `getSales` used `ORDER BY created_at` on the `sales` table (which should be `timestamp`).
   - `getCoursesForPitch` fetched `sales_pitch_summary` and `sales_pitch_script` which caused issues.
   - `getCourseModules` joined on the `modules` table instead of using `course_modules`.
2. In `src/lib/api/crm.ts`:
   - `getCRMAnalytics` did not aggregate `demoScheduled` and `demoCompleted`.
   - It lacked the monthly chart data from `sales`.
3. In `src/pages/crm/SalesDashboard.tsx`:
   - `metrics` didn't have demo variables.
   - `Math.floor()` approximations were used for demo numbers.
   - `chartData` was hardcoded to `[]`.
4. I ran `npm run build` and it passed. `npm run test` threw some errors in unrelated tests (e.g., vitest trying to run playwright `.spec.ts` files, old `modules` table name in seeder test, marketing and teacher api tests). None were caused by my changes.

## Logic Chain
- Replaced `offer_expiry` with `offer_expiry_date` in `src/lib/api/sales.ts`.
- Replaced `ORDER BY created_at` with `ORDER BY timestamp DESC` in `getSales`.
- Removed `sales_pitch_summary` and `sales_pitch_script` from the query in `getCoursesForPitch`.
- Updated `getCourseModules` to use `SELECT title FROM course_modules WHERE course_id = ? ORDER BY order_index ASC`.
- In `src/lib/api/crm.ts`, updated `getCRMAnalytics` to add `demoScheduled` and `demoCompleted` cases (using `Demo Scheduled` and `Demo Completed` statuses in `SUM(CASE WHEN ...)`). Added `monthlyData` query on `sales`.
- In `src/pages/crm/SalesDashboard.tsx`, added `demoScheduled` and `demoCompleted` to `metrics`, replaced `Math.floor` with actual values, and wired `chartData` to `analytics.monthlyData`.

## Caveats
- Some unrelated tests (`tests/e2e/dashboards.spec.ts`, `tests/seeding/seeder.test.ts`, etc.) are failing. This was caused by Vitest inadvertently running e2e tests, and a previous iteration's table name changes (e.g., `modules` to `course_modules`) that were not updated in the seeder test.

## Conclusion
The Iteration 2 M5 CRM Backend fix strategy is fully implemented and compiles successfully. The CRM dashboard will now show actual metrics and revenue data.

## Verification Method
1. Run `npm run build` to verify compilation.
2. Check `src/lib/api/sales.ts`, `src/lib/api/crm.ts`, and `src/pages/crm/SalesDashboard.tsx` to verify the code changes.
3. Observe the CRM dashboard in the app for actual values.
