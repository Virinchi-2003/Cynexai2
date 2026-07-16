# BRIEFING — 2026-07-07T02:04:15+05:30

## Mission
Investigate the `referred_by_student_id` mismatch between `src/lib/api/sales.ts` and `schema.sql` and recommend a fix strategy.

## 🔒 My Identity
- Archetype: Explorer
- Roles: Read-only investigation, analysis, reporting
- Working directory: C:\Users\kk\.gemini\antigravity\scratch\cynexai-website\.agents\teamwork_preview_explorer_m5_crm_backend_iter3_2
- Original parent: af1b2cac-f0cc-4f66-88cf-13c1240d67e8
- Milestone: M5 CRM Backend

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Run in CODE_ONLY network mode

## Current Parent
- Conversation ID: af1b2cac-f0cc-4f66-88cf-13c1240d67e8
- Updated: not yet

## Investigation State
- **Explored paths**: `schema.sql`, `src/lib/api/sales.ts`
- **Key findings**: `sales.ts` attempts to insert `referred_by_student_id` in `sales` table and retrieves it in `Sale` interface, but `schema.sql` only has this column in `admissions` table, not `sales` table.
- **Unexplored areas**: Wait for `rg` to find where `recordSale` is called to understand if UI expects referral to be recorded directly on sales.

## Key Decisions Made
- Checked schema vs code mismatch.

## Artifact Index
- handoff.md — Report of findings and recommended fix strategy
