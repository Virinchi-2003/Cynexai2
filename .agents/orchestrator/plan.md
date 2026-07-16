# Implementation Plan

1. **Decomposition**: We have decomposed the project into 3 milestones in `PROJECT.md`:
   - M1: Security Fixes (Remove `client.execute` from UI, remove hardcoded passwords).
   - M2: Dynamic Data (Remove demo data, replace with DB queries in `sales.ts`, `crm.ts`, `tasks.ts`).
   - M3: Routing & Roles (Secure `/admin`, fix DM role, remove orphaned pages).

2. **Dispatching Subagents**:
   - I will spawn sub-orchestrators (or workers) for these milestones. Since they are relatively bounded, I can spawn 3 workers for exploration and implementation, or I can follow the `Project Orchestrator` pattern to spawn sub-orchestrators. Given the complexity, I will spawn subagents for M1, M2, and M3.

3. **Synthesis**:
   - Track progress in `progress.md`.
   - Update `PROJECT.md` statuses as milestones complete.

4. **Completion**:
   - Verify all acceptance criteria are met.
   - Send final message to the parent agent.
