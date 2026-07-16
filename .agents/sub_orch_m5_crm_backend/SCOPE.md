# Scope: M5 CRM Backend

## Architecture
- Backend code running on Vite with a Turso SQLite database.
- Schema is in `schema.sql`. Make changes to it if necessary.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M5_1_DB | Modify `schema.sql` (and write migration scripts or setup script updates) for advanced CRM features (strict rules, etc.). Ensure `crm_leads`, `crm_activities`, `crm_stage_history` handle the logic. | none | DONE |
| 2 | M5_2_API | Implement API routes in `src/lib/api/crm.ts` (or similar) to enforce transition rules (e.g., rejecting moves that lack required activities) and fetch analytics for the dashboard. | M5_1_DB | IN_PROGRESS |

## Interface Contracts
- Provide a robust error if a lead transition fails strict rules (e.g., returning 400 Bad Request with a clear message).
- Dashboard API should provide dynamic counts (conversion rates, lead sources).
