# Handoff: Fix Strategy for Admin Redirect Loop

## 1. Observation
- In `src/components/layout/RequireAuth.tsx` (lines 19-31), the fallback redirect logic specifies dashboards for `Manager`, `CEO`, `Teacher`, `Student`, and `DM`, but defaults all other roles to `/sales/pipeline`:
  ```tsx
  // ...
  } else if (user.role === 'DM') {
    return <Navigate to="/dm/dashboard" replace />;
  } else {
    return <Navigate to="/sales/pipeline" replace />;
  }
  ```
- In `src/App.tsx`, the `/sales/pipeline` route is wrapped in `SalesLayout`, which restricts access to specific roles:
  ```tsx
  const SalesLayout = ({ children }: { children: React.ReactNode }) => (
    <RequireAuth allowedRoles={['Sales/HR', 'Manager', 'CEO']}>
      <CRMLayout>{children}</CRMLayout>
    </RequireAuth>
  );
  ```
- In `src/App.tsx`, the `/admin` route is available and specifically allows the `Admin` role:
  ```tsx
  <Route path="/admin" element={<RequireAuth allowedRoles={['Admin', 'CEO']}><MainLayout><AdminPanel /></MainLayout></RequireAuth>} />
  ```

## 2. Logic Chain
1. When an `Admin` user navigates to an unauthorized route (e.g. `/student`), `RequireAuth` intercepts the request since `Admin` is not permitted.
2. The `RequireAuth` fallback logic is triggered, but since there is no specific condition for `user.role === 'Admin'`, the logic falls through to the `else` block.
3. The `else` block redirects the `Admin` user to `/sales/pipeline`.
4. The router attempts to load `/sales/pipeline`, which is protected by `SalesLayout`.
5. `SalesLayout` executes `RequireAuth` with `allowedRoles={['Sales/HR', 'Manager', 'CEO']}`.
6. `Admin` is not in that list, so `RequireAuth` rejects the user, triggering the fallback logic again.
7. The fallback logic again drops into the `else` block, redirecting to `/sales/pipeline`, resulting in an infinite redirect loop.
8. By adding an explicit redirect for `Admin` to `/admin` (a route they are allowed to access), the loop will be broken.

## 3. Caveats
No caveats. The findings from the codebase exactly match the failure report, and `/admin` is verified to be the correct valid dashboard for the Admin role. 

## 4. Conclusion
The infinite redirect loop is caused by `Admin` users falling through to a default redirect (`/sales/pipeline`) that they do not have permission to access. The fix is to add an explicit handler in the fallback logic of `src/components/layout/RequireAuth.tsx` for the `Admin` role, redirecting them to `/admin`.

**Proposed Change in `src/components/layout/RequireAuth.tsx`:**
```tsx
  // ...
  } else if (user.role === 'DM') {
    return <Navigate to="/dm/dashboard" replace />;
  } else if (user.role === 'Admin') {
    return <Navigate to="/admin" replace />;
  } else {
    return <Navigate to="/sales/pipeline" replace />;
  }
```

## 5. Verification Method
1. Apply the proposed change to `src/components/layout/RequireAuth.tsx`.
2. Start the development server (e.g., `npm run dev`).
3. Log in as an Admin user.
4. Manually navigate to a restricted URL (e.g. `/student`).
5. Verify that you are correctly redirected to `/admin` and the app does not freeze or crash due to maximum update depth / infinite redirects.
