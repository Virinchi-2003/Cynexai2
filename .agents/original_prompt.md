# Original User Request

## Initial Request — 2026-07-08T00:11:02+05:30

Port core CRM features inspired by TwentyHQ into the existing CynexAI application, strictly using Test-Driven Development (TDD) principles. 

Working directory: C:\Users\kk\.gemini\antigravity\scratch\cynexai-website
Integrity mode: development

## Requirements

### R1. Sales/Lead Pipeline (Kanban)
Implement a drag-and-drop Kanban board to track prospective student enrollments across different stages (e.g., Lead, Contacted, Enrolled). 

### R2. Advanced Data Tables
Implement highly customizable data tables for managing Students and Users. Must support filtering, sorting, and inline-editing of records.

### R3. Task & Activity Tracking
Implement a system for admins and teachers to log activities (calls, emails) and schedule follow-up tasks linked to specific students or leads.

### R4. Strict Test-Driven Development (TDD)
You must strictly follow TDD. Write failing tests first, verify they fail, then write the minimal code to pass the tests. Do not write production code without a failing test.

## Acceptance Criteria

### CRM Features
- [ ] The Kanban board renders correctly, allows dragging cards between columns, and persists the new state.
- [ ] The Data Table component allows users to sort columns, apply filters, and edit cell values inline without full page reloads.
- [ ] Users can create a task/activity, assign it to a lead/student, and view a chronological history of activities for that student.

### TDD & Verification
- [ ] All new features must be accompanied by automated tests (e.g., Jest/Vitest or React Testing Library).
- [ ] Test coverage must demonstrate the core logic of the Kanban state, data table filtering, and task creation.
- [ ] The agent must be able to run `npm run test` (or equivalent) and show all tests passing cleanly.

*** SPECIAL INSTRUCTIONS FROM USER ***
- You MUST utilize the `cavecrew` skill (C:\Users\kk\.gemini\config\skills\cavecrew\SKILL.md) to spawn compressed subagents (`cavecrew-investigator`, `cavecrew-builder`, `cavecrew-reviewer`) when delegating work.
- You MUST adhere to the `test-driven-development` skill (C:\Users\kk\.gemini\config\skills\test-driven-development\SKILL.md). No code without a failing test.
