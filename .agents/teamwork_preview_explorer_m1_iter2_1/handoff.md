# Observation
1. The file `src/lib/auth.ts` contains the `seedInitialUsers` function (lines 35-60) which hardcodes 6 user accounts and their plaintext passwords (e.g., `Sandeep@142`, `admin123`).
2. The `seedInitialUsers` function is called directly within the `login` function in `src/lib/auth.ts` (line 63).
3. `src/lib/auth.ts` is imported by frontend components like `src/pages/crm/Login.tsx` (line 3). Consequently, the hardcoded passwords are still bundled and exposed to the client.
4. `src/lib/auth.ts` directly uses `client.execute` for database queries in both `seedInitialUsers` (lines 39, 50) and `login` (line 67) functions.
5. All `.tsx` UI components have successfully been cleared of direct `client.execute` calls. Only a harmless comment mentioning `client.execute` remains in `src/pages/teacher/AttendanceSystem.tsx` (line 28).

# Logic Chain
- Because `src/lib/auth.ts` is imported by `Login.tsx`, the Vite bundler includes the entirety of `auth.ts` in the frontend application. This means the `defaultUsers` array and its plaintext passwords are leaked to anyone inspecting the client-side JavaScript.
- Running seed logic (which requires hardcoded initial credentials) on every `login` attempt from the client is insecure and exposes sensitive data.
- The architecture specifies that "Frontend communicates with backend through `src/lib/api/` layer." However, `src/lib/auth.ts` (which acts as frontend state management for localStorage) directly executes SQL queries, violating this boundary.
- Moving the seed logic out of the frontend source tree (e.g., to a dedicated backend script) will completely prevent the passwords from being included in the client bundle.

# Caveats
- I did not check if removing auto-seeding on login breaks any existing E2E or unit tests. If automated tests rely on `seedInitialUsers` running dynamically when a user logs in, those test setups will need to be updated to invoke the new seed script before tests run.

# Conclusion
The hardcoded passwords were inadvertently retained in the frontend bundle because they were moved to `src/lib/auth.ts`. To securely fix this:
1. Create a strictly backend-only script (e.g., `scripts/seed.ts` at the root of the project) and move the `seedInitialUsers` logic there. This script should be run manually or in a CI/CD pipeline.
2. Completely remove `seedInitialUsers` and its invocation from `src/lib/auth.ts`.
3. To strictly follow the `src/lib/api/` architecture, move the `login` database query logic to `src/lib/api/auth.ts`, and have `src/lib/auth.ts` call that API function instead of using `client.execute` directly.

# Verification Method
1. Run `npm run build` and use `grep -r "Sandeep@142" dist/` to ensure the hardcoded passwords no longer appear in the compiled frontend bundle.
2. Verify `grep -r "client.execute" src/pages` returns no active code (except the known comment in `AttendanceSystem.tsx`).
3. Run `npm run test` (if tests exist) to ensure the separation of API and Auth logic doesn't introduce regressions.
