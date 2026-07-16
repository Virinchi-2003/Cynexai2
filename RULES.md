# CynexAI Project Rules

These rules are ABSOLUTE and must be strictly adhered to by all developers and AI agents working on this project.

## 1. The "No Dummy Data" Rule
**ABSOLUTE RULE:** After EVERY feature improvement, change, and bug fix, you MUST verify that the data being displayed is **dynamic** and comes directly from the Turso database. 
- There should be NO hardcoded arrays, state variables holding mock data, or fake "test" data (like "Rahul", "Priya", or fake classes) anywhere in the application.
- If data does not exist in the database, the UI should correctly display an empty state or remain blank. Do NOT inject dummy data to make the UI look full.

## 2. The "All Portals" Verification Rule
**ABSOLUTE RULE:** After making changes, you must verify that the data is working and correctly moving across **all relevant portals** (CEO, Manager, Sales, DM, Student). 
- A change in a shared database schema or API endpoint must not break another role's dashboard.
- Actions taken in one portal (e.g., Sales approving a lead) must correctly reflect in the subsequent portal (e.g., Manager Onboarding) dynamically.
