# Scope: M2: Sales/Lead Pipeline (Kanban)

## Architecture
- Module/package boundaries: Kanban Board UI (`src/pages/`, `src/components/`), API layer (`src/lib/api/`), Database schema (`schema.sql`).
- Must strictly use TDD (write failing tests first before implementation).
- Use `cavecrew` skill for delegations.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M2.1: Kanban State | DB schema & API for Lead stages and state persistence. | none | DONE |
| 2 | M2.2: Kanban UI | Drag-and-drop board UI for enrollments (e.g. Lead, Contacted, Enrolled). | M2.1 | DONE |

## Interface Contracts
- `CRMLead` transitions logic should be in the API layer and tested.
