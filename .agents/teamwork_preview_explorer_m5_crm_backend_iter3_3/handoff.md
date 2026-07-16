# Handoff Report

## 1. Observation
- `src/lib/api/sales.ts` in `recordSale` executes:
  `INSERT INTO sales (id, lead_id, admission_id, course_id, total_fee, amount_paid, status, sales_exec_id, referred_by_student_id, payment_mode) VALUES (...)`
- `schema.sql` (lines 98-114) defines the `sales` table without the `referred_by_student_id` column.
- `src/pages/crm/forms/SaleForm.tsx` (lines 19, 41, 98) actively collects a `referredBy` value via an input field and passes it to `recordSale`.
- `src/lib/api/sales.ts` defines a `Sale` interface that includes `referred_by_student_id: string | null;` and maps this field in `getSales()`.

## 2. Logic Chain
1. The codebase is currently structured to support a referral system at both the Admission and Sale levels, as evidenced by UI forms (`SaleForm.tsx`) and API functions (`sales.ts`).
2. The mismatch causes a SQL runtime error when `recordSale` is called because the target column doesn't exist in the database.
3. If we remove the column from `sales.ts`, we would also have to remove the corresponding UI elements in `SaleForm.tsx` and alter the `Sale` interface, which destroys existing functionality (direct sales referrals).
4. If we add the column to `schema.sql`, it resolves the DB error with a minimal 1-line change while preserving the intended feature.

## 3. Caveats
- No caveats. The fix is localized to schema initialization. If there's an existing populated database, an `ALTER TABLE sales ADD COLUMN referred_by_student_id TEXT;` migration would be needed on the live database, but since we are iterating on `schema.sql`, adding the column definition is sufficient.

## 4. Conclusion
The recommended fix strategy is to **add the `referred_by_student_id TEXT` column to the `sales` table in `schema.sql`**. This is less intrusive than stripping out the referral tracking feature from the UI, API interfaces, and SQL queries.

## 5. Verification Method
1. Modify `schema.sql` to add `referred_by_student_id TEXT,` to the `sales` table definition.
2. Clear/reset the local Turso SQLite database so it rebuilds using the new schema.
3. Open the UI, navigate to a CRM lead, and use the "Close Sale" form, entering a dummy student ID in the referral field.
4. Verify the sale saves successfully without throwing an SQL error.
