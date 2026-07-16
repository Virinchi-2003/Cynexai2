# Scope: M6 Task Backend

## Architecture
- Backend code running on Vite with a Turso SQLite database.
- Schema is in `schema.sql`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M6_1_DB | Modify `schema.sql` (and write migration scripts) for subtasks, task dependencies, and rich filtering (tags, complex states). | none | DONE |
| 2 | M6_2_API | Implement API routes in `src/lib/api/tasks.ts` to support Kanban column updates (drag-and-drop state), calendar fetching (start/end dates), and subtask/dependency management. | M6_1_DB | DONE |

## Interface Contracts
- Task API must allow updating `status` and `due_date`.
- Must return `Task` objects including subtask data and dependencies.
