# M6 Task Backend - Explorer Report

## 1. Observation

**Database Schema (`schema.sql`)**
- The `tasks` table currently has `id, title, description, assignee_id, created_by, priority, due_date, status, task_type, target_number, current_number, related_entity, created_at, updated_at`.
- The `status` column has a strict `CHECK(status IN ('To Do', 'In Progress', 'Review', 'Done'))`.
- `task_subtasks` exists with `id, task_id, title, status, created_at`. 
- No `tags`, `start_date`, or dependency tables exist.
- Found `migrate_schema.js` which successfully implements SQLite check-constraint removal by using `PRAGMA foreign_keys=off;`, creating a new table without the constraint, copying data, and replacing the old table.

**API Structure (`src/lib/api/tasks.ts`)**
- Uses `@libsql/client` (Turso).
- Supports basic CRUD for tasks, subtasks (`addSubtask`, `getTaskSubtasks`, `updateSubtaskStatus`), and comments.
- Does not support querying by date range (only sorting by `due_date`), task dependencies, tags, or start dates.

## 2. Logic Chain

- **Complex States (Kanban)**: To support arbitrary Kanban columns without breaking existing data, the `status` column's `CHECK` constraint must be removed. SQLite doesn't support `ALTER TABLE DROP CONSTRAINT`. Following the established pattern in `backend/migrate_schema.js`, we must re-create the `tasks` table without the constraint.
- **Dates**: We need a `start_date` column alongside `due_date` to support Calendar ranges. Adding `ALTER TABLE tasks ADD COLUMN start_date TEXT` is required (or just including it in the recreated table).
- **Tags**: Adding `tags TEXT` allows storing a JSON string array or comma-separated values, which is easily managed by SQLite/Turso.
- **Dependencies**: A new `task_dependencies` junction table is required with foreign keys to `tasks(id)`.
- **API Support**: 
  - `Task` interface needs `start_date` and `tags`.
  - Kanban API needs no new routes if we drop the DB constraint; `updateTaskStatus` will natively accept custom kanban column names.
  - Calendar API needs a method to fetch tasks bounded by `start_date` and `due_date` (or just bounded by dates).
  - Dependency API needs create/read/delete methods for `task_dependencies`.

## 3. Caveats

- Recreating the `tasks` table will drop existing triggers or indexes on the table if they aren't also recreated (none observed in `schema.sql`).
- During the `tasks` table recreation, `PRAGMA foreign_keys=off;` must be used strictly in the migration script, and re-enabled afterward.
- `tags` as `TEXT` means the API layer must handle `JSON.stringify()` on save and `JSON.parse()` on read.

## 4. Conclusion

**Actionable Plan for the Implementer:**

1. **Modify `schema.sql`:**
   - Update `tasks` table definition: remove `CHECK(status IN ...)` constraint on `status`. Add `tags TEXT` and `start_date TEXT`.
   - Add new table definition:
     ```sql
     CREATE TABLE IF NOT EXISTS task_dependencies (
         id TEXT PRIMARY KEY,
         task_id TEXT NOT NULL,
         depends_on_id TEXT NOT NULL,
         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
         FOREIGN KEY (depends_on_id) REFERENCES tasks(id) ON DELETE CASCADE
     );
     ```

2. **Create `migrate_m6.js` (in `src/scripts/` or project root):**
   - Execute `PRAGMA foreign_keys=off;`
   - `CREATE TABLE tasks_new` (with `tags`, `start_date`, and no `status` constraint).
   - `INSERT INTO tasks_new SELECT *, NULL as tags, NULL as start_date FROM tasks;`
   - `DROP TABLE tasks;`
   - `ALTER TABLE tasks_new RENAME TO tasks;`
   - `PRAGMA foreign_keys=on;`
   - Execute `CREATE TABLE IF NOT EXISTS task_dependencies...`

3. **Modify API (`src/lib/api/tasks.ts`):**
   - **Interface**: Add `start_date?: string; tags?: string;` to `Task` interface.
   - **Calendar**: Add `getTasksByDateRange(startDate: string, endDate: string)` method.
   - **Dependencies**: Add `addTaskDependency(taskId, dependsOnId)`, `removeTaskDependency(dependencyId)`, and `getTaskDependencies(taskId)`.
   - **Subtasks**: Add `deleteSubtask(subtaskId)` and generic `updateSubtask(subtaskId, updates)`.
   - **Update createTask**: include `start_date` and `tags` in the INSERT query.

## 5. Verification Method

- **DB Check**: Run `migrate_m6.js`. Open a local Turso/SQLite shell and run `.schema tasks`. Ensure `tags` and `start_date` exist, and `status` has no `CHECK` constraint. Run `.schema task_dependencies` to ensure the table exists.
- **API Check**: Build the frontend (`npm run build` or `npx tsc`) to ensure `tasks.ts` type-checks correctly with the new methods and `Task` properties.
