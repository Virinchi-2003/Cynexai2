# Analysis Report: M3 (Routing & Roles)

## 1. Observation
- **`/admin` Route Security:** In `src/App.tsx`, the route for `/admin` (line 180) is currently defined as `<Route path="/admin" element={<MainLayout><AdminPanel /></MainLayout>} />`. It lacks the `RequireAuth` wrapper used by other protected routes.
- **DM Role Mismatch:** In `src/App.tsx` (lines 216-217), the DM routes (`/dm/dashboard` and `/dm/planner`) use `<RequireAuth allowedRoles={['Digital Marketer', 'Manager', 'CEO']}>`. However, `src/lib/auth.ts` defines the role type precisely as `'DM'` (line 5), not `'Digital Marketer'`, and initializes the DM test user with `role: 'DM'`.
- **Orphaned Pages:** A search through `src/pages` and cross-referencing imports in `src/App.tsx` revealed:
  - `src/pages/crm/manager/CourseMgmt.tsx` is imported in `App.tsx` (line 41) but never used in the route configurations. The app uses `src/pages/shared/CourseManagement.tsx` instead.
  - `src/pages/crm/manager/UserMgmt.tsx` is never imported or used anywhere in the codebase. The app uses `src/pages/crm/manager/UserManagement.tsx` instead.

## 2. Logic Chain
1. The `PROJECT.md` and `SCOPE.md` state that routes must be protected via authentication. The `/admin` route is missing this protection, making the `AdminPanel` exposed. It should be wrapped in `RequireAuth` specifying appropriate roles (e.g., `['Admin', 'CEO']`).
2. The `SCOPE.md` requires role checks to match the database value exactly. Since `RequireAuth` performs exact string matching, passing `'Digital Marketer'` will fail for users logged in with the `'DM'` role. The role string in `App.tsx` must be updated to match `'DM'`.
3. `CourseMgmt.tsx` and `UserMgmt.tsx` are legacy duplicates of existing shared or manager pages. They are completely unreferenced in the UI flow (dead code) and should be removed.

## 3. Caveats
- For the `/admin` route, I assumed `['Admin', 'CEO']` would be the logical authorized roles since `auth.ts` lists an `'Admin'` and `'CEO'` role, and other admin dashboard routes use `['CEO']`. If there's a strict requirement for only one role, it should be adjusted at implementation.
- I assumed the only orphaned pages within scope are those within the `pages/` directory that are clear duplicates of routing pages.

## 4. Conclusion
To complete Milestone M3, the following changes are required:
1. **App.tsx**: Wrap the `/admin` route with `<RequireAuth allowedRoles={['Admin', 'CEO']}>`.
2. **App.tsx**: Change `'Digital Marketer'` to `'DM'` in the `RequireAuth` wrappers for `/dm/dashboard` and `/dm/planner`.
3. **App.tsx**: Remove the unused import `import CourseMgmt from './pages/crm/manager/CourseMgmt';`.
4. **Filesystem**: Delete the files `src/pages/crm/manager/CourseMgmt.tsx` and `src/pages/crm/manager/UserMgmt.tsx`.

## 5. Verification Method
- Check that `/admin` correctly redirects to the login page when unauthenticated.
- Login as the DM user (defined in `auth.ts`) and verify access to `/dm/dashboard` succeeds.
- Check that the `npm run build` or the project build command succeeds without errors after deleting the orphaned files.
