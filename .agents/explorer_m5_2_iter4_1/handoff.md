# M5_2_API Revised Strategy Handoff Report

## 1. Observation
- **Frontend Type Errors**: `src/pages/crm/LeadDetail.tsx` (lines 100, 106, 107) and `src/pages/crm/LeadCapture.tsx` (line 21) use `bucket_stage`, which no longer exists on the `Lead` interface. `LeadCapture.tsx` omits the required `status` property in the `createLead` payload.
- **Table Mismatches**: `src/lib/api/manager.ts` queries the obsolete `leads` table instead of `crm_leads` (lines 34, 37, 72, 89, 119, 154, 175, 208). It attempts to update `bucket_stage` directly (e.g. `UPDATE leads SET bucket_stage = 'H'`).
- **Unused Metrics**: `src/pages/crm/SalesDashboard.tsx` fetches analytics via `getCRMAnalytics()`, but the local `metrics` state (line 12) omits `leadSources` and `conversionRate`, failing to render them.
- **Disconnected Enums & Validation Bypass**: `LeadDetail.tsx` (line 14) uses legacy statuses for `STATUS_BUCKETS` (e.g., 'Sale completed'). `src/lib/api/crm.ts` (`updateLeadStatus`) accepts `newStatus: string` without validating if it strictly belongs to the `LeadStatus` type.
- **Fragile Validation**: `crm.ts` (line 133) uses `a.content.includes('Demo Completed')` to validate transitions to Admission.

## 2. Logic Chain
- Replacing `bucket_stage` with `status` in the `Lead` type was correct but incomplete, breaking the build because `LeadDetail.tsx` and `LeadCapture.tsx` were not migrated. Updating these to strictly use `status` mapped to `LeadStatus` will resolve TS2339.
- `manager.ts` is operating on an older schema version. Updating all `leads` table references to `crm_leads` and replacing `bucket_stage = 'H'/'G'` updates with `status = 'Closed Won'` (or appropriate `LeadStatus`) is necessary for DB consistency.
- Since `getCRMAnalytics` returns `leadSources` and `conversionRate`, `SalesDashboard.tsx` must add these to its local state and provide UI components (e.g., summary cards or lists) to satisfy the "ensure any new metrics are displayed" requirement.
- To prevent validation bypass, `updateLeadStatus` must perform a runtime check against a defined array of valid `LeadStatus` values.
- The fragile `.includes()` check can be safely removed because line 129 already enforces `oldStatus !== 'Demo Completed'`, effectively acting as a strict state machine guard.

## 3. Caveats
- `manager.ts` might have assumptions about `bucket_stage = 'H'` or `'G'` mapping to legacy business logic. I recommend mapping them to `Closed Won` and `Admission` (or simply `Closed Won` for sales) which aligns with the new schema. The product owner might need to confirm the exact state if custom sub-states are required.
- I have not executed `tsc` locally since this is a read-only strategy analysis, but the TS errors highlighted are directly observable in the current source code.

## 4. Conclusion
The iteration failed due to incomplete migration of the `bucket_stage` field, un-migrated DB queries in the manager API, missing runtime validation, and omitted UI for new metrics. 

**Revised Strategy for Implementation:**
1. **Frontend Models**: Edit `LeadDetail.tsx` to use `status` instead of `bucket_stage` and align `STATUS_BUCKETS` strictly with `LeadStatus` ('New', 'Contacted', etc.). Edit `LeadCapture.tsx` to pass `status: 'New'` instead of `bucket_stage: 'A'`.
2. **Backend Queries**: Refactor `manager.ts` to replace all SQL queries targeting `leads` with `crm_leads`, and map legacy `bucket_stage` updates to `status` updates (e.g., `status = 'Closed Won'`).
3. **Dashboard UI**: Update `SalesDashboard.tsx` state to capture `leadSources` and `conversionRate`, adding UI elements (e.g., basic metric cards) to display them.
4. **Validation Logic**: Strengthen `crm.ts` by validating `newStatus` against an array of valid statuses. Remove the fragile substring check in favor of the existing `oldStatus` state guard.

## 5. Verification Method
- Run `npx tsc --noEmit -p tsconfig.app.json` from the project root to confirm no `TS2339` errors for `bucket_stage` or `status` exist.
- Run a global search: `grep -r "bucket_stage" src/` to verify zero occurrences remain in the source code.
- Run a global search: `grep -ri " FROM leads " src/lib/api/manager.ts` and `grep -ri " JOIN leads " src/lib/api/manager.ts` to verify `leads` is completely replaced by `crm_leads`.
- Inspect `SalesDashboard.tsx` visually or via `grep` to ensure `leadSources` and `conversionRate` are rendered in the JSX.
