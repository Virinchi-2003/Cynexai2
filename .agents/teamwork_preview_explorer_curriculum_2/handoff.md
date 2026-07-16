# Handoff Report: Curriculum Seeding & Test Infra

## 1. Observation
- **Excel File:** Found `Modules Data.xlsx` in the project root (`C:\Users\kk\.gemini\antigravity\scratch\cynexai-website\Modules Data.xlsx`). The `xlsx` package (`^0.18.5`) is already present in `package.json`.
- **Database Schema:** The tables `modules`, `classes`, and `course_module_mapping` are defined in `src/lib/turso.ts` (lines 666-694) inside `initTursoDB()`. Notably, `schema.sql` at root has older/differently named tables (`course_modules`, `course_classes`), but the prompt specifies targeting the ones found in `turso.ts`.
- **Vitest Configuration:** `vitest` (`^4.1.9`) is installed, but there is no `vitest.config.ts` or `vitest.config.js`. The `vite.config.ts` does not contain a `test` property.
- **Code Layout:** The required directories (`scripts/seeding` and `tests/seeding`) specified in `SCOPE.md` do not exist yet. 

## 2. Logic Chain
1. **Test Infra:** Since `vitest` is missing configuration, the first step must be to either update `vite.config.ts` to include `vitest` settings or create a dedicated `vitest.config.ts`. To support in-memory SQLite for testing `@libsql/client`, a test setup file is needed to instantiate `createClient({ url: ":memory:" })` and run the table creation queries from `turso.ts`.
2. **Excel Parsing Strategy:** The prompt specifies parsing 8 sheets into 8 Modules. We must write a failing test in `tests/seeding/parser.test.ts` that asserts `parseModules('Modules Data.xlsx')` correctly outputs an array of structured `ModuleData`. Only then should `scripts/seeding/parser.ts` be implemented using the `xlsx` library.
3. **Database Seeding Strategy:** For wiping existing mocked records before inserting, a failing test in `tests/seeding/seeder.test.ts` should assert that `modules`, `classes`, and `course_module_mapping` are empty before new records are inserted. The implementation in `scripts/seeding/seeder.ts` will then need to execute `DELETE FROM <table_name>;` queries prior to insertion.

## 3. Caveats
- `schema.sql` and `src/lib/turso.ts` contain overlapping/conflicting schemas for courses and modules. The implementation should rely strictly on the `turso.ts` definitions (`modules`, `classes`, `course_module_mapping`) as specified in the objective.
- The `vitest` tests will need to handle asynchronous DB operations. Ensure `beforeAll` hooks initialize the DB schema correctly before tests run.

## 4. Conclusion
To fulfill Milestones 1 & 2 via strict TDD, the implementer should execute the following strategy:
1. **Setup:** Create `vitest.config.ts` and `tests/seeding/setup.ts` to spin up an in-memory `@libsql/client`.
2. **Phase 1 (Parser TDD):** Write failing tests for `parseModules` in `tests/seeding/parser.test.ts`, then implement `scripts/seeding/parser.ts` using the `xlsx` package to read `Modules Data.xlsx`.
3. **Phase 2 (Seeder TDD):** Write failing tests in `tests/seeding/seeder.test.ts` asserting that DB tables are wiped and correctly populated. Then implement `scripts/seeding/seeder.ts` to perform the `DELETE` and `INSERT` operations.

## 5. Verification Method
- Run `npx vitest run` to ensure all tests pass.
- Inspect `tests/seeding/parser.test.ts` and `tests/seeding/seeder.test.ts` to verify they cover the requirements.
- Verify `scripts/seeding/seeder.ts` includes `DELETE` commands for the three specified tables before inserting the Excel data.
