# BRIEFING — 2026-07-06T15:32:58+05:30

## Mission
Implement Test Infra Setup and Curriculum Seeding using strict Test-Driven Development (TDD) for the `vitest` setup, `parseModules` in parser, and `seedCurriculum` in seeder.

## 🔒 My Identity
- Archetype: subagent
- Roles: implementer, qa, specialist
- Working directory: C:\Users\kk\.gemini\antigravity\scratch\cynexai-website\.agents\teamwork_preview_worker_curriculum
- Original parent: fb54cc84-89c5-4ae7-9a74-a38d5132fe64
- Milestone: Curriculum Seeding with TDD

## 🔒 Key Constraints
- Must use strict TDD: RED -> Verify RED -> GREEN -> Verify GREEN -> REFACTOR.
- NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.
- No hardcoded test results.
- Write tests first for `parseModules` and `seedCurriculum`.

## Current Parent
- Conversation ID: fb54cc84-89c5-4ae7-9a74-a38d5132fe64
- Updated: 2026-07-06T15:32:58+05:30

## Task Summary
- **What to build**: Test infrastructure with vitest + @libsql/client (in-memory). Implement Excel parser for Modules Data and seed function to populate database.
- **Success criteria**: All tests pass. `parseModules` reads 8 sheets of Excel. `seedCurriculum` clears and populates modules, classes, course_module_mapping. Tests were written before the implementation.

## Key Decisions Made
- [TBD]

## Artifact Index
- [TBD]

## Loaded Skills
- Source: C:\Users\kk\.gemini\config\skills\test-driven-development\SKILL.md
- Local copy: [TBD]
- Core methodology: Red-Green-Refactor. NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.
