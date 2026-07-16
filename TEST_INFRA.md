# E2E Test Infra: CynexAI ERP

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Authenticated Routing (Admin) | ORIGINAL_REQUEST R3 | 5      | 5      | ✓      |
| 2 | Role-based Access (DM) | ORIGINAL_REQUEST R3 | 5      | 5      | ✓      |
| 3 | Dynamic Dashboard Rendering (Sales) | ORIGINAL_REQUEST R2 | 5      | 5      | ✓      |
| 4 | Empty State Handling (DM Dashboard) | ORIGINAL_REQUEST R2 | 5      | 5      | ✓      |
| 5 | Secure Login | ORIGINAL_REQUEST R1/R3 | 5      | 5      | ✓      |
| 6 | Task Manager Kanban (D&D) | ORIGINAL_REQUEST R1 | 5      | 5      | ✓      |
| 7 | Task Manager List View | ORIGINAL_REQUEST R1 | 5      | 5      | ✓      |
| 8 | Task Manager Calendar View | ORIGINAL_REQUEST R1 | 5      | 5      | ✓      |
| 9 | Task Manager Filtering | ORIGINAL_REQUEST R1 | 5      | 5      | ✓      |
| 10 | Task Manager Subtasks | ORIGINAL_REQUEST R1 | 5      | 5      | ✓      |
| 11 | CRM Pipeline Drag & Drop | ORIGINAL_REQUEST R2 | 5      | 5      | ✓      |
| 12 | CRM Stage Transition Strict Rules | ORIGINAL_REQUEST R2 | 5      | 5      | ✓      |
| 13 | CRM Activity Logging | ORIGINAL_REQUEST R2 | 5      | 5      | ✓      |
| 14 | CRM Follow-up Scheduling | ORIGINAL_REQUEST R2 | 5      | 5      | ✓      |
| 15 | CRM Analytics Dashboards | ORIGINAL_REQUEST R2 | 5      | 5      | ✓      |
| 16 | Unified Task Hub (Routing) | ORIGINAL_REQUEST R3 | 5      | 5      | ✓      |

## Test Architecture
- Test runner: Playwright (`npx playwright test`)
- Test case format: Playwright test files (`tests/e2e/*.spec.ts`)
- Directory layout: 
  - `tests/e2e/` for test scripts
  - `tests/e2e/utils/` for helper scripts (e.g. database setup/teardown)

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | DM successfully logs in, views their dashboard, sees data | F2, F5 | Medium     |
| 2 | Unauthenticated user tries to access admin, gets redirected, logs in as admin, views sales dashboard | F1, F3, F5 | High |
| 3 | Admin views empty DM dashboard, adds data, sees charts update | F3, F4 | High |
| 4 | User switches between Kanban, List, and Calendar views seamlessly | F6, F7, F8, F16 | Medium |
| 5 | User creates a task, adds subtasks, and drags across Kanban columns | F6, F10 | High |
| 6 | Sales moves a lead in CRM pipeline but is blocked by strict rules, adds activity, then succeeds | F11, F12, F13 | High |
| 7 | CRM Manager views dashboard, creates a follow-up, verifies analytics update | F14, F15 | Medium |
| 8 | Complex filtering applied on List view and Kanban view | F9 | Medium |

## Coverage Thresholds
- Tier 1: ≥5 per feature
- Tier 2: ≥5 per feature (where boundaries exist)
- Tier 3: pairwise coverage of major feature interactions
- Tier 4: ≥5 realistic application scenarios
