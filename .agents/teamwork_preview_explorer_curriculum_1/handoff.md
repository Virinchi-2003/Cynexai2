# Handoff Report: Curriculum Seeding Test Infra & Implementation Strategy

## Observation
1. **Scope & Codebase**: The project requires setting up Vitest, testing a parser for `Modules Data.xlsx` (8 sheets, rows as classes), wiping specific tables (`modules`, `classes`, `course_module_mapping`), and seeding the DB using `@libsql/client`.
2. **Current State**:
   - `vitest` is installed in `package.json` but no `vitest.config.ts` is configured for Node tests.
   - The root project has `xlsx` and `@libsql/client` installed.
   - A Python script `backend/seed_from_excel.py` currently drops/recreates tables and seeds from the Excel file, confirming the schema structure and relationships.
   - The DB schema for the seeder expects:
     - `modules` (id, title, description, instructor_id, created_at)
     - `course_module_mapping` (course_id, module_id, order_index)
     - `classes` (id, module_id, title, description, youtube_video_id, meet_link, type, status, order_index, created_at)

## Logic Chain
- To satisfy Milestone 1, we need to create `vitest.config.ts` configured for the Node environment.
- Since we need to test `@libsql/client`, we should use a local in-memory SQLite database (`file::memory:`) in tests. The test setup must manually create the required tables before running seeder tests.
- For TDD (Milestone 2), we need a strict Red-Green-Refactor approach. The tests (`tests/seeding/parser.test.ts` and `tests/seeding/seeder.test.ts`) must be written and verify failure before implementing `scripts/seeding/parser.ts` and `scripts/seeding/seeder.ts`.
- The parser must use the `xlsx` package to read `Modules Data.xlsx` sheets, extracting row data mapping it to the `ModuleData` interface.
- The seeder must first issue `DELETE FROM classes`, `DELETE FROM course_module_mapping`, and `DELETE FROM modules` to wipe existing mocked records, then `INSERT` the newly parsed data.

## Caveats
- The python script `backend/seed_from_excel.py` drops and recreates tables entirely, but the `SCOPE.md` specifically requests to *wipe* (i.e. `DELETE FROM`) existing mocked records rather than dropping tables.
- A dummy Excel file (or programmatic creation of one via `xlsx`) will be needed in the tests to keep the parser test deterministic without relying on the actual `Modules Data.xlsx`.
- Testing `@libsql/client` against `:memory:` is sufficient for standard SQL logic, but ensure foreign key constraints (if any) are properly toggled or handled during the deletion process.

## Conclusion
**Implementation Strategy:**
1. **Test Setup**: Create `vitest.config.ts` excluding `tests/e2e`. Create `tests/seeding/setupDb.ts` to spin up a `@libsql/client` with `file::memory:` and a function to run `CREATE TABLE` queries mimicking the production schema for `modules`, `classes`, `course_module_mapping`.
2. **Phase 1: Parser (TDD)**:
   - Create `tests/seeding/parser.test.ts`. Programmatically create a tiny in-memory Excel file using `xlsx` to act as a test double.
   - Write tests expecting `parseModules(path)` to return strongly-typed `ModuleData[]`.
   - Implement `scripts/seeding/parser.ts` until tests pass.
3. **Phase 2: Seeder (TDD)**:
   - Create `tests/seeding/seeder.test.ts`. Insert mock data into the `:memory:` tables.
   - Assert that `seedCurriculum(db, parsedData)` first zeroes out `classes`, `course_module_mapping`, and `modules`.
   - Assert that it correctly inserts new records.
   - Implement `scripts/seeding/seeder.ts` until tests pass.

## Verification Method
- Run `npx vitest tests/seeding --run` to verify tests pass after implementation.
- Check that `scripts/seeding/parser.ts` and `scripts/seeding/seeder.ts` are cleanly separated and written after the tests.
