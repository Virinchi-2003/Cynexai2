# M5 CRM Backend Iteration 2 Review

## Observation
1. In `src/lib/api/sales.ts:54`, the `recordSale` function still executes an `INSERT INTO sales` query that includes the `referred_by_student_id` column.
2. In `src/lib/api/sales.ts:93`, the `getSales` function still attempts to map the `referred_by_student_id` column from the result rows.
3. In `schema.sql:99-114`, the `sales` table does not have a `referred_by_student_id` column. There is no alternative migration (e.g., `patch_sales.mjs`) that adds this column to the `sales` table.
4. The other fixes requested previously (changing `offer_expiry` to `offer_expiry_date` in `recordAdmission`, changing `created_at` to `timestamp` in `getSales`) were successfully implemented.
5. In `src/lib/api/crm.ts`, `getCRMAnalytics` correctly implements SQL aggregation (e.g., `SUM(CASE WHEN ...)` and `SUM(total_fee)`) instead of hardcoded numbers.
6. In `src/pages/crm/SalesDashboard.tsx`, the `BarChart` correctly maps real `chartData` fetched from the API instead of using facade implementations.
7. The project builds successfully (`npm run build`).

## Logic Chain
- The worker successfully fixed the facade violations by mapping actual data in `SalesDashboard.tsx` and computing analytics using SQL in `crm.ts`.
- The worker partially resolved the SQL mismatches, fixing the column names for `admissions` and the timestamp order for `sales`.
- However, the worker missed the `referred_by_student_id` mismatch on the `sales` table, which was explicitly called out in the previous review and explorer notes. 
- Because the `sales` table lacks the `referred_by_student_id` column, the `INSERT INTO sales` statement in `recordSale` will fail at runtime with a "no such column" SQLite error.
- This is a critical functional blocker for recording sales and indicates that the previous issues were not fully resolved.

## Caveats
- I did not test this against a live Turso database, but the static schema definition (`schema.sql`) and SQL insert strings guarantee a runtime failure.

## Conclusion
**Verdict:** REQUEST_CHANGES (VETO)

The facade violations and most SQL syntax errors were fixed, but a critical SQL mismatch remains. The `recordSale` function is still attempting to insert `referred_by_student_id` into the `sales` table, which lacks this column. 

Please address this final issue:
- In `src/lib/api/sales.ts`, remove `referred_by_student_id` from the `INSERT INTO sales` statement (and its corresponding `args`), remove it from the `Sale` interface, and remove the mapping in `getSales`. Alternatively, add the column to the `sales` table in `schema.sql`.

## Verification Method
1. Inspect `schema.sql` to confirm the columns of the `sales` table.
2. Inspect `src/lib/api/sales.ts` to confirm that `recordSale` tries to insert `referred_by_student_id`.
3. Fix the code, then run `npm run build` to ensure type safety.
