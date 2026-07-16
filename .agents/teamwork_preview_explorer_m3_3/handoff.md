# M3 Investigation Report

## Observation
1. **Unsecured `/admin` route**: 
   - `src/App.tsx:180` contains the route definition: `<Route path="/admin" element={<MainLayout><AdminPanel /></MainLayout>} />`. 
   - It is not wrapped in `RequireAuth`.
2. **DM Role Mismatch**: 
   - `src/App.tsx:216-217` defines allowed roles as `['Digital Marketer', 'Manager', 'CEO']` for DM routes (`/dm/dashboard` and `/dm/planner`). 
   - However, `src/lib/auth.ts` defines the Role type as `... | 'CEO' | 'DM'` and seeds the mock user with `role: 'DM'`. `DMLayout` (App.tsx:131) also expects `['DM', 'Manager', 'CEO']`.
3. **Orphaned Pages and Unused Imports**:
   - The following files are completely unreferenced across the codebase:
     - `src/components/AboutUs.tsx`
     - `src/components/AdminLogin.tsx`
     - `src/components/BrochurePage.tsx`
     - `src/components/ApplyForm.tsx`
     - `src/pages/crm/manager/UserMgmt.tsx`
   - The following files are imported in `src/App.tsx` but are never used in any React component or Route:
     - `src/components/OurTeam.tsx`
     - `src/pages/crm/manager/CourseMgmt.tsx`
     - `src/pages/teacher/LiveClass.tsx`

## Logic Chain
- **Securing `/admin`**: To fulfill M3's "Secure `/admin` with `RequireAuth`", we must wrap the `<AdminPanel />` route in `RequireAuth`. Given that `/admin/dashboard` is protected by `['CEO']`, adding `allowedRoles={['CEO', 'Admin']}` (or similar) ensures proper RBAC.
- **Fixing DM role**: The discrepancy between `'Digital Marketer'` in the route definition and `'DM'` in the user's data model prevents DM users from accessing their routes. Updating the strings in `App.tsx` to match the data model (`'DM'`) resolves this bug.
- **Removing orphaned pages**: Deleting unused files and their corresponding dead imports in `App.tsx` cleans up the project and satisfies the milestone requirement.

## Caveats
- `AdminPanel` currently doesn't specify roles in the prompt's exact words, so relying on `['CEO', 'Admin']` is a reasonable assumption based on existing `/admin/dashboard` patterns.
- Ensure that removing imports in `App.tsx` doesn't inadvertently break the build if they were missed in the text search. The TypeScript compiler will catch any issues.

## Conclusion
To complete Milestone M3, the following changes should be implemented:
1. **Update `src/App.tsx` (Route Protection)**:
   Change `line 180` to:
   `<Route path="/admin" element={<RequireAuth allowedRoles={['Admin', 'CEO']}><MainLayout><AdminPanel /></MainLayout></RequireAuth>} />`
2. **Update `src/App.tsx` (Role Fix)**:
   Change `lines 216-217` to use `'DM'` instead of `'Digital Marketer'`:
   `<Route path="/dm/dashboard" element={<RequireAuth allowedRoles={['DM', 'Manager', 'CEO']}><DMLayout><DMDashboard /></DMLayout></RequireAuth>} />`
   `<Route path="/dm/planner" element={<RequireAuth allowedRoles={['DM', 'Manager', 'CEO']}><DMLayout><ContentPlanner /></DMLayout></RequireAuth>} />`
3. **Clean Up `src/App.tsx` (Imports)**:
   Remove imports for `OurTeam`, `CourseMgmt`, and `LiveClass`.
4. **Delete Orphaned Files**:
   Remove the 8 orphaned `.tsx` files listed in the Observations section.

## Verification Method
1. **Build & Test**: Run `npm run build` or the project's build command to ensure there are no missing imports or TS errors.
2. **Manual Test (Auth)**: Attempt to navigate to `/admin` while unauthenticated or as a Student. It should redirect to login or show an unauthorized message.
3. **Manual Test (DM Role)**: Log in as `dm@cynexai.com` (`admin123`) and verify access to `/dm/dashboard`.
4. **Inspect Filesystem**: Confirm the 8 orphaned files no longer exist.
