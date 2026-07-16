# Handoff Report: M5 CRM Backend Fix Strategy

## Observation
- **Validation**: In `src/lib/api/crm.ts`, the `updateLeadStatus` function currently only enforces one rule (requiring a 'Demo Completed' meeting before moving to 'Admission' or 'Closed Won'). It does not enforce the rule mentioned in `PROJECT.md` (e.g., "at least one activity logged before moving to 'Contacted'").
- **Database Schema**: `schema.sql` is missing a `sales` table. However, `src/lib/api/sales.ts` and `src/pages/crm/SalesDashboard.tsx` actively attempt to insert and read from a `sales` table to calculate revenue metrics (`total_fee`, `amount_paid`).
- **Analytics Dashboard**: The `SalesDashboard.tsx` component is currently downloading all leads and sales into memory to compute aggregate metrics (`totalLeads`, `activeAdmissions`, `totalRevenue`, `collectedRevenue`).

## Logic Chain
1. **Validation Enforcement**: To satisfy the strict backend validation requirement, `updateLeadStatus` in `src/lib/api/crm.ts` needs a switch-case or map of rules. For a transition to `'Contacted'`, it must check `getLeadActivities(id)` and return an error if the array is empty. This prevents any frontend drag-and-drop from bypassing the rules.
2. **Analytics DB Support (schema.sql)**: The missing `sales` table must be explicitly added to `schema.sql`. It requires columns for `total_fee` and `amount_paid`, and foreign keys to `crm_leads`, `admissions`, `courses`, and `erp_users` to match the data being pushed by `src/lib/api/sales.ts`.
3. **Analytics API (crm.ts)**: To efficiently support the analytics dashboard and avoid frontend number-crunching over large datasets, a new function (e.g., `getCrmAnalytics()`) should be added to `src/lib/api/crm.ts`. This function will run SQL aggregation queries directly (e.g., `SELECT SUM(total_fee) FROM sales`, `SELECT COUNT(*) FROM crm_leads WHERE status = 'Admission'`) and return the compiled metrics to the frontend.

## Caveats
- **Legacy Table Names in `sales.ts`**: While not in the immediate file scope, `src/lib/api/sales.ts` updates legacy schema fields (`UPDATE leads SET bucket_stage = 'D'`). It should be updated to `UPDATE crm_leads SET status = 'Admission'`, or else the status pipeline will become out of sync.
- **Frontend Dashboard Update Required**: Once the backend analytics query is exposed, `SalesDashboard.tsx` will need to be refactored to consume it instead of the current `getLeads` array-reduce logic. Its current filters (like `l.bucket_stage === 'Admission Completed'`) are also legacy and need to align with the new `status` enums.

## Conclusion
1. **`schema.sql`**: Append a `CREATE TABLE IF NOT EXISTS sales` statement mirroring the insertion logic in `sales.ts` to persist revenue data.
2. **`src/lib/api/crm.ts`**: 
   - Expand `updateLeadStatus` to strictly validate transitions (e.g., if `newStatus === 'Contacted'`, assert `activities.length > 0`).
   - Add a `getCrmAnalytics()` function to run SQLite aggregations for total leads, admissions count, total revenue, and collected revenue.

## Verification Method
1. Run `npm run build` to ensure TypeScript typings for new `crm.ts` functions are sound.
2. Apply `schema.sql` to a test Turso/SQLite database to verify table syntax and foreign key integrity.
3. Attempt to call `updateLeadStatus` to `'Contacted'` on a new lead without activities—it should return `{ success: false, error: '...' }`.
