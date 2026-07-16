# Strategy: M5_2_API Implementation

Based on the investigation from the Explorers, here is the synthesized strategy to implement M5_2_API:

## 1. Robust Errors & Strict Rules in `updateLeadStatus`
- File: `src/lib/api/crm.ts`
- Modify the return type of `updateLeadStatus` to include an optional `status` field: `Promise<{ success: boolean; status?: number; error?: string }>`.
- Add strict validation rules before updating the lead status. Fetch activities for the lead inside the function to check conditions:
  - Moving to `Contacted`: Requires at least one activity to be logged.
  - Moving to `Admission` or `Closed Won`: Requires the previous status to have been `Demo Completed` or similar strict logic as currently outlined but properly enforcing it.
- When validation fails, return `{ success: false, status: 400, error: "Specific validation message" }` instead of throwing an unhandled exception or returning without a status.

## 2. Dynamic Analytics in `getCRMAnalytics`
- File: `src/lib/api/crm.ts`
- Add a new query to fetch lead sources:
  `SELECT source, COUNT(*) as count FROM crm_leads GROUP BY source`
- Map the result to an array of `{ name: string, value: number }`.
- Calculate conversion rates inline. For example:
  - Overall Conversion: `(closed_won_count / total_leads * 100).toFixed(1)`
  - Demo to Admission: `(active_admissions / demo_completed * 100).toFixed(1)`
- Extend the returned metrics object to include `leadSources` and `conversionRate`.

## 3. Frontend Adjustments
- File: `src/pages/crm/LeadDetail.tsx` (and/or `src/components/crm/LeadDetailPanel.tsx`)
  - Ensure the `updateLeadStatus` call passes all required arguments (such as `userId`, which may be missing).
  - Explicitly handle the returned error object. If `!result.success`, display `result.error` (e.g., via an alert or toast) so the backend validation failure is visible to the user.
- File: `src/pages/crm/SalesDashboard.tsx`
  - Ensure any new metrics returned by `getCRMAnalytics` can be displayed if applicable, or at least ensure the frontend doesn't break due to the payload changes.

## Verification
- Build and type-check: `npm run build` and `npm run typecheck` (or `npm run lint`).
- Manual/UI test: Check that transitioning a New lead directly to Contacted without an activity triggers the robust error UI.
