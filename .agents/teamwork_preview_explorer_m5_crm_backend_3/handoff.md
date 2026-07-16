# M5 CRM Backend Investigation Handoff

## Observation
1. In `src/lib/api/crm.ts` (lines 115-152), the `updateLeadStatus` function validates transitions to `'Admission'` or `'Closed Won'` (checks for `'Demo Completed'` meeting), but lacks validations for moving to `'Contacted'` or other states (which should require activities).
2. The `src/pages/crm/SalesDashboard.tsx` (lines 23-34) fetches all leads and all sales to compute analytics (totalLeads, activeAdmissions, totalRevenue, collectedRevenue) on the frontend. This scales poorly.
3. `SalesDashboard.tsx` relies on `l.bucket_stage === 'Admission Completed'`, but the `crm_leads` table in `schema.sql` (line 19) uses `status` with values like `'New', 'Contacted', 'Demo Scheduled', 'Demo Completed', 'Admission', 'Closed Won', 'Closed Lost'`.
4. `src/lib/api/sales.ts` queries a `sales` table, inserts into `admissions` using fields `amount`, `expected_sale_date`, `referred_by_student_id`, and `status = 'Active'`, and updates a `leads` table column `bucket_stage`.
5. `schema.sql` completely lacks a `sales` table. Its `admissions` table (lines 83-92) has different column names (`reservation_amount` instead of `amount`, `offer_expiry_date` instead of `offer_expiry`) and different ENUM values for status (`'reserved'` vs `'Active'`). Its leads table is named `crm_leads`, not `leads`.

## Logic Chain
1. **Strict Validation:** To fulfill the M5 requirement for strict CRM pipeline validation, we must add checks inside `src/lib/api/crm.ts`'s `updateLeadStatus` method that reject a status change to `'Contacted'` or later if the lead has no logged activities.
2. **Analytics DB Support:** The dashboard computes aggregations client-side. To provide proper DB support, we should add a function `getCRMAnalytics()` in `src/lib/api/crm.ts` that runs aggregate SQL queries (e.g. `SUM(total_fee)`) on the backend, returning the 4 required metrics.
3. **Schema Alignment:** For the analytics queries and sales functionality to work, the missing `sales` table must be added to `schema.sql`.
4. **Fixing Mismatches:** The mismatch between `src/lib/api/sales.ts`, the frontend dashboard, and `schema.sql` (e.g., `leads` vs `crm_leads`, `bucket_stage` vs `status`, mismatched `admissions` schema) will cause DB constraint failures. We must align `schema.sql` to support the application's actual data usage, and update the backend/frontend logic to be consistent.

## Caveats
- I did not investigate all CRM page files. There may be other components depending on the incorrect `bucket_stage` or `leads` table name.
- The instruction specifies modifying `schema.sql` and `src/lib/api/crm.ts`. Fixing `src/lib/api/sales.ts` or `SalesDashboard.tsx` is technically outside the stated files for this specific task, but is highly recommended to achieve a working state since they contain the SQL mismatches.

## Conclusion
**Fix Strategy:**
1. **In `src/lib/api/crm.ts`:**
   - Modify `updateLeadStatus` to enforce validation for moving to `'Contacted'` or `'Demo Scheduled'` (e.g., return an error if `activities.length === 0`).
   - Add a `getCRMAnalytics()` function that performs database-side aggregations (e.g., `SELECT COUNT(*)`, `SELECT SUM(amount_paid) FROM sales`) to supply the dashboard metrics directly.
2. **In `schema.sql`:**
   - Add the missing `sales` table schema.
   - Update the `admissions` table schema to match `sales.ts` usage (rename `reservation_amount` to `amount`, add `expected_sale_date` and `referred_by_student_id`, update the status constraint to include `'Active'`).
3. **In dependents (Recommended Alignment):**
   - Update `SalesDashboard.tsx` to use the new `getCRMAnalytics()` function and check `l.status === 'Admission'` instead of `bucket_stage`.
   - Update `src/lib/api/sales.ts` queries to use the `crm_leads` table instead of `leads` and to avoid updating the non-existent `bucket_stage` column.

## Verification Method
- **Commands:** Run `npm run test` or `npm run test:e2e` after implementation.
- **Files to Inspect:** `src/lib/api/crm.ts` for the new validation logic and analytics function; `schema.sql` for the `sales` table and corrected `admissions` table.
- **Manual Verification:** Open the CRM pipeline and try to drag a "New" lead to "Contacted" without activities; it should be rejected. Load the Sales Dashboard and verify metrics display correctly via the DB without throwing SQL errors about missing tables.
