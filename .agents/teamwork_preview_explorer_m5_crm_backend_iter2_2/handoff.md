# Handoff Report: CRM Backend Fix Strategy

## 1. Observation
1. **Integrity Violation in `SalesDashboard.tsx`:**
   - Lines 141 and 147 use dummy math for funnel metrics: `Math.floor(metrics.totalLeads * 0.4)` and `Math.floor(metrics.totalLeads * 0.35)`.
   - Line 32 sets chart data to an empty array: `setChartData([]);`.
   - `getCRMAnalytics()` in `src/lib/api/crm.ts` does not compute or return counts for "Demo Scheduled", "Demo Completed", or any chart data.

2. **SQL Mismatches in `src/lib/api/sales.ts`:**
   - `recordAdmission` (line 8) inserts into `offer_expiry`, but `schema.sql` (line 88) uses `offer_expiry_date`.
   - `getSales` (line 83) sorts by `created_at DESC`, but `schema.sql` (line 109) uses `timestamp`.
   - `recordSale` (line 54) inserts into `referred_by_student_id`, which does not exist in the `sales` table (`schema.sql` lines 99-114). The `Sale` interface also incorrectly includes this property.
   - `getCoursesForPitch` (line 107) queries `sales_pitch_summary` and `sales_pitch_script`, which are not in the `courses` table (`schema.sql` lines 40-49).
   - `getCourseModules` (line 120) queries `modules m JOIN course_module_mapping cmm`, but `schema.sql` (lines 52-61) uses a single table `course_modules` with a `course_id` column.

## 2. Logic Chain
- **Resolving Integrity Violation:**
  - Update `getCRMAnalytics` in `src/lib/api/crm.ts` to derive actual funnel metrics using `SUM(CASE WHEN status = '...' THEN 1 ELSE 0 END)` for "Demo Scheduled" and "Demo Completed".
  - Compute real `chartData` by joining the `sales` and `courses` tables, grouping by `course_id`, and aggregating `total_fee` (Target Revenue) and `amount_paid` (Collected Revenue).
  - Update `SalesDashboard.tsx` state and UI to consume these newly provided actual metrics.

- **Resolving SQL Mismatches:**
  - `sales.ts:8`: Change `offer_expiry` to `offer_expiry_date` in the `INSERT INTO admissions` query.
  - `sales.ts:54`: Remove `referred_by_student_id` from the `INSERT INTO sales` query and from the `Sale` interface (line 76).
  - `sales.ts:83`: Change `ORDER BY created_at DESC` to `ORDER BY timestamp DESC`. Remove `referred_by_student_id` mapping.
  - `sales.ts:107`: Remove `sales_pitch_summary` and `sales_pitch_script` from the `SELECT` query.
  - `sales.ts:120`: Change the query to `SELECT title FROM course_modules WHERE course_id = ? ORDER BY order_index ASC`.

## 3. Caveats
- `SalesDashboard.tsx` contains a DateRange dropdown. Currently, `getCRMAnalytics()` does not support date filtering, so the UI filter will remain non-functional. Adding dynamic date filtering to the SQL queries is outside the immediate scope of fixing the integrity violation but should be considered in future iterations.

## 4. Conclusion
The implementation strategy should precisely target the SQL inconsistencies and dashboard derivations.

**Required Changes in `src/lib/api/sales.ts`:**
1. Fix `recordAdmission`:
   ```typescript
   sql: `INSERT INTO admissions (id, lead_id, amount, discount_locked, offer_expiry_date, expected_sale_date, status, referred_by_student_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
   ```
2. Fix `recordSale` (and `Sale` interface):
   ```typescript
   sql: `INSERT INTO sales (id, lead_id, admission_id, course_id, total_fee, amount_paid, status, sales_exec_id, payment_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
   // Also remove referred_by_student_id from args, Sale interface, and getSales mapping.
   ```
3. Fix `getSales` query:
   ```typescript
   const result = await client.execute("SELECT * FROM sales ORDER BY timestamp DESC");
   ```
4. Fix `getCoursesForPitch` query:
   ```typescript
   const result = await client.execute("SELECT id, title, description, price FROM courses ORDER BY created_at ASC");
   ```
5. Fix `getCourseModules` query:
   ```typescript
   sql: `SELECT title FROM course_modules WHERE course_id = ? ORDER BY order_index ASC`
   ```

**Required Changes in `src/lib/api/crm.ts` (`getCRMAnalytics`):**
Modify the queries to compute real metrics and chart data:
```typescript
const leadsRes = await client.execute(`
  SELECT 
    COUNT(*) as total_leads, 
    SUM(CASE WHEN status = 'Admission' THEN 1 ELSE 0 END) as active_admissions,
    SUM(CASE WHEN status = 'Demo Scheduled' THEN 1 ELSE 0 END) as demo_scheduled,
    SUM(CASE WHEN status = 'Demo Completed' THEN 1 ELSE 0 END) as demo_completed
  FROM crm_leads
`);

// ... existing revenue logic ...
const chartRes = await client.execute(`
  SELECT c.title as name, SUM(s.total_fee) as target, SUM(s.amount_paid) as collected 
  FROM sales s JOIN courses c ON s.course_id = c.id GROUP BY s.course_id
`);
const chartData = chartRes.rows.map(r => ({
  name: r.name, target: Number(r.target), collected: Number(r.collected)
}));
```

**Required Changes in `src/pages/crm/SalesDashboard.tsx`:**
Add `demoScheduled` and `demoCompleted` to `metrics` state, and map them to the corresponding UI funnel nodes. Replace `setChartData([])` with `setChartData(analytics.chartData)`.

## 5. Verification Method
1. Ensure the TS compiler passes (`npm run build` or `npx tsc`).
2. Run the application, create sample leads in different statuses, log dummy sales, and verify that the Sales Dashboard numbers align with the raw database state.
3. Validate that E2E tests handling CRM and Sales flows pass without SQL exceptions.
