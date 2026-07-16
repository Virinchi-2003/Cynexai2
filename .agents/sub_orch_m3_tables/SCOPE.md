# Scope: M3 Advanced Data Tables

## Architecture
- Backend communicates with frontend through `src/lib/api/` layer.
- No direct database queries (`client.execute`) are allowed in `.tsx` components.
- Routes are protected via authentication.
- Turso SQLite is the database (`schema.sql`).
- The Data Table component must support filtering, sorting, and inline editing without full page reloads.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M3: Advanced Data Tables | Backend & UI for customizable data tables (filter, sort, inline-edit) for Students & Users. | none | DONE |

## Interface Contracts
### `src/components/DataTable` ↔ `src/lib/api/`
- Data Table component accepts column definitions and data fetching hooks.
- Filter and sort state managed in UI and passed as parameters to API endpoints.
- Inline edit triggers a PATCH request to API endpoint and optimistic UI update.
