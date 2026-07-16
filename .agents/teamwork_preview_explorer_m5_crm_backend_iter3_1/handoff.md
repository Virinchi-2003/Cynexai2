# Handoff Report: M5 CRM Backend - `sales` Table Schema Mismatch

## 1. Observation
- In `src/lib/api/sales.ts`, the `recordSale` function attempts to insert `referred_by_student_id` into the `sales` table: 
  `INSERT INTO sales (id, lead_id, admission_id, course_id, total_fee, amount_paid, status, sales_exec_id, referred_by_student_id, payment_mode) VALUES (...)`
- In `schema.sql`, the `sales` table definition (lines 98-114) lacks the `referred_by_student_id` column, although it exists in the `admissions` table (line 92).
- In `src/lib/api/ceo.ts`, there is an explicit query selecting this column from the `sales` table: `SELECT id, referred_by_student_id, amount_paid FROM sales WHERE referred_by_student_id IS NOT NULL AND status != 'Pending'`
- In `src/pages/crm/ceo/CEODashboard.tsx`, the frontend relies on this column to render: `Referred by: {r.referred_by_student_id}`
- In `src/lib/turso.ts` (line 878), a database initialization migration actually attempts to append this column dynamically: `await addColumn('sales', 'referred_by_student_id TEXT');`

## 2. Logic Chain
1. The code in `sales.ts` throws an integrity/schema error because it attempts to insert into a column that `schema.sql` doesn't define.
2. Since `ceo.ts` explicitly queries `sales.referred_by_student_id` and the UI (`CEODashboard.tsx`) renders it, removing it from `sales.ts` would break downstream analytical features and UI components.
3. The existence of `await addColumn('sales', 'referred_by_student_id TEXT');` in `turso.ts` confirms that the developers intended for this column to exist on the `sales` table.
4. Therefore, the mismatch is caused by `schema.sql` being out of sync with the runtime migrations and TypeScript definitions.

## 3. Caveats
- I did not run the application to verify if the migration in `turso.ts` executes successfully in a fresh environment, but regardless, `schema.sql` must reflect the source of truth for the database layout.
- There is also a `payment_mode` column being inserted in `sales.ts` and migrated in `turso.ts` (line 879) which is already present in `schema.sql` (line 106). The missing column is purely `referred_by_student_id`.

## 4. Conclusion
**Recommended Fix Strategy:** Add the `referred_by_student_id` column directly to the `sales` table definition in `schema.sql`.

*Proposed Change in `schema.sql`:*
```sql
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    admission_id TEXT,
    course_id TEXT NOT NULL,
    total_fee REAL NOT NULL,
    amount_paid REAL NOT NULL,
    payment_mode TEXT,
    status TEXT CHECK(status IN ('Sale Partial Closed', 'Sale Completed')) NOT NULL,
    sales_exec_id TEXT,
    referred_by_student_id TEXT,  -- <-- ADD THIS LINE
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- ... foreign keys ...
);
```

## 5. Verification Method
- **Method**: Apply the change to `schema.sql`, then execute the project test/integrity scripts.
- **Validation**: Check that the `recordSale` function no longer throws a SQL error for the missing column and that the application initializes cleanly. Verify that `CEODashboard.tsx` renders correctly.
