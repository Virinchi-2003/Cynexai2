# Scope: Curriculum Seeding (Milestone 1 & 2)

## Architecture
- `scripts/seeding` - Directory to hold migration and parsing scripts
- `tests/seeding` - Directory for TDD tests

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Test Infra Setup | Setup in-memory sqlite or local DB for tests, vitest config | none | DONE |
| 2 | Curriculum Seeding | Parse Modules Data.xlsx, clean DB, seed modules/classes | M1 | DONE |

## Interface Contracts
### Excel Parser ↔ Seeder
- `parseModules(filePath: string): ModuleData[]`

## Code Layout
- `backend/` - Has server files. Turso uses `@libsql/client`.
- `tests/` - For vitest.
