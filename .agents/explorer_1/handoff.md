# Handoff Report

## Observation
`src/lib/types.ts:17` — `CrmActivity` — Has `lead_id` but lacks `student_id` or a generic `entity_id`.
`src/lib/types.ts:132` — `Task` — Lacks `lead_id` or `student_id` fields (differs from `api/tasks.ts` version).
`src/lib/api/tasks.ts:4` — `Task` — Has `related_entity` field which acts as a generic linker, but lacks explicit `lead_id` or `student_id`.
`src/lib/api/tasks.ts:23` — `createTask` — Inserts `related_entity`, but no equivalent endpoint exists to fetch tasks by this field.
`src/lib/api/tasks.ts:57` — `getTasksForUser` — Fetches tasks only by `assignee_id`, not by linked lead or student.
`src/lib/api/crm.ts:77` — `getLeadActivities` — Fetches activities specifically for `lead_id`. No equivalent for students.
`src/lib/api/crm.ts:99` — `addActivity` — Adds activity specifically for `lead_id`. No equivalent for students.

## Logic Chain
1. To track tasks linked to students and leads (M1.2), we need a way to link them in the DB and query them.
2. The `Task` type in `api/tasks.ts` uses `related_entity`, but we lack a `getTasksByRelatedEntity` endpoint to display them on a lead or student profile.
3. The `CrmActivity` and its API endpoints only support `lead_id`. To support students, we must either add `student_id` to the type/table and create new endpoints (`getStudentActivities`, `addStudentActivity`), or refactor to use polymorphic `entity_id` and `entity_type`.
4. The `Task` type in `src/lib/types.ts` is outdated/conflicting with `src/lib/api/tasks.ts` and needs synchronization to include the linkage fields.

## Caveats
Did not check database schema directly, relying on TS interfaces and API SQL queries.

## Conclusion
The following API endpoints and changes are needed for M1.2:
1. `getTasksByEntity(entityId: string)` in `tasks.ts` (to fetch tasks for a specific lead or student via `related_entity`).
2. `getStudentActivities(studentId: string)` in `crm.ts` (or activities.ts).
3. `addStudentActivity(studentId, userId, type, content)` in `crm.ts`.
4. Reconcile `Task` interface in `types.ts` and `api/tasks.ts` to include `related_entity` (and optionally `entity_type`).
5. Update `CrmActivity` type (and potentially DB schema) to include `student_id`.

## Verification Method
Check `src/lib/api/tasks.ts` and `src/lib/api/crm.ts` to verify the lack of endpoints for fetching tasks by entity or activities for students.
