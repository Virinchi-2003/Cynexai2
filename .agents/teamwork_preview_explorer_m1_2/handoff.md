# M1 Security Fixes Investigation Handoff

## Observation
- Using the command `Get-ChildItem -Path ...\src -Recurse -Filter *.tsx | Select-String -Pattern "client.execute"`, I located direct `client.execute` calls in 20 UI files under `src/pages/`.
- Key files examined include:
  - **`src/pages/crm/ceo/CEODashboard.tsx`**: (Lines 20, 23) contains `client.execute("SELECT id, referred_by_student_id, amount_paid FROM sales...")` inside a `React.useEffect`.
  - **`src/pages/student/StudentPortal.tsx`**: (Lines 37) contains `client.execute("SELECT id, title FROM classes WHERE type = 'live'...")` inside a polling function.
  - **`src/pages/teacher/TeacherDashboard.tsx`**: (Lines 30, 38, 56, 60, 65) contains queries like `client.execute({ sql: "SELECT * FROM timetables WHERE teacher_id = ?", args: [user?.id || ''] })`.
  - Other affected files: `AdminDashboard.tsx`, `LeadPipeline.tsx`, `SalesPitchPage.tsx`, `ApprovalDashboard.tsx`, `GlobalTaskManager.tsx`, `OnboardingFlow.tsx`, `UserMgmt.tsx`, `ClassEditor.tsx`, `CourseManagement.tsx`, `ModuleEditor.tsx`, `ClassFlow.tsx`, `ModuleMap.tsx`, `AttendanceSystem.tsx`, `LiveStreamDashboard.tsx`, `PresentationView.tsx`, `TeacherCMS.tsx`, `TeacherTimetable.tsx`.
- In **`src/pages/crm/Login.tsx`**:
  - Lines 7-12 contain a `QUICK_LOGINS` array with hardcoded plain-text passwords: e.g., `password: 'admin123'` and `password: 'Sandeep@142'`. 
  - Line 131 explicitly displays: `Password for all demo accounts: admin123`.

## Logic Chain
1. The `SCOPE.md` architecture constraints explicitly state: "No direct database queries (`client.execute`) are allowed in `.tsx` components" and "Components must import API functions from `src/lib/api/` instead of executing SQL queries."
2. The presence of `client.execute` in the observed React components directly violates this architectural rule by mixing data-access logic with UI logic.
3. These queries must be encapsulated into modular API functions in `src/lib/api/` (e.g., `student.ts`, `teacher.ts`, `ceo.ts`) to maintain a secure and clean boundary.
4. Hardcoded passwords in `Login.tsx` are a critical security vulnerability and violate the M1 milestone objectives. They must be removed from the frontend code.

## Caveats
- I did not inspect the exact SQL queries in all 20 affected files; I only confirmed the presence of `client.execute`. The implementer will need to systematically extract and parameterize all SQL queries individually across these files.
- The `QUICK_LOGINS` feature in `Login.tsx` appears to be a developer/demo convenience. Completely removing it or removing the password will mean testers must manually type the password. The team should align on whether to pre-fill just the email or use environment variables for demo accounts.

## Conclusion
To fulfill Milestone M1, implement the following concrete fix strategy:
1. **Refactor DB Operations**: For all 20 `.tsx` files in `src/pages/`, extract the SQL logic into corresponding API domain files under `src/lib/api/` (e.g., `api/ceo.ts`, `api/student.ts`, `api/teacher.ts`). Create new files if the domain doesn't exist yet.
2. **Update UI Components**: Replace `client.execute` calls in the `.tsx` components with the newly created async API functions. Remove the import of `client` and `isTursoConfigured` from `../../lib/turso` in all UI components.
3. **Remove Hardcoded Credentials**: In `src/pages/crm/Login.tsx`, remove the `password` properties from the `QUICK_LOGINS` array. Update `handleQuickLogin` to either prompt for a password or only pre-fill the email address to require manual password entry. Remove the plaintext password hint on line 131.

## Verification Method
- **File Inspection**: Run `Get-ChildItem -Path C:\Users\kk\.gemini\antigravity\scratch\cynexai-website\src\pages -Recurse -Filter *.tsx | Select-String -Pattern "client.execute"`. It should return **no results**.
- **Credential Check**: Inspect `src/pages/crm/Login.tsx` to verify that `password: '...'` does not exist anywhere in the file.
- **Functionality**: Start the development server (`npm run dev`) and verify that the dashboards (CEO, Student, Teacher) load their data correctly via the API layer, and the login flow works securely.
