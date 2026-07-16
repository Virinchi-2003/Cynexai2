# Project: CynexAI CRM Features

## Architecture
- Frontend communicates with backend through `src/lib/api/` layer.
- No direct database queries (`client.execute`) are allowed in `.tsx` components.
- Routes are protected via authentication.
- Turso SQLite is the database (`schema.sql`).

## Interface Contracts
- Tasks & Activities: Must link to either a User (Student) or a CRMLead.
- CRM Pipeline: State transitions must persist.
- Data Tables: Must support sorting, filtering, and inline edits via API endpoints.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Task & Activity Tracking | Backend & UI for logging activities and scheduling tasks linked to students/leads. | none | DONE |
| 2 | M2: Sales/Lead Pipeline (Kanban) | Backend & UI for drag-and-drop Kanban board for enrollments. | none | DONE |
| 3 | M3: Advanced Data Tables | Backend & UI for customizable data tables (filter, sort, inline-edit) for Students & Users. | none | DONE |

## Code Layout
- UI Components: `src/pages/**/*.tsx`, `src/components/**/*.tsx`
- API Layer: `src/lib/api/**/*.ts`
- E2E Tests: `tests/e2e/*.spec.ts`
- Unit Tests: `src/**/*.test.ts`
