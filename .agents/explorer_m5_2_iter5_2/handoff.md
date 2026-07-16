# Observation
- In `src/lib/api/crm.ts` (lines 129-131), `updateLeadStatus` contains an early return block when transitioning to `Admission` or `Closed Won`:
  ```typescript
  if (oldStatus !== 'Demo Completed') {
    return { success: false, status: 400, error: `Cannot move to ${newStatus} unless current status is Demo Completed.` };
  }
  ```
- This early return prevents the execution of the subsequent code that checks the `demos` table:
  ```typescript
  const demosRes = await client.execute({
    sql: "SELECT * FROM demos WHERE lead_id = ? AND status = 'Completed'",
    args: [id]
  });
  ```
- Running `npx vitest run src/lib/api/__tests__/crm.test.ts` reveals two test failures in `Strict Stage Transitions`:
  - `prevents moving a lead to Admission without a Demo Completed activity` fails because it receives the `Cannot move to Admission unless current status is Demo Completed.` error instead of `Cannot move to Admission without completing a Demo.`. It also throws a TypeError because `client.execute` is mocked with `.mockResolvedValueOnce({ rows: [] })`, but the function now performs multiple DB calls (`getLeadById`, `getLeadActivities`, `demos` query, etc.).
  - `allows moving a lead to Admission if a Demo Completed activity exists` fails because it expects `result.success` to be `true`, but it receives `false` (due to the early return bug and insufficient mocking).

# Logic Chain
1. The early return in `crm.ts` (lines 129-131) creates a logic bug. If `oldStatus` is not `'Demo Completed'`, the function returns an error without checking the `demos` table. If it *is* `'Demo Completed'`, the function proceeds, but `hasDemoCompleted` evaluates to `true` immediately (`oldStatus === 'Demo Completed' || ...`), rendering the `demos` table query effectively dead code.
2. To allow leads with a completed demo in the `demos` table to transition to `Admission` or `Closed Won` regardless of their immediate previous status, the early return block must be removed. The logic should rely solely on the `hasDemoCompleted` check.
3. The unit tests in `crm.test.ts` are outdated. They assume `updateLeadStatus` only checks for an activity matching "Demo Completed", but the implementation now checks the `demos` table or `oldStatus`.
4. Furthermore, because `updateLeadStatus` makes multiple sequential DB calls (`getLeadById`, `getLeadActivities`, `demos` check, `UPDATE crm_leads`), the unit tests cannot rely on a single `.mockResolvedValueOnce({ rows: [] })`. They need a `.mockImplementation` that returns the correct mocked rows based on the executed SQL query string.
5. Updating the tests to mock each specific query based on its `sql` property will resolve the `TypeError` and correctly test the new logic paths.

# Caveats
- No new features are added; the scope is restricted to fixing the logic bug and updating tests to cover the new `demos` table check.
- The tests check that the `demos` table is correctly queried when the status is not already `Demo Completed`. We do not strictly need a separate test case for when `oldStatus === 'Demo Completed'` because it shares the same success branch, but adding it would increase test robustness.
- We assume `isTursoConfigured` and `client` are otherwise mocked correctly in the test environment.

# Conclusion
The logic bug is caused by an erroneous early return in `updateLeadStatus` that preempts the newly implemented `demos` table check. The associated unit tests fail because they do not mock the new sequence of database queries correctly.

**Fix Strategy:**
1. Edit `src/lib/api/crm.ts` to remove lines 129-131:
   ```typescript
   if (oldStatus !== 'Demo Completed') {
     return { success: false, status: 400, error: `Cannot move to ${newStatus} unless current status is Demo Completed.` };
   }
   ```
2. Edit `src/lib/api/__tests__/crm.test.ts` to replace the `mockResolvedValueOnce` calls inside `describe('Strict Stage Transitions')` with a `vi.mockImplementation` function on `client.execute`. The mock should inspect `query.sql` and return appropriate rows for `getLeadById`, `getLeadActivities`, the `demos` query, and the `UPDATE` query.
3. Update the first test ("prevents moving a lead to Admission without a Demo Completed activity") to return `[]` for the `demos` query.
4. Update the second test ("allows moving a lead to Admission if a Demo Completed activity exists") to return `[{ id: 'demo_1', status: 'Completed' }]` for the `demos` query, and rename it to reflect checking the `demos` table instead of activities.

# Verification Method
1. Modify `src/lib/api/crm.ts` as specified.
2. Modify `src/lib/api/__tests__/crm.test.ts` as specified.
3. Run `npx vitest run src/lib/api/__tests__/crm.test.ts`.
4. Ensure all unit tests pass without TypeErrors or AssertionErrors.
