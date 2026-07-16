# BRIEFING — 2026-07-06T13:26:00Z

## Mission
Implement security fixes for M1: remove hardcoded passwords from Login.tsx and eliminate direct database queries (`client.execute`) from all `.tsx` files by migrating them to `src/lib/api/`.

## 🔒 My Identity
- Archetype: Teamwork agent
- Roles: implementer, qa, specialist
- Working directory: C:\Users\kk\.gemini\antigravity\scratch\cynexai-website\.agents\teamwork_preview_worker_m1_1
- Original parent: d06f34f3-6641-40f2-bc10-b82e835cfcdf
- Milestone: M1 (Security Fixes)

## 🔒 Key Constraints
- DO NOT CHEAT. All implementations must be genuine.
- Code layout and interface contracts must be respected.
- Never write to `.agents` for source/test/data files.

## Current Parent
- Conversation ID: d06f34f3-6641-40f2-bc10-b82e835cfcdf
- Updated: not yet

## Task Summary
- **What to build**: Fix hardcoded passwords in `src/pages/crm/Login.tsx` and move `client.execute` out of `src/pages/**/*.tsx` to `src/lib/api/`.
- **Success criteria**: No hardcoded passwords, `Get-ChildItem -Path src -Recurse -Filter *.tsx | Select-String -Pattern "client.execute"` returns no results, build succeeds.

## Change Tracker
- **Files modified**: None yet
- **Build status**: Unknown
- **Pending issues**: Remove hardcoded passwords in Login.tsx, move client.execute in many TSX files.

## Quality Status
- **Build/test result**: Unknown
- **Lint status**: Unknown
- **Tests added/modified**: None

## Key Decisions Made
- [TBD]
