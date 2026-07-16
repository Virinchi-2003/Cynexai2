# BRIEFING — 2026-07-08T00:14:00+05:30

## Mission
Implement M2: Sales/Lead Pipeline (Kanban) using TDD and cavecrew for delegations.

## 🔒 My Identity
- Archetype: teamwork_preview_orchestrator
- Roles: sub-orchestrator
- Working directory: C:\Users\kk\.gemini\antigravity\scratch\cynexai-website\.agents\sub_orch_m2_kanban
- Original parent: 4cb2815e-e451-4ad7-9e3b-c9b2f3952b22
- Original parent conversation ID: 4cb2815e-e451-4ad7-9e3b-c9b2f3952b22

## 🔒 My Workflow
- **Pattern**: Project / Canonical (Sub-orchestrator Iteration Loop)
- **Scope document**: C:\Users\kk\.gemini\antigravity\scratch\cynexai-website\.agents\sub_orch_m2_kanban\SCOPE.md
1. **Decompose**: M2.1 Kanban State, M2.2 Kanban UI.
2. **Dispatch & Execute**:
   - **Direct (iteration loop)**: cavecrew-investigator → cavecrew-builder → cavecrew-reviewer → test → gate
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: at 16 spawns, write handoff.md, spawn successor.
- **Work items**:
  1. M2.1 Kanban State [pending]
  2. M2.2 Kanban UI [pending]
- **Current phase**: 2
- **Current focus**: M2.1 Kanban State

## 🔒 Key Constraints
- Use `cavecrew` skill for delegations.
- Adhere to `test-driven-development` skill.
- Never reuse a subagent after it has delivered its handoff — always spawn fresh.

## Current Parent
- Conversation ID: 4cb2815e-e451-4ad7-9e3b-c9b2f3952b22
- Updated: not yet

## Key Decisions Made
- None yet

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
- SCOPE.md — Scope specific to M2
