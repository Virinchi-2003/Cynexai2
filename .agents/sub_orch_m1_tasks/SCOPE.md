# Scope: M1: Task & Activity Tracking

## Architecture
- Module/package boundaries: Activity tracking UI (`src/pages/`, `src/components/`), API layer (`src/lib/api/`), Database schema (`schema.sql`).
- Must strictly use TDD (write failing tests in `tests/` or `src/` first before implementation).
- Use `cavecrew` skill for delegations.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1.1: DB Schema | Create tables/columns for tasks & activities linked to students/leads. | none | DONE |
| 2 | M1.2: API Endpoints | Create/read/update tasks and chronological activity history. | M1.1 | PLANNED |
| 3 | M1.3: UI Integration| Form to log activities and chronological history view in UI. | M1.2 | PLANNED |

## Interface Contracts
- Task/Activity must link to either a student (User) or a lead (CRMLead).
