# Handoff: Curriculum Seeding & Test Infra Analysis

## Summary
The project requires setting up Vitest, parsing `Modules Data.xlsx` into `course_modules` and `course_classes`, and employing strict TDD. The database uses `@libsql/client` and a local SQLite DB (or in-memory) can be used for tests.

## 1. Observation
- **Excel File:** `Modules Data.xlsx` is at the root directory. It contains 8 sheets (`Python`, `AI`, `ML`, `SQL`, `Excel`, `SDLC`, `Power BI`, `Softskills`). Each sheet has headers (e.g., `Class`, `Topics`), where rows map to classes.
- **Database Schema (`schema.sql`):** 
  - `course_modules` table has: `id`, `course_id`, `title`, `instructor_id`, `order_index`, `created_at`.
  - `course_classes` table has: `id`, `module_id`, `title`, `description`, `type`, `order_index`, `status`, etc.
  - **No `course_module_mapping` table exists** in `schema.sql`. The relationship is a direct 1-to-many via `course_classes.module_id`.
- **Vitest Configuration:** `vitest` (`^4.1.9`) is in `devDependencies` within `package.json`. However, there is no `vitest.config.ts`, nor is there a `test` script defined in `package.json`.
- **Scope Directives:** `SCOPE.md` specifies strict TDD, interface `parseModules(filePath: string): ModuleData[]`, and organizing code into `scripts/seeding` and `tests/seeding`.

## 2. Logic Chain
1. **Test Infra:** Since Vitest is installed but unconfigured, the implementation must start by creating `vitest.config.ts` and adding `"test": "vitest"` to `package.json`.
2. **In-Memory Database:** The tests need an isolated DB. The `@libsql/client` allows `createClient({ url: ":memory:" })` or a local file DB. The test setup must read `schema.sql` from the root and execute it to create the necessary tables before seeding.
3. **Data Parsing:** `Modules Data.xlsx` should be read using the installed `xlsx` library. The `parseModules` function should map each sheet to a module and its rows to classes (mapping `Class` column to class `title` and `Topics` to `description`, with `type='video'` or similar default).
4. **Data Seeding & Wipe:** Wiping existing records requires executing `DELETE FROM course_classes; DELETE FROM course_modules;`. Since there's no `course_module_mapping`, we omit that.
5. **Foreign Key Constraint:** `course_modules` requires a `course_id`. The seeder will need a `course_id` passed to it, and tests must insert a dummy course into the `courses` table beforehand to prevent foreign key errors.

## 3. Caveats
- **Schema Discrepancy:** `SCOPE.md` asks to wipe `modules`, `classes`, and `course_module_mapping`. The actual DB tables are `course_modules` and `course_classes`, and the mapping table does not exist. The implementer must use the actual table names.
- **Course Requirement:** `course_modules` has a strict FK to `courses.id`. The tests must create a dummy `courses` record before inserting modules.

## 4. Conclusion & Implementation Strategy
To fulfill Milestones 1 and 2, the worker should execute the following strategy:

**Step 1: Test Infra Setup**
- Add `"test": "vitest"` to `package.json` and create a minimal `vitest.config.ts`.
- Create `tests/seeding/dbSetup.ts` that exports a helper to initialize an in-memory `@libsql/client` DB and applies `schema.sql`.

**Step 2: Failing Tests (TDD)**
- Create `tests/seeding/parser.test.ts` with assertions that `parseModules` extracts 8 modules and correct class lists from the Excel file.
- Create `tests/seeding/seeder.test.ts` to assert that `seedCurriculum(dbClient, parsedData, courseId)` deletes existing records in `course_classes` and `course_modules`, and successfully inserts the new data.

**Step 3: Implementation**
- Implement `scripts/seeding/parser.ts` using `xlsx` to pass `parser.test.ts`.
- Implement `scripts/seeding/seeder.ts` to execute the corresponding SQL `DELETE` and `INSERT` commands to pass `seeder.test.ts`.

## 5. Verification Method
- Run `npm run test` (or `npx vitest run`). All seeding and parsing tests should pass (Green).
- Inspect `tests/seeding/` to verify tests were written according to the described strategy and run against an isolated `@libsql/client` database.
