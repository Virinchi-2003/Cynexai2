# Analysis of CRM updateLeadStatus Logic Bug

## Observation
- In `src/lib/api/crm.ts`, `updateLeadStatus` contains an early return at lines 129-131 if `oldStatus !== 'Demo Completed'`.
- Immediately following this (lines 133-142), there is logic that queries the `demos` table to check for completed demos. This code is currently dead because it can only be reached if `oldStatus` is already `'Demo Completed'`.
- In `src/lib/api/__tests__/crm.test.ts`, the unit tests for stage transitions fail with `TypeError: Cannot read properties of undefined (reading 'rows')`.
- This happens because the test mocks `client.execute` using `mockResolvedValueOnce()` one time, but the new `updateLeadStatus` implementation now makes up to 5 consecutive DB queries (`getLeadById`, `getLeadActivities`, `SELECT * FROM demos`, `UPDATE crm_leads`, `INSERT INTO crm_stage_history`). The subsequent `client.execute` calls return `undefined`.

## Logic Chain
1. The intended logic for moving to `Admission` or `Closed Won` is to require either a lead status of `Demo Completed` OR a completed demo in the `demos` table.
2. The early return in `crm.ts` (lines 129-131) prevents the `demos` table check from executing when it's most needed (i.e., when `oldStatus` is not `'Demo Completed'`).
3. Removing the early return will allow the execution to fall through to the `demos` table query, evaluate `hasDemoCompleted`, and correctly return an error on line 141 if both checks fail.
4. The unit tests are failing because they are mocked for an older implementation that executed fewer DB queries. Chaining `.mockResolvedValueOnce()` is brittle here; using `.mockImplementation` to return the correct mock data based on the provided SQL query string is the robust way to fix the unit tests.

## Caveats
- I did not test the exact UI interactions, but the underlying API state machine bug is clear and localized to these files.
- The third test `can add a new activity to a lead` still passes because `addActivity` only executes a single SQL query, so `mockResolvedValueOnce` still works there. However, it's best to standardise the mocking approach if possible.

## Conclusion
To fix the logic bug and broken tests:
1. **In `src/lib/api/crm.ts`**: Remove the early return block (lines 129-131). The existing logic below it (lines 133-142) is already correct and will accurately evaluate whether a Demo has been completed in either the `oldStatus` or the `demos` table.
2. **In `src/lib/api/__tests__/crm.test.ts`**: Update the two failing tests to use `vi.mockImplementation` for `client.execute`. Inspect the SQL query and route to the correct mock response (e.g., returning appropriate `rows` for `crm_leads`, `crm_activities`, and `demos`). Update the test names and expected call counts to reflect the new implementation.

## Verification Method
1. Make the specified changes to `crm.ts` and `crm.test.ts`.
2. Run `npx vitest run src/lib/api/__tests__/crm.test.ts`.
3. All tests should pass without throwing `TypeError: Cannot read properties of undefined (reading 'rows')`.
