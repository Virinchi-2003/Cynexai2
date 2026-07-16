# Synthesis Report: Test Infra Setup & Curriculum Seeding

## Consensus
1. **Test Infra**: `vitest` is installed but needs configuration (`vitest.config.ts`) and a `"test": "vitest"` script in `package.json`. Tests should use an in-memory `@libsql/client` initialized with the schemas for `modules`, `classes`, and `course_module_mapping`.
2. **Database Schema**: The authoritative schema definition is in `src/lib/turso.ts` (specifically `modules`, `classes`, and `course_module_mapping`). `schema.sql` at root has older table names. We must strictly target the tables specified in the prompt (`modules`, `classes`, `course_module_mapping`).
3. **Parsing Strategy**: Use the installed `xlsx` library to read `Modules Data.xlsx`. The function `parseModules(filePath)` should return an array of modules, each containing its associated classes.
4. **Seeding Strategy**: Execute `DELETE FROM classes; DELETE FROM course_module_mapping; DELETE FROM modules;` before inserting the parsed data to ensure idempotent seeding.
5. **TDD Workflow**: We MUST write failing tests first (`tests/seeding/parser.test.ts` and `tests/seeding/seeder.test.ts`) before implementing the actual logic in `scripts/seeding/parser.ts` and `scripts/seeding/seeder.ts`.

## Implementation Plan for Worker
1. **Setup**: Create `vitest.config.ts` and a `tests/seeding/setup.ts` file to initialize the in-memory SQLite DB using `@libsql/client`.
2. **Phase 1 (Parser - Red-Green-Refactor)**: 
   - Write failing tests for `parseModules` in `tests/seeding/parser.test.ts`.
   - Implement `scripts/seeding/parser.ts` to make tests pass.
3. **Phase 2 (Seeder - Red-Green-Refactor)**:
   - Write failing tests for DB wipe and insert logic in `tests/seeding/seeder.test.ts`.
   - Implement `scripts/seeding/seeder.ts` to make tests pass.
4. **Verification**: Run `npm run test` or `npx vitest run` to ensure everything works correctly.
