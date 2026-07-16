# Handoff: M3 Investigation & Fix Strategy

## Observation
1. **Infinite Redirect Loop (`RequireAuth.tsx`)**: In `src/components/layout/RequireAuth.tsx:20-30`, the fallback logic routes unauthorized users based on their role. If `user.role === 'Admin'`, it falls through to the `else` block: `return <Navigate to="/sales/pipeline" replace />;`. However, the `/sales/pipeline` route in `App.tsx:182` is wrapped in `SalesLayout`, which only allows `['Sales/HR', 'Manager', 'CEO']`. Since `Admin` is not permitted, it triggers `RequireAuth` again, causing an infinite redirect loop.
2. **Login Fallback Missing Admin**: In `src/pages/crm/Login.tsx:31-36`, successful login logic for `Admin` is missing. It falls through to the `else navigate('/sales/pipeline');` block, resulting in the same redirect issue.
3. **DM Role Mismatch**: In `src/lib/auth.ts:5`, the `Role` type is defined as `'DM'`. It is also seeded as `'DM'` on line 45. However, `SCOPE.md` states "Role checks for Digital Marketer must match the database value exactly", implying the string `'Digital Marketer'` must be used instead of `'DM'`. References to `'DM'` also exist in `App.tsx:128`, `Login.tsx:33`, and `RequireAuth.tsx:26`.
4. **Orphaned Pages**: A search of the codebase imports confirms that `src/pages/crm/forms/AdmissionForm.tsx`, `src/pages/crm/forms/SaleForm.tsx`, and `src/pages/crm/forms/SalesPitchModal.tsx` exist but are entirely unreferenced.
5. **`/admin` Route**: The `/admin` route in `App.tsx:177` is already secured with `RequireAuth allowedRoles={['Admin', 'CEO']}`.

## Logic Chain
1. To fix the infinite redirect loop, `RequireAuth.tsx` must explicitly handle the `Admin` role in its fallback block. Redirecting `Admin` to `/admin` resolves the loop because `/admin` is explicitly allowed for the `Admin` role.
2. Similarly, `Login.tsx` must be updated to route `Admin` to `/admin` upon successful login.
3. To resolve the DM role mismatch, the string `'DM'` should be completely replaced with `'Digital Marketer'` across the frontend codebase to align with the database. This includes the `Role` type definition and seed data in `auth.ts`, the `RequireAuth.tsx` fallback, `Login.tsx` routing, and the `DMLayout` in `App.tsx`.
4. The three form files in `src/pages/crm/forms/` are orphaned pages and should be deleted to clean up the repository.

## Caveats
- It is assumed that `/admin` (the Blog Management Admin Panel) is the intended fallback for the `Admin` role. There is another route `/admin/dashboard` in `App.tsx` which is restricted to `CEO` only. If the `Admin` should have access to `/admin/dashboard` instead, `App.tsx` must be updated to include `Admin` for that route, and the fallbacks should point to `/admin/dashboard`.
- It is assumed that the DB value is exactly `'Digital Marketer'` based on the instructions. 

## Conclusion
A complete fix strategy for M3 involves:
1. **Routing Logic (Loop Fix)**: Update `RequireAuth.tsx` and `Login.tsx` to explicitly navigate `Admin` users to `/admin`.
2. **Role Standardization**: Refactor all instances of `'DM'` to `'Digital Marketer'` in `src/lib/auth.ts`, `src/App.tsx`, `src/components/layout/RequireAuth.tsx`, and `src/pages/crm/Login.tsx`.
3. **Cleanup**: Delete the orphaned form components in `src/pages/crm/forms/` (`AdmissionForm.tsx`, `SaleForm.tsx`, `SalesPitchModal.tsx`).

## Verification Method
- Make the proposed code changes and run `npm run build` to verify there are no TypeScript compilation errors.
- Test the fallback by modifying the `QUICK_LOGINS` array in `Login.tsx` to set a user with `role: 'Admin'`, click login, and verify it navigates to `/admin` successfully instead of crashing the browser with a redirect loop.
- Use `find_by_name` or `grep_search` to verify that `'DM'` is fully eradicated from role checks.
