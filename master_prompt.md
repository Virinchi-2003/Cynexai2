# CynexAI ERP — Master Build Prompt & Production Build Plan

Use this entire document as a single build prompt for an AI dev tool (Claude Code, Cursor, etc.) or as a spec for a dev team. It is self-contained: flows, solutions, UI, data model, and phased build plan.

## 0. SYSTEM OVERVIEW

Build a mobile-first ERP for CynexAI (coaching institute) covering the full lifecycle: Lead → Demo → Admission (optional) → Sale → Manager Approval → Onboarding → Student Portal → Learning → Placement → Alumni, plus WhatsApp Web automation, a rolling-module batch/timetable engine, a student Career Center, a Referral Center, and a free/self-hosted AI voice stack.

Core principle: Admission ≠ Sale. Admission is a reservation before course purchase. Sale is any payment toward the actual course fee. Onboarding never happens without Manager Approval.


## 1. MASTER PROCESS FLOW

Lead
 ↓
Demo Scheduled
 ↓
Demo Completed
 ↓
Admission (Optional — reservation only, no account created)
 ↓
Sale Partial Closed  OR  Sale Completed
 ↓
Manager Approval  (mandatory gate — Sales/HR cannot bypass)
 ↓
Onboarding  (Batch, Teacher, Mode, Joining Date assigned)
 ↓
Student Portal Created (Login, ID, Tasks)
 ↓
Learning (Rolling Module Batches)
 ↓
Placement
 ↓
Alumni

### CRM Pipeline Buckets

| Bucket | Stage |
|---|---|
| A | New Leads |
| B | Interested |
| C | Demo |
| D | Admission (Seat Reserved) |
| E | Sales (Partial / Full) |
| F | Manager Approval |
| G | Onboarding |
| H | Learning |
| I | Placement |
| J | Alumni |

## 2. FEATURE MODULES — PROBLEM, SOLUTION, DATA MODEL, UI

### 2.1 Admission vs Sale Logic

Problem: Institutes conflate "reservation" with "purchase," causing wrong revenue reporting and premature onboarding.

Solution:
- Two distinct objects: Admission and Sale, linked to the same Lead.
- Admission does not create a student account. It only locks a discount/offer and records intent.
- Sale can occur with or without a prior Admission (system auto-skips Admission if no reservation fee was paid).

Admission record fields:
Admission Amount, Discount Locked (%/₹), Offer Expiry Date, Notes, Expected Sale Date, Lead ID, Created By, Status (Active/Expired/Converted)

Sale record fields:
Course, Total Fee, Amount Paid, Balance, Payment Mode, Status (Sale Partial Closed / Sale Completed), Linked Admission ID (nullable), Sales Executive ID, Timestamp

Business rule engine:
IF payment_received > 0 AND payment_toward = "course_fee":
    IF amount_paid < total_fee: status = "Sale Partial Closed"
    IF amount_paid == total_fee: status = "Sale Completed"
    trigger: create Manager Approval task

UI (mobile-first):
- Lead detail screen has two clearly separated action buttons: "Record Admission" (blue, secondary) and "Record Sale" (green, primary) — never merged into one form.
- Sale form shows a running balance bar (paid vs total) as a horizontal progress bar.
- A persistent banner on the Sale confirmation screen: "After receiving any course payment, do NOT promise batch dates. Batch allocation happens only after Manager Approval."

### 2.2 Manager Approval Workflow

Problem: Sales/HR could onboard students without verification, causing overpromising and batch overbooking.

Solution: Hard gate — no onboarding screen is reachable until a Manager explicitly approves.

Approval checklist (Manager must confirm each):
- Payment verified
- Course confirmed
- Batch availability confirmed
- Required documents received
- Teacher assignable
- Joining date feasible

UI:
- Manager gets a push/in-app notification badge on a dedicated "Pending Approvals" tab.
- Approval screen is a checklist with toggle switches, each with a required note field if rejected.
- On approval → auto-triggers Onboarding form for that student; on rejection → returns to Sales Executive with reason, lead stays in Bucket E.

### 2.3 Onboarding

Manager enters: Batch, Joining Date, Assigned Teacher, Mode (Online/Offline/Hybrid), Initial Modules, Remarks.

