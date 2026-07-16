# Original User Request

## Initial Request — 2026-07-06T09:56:23Z

Migrate dummy ERP data to real production data using the provided Excel files, enforcing Test-Driven Development (TDD).

Working directory: `C:\Users\kk\.gemini\antigravity\scratch\cynexai-website`
Integrity mode: development

## Requirements

### R1. Database Cleanup
Wipe all existing mocked records from the following tables: `modules`, `classes`, `course_module_mapping`, `student_progress`, and any mocked `timetable` entries.

### R2. Seeding Curriculum from Modules Data
Parse `Modules Data.xlsx`. For each of the 8 sheets (Python, AI, ML, SQL, Excel, SDLC, Power BI, Softskills), create a unique Module. Insert every row in those sheets as a Class mapped to the respective Module.

### R3. Seeding Timetable & Progress from Student Data
Parse `Student_Data.xlsx`. Group students by Batch, Teacher, and Timing. 
- Create a real timetable schedule in the database for each unique Batch + Teacher + Timing.
- For each student, read their `Classes completed` column and mark exactly that many classes as `completed = 1` in the `student_progress` table for their current module.
- Ensure Venkatesh and Prudhvi have their actual courses assigned to them.

### R4. Test-Driven Development
All database scripts must be written following the strict Red-Green-Refactor TDD cycle. Create failing tests first (e.g., verifying that data is properly loaded) before executing the database migration.

## Acceptance Criteria

### Data Integrity Verification
- [ ] Database contains exactly 8 modules corresponding to the sheets in `Modules Data.xlsx`.
- [ ] The `classes` table contains the exact number of rows as the combined rows across all 8 sheets.
- [ ] `student_progress` accurately reflects the `Classes completed` integer from the Excel file for every student.

### Teacher Dashboard Verification
- [ ] When fetching the timetable for `venkateswarreddykatreddy29@gmail.com`, it returns the real batches (e.g., Batch 1, Batch 2) and timings (e.g., 10-11am) derived from the Excel file.
