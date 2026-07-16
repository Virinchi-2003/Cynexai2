# Scope: E2E Testing Track

## Architecture
- Dual track E2E tests for Advanced Task Manager and Advanced CRM.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Test_Design | Create `TEST_INFRA.md` identifying features (Task Kanban, List, Calendar, CRM stages, analytics) | none | PLANNED |
| 2 | Test_Impl | Implement Tier 1-4 tests based on `TEST_INFRA.md` using Playwright | Test_Design | PLANNED |
| 3 | Test_Ready | Publish `TEST_READY.md` when tests are created (expected to fail initially) | Test_Impl | PLANNED |

## Interface Contracts
- Must not depend on implementation design, only user requirements from `ORIGINAL_REQUEST.md`.
