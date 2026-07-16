## Review Summary

**Verdict**: REQUEST_CHANGES

## Findings

### [Critical] Finding 1: Logic Error in `updateLeadStatus` breaking API functionality

- **What**: The logic added to `updateLeadStatus` contains a dead-code branch and incorrectly enforces `oldStatus === 'Demo Completed'` immediately when moving to 'Admission' or 'Closed Won'.
- **Where**: `src/lib/api/crm.ts`
- **Why**: 
  ```typescript
  if (newStatus === 'Admission' || newStatus === 'Closed Won') {
    if (oldStatus !== 'Demo Completed') {
      return { success: false, status: 400, error: `Cannot move to ${newStatus} unless current status is Demo Completed.` };
    }
    // Dead code below:
    const demosRes = await client.execute({ ... });
    const hasDemoCompleted = oldStatus === 'Demo Completed' || demosRes.rows.length > 0;
  ```
  Because of the early return, `hasDemoCompleted` is always `true`. This fundamentally changes the API contract and breaks the fallback ability to rely on the `demos` table or `crm_activities` if the exact literal `oldStatus` isn't `'Demo Completed'`. 
- **Suggestion**: Remove the `if (oldStatus !== 'Demo Completed') return ...` block entirely. Rely exclusively on `hasDemoCompleted` correctly evaluating `oldStatus === 'Demo Completed' || demosRes.rows.length > 0` to decide whether to throw the 400 error.

### [Critical] Finding 2: Unhandled Unit Test Failures (Integrity Violation)

- **What**: `src/lib/api/__tests__/crm.test.ts` is failing for two tests related to `Strict Stage Transitions`.
- **Where**: `src/lib/api/__tests__/crm.test.ts`
- **Why**: The worker modified `updateLeadStatus` to include new database calls (such as `getLeadById` to fetch `oldStatus`) but entirely neglected to update the corresponding unit tests to match these new code paths and error strings. Running `npm run test` reveals regressions directly caused by this iteration. Tests were apparently not executed by the worker, constituting an integrity violation for self-certifying work without verifying the tests it breaks.
- **Suggestion**: Fix the unit test failures. Update the tests to mock `getLeadById` / `client.execute` properly for the new flow, and correct the expected error string in the test to match your new implementation.

## Verified Claims

- Replaced `bucket_stage` with `status: LeadStatus` in LeadDetail and LeadCapture → verified via `view_file` → PASS
- Removed `.includes('Demo Completed')` in favor of querying `demos` table in `crm.ts` → verified via `view_file` → PASS (Implementation has a logic bug as described above).
- SQL statements in `manager.ts` and `admin.ts` updated to `crm_leads` and map to `Closed Won` → verified via `view_file` → PASS
- Added metrics to `SalesDashboard.tsx` → verified via `view_file` → PASS

## Unverified Items

- None. All major changes were verified through code inspection and testing.
