# Original User Request

## Initial Request — 2026-07-07T01:41:00+05:30

# Mission
Build a production-ready, highly advanced "Asana-level" Task Manager and an advanced CRM, drawing inspiration from industry standards and existing open-source repositories.

Working directory: `C:\Users\kk\.gemini\antigravity\scratch\cynexai-website`
Integrity mode: development

## Requirements

### R1. Advanced Task Manager (Asana-level)
Replace the current basic task board with an advanced task management interface. Features must include Kanban boards (drag-and-drop), list views, calendar views, rich filtering, and complex subtask/dependency management. You must use established open-source libraries like `@hello-pangea/dnd` for drag-and-drop and `react-big-calendar` for robust calendar views.

### R2. Advanced CRM
Upgrade the existing CRM pipeline to an advanced standard. Features must include a robust lead management pipeline with drag-and-drop stage transitions (with backend strict rule enforcement), automated activity logging, follow-up scheduling, and comprehensive analytics dashboards.

### R3. Codebase Integration
Integrate these new advanced UI components and state management with the existing CynexAI Vite/React codebase and Turso SQLite backend. Ensure routing (e.g., removing any duplicate task tabs in favor of a unified Task Hub) is clean and role-based access is strictly maintained.

## Acceptance Criteria

### Task Manager UI
- [ ] Code builds without errors and dependencies (`@hello-pangea/dnd`, `react-big-calendar`) are correctly installed and integrated.
- [ ] Users can switch seamlessly between Kanban, List, and Calendar views for tasks.
- [ ] Tasks can be dragged and dropped across status columns in the Kanban view, updating the backend state upon drop.

### CRM Upgrades
- [ ] Leads can be dragged and dropped between pipeline stages, subject to strict backend validation (e.g. rejecting moves that lack required activities).
- [ ] CRM includes a visual analytics dashboard calculating metrics like conversion rates and lead sources dynamically from the DB.

Your working directory is C:\Users\kk\.gemini\antigravity\scratch\cynexai-website\.agents\orchestrator_task_manager
Write your plans to plan.md, progress to progress.md, and context to context.md within your working directory.
When you are completely finished with all acceptance criteria, reply to me and explicitly claim victory.
