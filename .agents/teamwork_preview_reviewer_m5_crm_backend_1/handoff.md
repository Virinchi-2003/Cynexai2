# M5 CRM Backend Fix Review

## Observation
1. In `src/lib/api/sales.ts:8`, the `recordAdmission` function executes an `INSERT INTO admissions` query referencing an `offer_expiry` column. However, `schema.sql:88` defines the column as `offer_expiry_date`.
2. In `src/lib/api/sales.ts:54`, the `recordSale` function executes an `INSERT INTO sales` query that includes a `referred_by_student_id` column. However, `schema.sql:99-114` does not define a `referred_by_student_id` column for the `sales` table.
3. In `src/lib/api/sales.ts:83`, the `getSales` function executes `SELECT * FROM sales ORDER BY created_at DESC`. However, `schema.sql:109` defines the column as `timestamp`, not `created_at`.
4. The `updateLeadStatus` and `getCRMAnalytics` functionalities in `src/lib/api/crm.ts` appear logically sound.

## Logic Chain
- The mismatch between the column names used in the raw SQL queries in `src/lib/api/sales.ts` and the actual definitions in `schema.sql` will cause SQLite exceptions at runtime.
- Specifically, attempting to record an admission, record a sale, or list sales will all crash with "no such column" errors.
- Since this code interacts with the primary database for core CRM features (Admissions and Sales), these are critical blockers.

## Caveats
- No live Turso instance was available during the test, so these queries were not run against the actual remote database. However, the static SQL syntax and schema mismatch guarantees runtime failures.

## Conclusion
**Verdict:** REQUEST_CHANGES (VETO)
The changes introduce multiple SQL column name mismatches that will break core functionalities (recording admissions, recording sales, viewing sales). 
Please fix the following mismatches in `src/lib/api/sales.ts` or `schema.sql`:
- Align `offer_expiry` with `offer_expiry_date` in `recordAdmission`.
- Ensure `referred_by_student_id` exists in the `sales` table or remove it from the `INSERT` query in `recordSale` and the mapping in `getSales`.
- Change `ORDER BY created_at DESC` to `ORDER BY timestamp DESC` in `getSales`.

## Verification Method
1. Inspect `src/lib/api/sales.ts` against `schema.sql` to verify column names.
2. Run a local libSQL/SQLite query attempting to execute these statements against the `schema.sql` structure.
