# Handoff Report: Milestone M5_2_API Investigation

## Observation
- `PROJECT.md` dictates that the API layer is implemented inside `src/lib/api/` as direct database query wrappers used by the frontend UI (Vite + React), rather than a separate Node.js server.
- `src/lib/api/crm.ts` contains the `updateLeadStatus` and `getCRMAnalytics` functions which simulate REST API behavior.
- `updateLeadStatus` currently checks if activities exist for strict transition rules (e.g., rejecting transition to `Admission` if `Demo Completed` activity is missing). However, it returns a plain object `{ success: false, error: '...' }`, and `LeadDetail.tsx` completely ignores this returned object, leading to a silent failure.
- `getCRMAnalytics` currently only fetches `total_leads`, `active_admissions`, `demo_scheduled`, `demo_completed`, and revenue. It lacks dynamic counts for conversion rates and lead sources required by the contract.

## Logic Chain
1. To meet the "Provide a robust error if a lead transition fails strict rules (e.g., returning 400 Bad Request with a clear message)" requirement, `updateLeadStatus` should be modified to return `{ success: false, status: 400, error: '...' }` or throw a custom `APIError(400, '...')`.
2. The UI in `LeadDetail.tsx` (and `LeadDetailPanel.tsx`) must be updated to check the return value `if (!result.success)` and display the error message, otherwise the backend validation is visually ignored by the user.
3. To meet the "Dashboard API should provide dynamic counts (conversion rates, lead sources)" requirement, `getCRMAnalytics` should execute two additional queries:
   - `SELECT source, COUNT(*) as count FROM crm_leads GROUP BY source` to get lead sources.
   - `SELECT COUNT(*) as count FROM crm_leads WHERE status = 'Closed Won'` to calculate the conversion rate `(closed_won / total_leads * 100)`.

## Caveats
- Since the architecture uses frontend-based "API routes", we are simulating a 400 Bad Request rather than returning a traditional HTTP Response. Adding a `status: 400` property to the return type is the recommended approach for this codebase.
- The `userId` argument is required by `updateLeadStatus` but is currently omitted in `LeadDetail.tsx` line 50 (`await updateLeadStatus(id as string, newStatus)`). This should be fixed simultaneously.

## Conclusion
Implement the API contracts by modifying `src/lib/api/crm.ts` as follows:
1. Update `updateLeadStatus` signature to `Promise<{ success: boolean, status?: number, error?: string }>` and return `{ success: false, status: 400, error: '...' }` when validation fails.
2. Extend `getCRMAnalytics` with queries for `leadSources` (grouped by source) and `conversionRate` (Closed Won / Total Leads * 100).
3. (For the implementer) Update `src/pages/crm/LeadDetail.tsx` to handle the error response and provide the missing `userId` argument.

## Verification Method
1. Inspect `src/lib/api/crm.ts` to confirm `updateLeadStatus` returns `status: 400` on failure and `getCRMAnalytics` returns the new metrics.
2. Start the dev server (`npm run dev`) and attempt an invalid lead transition in the CRM UI (e.g., moving a New lead directly to Admission without a Demo). Verify that an error (like an alert or toast) is displayed.
3. Check the CRM Dashboard to ensure Lead Sources and Conversion Rates are populated.
4. Run `npm run lint` and `npm run build` to verify TypeScript typings for the new properties are correct.
