# Handoff Report: M3 Iteration 1 - Admin Redirect Loop

## 1. Observation
- In `src/components/layout/RequireAuth.tsx` lines 18-31, the fallback redirect logic for an authenticated user accessing a restricted route is:
  ```tsx
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If they are logged in but don't have permission, send them to their own dashboard
    if (user.role === 'Manager' || user.role === 'CEO') {
      return <Navigate to="/manager" replace />;
    } else if (user.role === 'Teacher') {
      return <Navigate to="/teacher" replace />;
    } else if (user.role === 'Student') {
      return <Navigate to="/student" replace />;
    } else if (user.role === 'DM') {
      return <Navigate to="/dm/dashboard" replace />;
    } else {
      return <Navigate to="/sales/pipeline" replace />;
    }
  }
  ```
- The `Admin` role is not explicitly handled in the `if/else if` chain.
- The default fallback is `<Navigate to="/sales/pipeline" replace />;`.
- In `src/App.tsx`, the `/sales/pipeline` route is wrapped in `SalesLayout`, which uses `<RequireAuth allowedRoles={['Sales/HR', 'Manager', 'CEO']}>`.
- The `/admin` route is available and allowed for `['Admin', 'CEO']`.

## 2. Logic Chain
- When a user with the `Admin` role tries to access a restricted route (e.g. `/student`), the condition `!allowedRoles.includes(user.role)` evaluates to true.
- The logic falls through the `if/else if` chain because `user.role` ('Admin') does not match 'Manager', 'CEO', 'Teacher', 'Student', or 'DM'.
- It hits the final `else` statement and redirects the `Admin` user to `/sales/pipeline`.
- `RequireAuth` then evaluates the new route `/sales/pipeline`, which allows only `['Sales/HR', 'Manager', 'CEO']`.
- Since 'Admin' is not in this allowed list, the process repeats: the Admin is redirected to `/sales/pipeline` again, resulting in an infinite redirect loop.
- By adding an explicit check for the `Admin` role to redirect them to `/admin`, the loop is broken and the Admin is sent to an allowed, appropriate dashboard.

## 3. Caveats
- No caveats. The fix directly addresses the described critical issue and relies entirely on existing role definitions and routes observed in `App.tsx` and `RequireAuth.tsx`.

## 4. Conclusion
- The infinite redirect loop is caused by the missing explicit condition for the `Admin` role in the restricted route fallback logic.
- **Fix Strategy**: 
  In `src/components/layout/RequireAuth.tsx`, add an `else if` condition for `Admin` right before the final `else` block:
  ```tsx
    } else if (user.role === 'Admin') {
      return <Navigate to="/admin" replace />;
  ```

## 5. Verification Method
- Make the code change to `src/components/layout/RequireAuth.tsx`.
- Attempt to log in with an `Admin` account and navigate to a restricted route (e.g. `/student`).
- Verify that the application redirects the user to `/admin` without triggering an infinite redirect error.
