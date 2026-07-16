# Iteration 3 Failure Report for M5_2_API

The previous worker implemented the API layer changes, but the iteration failed the Review Gate due to the following reasons:

## Reviewer 1 Findings
1. **Critical:** Incomplete Schema Migration Breaks Build/Typecheck. The `Lead` interface in `src/lib/types.ts` was updated to remove `bucket_stage` and add `status`. However, `src/pages/crm/LeadDetail.tsx` and `src/pages/crm/LeadCapture.tsx` still rely on `bucket_stage`. As a result, running `npx tsc` fails with `error TS2339: Property 'bucket_stage' does not exist on type 'Lead'`.
2. **Major:** Inconsistent Database References. `src/lib/api/crm.ts` uses the new `crm_leads` table and updates `status`, whereas `src/lib/api/manager.ts` still queries the old `leads` table and updates `bucket_stage` (e.g., `UPDATE leads SET bucket_stage = 'H'`). This leaves the system in a broken state.
3. **Minor:** Unused Frontend Metrics. The backend properly implements `leadSources` and `conversionRate` inside `getCRMAnalytics`, but the strategy asked to "ensure any new metrics returned by getCRMAnalytics can be displayed if applicable". `src/pages/crm/SalesDashboard.tsx` accepts the payload without breaking but ignores the new metrics entirely.

## Reviewer 2 Findings
1. **[Critical] Type check failures in Frontend**: The frontend components (`LeadDetail.tsx`, `LeadCapture.tsx`) use `bucket_stage` which does not exist on the `Lead` type, causing `tsc --noEmit -p tsconfig.app.json` to fail with `TS2339`. `LeadCapture` also completely omits the required `status` field in its `createLead` payload.
2. **[Major] Disconnected Status Enums**: The `STATUS_BUCKETS` array in `LeadDetail.tsx` has legacy options (like 'Sale completed', 'Interested') that are not part of the backend's `LeadStatus` union type.
3. **[Major] Validation Bypass**: `updateLeadStatus` takes `newStatus: string`. If a client sends an unlisted string (e.g. from the mismatched frontend array), it bypasses the `requiresActivityStatuses` validation completely and updates the DB with an invalid state.
4. **[Minor] Fragile state validation**: Relying on substring `content.includes('Demo Completed')` is fragile for strict state transitions.

Please use this feedback to formulate a revised strategy for M5_2_API.
