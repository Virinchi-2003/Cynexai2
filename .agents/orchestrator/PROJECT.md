# Project: CynexAI ERP Data Migration
# Scope: Migrate dummy ERP data to real production data

## Architecture
- `scripts/seeding` - Directory to hold migration and parsing scripts
- `tests/seeding` - Directory for TDD tests

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Test Infra Setup | Setup in-memory sqlite or local DB for tests, vitest config | none | IN_PROGRESS |
| 2 | Curriculum Seeding | Parse Modules Data.xlsx, clean DB, seed modules/classes | M1 | IN_PROGRESS |
| 3 | Timetable & Progress Seeding | Parse Student_Data.xlsx, seed timetable, student_progress | M2 | PLANNED |
| 4 | Final E2E Test | Verify Teacher Dashboard queries | M3 | PLANNED |

## Interface Contracts
### Excel Parser ↔ Seeder
- `parseModules(filePath: string): ModuleData[]`
- `parseStudents(filePath: string): StudentData[]`

## Code Layout
- `backend/` - Has server files. Wait, Turso uses `@libsql/client`.
- `tests/` - For vitest.
