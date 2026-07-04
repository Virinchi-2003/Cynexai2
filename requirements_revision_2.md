# CYNEXAI ERP - Additional Requirements & Corrections (Revision 2)

## CRM Flow Correction
Admission and Sale are not the same process.

### Correct Flow
Lead → Demo Scheduled → Demo Completed → Admission (Optional) → Sale Partial Closed OR Sale Completed → Manager Approval → Onboarding → Student Portal → Learning → Placement

### Admission Definition
Admission means the student pays a small reservation amount before purchasing the course (e.g. Demo Reservation Fee, Early Admission Fee, Seat Blocking Fee, Offer Reservation, Discount Reservation).
The student has not yet purchased the course.
Admission should contain:
- Admission Amount
- Discount Locked
- Offer Expiry Date
- Notes
- Expected Sale Date
*Admission does NOT create a student account.*

### Sale Definition
Sale begins whenever the student pays any amount toward the actual course fee (e.g. Course Fee = ₹40,000, Student pays ₹10,000 -> Status: Sale Partial Closed; OR Student pays ₹40,000 -> Status: Sale Completed).
This completely skips the Admission step if no admission fee was collected.

### Updated Buckets
- Bucket A: New Leads
- Bucket B: Interested
- Bucket C: Demo
- Bucket D: Admission (Seat Reserved)
- Bucket E: Sales (Partial / Full)
- Bucket F: Manager Approval
- Bucket G: Onboarding
- Bucket H: Learning
- Bucket I: Placement
- Bucket J: Alumni

## Manager Approval & Onboarding
- **Manager Approval:** Sales Executives cannot onboard students. Once a Sale Partial or Sale Completed occurs, the Manager receives a pending approval notification. Manager verifies: Payment, Course, Batch Availability, Required Documents, Assigned Teacher, Joining Date.
- **Onboarding:** Manager enters Batch, Joining Date, Assigned Teacher, Mode (Online/Offline/Hybrid), Initial Modules, Remarks. Only then is the Student Portal created, Login Email sent, Student ID generated, and Tasks assigned.
- **Sales Note:** Display a permanent note: *"After receiving any course payment, Sales/HR must NOT promise batch dates. Batch allocation and joining dates are assigned only after Manager Approval."*

## Roles & Navigation
- **Sales / HR Executive:** Combine Sales and HR onboarding roles into a single `Sales/HR Executive` role. Permissions include: CRM, Follow-ups, Admissions, Sales, Document Collection, Student Follow-up, HR Onboarding Tasks, Referral Handling.

## WhatsApp Improvements
- **WhatsApp Web Automation:** 
  - One-click open WhatsApp chat with pre-filled message using `wa.me` or WhatsApp Web links.
  - Bulk WhatsApp: Select multiple CRM leads and open WhatsApp Web sequentially with pre-filled messages (Demo Reminder, Fee Reminder, Today's Batch Link, Holiday Notice, Placement Update, Referral Campaign, Festival Greetings) for manual sending.
- **Save Contact Feature:** Format: `Name - Course` (e.g. `Rahul - Data Science`) for easy WhatsApp organization.

## Task System Improvements
- **Task Types:** Completed/Pending, Numeric Target (e.g. "Call 30 Leads", current = 17, with progress bar), Checklist, Approval Required, Recurring (Daily/Weekly/Monthly).

## Student Portal & Career Center
- **Lesson Types:** Support Video Only, Video + Quiz, Video + Coding, Video + Assignment, Live Class, Reading Material, Practice Session.
- **Career Hub:**
  - **Resume Builder:** Professional, ATS-friendly, and Fresher templates with one-click PDF export using pre-filled student data.
  - **LinkedIn Profile Builder:** AI suggestions (Headline, About, Skills, Banner Ideas, Featured section, Experience Format) and Daily Tips (Networking, Recruiter, Profile Improvement, Interview Advice).
- **Referral Center:** Pull referral materials (Posters, Brochures, WhatsApp templates, Instagram Stories, QR Codes) managed centrally by DM team.

## Technical / Infrastructure
- **AI Voice Stack:** Speech-to-Text (OpenAI Whisper self-hosted), Text-to-Speech (Kokoro TTS, Piper TTS, or Coqui XTTS v2), Conversational AI (OpenRouter free or Ollama self-hosted models).
- **Timetable & Rolling Module Batches:** 
  - Rolling Module Batches instead of single course batches. Students join modules (SQL, Python, Excel, Power BI, ML, AI, Soft Skills, SDLC) operating independently. Batch formation rules (Min/Max students, Expected Start Date).
  - Progress tracked at lesson/module level so resuming students join the next available module batch.
  - Timetable Manager: Visual weekly calendar showing teacher/classroom availability, Meet schedule, occupancy, and conflict warnings.
  - Teacher Load Balancing: Weekly hours taught, upcoming classes, demo slots.

## Design
- **Mobile-First Design:** Platform designed primarily for mobile (large touch targets, bottom navigation, vertical scroll cards, minimal typing, offline-friendly caching). Desktop expands screen real estate while keeping same workflows.
