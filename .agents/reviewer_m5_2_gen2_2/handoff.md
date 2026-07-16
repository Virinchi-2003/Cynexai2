## Review Summary

**Verdict**: REQUEST_CHANGES

## Findings

### [Critical] Type check failures in Frontend due to outdated fields
- **What**: The frontend code still uses the legacy `bucket_stage` field instead of the new `status` field defined in `Lead` type.
- **Where**: `src/pages/crm/LeadDetail.tsx` (lines 100-107) and `src/pages/crm/LeadCapture.tsx` (line 21).
- **Why**: `Lead` type does not have `bucket_stage`, causing `npx tsc --noEmit -p tsconfig.app.json` to fail with `TS2339: Property 'bucket_stage' does not exist on type 'Lead'` and `TS2353: Object literal may only specify known properties`.
- **Suggestion**: Replace all usages of `bucket_stage` with `status` on the `Lead` object in the frontend components. In `LeadCapture.tsx`, pass `status: 'New'` instead of `bucket_stage: 'A'`.

### [Major] Disconnected Status Enums between Frontend and Backend
- **What**: The status dropdown options in the frontend (`STATUS_BUCKETS`) do not match the backend `LeadStatus` type or validation logic.
- **Where**: `src/pages/crm/LeadDetail.tsx` (lines 14-26) and `src/lib/types.ts`.
- **Why**: The dropdown lists legacy options (e.g. `Not answering/Lifting`, `Sale completed`) while the backend `LeadStatus` expects specific values (`New`, `Contacted`, `Demo Scheduled`, etc.). This causes the frontend to send invalid states that bypass backend validation and corrupt the DB state.
- **Suggestion**: Update `STATUS_BUCKETS` in `LeadDetail.tsx` to match the `LeadStatus` type exactly.

### [Major] Validation Bypass in `updateLeadStatus`
- **What**: The `updateLeadStatus` function signature accepts `newStatus: string` instead of `LeadStatus`, and the validation array `requiresActivityStatuses` is a fixed whitelist.
- **Where**: `src/lib/api/crm.ts` (line 115).
- **Why**: Because `newStatus` is just a string, if the frontend sends an invalid status (like 'Busy' or 'Sale completed'), it bypasses the `requiresActivityStatuses` check entirely and updates the database with a garbage state, silently breaking the integrity of the state machine.
- **Suggestion**: Strongly type `newStatus: LeadStatus`. Alternatively, validate that `newStatus` is one of the strictly allowed values in `LeadStatus` before applying transition rules.

### [Minor] Fragile state validation using unstructured text
- **What**: The condition to transition to `Admission` or `Closed Won` relies on substring matching `content.includes('Demo Completed')`.
- **Where**: `src/lib/api/crm.ts` (line 133).
- **Why**: If a user logs an activity like "Client cancelled because they don't want a Demo Completed", this will incorrectly pass the validation check.
- **Suggestion**: Consider a more structured way to track demo completions (e.g., a specific activity `type` or a structured `metadata` field) rather than raw string matching.

## Verified Claims
- `updateLeadStatus` returns structured object with `success, status, error` → verified via `view_file` → **pass**
- `getCRMAnalytics` adds `leadSources` and `conversionRate` inline calculation → verified via `view_file` → **pass**
- Build and Type-check passes → verified via `npx tsc --noEmit -p tsconfig.app.json` → **fail**

## Coverage Gaps
- None.

## Unverified Items
- None.
