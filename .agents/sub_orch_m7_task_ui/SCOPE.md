# Scope: M7 Task UI

## Architecture
- React + Vite + Tailwind CSS.
- Fetch tasks via `src/lib/api/tasks.ts`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M7_1_Components | Build the basic Kanban column views, List views, and Calendar views using `@hello-pangea/dnd` and `react-big-calendar`. Add UI for Subtasks. | none | PLANNED |
| 2 | M7_2_Integration | Integrate these views into a unified Task Hub replacing existing Task pages. Wire up API calls (drag-and-drop state update, fetch by date for calendar). | M7_1_Components | PLANNED |

## Interface Contracts
- Must not directly query the DB. Use the updated methods from `tasks.ts`.
- Must route correctly from the Sidebar (e.g. unified "Task Hub").
