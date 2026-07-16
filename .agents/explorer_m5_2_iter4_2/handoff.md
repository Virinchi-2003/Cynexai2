# Revised Strategy for M5_2_API

## Observation
1. **Frontend Type Errors:** `src/pages/crm/LeadDetail.tsx` and `src/pages/crm/LeadCapture.tsx` still reference `bucket_stage` which was removed from the `Lead` interface in favor of `status`. Additionally, `STATUS_BUCKETS` array uses legacy values.
2. **Backend Table Mismatch:** `src/lib/api/manager.ts` still queries the old `leads` table and attempts to update `bucket_stage` (e.g., `UPDATE leads SET bucket_stage = 'H'`), whereas `src/lib/api/crm.ts` uses the new `crm_leads` table and updates `status`.
3. **Validation Bypass & Fragility:** `updateLeadStatus` in `src/lib/api/crm.ts` accepts `newStatus: string` without validating it against the `LeadStatus` enum, causing bypasses. It also relies on `content.includes('Demo Completed')` in activities for transition validation.
4. **Unused Metrics:** `src/pages/crm/SalesDashboard.tsx` receives `leadSources` and `conversionRate` from `getCRMAnalytics` but ignores them.

## Logic Chain
1. To fix the frontend type issues, we must replace all `bucket_stage` properties with `status`. The `STATUS_BUCKETS` must reflect exactly the values from the `LeadStatus` union (`'New' | 'Contacted' | 'Demo Scheduled' | 'Demo Completed' | 'Admission' | 'Closed Won' | 'Closed Lost'`) so valid states can be selected.
2. For the backend to remain in sync with the schema, any SQL operations on leads inside `manager.ts` must target `crm_leads` and modify the `status` column instead of `bucket_stage`. The legacy values ('H', 'G') should map to actual `LeadStatus` enums like `'Closed Won'` or `'Admission'`.
3. To secure the API, `updateLeadStatus` must type the argument as `LeadStatus` and include a runtime check confirming the provided `newStatus` is valid.
4. To fix the fragile state validation, rather than scanning the text content of activities for the string `'Demo Completed'`, the API should query the `demos` table for the lead to check if there is a demo with `status = 'Completed'`.
5. Finally, to fulfill the metrics requirement, new metric `<Card>` components should be added in `SalesDashboard.tsx` for `conversionRate`, and a `PieChart` added for `leadSources`.

## Caveats
- I assumed the `demos` table exists and matches the `Demo` interface defined in `src/lib/types.ts`. If it does not, a fallback would be checking for a structured activity type like `type = 'Meeting'` and a specific structured column, but querying `demos` is the architecturally correct approach.

## Conclusion
The `M5_2_API` failure stems from an incomplete migration of properties, table names, and unenforced API validation parameters. Implementing the fixes detailed in the Logic Chain will resolve the TypeScript build errors, unify backend queries to the `crm_leads` table, secure the transitions, and visually utilize the missing analytics metrics.

## Verification Method
1. **Frontend Typecheck:** Run `npx tsc --noEmit -p tsconfig.app.json` inside the project to verify `LeadDetail.tsx` and `LeadCapture.tsx` compile without `TS2339`.
2. **Backend Logic Review:** Inspect `src/lib/api/manager.ts` and `src/lib/api/crm.ts` to ensure `crm_leads` and `status` are used exclusively, and `bucket_stage`/`leads` do not appear.
3. **Validation Testing:** Invoke `updateLeadStatus` with a random string like `'InvalidState'` and assert it returns a `400` error before attempting to update the database.