System auto-generates on submit:
- Student Portal account
- Login email (credentials sent)
- Student ID (format: CNX-YYYY-####)
- Tasks assigned to Sales/HR (e.g., "Confirm student joined first class")

UI: Single-screen onboarding form with dropdowns (searchable, not free text) for Batch and Teacher, a date picker for Joining Date, and a segmented control for Mode. Submit button disabled until all required fields are filled.

### 2.4 Sales / HR Unified Role

Problem: Small team, one person does both jobs; separate roles create friction.

Solution: Single role "Sales/HR Executive" with permission bundle:
CRM, Follow-ups, Admissions, Sales, Document Collection, Student Follow-up, HR Onboarding Tasks, Referral Handling.

UI: Role-based dashboard with tabbed sections (Leads / Sales / Documents / Onboarding Tasks / Referrals) rather than separate apps — reduces context switching on mobile.

### 2.5 WhatsApp Web Automation (No Paid API)

Problem: No WhatsApp Business API budget; need bulk + one-click messaging.

Solution: Browser-based automation using wa.me deep links / WhatsApp Web, opened sequentially — employee manually presses Send (keeps it ToS-safe, no auto-send bot).

Features:
- One-Click Chat — button on each lead opens WhatsApp Web/app with a pre-filled message template (wa.me/<number>?text=<encoded_message>).
- Bulk WhatsApp — select multiple leads → choose a template (Demo Reminder, Fee Reminder, Batch Link, Holiday Notice, Placement Update, Referral Campaign, Festival Greeting) → system opens each chat one at a time in sequence, employee presses Send, system auto-advances to the next lead after a short delay or manual "Next" tap.
- Save Contact — auto-formats contact name as Name - Course (e.g., "Rahul - Data Science") and generates a downloadable .vcf or a "Save Contact" deep link.

UI:
- Lead list has multi-select checkboxes (mobile: long-press to enter select mode).
- A floating action button "Bulk WhatsApp" appears once ≥1 lead selected.
- Template picker is a bottom sheet with preview text before sending.
- Progress indicator: "Sending 3 of 30" with Skip/Next controls.

### 2.6 Task System

Task types: Completed/Pending, Numeric Target (e.g., "Call 30 Leads," progress bar), Checklist, Approval Required, Recurring (Daily/Weekly/Monthly).

Data model:
Task { id, type, title, target_value, current_value, assignee_id, due_date, recurrence_rule, status, requires_approval, approver_id }

UI: Task cards on dashboard show a progress bar for numeric tasks (e.g., 17/30), a checkbox row for checklist tasks, and a recurrence badge (icon) for recurring tasks. Tapping a numeric task opens a stepper to log progress (+1, +5, custom).

### 2.7 Student Portal — Flexible Lesson Types

Problem: Not every lesson needs coding/assignment; rigid lesson structure blocks non-technical courses.

Solution: Each lesson independently toggles components:
Video Only / Video+Quiz / Video+Coding / Video+Assignment / Live Class / Reading Material / Practice Session.

Data model:
Lesson { id, module_id, title, has_video, has_quiz, has_coding, has_assignment, has_live_class, has_reading, has_practice }

UI: Lesson editor (admin/teacher side) shows toggle chips for each component; only enabled components render blocks on the student-facing lesson screen. Student view is a vertical scroll of cards, one per enabled component, with a completion checkmark per card and one overall "Mark Lesson Complete" button at the bottom.

### 2.8 Student Career Center

Resume Builder:
- Templates: Professional, ATS-friendly, Fresher.
- Auto-fills Skills, Projects, Education, Certifications, Course Progress from student profile.
- One-click PDF export.

LinkedIn Profile Builder:
- AI-generated suggestions for Headline, About, Skills, Banner Ideas, Featured Section, Experience Format.
- Daily notification system: "Today's Networking Tip," "Today's Recruiter Tip," "Today's Profile Improvement," "Today's Interview Advice."

Portfolio Builder (Phase 2/future): Auto-generates a portfolio page from student projects.

UI: Career Hub is a dedicated bottom-nav tab with three cards (Resume / LinkedIn / Portfolio). Resume builder is a step-by-step wizard (5 steps) with a live preview pane (stacked below form on mobile, side-by-side on desktop).

### 2.9 Referral Center

Solution: Digital Marketing team centrally manages ready-made referral assets (Posters, Brochures, WhatsApp Messages, Instagram Stories, Referral Videos, Course PDFs, Offer Posters, QR Codes). Students always see the latest version automatically — no manual re-sharing needed.

UI: Grid gallery of shareable assets with a "Share" button per item (opens native share sheet on mobile). DM team has a separate CMS-style upload screen to push new assets that instantly reflect for all students.

### 2.10 AI Voice Stack (Free/Self-Hosted)

- Speech-to-Text: OpenAI Whisper (self-hosted).
- Text-to-Speech (in priority order): Kokoro TTS → Piper TTS → Coqui XTTS v2.
- Conversational AI: OpenRouter free-tier models or self-hosted Ollama models.

Use cases: voice input for handwritten/verbal doubt-solving, TTS narration for video lessons, voice-based practice sessions.

### 2.11 Rolling Module Batch & Timetable Engine

Problem: Creating a new batch per student is unscalable; students join at different times.

Solution — Rolling Module Batches:
- Each course (e.g., Data Science) is broken into independent modules (SQL, Python, Excel, Power BI, ML, AI, Soft Skills, SDLC).
- Each module runs its own recurring batch schedule (e.g., Power BI starts every Monday, Excel every Wednesday, Soft Skills continuous).
- New students join whatever foundational module is currently available while waiting for enough students to accumulate for a fresh core-sequence (SQL/Python/ML) batch.

Batch formation rules (Manager-defined):
Batch { module_id, min_students, max_students, expected_start_date, target_capacity, current_enrolled, status }

Manager can launch a batch manually once current_enrolled >= min_students.
Resuming/returning students: Progress is tracked at the lesson level, not the course level. A student who completed Excel + Power BI but not SQL/Python/ML/AI is auto-slotted into the next available SQL batch — never restarts from zero.

Timetable Manager (for Managers):
- Visual weekly calendar showing: Teacher availability, Classroom availability, Google Meet schedule, Batch occupancy, Student counts, Holidays, Demo sessions, Makeup classes.
- System warns on scheduling conflicts before publishing (e.g., teacher double-booked, classroom overlap).

Teacher Load Balancing dashboard: Hours taught this week, upcoming classes, demo sessions, available slots — used when assigning new demos/classes to avoid overload.

UI:
- Timetable Manager is a horizontally-scrollable weekly grid (mobile) that expands to a full multi-column calendar on desktop.
- Conflict warnings appear as inline red banners before the "Publish" button is enabled.
- Batch cards show a capacity ring (e.g., 18/30 filled) with color states: gray (forming), amber (near minimum), green (ready to launch), red (full).

## 3. UI/UX DESIGN SYSTEM (MOBILE-FIRST)

Principle: Mobile is the primary product; desktop expands from it, not the reverse.

Rules:
- Bottom navigation (4-5 tabs max) per role: e.g., Student → Home / Learning / Career / Referral / Profile. Sales/HR → Leads / Sales / Tasks / WhatsApp / Profile. Manager → Approvals / Timetable / Batches / Teachers / Reports.
- Large touch targets (min 44x44px), thumb-reachable primary actions at the bottom of the screen.
- Searchable dropdowns instead of free-text wherever a fixed list exists (leads, batches, teachers, courses).
- Dashboard cards optimized for vertical scroll — one metric/action per card, no dense tables on mobile (tables collapse into stacked cards below 600px width).
- Offline-friendly caching for lead lists and lesson content (service worker / local cache).
- Desktop breakpoint (≥1024px) unlocks: multi-panel views (e.g., lead list + detail side-by-side), advanced analytics widgets, and the full timetable grid — but every workflow must remain identical in step order to mobile, only the layout density changes.

## 4. TECH STACK RECOMMENDATION

Layer Choice Reason
Frontend React (Next.js) + Tailwind fast mobile-first build, SSR for portal SEO
Backend Node.js (NestJS/Express) shared JS ecosystem with WhatsApp automation
DB PostgreSQL relational integrity for CRM/Sales/Batches
Realtime Socket.io / Supabase Realtime live approval notifications, timetable conflicts
WhatsApp Automation Puppeteer + whatsapp-web.js already proven in your prior bot work
File/PDF Puppeteer or pdf-lib resume export
STT Whisper (self-hosted, GPU optional) free, accurate
TTS Kokoro / Piper / Coqui free, natural
Conversational AI OpenRouter free models / Ollama zero/low cost
Hosting VPS (Hetzner/DigitalOcean) + Docker control over Puppeteer/Whisper processes

## 5. CORE DATABASE TABLES (KEY ENTITIES)

Lead(id, name, phone, course_interest, source, bucket_stage, assigned_to, created_at)
Demo(id, lead_id, scheduled_at, status, notes)
Admission(id, lead_id, amount, discount_locked, offer_expiry, expected_sale_date, status)
Sale(id, lead_id, admission_id, course_id, total_fee, amount_paid, status, sales_exec_id)
ManagerApproval(id, sale_id, checklist_json, status, notes, approver_id, decided_at)
Onboarding(id, sale_id, batch_id, teacher_id, mode, joining_date, remarks)
Student(id, onboarding_id, student_code, portal_login_email, status)
Module(id, name, sequence_order)
Batch(id, module_id, min_students, max_students, target_capacity, current_enrolled, start_date, status)
LessonProgress(id, student_id, lesson_id, status, score, watched_pct)
Task(id, type, title, target_value, current_value, assignee_id, due_date, recurrence_rule, status)
WhatsAppTemplate(id, name, body, category)
ReferralAsset(id, type, file_url, uploaded_by, updated_at)
Teacher(id, name, weekly_hours_taught, availability_json)
Timetable(id, batch_id, teacher_id, room_or_link, day_of_week, start_time, end_time)

## 6. MASTER BUILD PLAN — PHASES

Phase 0 — Foundations (Week 1-2)
Repo setup, CI/CD, auth (role-based: Admin, Manager, Sales/HR, Teacher, Student).
Core DB schema migration (all tables above).
Design system: color tokens, typography, mobile grid, component library (buttons, cards, bottom sheets, toggles).

Phase 1 — CRM Core (Week 3-4)
Lead capture, bucket pipeline (Kanban view mobile+desktop), lead detail screen.
Demo scheduling + completion flow.
Searchable dropdowns, filters, assignment logic.

Phase 2 — Admission & Sale Engine (Week 5-6)
Admission form + rules (discount lock, expiry).
Sale form + partial/complete logic + balance tracking.
Persistent no-promise-dates banner.

Phase 3 — Manager Approval & Onboarding (Week 7-8)
Pending Approvals tab, checklist UI, notification system.
Onboarding form, auto student account/ID/login generation.
Sales/HR unified role permissions.

Phase 4 — WhatsApp Web Automation (Week 9-10)
One-click chat deep links.
Bulk send sequencer (Puppeteer/whatsapp-web.js), template manager.
Save Contact (Name - Course format, vCard export).

Phase 5 — Task System (Week 10-11)
Task types (numeric, checklist, recurring, approval-required).
Dashboard cards + progress logging.

Phase 6 — Student Portal & Learning (Week 11-13)
Flexible lesson-type builder (admin) + student lesson viewer.
Progress tracking at lesson level.
Video hosting/streaming integration.

Phase 7 — Rolling Batch & Timetable Engine (Week 13-16)
Module-based batch model, min/max/target capacity logic.
Auto-slotting returning students into next available module batch.
Timetable Manager (weekly grid, conflict detection).
Teacher Load Balancing dashboard.

Phase 8 — Career Center & Referral Center (Week 16-18)
Resume Builder wizard + PDF export + auto-fill from profile.
LinkedIn Builder + daily tips notification engine.
Referral Center gallery + DM CMS upload panel.
Portfolio Builder (stub/future flag).

Phase 9 — AI Voice Stack Integration (Week 18-19)
Whisper STT self-hosted service.
Kokoro/Piper/Coqui TTS pipeline for lesson narration.
OpenRouter/Ollama conversational AI for doubt-solving.

Phase 10 — QA, Load Testing, Production Hardening (Week 19-21)
Role-permission audit, approval-gate bypass testing.
Mobile device testing (low-end Android priority).
Backup/restore, error monitoring (Sentry), load testing on WhatsApp sequencer.

Phase 11 — Deployment & Rollout (Week 21-22)
Staged rollout: internal team → pilot batch of students → full rollout.
Data migration from existing spreadsheets/tools.
Training docs for Manager/Sales-HR roles.