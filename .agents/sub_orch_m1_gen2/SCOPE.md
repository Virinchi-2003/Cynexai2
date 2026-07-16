# Scope: M1 (Security Fixes)

## Architecture
- Frontend communicates with backend through `src/lib/api/` layer.
- No direct database queries (`client.execute`) are allowed in `.tsx` components.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1 | Remove `client.execute` from UI (e.g., `CEODashboard.tsx`, `StudentPortal.tsx`, `TeacherDashboard.tsx`); remove hardcoded passwords in `src/pages/crm/Login.tsx` | none | IN_PROGRESS |

## Interface Contracts
- Components must import API functions from `src/lib/api/` instead of executing SQL queries.
