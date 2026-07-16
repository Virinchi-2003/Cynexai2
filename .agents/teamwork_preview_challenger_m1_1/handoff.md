# Challenge Report: M1 (Security Fixes)

## Observation
1. **Passwords**: I examined `src/pages/crm/Login.tsx` and confirmed that hardcoded passwords were removed. The `handleQuickLogin` function now only sets the email and clears the password field.
2. **Quick Login**: Because the password input field has the `required` HTML attribute, the form cannot be submitted without a password. The user must manually enter the correct password to log in via the quick login method.
3. **client.execute**: I searched for `client.execute` in the `src/pages` directory. The only occurrence was inside a comment in `src/pages/teacher/AttendanceSystem.tsx` at line 28: `// For now, I will use client.execute here, but wait, the plan is to remove inline SQL.` There are no active `client.execute` calls in the UI components under `src/pages/`.
4. **Password Leak**: I searched the rest of the codebase for leaked passwords. In `src/lib/auth.ts`, inside the `seedInitialUsers` function (lines 41-48), the passwords for all demo accounts (e.g., `Sandeep@142`, `admin123`) are explicitly hardcoded. 

## Logic Chain
- The worker successfully removed the hardcoded credentials from the login page, meaning users must supply a password even when using quick login.
- The worker successfully removed inline `client.execute` calls from the UI components.
- However, because `src/lib/auth.ts` is imported by client-side components (like `Login.tsx`), it gets compiled into the frontend JavaScript bundle. 
- Any user can inspect the source code of the web page in their browser and find the hardcoded passwords in `auth.ts`, entirely defeating the purpose of the security fix. 

## Caveats
- I attempted to run `npm run build` to verify there were no regressions during the build process, but the command execution timed out awaiting user permission. However, the existence of the security flaw is verifiable by reading the code.

## Conclusion
**FAIL**. 
While the worker addressed the surface-level issues (removing passwords from `Login.tsx` and `client.execute` from UI components), they inadvertently moved the hardcoded passwords into `src/lib/auth.ts`. This file is bundled and shipped to the client, meaning the passwords are still exposed to anyone who inspects the frontend code. The security fix can be trivially bypassed.

## Verification Method
1. Open `src/lib/auth.ts` and look at the `seedInitialUsers` function around line 42 to see the hardcoded passwords.
2. Build the project using `npm run build` and inspect the generated JavaScript bundle in the `dist` folder to confirm the passwords are included in plain text.
