# Investigation Report: `referred_by_student_id` Schema Mismatch

## 1. Observation
- `src/lib/api/sales.ts:54` attempts to insert `referred_by_student_id` into the `sales` table in `recordSale()`.
- `schema.sql:98-114` defines the `sales` table, but it lacks the `referred_by_student_id` column (though it does have `payment_mode`).
- `src/lib/turso.ts:878` runs an on-the-fly migration: `await addColumn('sales', 'referred_by_student_id TEXT');`.
- `src/lib/api/ceo.ts:21` has `getReferrals()` which queries `SELECT id, referred_by_student_id, amount_paid FROM sales WHERE referred_by_student_id IS NOT NULL...`.
- `src/pages/crm/ceo/CEODashboard.tsx:100` expects and displays this value `Referred by: {r.referred_by_student_id}`.
- `src/lib/api/sales.ts` defines the `Sale` interface and `getSales()` both mapped with `referred_by_student_id`.

## 2. Logic Chain
- The codebase relies heavily on the `referred_by_student_id` column being present on the `sales` table for several backend functions and UI dashboards.
- Removing it from `sales.ts`'s `recordSale` would break CEO dashboard reporting and referral tracking, as the value would no longer be inserted when a sale happens.
- `src/lib/turso.ts` already has a dynamic migration step for it, indicating that the developers intended for this column to exist on `sales`.
- Thus, the base schema definition in `schema.sql` is out of date and needs to be aligned with the application's actual data requirements.

## 3. Caveats
- No caveats found. Adding the column to `schema.sql` is the only way to satisfy the existing TypeScript interfaces and SQL queries without breaking features.

## 4. Conclusion
**Recommended Fix Strategy:**
Add `referred_by_student_id TEXT` to the `sales` table definition in `schema.sql` to align it with the codebase's expectations.

*Proposed change to `schema.sql`:*
```sql
-- Sales Table
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
    referred_by_student_id TEXT, -- Add this line
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id),
    FOREIGN KEY (admission_id) REFERENCES admissions(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (sales_exec_id) REFERENCES erp_users(id)
);
```

## 5. Verification Method
- **Method**: Apply the change to `schema.sql`. Run any schema initialization/reset command, and ensure that backend validation scripts or tests pass without complaining about `sales.referred_by_student_id` missing or having incorrect column mappings.
