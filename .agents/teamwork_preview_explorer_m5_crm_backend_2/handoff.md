# Observation

1. In `src/lib/api/crm.ts`, `updateLeadStatus` currently only validates transitions to `'Admission'` or `'Closed Won'` (requires a meeting activity with "Demo Completed"). However, test cases in `tests/e2e/advanced-crm.spec.ts` indicate that strict rule enforcement is expected across the board for the pipeline.
2. The analytics dashboard in `src/pages/crm/SalesDashboard.tsx` relies on `sales` data to calculate total revenue, collected revenue, and active admissions. 
3. In `schema.sql`, there is no `sales` table at all, meaning any DB queries relating to sales (and thus analytics revenue metrics) will fail.
4. In `schema.sql`, the `admissions` table defines columns `reservation_amount` and `offer_expiry_date`, and limits `status` to `('reserved', 'converted', 'expired', 'refunded')`. However, `src/lib/api/sales.ts` attempts to insert into `admissions` using columns `amount`, `offer_expiry`, `expected_sale_date`, `referred_by_student_id`, and a status of `'Active'`, which will throw DB schema errors.
5. In `src/pages/crm/SalesDashboard.tsx`, analytics are computed entirely on the client-side by fetching all leads and sales (`getLeads()`, `getSales()`). Furthermore, it relies on a non-existent property (`l.bucket_stage`).

# Logic Chain

1. The CRM drag-and-drop validation rules can be robustly enforced in the backend by extending `updateLeadStatus` in `src/lib/api/crm.ts`. We must validate that moving a lead to earlier active states (like `'Contacted'`, `'Demo Scheduled'`) also has corresponding logged activities (e.g. any activity for `'Contacted'`, a demo activity for `'Demo Scheduled'`).
2. To provide DB support for the analytics dashboard, the `sales` table must be introduced in `schema.sql` so that revenue figures can be saved and queried.
3. The `admissions` table schema in `schema.sql` must be aligned with the actual insert queries happening in `src/lib/api/sales.ts` so that admissions can be recorded without throwing constraint/column errors.
4. To handle the analytics dashboard efficiently, an aggregated metrics API should be added to `src/lib/api/crm.ts` (e.g. `getCRMAnalytics()`) which calculates totals via SQL instead of pulling thousands of raw rows to the frontend.

# Caveats
- `src/lib/api/sales.ts` contains queries like `UPDATE leads SET bucket_stage = 'D'` which reference an invalid table `leads` (should be `crm_leads`) and an invalid column `bucket_stage`. While out of scope for the exact files requested, this discrepancy will need to be fixed for the app to function properly.
- The `SalesDashboard.tsx` UI should be updated to use the new `getCRMAnalytics` endpoint rather than computing stats manually in React.

# Conclusion

**Fix Strategy:**

1. **Update `src/lib/api/crm.ts`:**
   - Enhance `updateLeadStatus` to enforce rules for more states (e.g., `'Contacted'` requires at least one activity, `'Demo Scheduled'` requires an activity referencing a demo).
   - Add a `getCRMAnalytics()` endpoint to execute SQL queries for analytics (aggregating `totalLeads`, `activeAdmissions`, `totalRevenue`, `collectedRevenue`).
2. **Update `schema.sql`:**
   - Create the missing `sales` table with the correct schema (`id`, `lead_id`, `course_id`, `total_fee`, `amount_paid`, `status`, etc.).
   - Modify the `admissions` table definition: rename `reservation_amount` to `amount`, `offer_expiry_date` to `offer_expiry`, add `expected_sale_date` and `referred_by_student_id`, and update the `status` CHECK constraint to include `'Active'`.

# Verification Method

1. Run `npx vitest src/lib/api/__tests__/crm.test.ts` to ensure the extended drag-and-drop validation logic passes.
2. Run `sqlite3 database.db < schema.sql` (or equivalent Turso init) to verify that `sales` and `admissions` tables are created correctly without schema errors.
3. Call `getCRMAnalytics()` (or hit the associated dashboard route in e2e tests) and verify it returns aggregated metrics without crashing, ensuring the DB support is functioning.
