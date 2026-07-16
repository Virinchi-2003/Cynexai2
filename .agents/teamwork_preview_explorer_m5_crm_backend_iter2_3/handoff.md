# Handoff Report

## 1. Observation
- `src/pages/crm/SalesDashboard.tsx` relies on dummy math for funnel metrics (`Math.floor(metrics.totalLeads * 0.4)` on line 141 and `0.35` on line 147) and sets `chartData` to an empty array instead of populating it with real historical pipeline/revenue data (line 32).
- `src/lib/api/sales.ts` has multiple SQL integrity violations against `schema.sql`:
  - Line 8: Uses `offer_expiry` instead of `offer_expiry_date` when inserting into `admissions`.
  - Line 83: Queries `sales` table ordering by `created_at` which does not exist (the schema uses `timestamp`).
  - Line 107: Queries non-existent columns `sales_pitch_summary` and `sales_pitch_script` from the `courses` table.
  - Line 120: Queries non-existent `modules` and `course_module_mapping` tables. The schema defines `course_modules` with a `course_id` column.

## 2. Logic Chain
- To fix the dummy math in `SalesDashboard.tsx`, the `getCRMAnalytics()` function in `src/lib/api/crm.ts` must be updated to aggregate real pipeline statistics (i.e. `SUM(CASE WHEN status = 'Demo Scheduled' THEN 1 ELSE 0 END)`).
- The empty `chartData` should be populated with real monthly revenue aggregations from the `sales` table using SQLite date functions (e.g., `strftime('%Y-%m', timestamp)`).
- The `src/lib/api/sales.ts` file needs direct string replacements to match the valid columns and tables in `schema.sql`.

## 3. Caveats
- I did not verify if the UI perfectly maps to the new `chartData` format, but Recharts `BarChart` uses `dataKey="target"` and `dataKey="collected"`, which maps easily to SQLite aggregations (`SUM(total_fee) as target, SUM(amount_paid) as collected`).
- `schema.sql` does not track explicit monthly sales targets, so "target" in the chart must just be `total_fee` (the expected pipeline value) vs `collected` (`amount_paid`).

## 4. Conclusion
Fix Strategy:
1. **Fix SQL syntax in `src/lib/api/sales.ts`**:
   - Replace `offer_expiry` with `offer_expiry_date` (Line 8).
   - Replace `ORDER BY created_at` with `ORDER BY timestamp` (Line 83).
   - Remove `sales_pitch_summary` and `sales_pitch_script` from the query (Line 107).
   - Change the query on line 120 to: `SELECT m.title FROM course_modules m WHERE m.course_id = ? ORDER BY m.order_index ASC`.
2. **Update Analytics in `src/lib/api/crm.ts` (`getCRMAnalytics`)**:
   - Add `demo_scheduled` and `demo_completed` cases to the `crm_leads` aggregate query.
   - Execute a new query on `sales` to fetch monthly chart data: `SELECT strftime('%Y-%m', timestamp) as month, SUM(total_fee) as target, SUM(amount_paid) as collected FROM sales GROUP BY month ORDER BY month ASC LIMIT 6`.
   - Return these new data points (`demoScheduled`, `demoCompleted`, `chartData`).
3. **Connect Data in `src/pages/crm/SalesDashboard.tsx`**:
   - Update `metrics` state to include `demoScheduled` and `demoCompleted`.
   - Replace `Math.floor(...)` with `metrics.demoScheduled` and `metrics.demoCompleted`.
   - Set `chartData` to the mapped array returned by the API instead of `[]`.

## 5. Verification Method
- **SQL correctness**: Run `npx tsc` (if applicable) and manually inspect `src/lib/api/sales.ts`. Ensure no SQLite errors are logged in the terminal when interacting with sales data.
- **Data validation**: View the Sales Dashboard in the browser and verify the "Demo Scheduled" and "Demo Completed" metrics display actual database counts rather than proportional dummy logic.
