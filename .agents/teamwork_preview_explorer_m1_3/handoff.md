# Handoff: M1 (Security Fixes) Investigation

## 1. Observation
- **`client.execute` in UI Files**:
  I used powershell to scan all `.tsx` files in the `src/` directory for direct `client.execute` queries. The scan yielded direct usage in many UI files. Examples include:
  - `src/pages/crm/ceo/CEODashboard.tsx` (lines 20, 23): Calling `client.execute("SELECT id, referred_by_student_id, amount_paid FROM sales ...")` and `client.execute("SELECT SUM(salary)...")`.
  - `src/pages/student/StudentPortal.tsx` (line 37): Calling `client.execute("SELECT id, title FROM classes WHERE type = 'live' AND status = 'in_progress' LIMIT 1")`.
  - `src/pages/teacher/TeacherDashboard.tsx` (lines 30, 38, 56, 60, 65): Multiple inline queries such as `client.execute("SELECT * FROM timetables WHERE teacher_id = ?")`.
  - Other UI components doing this include: `ClassEditor.tsx`, `CourseManagement.tsx`, `ModuleEditor.tsx`, `TeacherCMS.tsx`, `LiveStreamDashboard.tsx`, etc.
  
- **Hardcoded Passwords**:
  I viewed `src/pages/crm/Login.tsx`.
  - On lines 7-12, the array `QUICK_LOGINS` hardcodes the password for various demo accounts: `password: 'admin123'` (and `Sandeep@142` for Sales).
  - On line 131, there is a visible hardcoded text: `<p>...Password for all demo accounts: <code>admin123</code></p>`.
  - On line 51, `handleQuickLogin` passes `cred.password` directly to the `login` function.

- **Current API Layer**:
  Listing `src/lib/api/` reveals files like `student.ts`, `teacher.ts`, `manager.ts`, etc. Reviewing `student.ts` shows it correctly abstracts queries into functions like `getStudentDashboardData(studentId)` using an internal `executeWithRetry` helper.

## 2. Logic Chain
- The scope (`SCOPE.md`) explicitly prohibits `.tsx` components from making direct database queries (`client.execute`).
- Observations show that several `.tsx` files directly import the Turso client and write raw SQL inline, violating architecture guidelines.
- Moving the data fetching logic to the established `src/lib/api/` layer will enforce separation of concerns, keep SQL queries backend-side, and make components cleaner and testable.
- The `QUICK_LOGINS` in `Login.tsx` poses a major security vulnerability by leaking active demo/production credentials (including a complex one: `Sandeep@142`) inside frontend code, which is easily visible in source control and client bundles.

## 3. Caveats
- Since there are over 20 `.tsx` files calling `client.execute`, migrating all of them will require extensive updates across multiple domains (Teacher, Student, CRM, CEO, Shared).
- Removing the hardcoded password functionality from the quick logins will alter the demo user experience, so the replacement behavior (e.g. pre-filling the email and asking for the password) needs to be communicated.

## 4. Conclusion
**Recommended Fix Strategy**:

1. **Relocate DB Operations to API Layer**:
   - Audit and extract every inline SQL query from `.tsx` components.
   - For each extracted query, create or update exportable async data-fetching functions in the appropriate `src/lib/api/` file (e.g., `api/ceo.ts`, `api/teacher.ts`). Use the `executeWithRetry` pattern found in `student.ts` for resilience.
   - Update the UI files to import these API layer functions, completely removing their dependency on the Turso database client (`client`).

2. **Eliminate Hardcoded Passwords**:
   - Modify `src/pages/crm/Login.tsx` by stripping the `password` field from the `QUICK_LOGINS` array.
   - Remove the `<code>admin123</code>` text element at line 131.
   - **Functional Update**: Instead of submitting the login immediately upon clicking a quick login button, update `handleQuickLogin` to populate the `email` input field in the main form, but leave the `password` input empty. This requires the demo user to type the password manually, preserving security while still accelerating the demo process.

## 5. Verification Method
- **Verify DB Operations**: Run `Get-ChildItem -Path src -Recurse -Filter *.tsx | Select-String -Pattern "client.execute"` locally. It should return 0 results. Check `src/lib/api/` to confirm that all queries were properly abstracted.
- **Verify Passwords**: Inspect `src/pages/crm/Login.tsx`. The strings `'admin123'` and `'Sandeep@142'` must not appear anywhere in the file.
- **Testing**: Start the dev server (`npm run dev`) and test navigating to the CEO dashboard, Student Portal, and Teacher dashboard to ensure data loads correctly via the API layer. Test the Quick Login buttons on the login page to verify they correctly pre-fill the email address without performing a login attempt.
