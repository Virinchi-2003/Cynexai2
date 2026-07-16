# Handoff Report: M5_2_API Failure Analysis & Revised Strategy

## 1. Observation
- **Frontend Type Errors**: `npx tsc` failed with `TS2339: Property 'bucket_stage' does not exist on type 'Lead'`.
  - In `src/pages/crm/LeadDetail.tsx` (lines 100, 106, 107), `lead.bucket_stage` is still used instead of the new `status` property. The `STATUS_BUCKETS` array (lines 14-26) contains legacy values (e.g., `'Sale completed'`) that do not match the `LeadStatus` type.
  - In `src/pages/crm/LeadCapture.tsx` (line 21), `bucket_stage: 'A'` is passed to `createLead` instead of the required `status` property.
- **Backend Table Mismatches**:
  - `src/lib/api/manager.ts` incorrectly queries the old `leads` table and uses `bucket_stage`. Observations from `run_command` (grep):
    - Line 37: `JOIN leads l ON s.lead_id = l.id`
    - Line 89: `UPDATE leads SET bucket_stage = 'H' WHERE id = ?`
    - Line 119: `UPDATE leads SET bucket_stage = 'G' WHERE id = ?`
    - Line 154: `SELECT COUNT(*) as c FROM leads`
    - Lines 175, 208: `JOIN leads l ...`
  - `src/lib/api/admin.ts` (line 21) incorrectly queries `SELECT COUNT(*) as count FROM leads`.
- **Validation Issues (`src/lib/api/crm.ts`)**:
  - Reviewer noted `updateLeadStatus` takes `newStatus: string` which bypasses strict typing. (Observed on line 115).
  - Reviewer noted fragile state validation. On line 133, `const hasDemoCompleted = activities.some(a => a.type === 'Meeting' && a.content.includes('Demo Completed'))` relies on substring matching.
- **Unused Frontend Metrics**:
  - In `src/pages/crm/SalesDashboard.tsx`, the `metrics` state (lines 12-19) omits `leadSources` and `conversionRate` returned by `getCRMAnalytics()`, and no UI exists to display them.

## 2. Logic Chain
1.  **TypeScript & Status Alignment**: Since the schema migrated `Lead` from `bucket_stage` to `status: LeadStatus`, any UI referencing `bucket_stage` will fail to compile. Replacing `bucket_stage` with `status`, aligning `STATUS_BUCKETS` exactly with the `LeadStatus` union from `src/lib/types.ts` (`'New', 'Contacted', 'Demo Scheduled', 'Demo Completed', 'Admission', 'Closed Won', 'Closed Lost'`), and setting `status: 'New'` on lead creation will resolve the TypeScript errors.
2.  **Table Reference Corrections**: The codebase transitioned to using `crm_leads` for leads. Both `manager.ts` and `admin.ts` must query `crm_leads` instead of `leads` to prevent database mismatch errors.
3.  **Manager Updates Correction**: In `manager.ts`, updating `bucket_stage = 'H'` or `'G'` is obsolete. They should be updated to `status = 'Closed Won'` to represent a successful sale/onboarding approval, aligning with the new `LeadStatus` workflow.
4.  **Validation Fortification**: Typing `newStatus` as `LeadStatus` in `updateLeadStatus` will enforce compiler checks in the frontend, preventing arbitrary string updates. Dropping the fragile substring check (`content.includes('Demo Completed')`) and relying solely on the verified `oldStatus === 'Demo Completed'` check is more robust for strict state transitions.
5.  **Metrics Integration**: Expanding the `metrics` state in `SalesDashboard.tsx` to accept the new data and rendering simple UI components (e.g., text spans or basic lists) for `conversionRate` and `leadSources` will fulfill the original requirement.

## 3. Caveats
- I assume `crm_leads` has the same structure as `leads` in queries where `leads` was used (e.g., `l.name`). If column names changed beyond `bucket_stage`, additional fixes may be needed.
- `manager.ts` updates to `status = 'Closed Won'` for onboarding and manager approvals assume `'Closed Won'` is the intended final state in `LeadStatus`. If an `'Onboarding'` state is later added to `LeadStatus`, this should be adjusted.

## 4. Conclusion
The implementation failure was caused by incomplete refactoring of schema changes. To fix it, the implementer must:
1. Update `LeadDetail.tsx` (replace `bucket_stage` with `status`, align `STATUS_BUCKETS` with `LeadStatus`) and `LeadCapture.tsx` (use `status: 'New'`).
2. Replace all instances of the `leads` table with `crm_leads` in `src/lib/api/manager.ts` and `src/lib/api/admin.ts`.
3. In `manager.ts`, change `UPDATE leads SET bucket_stage = ...` queries to update `crm_leads SET status = 'Closed Won'`.
4. In `src/lib/api/crm.ts`, change `newStatus` type to `LeadStatus` in `updateLeadStatus` and remove the fragile substring validation check on line 133.
5. Add `leadSources` and `conversionRate` to the `metrics` state in `SalesDashboard.tsx` and display them in the UI.

## 5. Verification Method
- **TypeScript**: Run `npx tsc --noEmit -p tsconfig.app.json` or `npx tsc`. It must complete with zero errors.
- **Database Logic**: Run `grep -r "leads\b" src/lib/api/` (or equivalent Windows search) to verify no unmigrated `leads` references remain (ensure they are `crm_leads`).
- **Build**: Ensure the project compiles successfully using `npm run build` or equivalent.
