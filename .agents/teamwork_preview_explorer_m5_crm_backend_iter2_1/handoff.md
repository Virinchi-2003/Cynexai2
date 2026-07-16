# M5 CRM Backend Fix Strategy

## 1. Observation
1. **SalesDashboard.tsx dummy math**: In `src/pages/crm/SalesDashboard.tsx` (lines 141, 147), funnel metrics are calculated as `Math.floor(metrics.totalLeads * 0.4)` and `Math.floor(metrics.totalLeads * 0.35)`. Additionally, the revenue performance chart data is hardcoded to an empty array: `setChartData([])` (line 32).
2. **crm.ts lacking query support**: `getCRMAnalytics` in `src/lib/api/crm.ts` (line 160) currently only returns `totalLeads`, `activeAdmissions`, `totalRevenue`, and `collectedRevenue`. It does not retrieve data for the `demo_scheduled` or `demo_completed` funnel steps, nor does it return grouped data for the revenue chart.
3. **sales.ts SQL schema mismatches**:
   - `recordAdmission` (line 8): Uses `offer_expiry` instead of `offer_expiry_date` found in `schema.sql`.
   - `recordSale` (line 54): Uses `referred_by_student_id` in the `INSERT INTO sales` query, but this column only exists on the `admissions` table, not `sales`.
   - `getSales` (line 83): Uses `ORDER BY created_at DESC`, but the `sales` table has a `timestamp` column.
   - `getCoursesForPitch` (line 107): Selects `sales_pitch_summary` and `sales_pitch_script` which do not exist in the `courses` table.
   - `getCourseModules` (line 120): Joins `modules` and `course_module_mapping`, but the actual database structure simply has a `course_modules` table with a `course_id` column.

## 2. Logic Chain
- **Resolving the Integrity Violation (Dummy Math)**: To replace `Math.floor` with real metric derivations, `getCRMAnalytics` must be expanded. The conversion funnel requires checking how many leads reached each stage. A robust approach is using `SUM(CASE WHEN status IN (...) THEN 1 ELSE 0 END)` to get cumulative counts (e.g., anyone in 'Admission' has implicitly completed a 'Demo'). For the `chartData`, `total_fee` and `amount_paid` from the `sales` table represent the target and collected revenue respectively. Grouping these by month via SQLite's `strftime` will provide the exact data structure needed for Recharts.
- **Resolving SQL Mismatches**: Fixing `src/lib/api/sales.ts` is a direct mapping exercise against `schema.sql`. Removing nonexistent columns from queries and correcting column names will eliminate SQLite syntax and "no such column" runtime errors.

## 3. Caveats
- `getCRMAnalytics` uses simple conditional sums for funnel metrics. If leads skip stages manually in the UI without recording history, this cumulative logic (`status IN ('Demo Scheduled', 'Demo Completed', 'Admission')`) will still count them correctly for the earlier stages.
- The chart data grouping uses `strftime('%Y-%m')`. A mapping step in TypeScript might be needed if the UI strictly requires abbreviated month names (e.g. mapping "2026-07" -> "Jul").

## 4. Conclusion
We must implement a strict alignment between API queries and `schema.sql`, alongside a complete replacement of dummy analytics.
**Actionable Fixes:**
1. Update `getCRMAnalytics` in `src/lib/api/crm.ts` to execute a comprehensive stats query that includes cumulative funnel stages (e.g., `demoScheduled: SUM(CASE WHEN status IN ('Demo Scheduled', 'Demo Completed', 'Admission', 'Closed Won') THEN 1 ELSE 0 END)`).
2. Add a `getRevenueChartData()` function or append to `getCRMAnalytics` a query selecting `strftime('%Y-%m', timestamp) as name`, `SUM(total_fee) as target`, and `SUM(amount_paid) as collected` from `sales` grouped by month.
3. Update `SalesDashboard.tsx` to read the new funnel stage counts from `metrics` instead of computing them via `Math.floor`, and wire the new chart data to `setChartData`.
4. In `src/lib/api/sales.ts`, correct the 5 mismatched SQL queries exactly as observed (e.g., `offer_expiry` -> `offer_expiry_date`, remove `referred_by_student_id` from `sales` insert, etc.).

## 5. Verification Method
- **SQL correctness**: Run `npx tsx scripts/check_schema.mjs` (if a script exists) or simply start the backend and perform sales module actions in the UI to confirm no SQL errors appear in the console.
- **Funnel UI**: Inspect `SalesDashboard.tsx` in a browser. The funnel values for Demo Scheduled and Demo Completed should reflect exact backend counts.
- **Testing**: Run the project's E2E tests (if applicable for CRM) or use a local `vitest` command to ensure `src/lib/api/sales.ts` successfully compiles and returns data.
