# BRIEFING — 2026-07-07

## Mission
Implement the Task Backend (M6).

## 🔒 My Identity
- Archetype: sub_orch
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: C:\Users\kk\.gemini\antigravity\scratch\cynexai-website\.agents\sub_orch_m6_task_backend
- Original parent: 9f4b423d-3fba-494a-b15b-00d5298f44a6
- Original parent conversation ID: 9f4b423d-3fba-494a-b15b-00d5298f44a6

## 🔒 My Workflow
- **Pattern**: Project Orchestrator Iteration Loop (Explorer -> Worker -> Reviewer -> Auditor)
- **Scope document**: C:\Users\kk\.gemini\antigravity\scratch\cynexai-website\.agents\sub_orch_m6_task_backend\SCOPE.md
1. **Decompose**: Decomposed into M6_1_DB and M6_2_API.
2. **Dispatch & Execute**:
   - **Direct (iteration loop)**: Explorer → Worker → Reviewer → gate
3. **On failure**: Retry, Replace, Skip, Redistribute, Degrade
4. **Succession**: Self-succeed at 16 spawns, write handoff.md, spawn successor.
- **Work items**:
  1. M6_1_DB [PLANNED]
  2. M6_2_API [PLANNED]
- **Current phase**: 2
- **Current focus**: M6_1_DB

## 🔒 Key Constraints
- Must use exact pattern: Explorer -> Worker -> Reviewer -> Auditor.
- Do not write code directly.
- Gate milestone only if all tests and Auditor pass.
- No direct database queries (`client.execute`) are allowed in `.tsx` components (architecture rule).

## Current Parent
- Conversation ID: 9f4b423d-3fba-494a-b15b-00d5298f44a6
- Updated: not yet

## Key Decisions Made
- [TBD]

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|

## Succession Status
- Succession required: no
- Spawn count: 0 / 16
- Pending subagents: none
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: not started
- Safety timer: none

## Artifact Index
- SCOPE.md — sub-milestone definitions
- progress.md — checklist and iteration status
