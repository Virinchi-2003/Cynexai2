-- CynexAI ERP Database Schema (libSQL / Turso)

-- Users Table (RBAC)
CREATE TABLE IF NOT EXISTS erp_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- In production, use bcrypt hash
    role TEXT CHECK(role IN ('Admin', 'Manager', 'Sales/HR', 'Teacher', 'Student', 'CEO', 'DM')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CRM Leads Table
CREATE TABLE IF NOT EXISTS crm_leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT CHECK(status IN ('New', 'Contacted', 'Demo Scheduled', 'Demo Completed', 'Admission', 'Closed Won', 'Closed Lost')) NOT NULL,
    source TEXT,
    course_interest TEXT,
    assigned_to TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES erp_users(id)
);

-- WhatsApp Messages Table (Synced by WWeb.js)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id TEXT PRIMARY KEY,
    lead_id TEXT,
    direction TEXT CHECK(direction IN ('inbound', 'outbound')) NOT NULL,
    message_body TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id)
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instructor_id TEXT,
    price REAL,
    status TEXT CHECK(status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES erp_users(id)
);

-- Course Modules Table
CREATE TABLE IF NOT EXISTS course_modules (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Course Modules/Classes Table
CREATE TABLE IF NOT EXISTS course_classes (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    youtube_video_id TEXT, -- For embedded unlisted youtube videos
    type TEXT CHECK(type IN ('video', 'reading', 'quiz', 'code', 'live', 'assignment', 'practice', 'interview')) NOT NULL,
    order_index INTEGER NOT NULL,
    meet_link TEXT,
    ai_ppt_markdown TEXT,
    ai_script TEXT,
    ai_keypoints TEXT,
    ai_summary TEXT,
    status TEXT CHECK(status IN ('draft', 'published', 'completed')) DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES course_modules(id)
);

-- Admissions Table
CREATE TABLE IF NOT EXISTS admissions (
    id TEXT PRIMARY KEY,
    lead_id TEXT UNIQUE NOT NULL,
    reservation_amount REAL NOT NULL,
    discount_locked REAL,
    offer_expiry_date DATETIME,
    status TEXT CHECK(status IN ('reserved', 'converted', 'expired', 'refunded')) DEFAULT 'reserved',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id)
);
