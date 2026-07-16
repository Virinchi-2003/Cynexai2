# M6 Task Backend - Fix Strategy Report

## Summary
The `createTask` function in `src/lib/api/tasks.ts` is missing the `created_by` field, causing `isAuthorized` checks for task creators to fail. Additionally, the corresponding test in `src/lib/api/__tests__/tasks.test.ts` fails because it expects 11 arguments in the SQL mock, while `createTask` currently passes 13 (and will soon pass 14).

## 1. Observation
- `src/lib/api/tasks.ts` (lines 30-46): The SQL statement `INSERT INTO tasks (...) VALUES (...)` in `createTask` currently defines 13 columns: `(id, title, description, assignee_id, status, priority, due_date, related_entity, task_type, target_number, current_number, start_date, tags)`. It omits `created_by`.
- `src/lib/api/__tests__/tasks.test.ts` (lines 51-66): The mock expectation for `client.execute` in the `createTask` test expects the `args` array to equal an array of 11 elements.
- When running the tests (`npx vitest run src/lib/api/__tests__/tasks.test.ts`), the `createTask` test fails with `AssertionError: expected [ 'task_...', ...(12) ] to deeply equal [ 'task_...', ...(10) ]` indicating that the test expects 11 arguments but the function currently supplies 13.

## 2. Logic Chain
1. To address the `isAuthorized` failure, `createTask` must be updated to insert the `created_by` field into the database.
2. We must modify `src/lib/api/tasks.ts` so the `INSERT INTO` statement includes `created_by` in its column list and adds `task.created_by || null` as the 14th argument in the `args` array.
3. This change will increase the number of arguments sent to `client.execute` from 13 to 14.
4. The test in `src/lib/api/__tests__/tasks.test.ts` is currently out of date. It expects 11 arguments, ignoring recently added fields like `start_date` and `tags`, and will now need to account for `created_by` as well.
5. Updating the test's `toEqual([...])` expectation to include all 14 arguments will resolve the test failure and ensure consistency.

## 3. Caveats
- The `created_by` field is optional in the `Task` interface (`created_by?: string;`). The test payload (`taskData`) currently does not include `created_by`. Therefore, we must expect `null` as the 14th argument in the test expectation, or update the test payload to pass a specific `created_by` value and assert that instead. 

## 4. Conclusion
Apply the following fixes:
1. In `src/lib/api/tasks.ts`, modify the `INSERT INTO` query within `createTask`:
   - Add `created_by` to the columns string.
   - Add a 14th `?` to the `VALUES` clause.
   - Append `task.created_by || null` to the `args` array.
2. In `src/lib/api/__tests__/tasks.test.ts`, update the `expect(callArgs.args).toEqual([...])` array in the `createTask` test to include 14 items. Specifically, append `null` (for `start_date`), `null` (for `tags`), and `null` (for `created_by`) to the existing 11 mock arguments. 

## 5. Verification Method
- Execute: `npx vitest run src/lib/api/__tests__/tasks.test.ts`
- Expect the `createTask` test (and all others in the suite) to pass successfully.
