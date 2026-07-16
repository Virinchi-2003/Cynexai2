# Handoff: Admin Infinite Redirect Loop Fix Strategy

## 1. Observation
- `src/components/layout/RequireAuth.tsx:18-31` contains the fallback routing logic when an authenticated user navigates to a restricted route.
- The fallback logic explicitly handles `Manager`, `CEO`, `Teacher`, `Student`, and `DM`, but defaults to returning `<Navigate to="/sales/pipeline" replace />` in the `else` block for any other roles.
- `src/lib/auth.ts:4` lists the valid roles as: `'Admin' | 'Manager' | 'Sales/HR' | 'Teacher' | 'Student' | 'CEO' | 'DM'`.
- `src/App.tsx:182` defines the `/sales/pipeline` route wrapped in `<SalesLayout>`, which requires `['Sales/HR', 'Manager', 'CEO']` roles.
- `src/App.tsx:177` defines the `/admin` route which is allowed for `['Admin', 'CEO']`.

## 2. Logic Chain
1. When an `Admin` user tries to access a restricted route (e.g., `/student`), `RequireAuth` rejects them because they are not in the `allowedRoles`.
2. The fallback logic executes. Since `Admin` is not explicitly matched in the `if/else if` blocks, they fall into the `else` block.
3. The `else` block redirects them to `/sales/pipeline`.
4. When navigating to `/sales/pipeline`, the `RequireAuth` wrapper for `SalesLayout` executes, checking if `Admin` is in `['Sales/HR', 'Manager', 'CEO']`.
5. `Admin` is not in this list, so they are rejected again.
6. The fallback logic executes again, sending them to the `else` block, which redirects to `/sales/pipeline`.
7. This repeats infinitely, causing a redirect loop.
8. By adding an explicit `else if (user.role === 'Admin')` block that redirects to `/admin` (a route they have access to), the loop will be broken.

## 3. Caveats
- No caveats. The routing logic in `App.tsx` explicitly provides an `/admin` route that is appropriate for the `Admin` role.

## 4. Conclusion
Add an explicit check for the `Admin` role in `src/components/layout/RequireAuth.tsx` to redirect them to `/admin`. The `else` block will then correctly apply only to the `Sales/HR` role.

Proposed change in `src/components/layout/RequireAuth.tsx`:
```tsx
    } else if (user.role === 'DM') {
      return <Navigate to="/dm/dashboard" replace />;
    } else if (user.role === 'Admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/sales/pipeline" replace />;
    }
```

## 5. Verification Method
1. Modify `src/components/layout/RequireAuth.tsx` as proposed.
2. Log in as a user with the `Admin` role.
3. Manually navigate to a restricted URL (e.g., `/student` or `/manager`).
4. Observe that the user is safely redirected to `/admin` without causing a redirect loop or crashing the browser.
