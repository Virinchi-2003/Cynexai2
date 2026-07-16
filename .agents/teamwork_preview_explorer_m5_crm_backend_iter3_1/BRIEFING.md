# BRIEFING — 2026-07-06T20:34:00Z

## Mission
Investigate the schema vs code mismatch for `sales.ts` in M5 CRM Backend, specifically `referred_by_student_id` in the `sales` table, and recommend a fix strategy.

## 🔒 My Identity
- Archetype: Teamwork explorer
- Roles: Read-only investigator
- Working directory: C:\Users\kk\.gemini\antigravity\scratch\cynexai-website\.agents\teamwork_preview_explorer_m5_crm_backend_iter3_1
- Original parent: af1b2cac-f0cc-4f66-88cf-13c1240d67e8
- Milestone: M5: CRM Backend

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Network mode: CODE_ONLY

## Current Parent
- Conversation ID: af1b2cac-f0cc-4f66-88cf-13c1240d67e8
- Updated: 2026-07-06T20:34:00Z

## Investigation State
- **Explored paths**: PROJECT.md, src/lib/api/sales.ts, schema.sql, src/lib/turso.ts, src/lib/api/ceo.ts, src/pages/crm/ceo/CEODashboard.tsx
- **Key findings**: `sales` table missing `referred_by_student_id`. Code explicitly relies on it in queries and migrations (`turso.ts`). Needs to be added to `schema.sql`.
- **Unexplored areas**: None, investigation complete.

## Key Decisions Made
- Concluded that `schema.sql` should be updated to add `referred_by_student_id TEXT` to the `sales` table.

## Artifact Index
- handoff.md — Report back to main agent
