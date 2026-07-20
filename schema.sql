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
    instructor_id TEXT,
    order_index INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (instructor_id) REFERENCES erp_users(id)
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
    status TEXT CHECK(status IN ('draft', 'scheduled', 'in_progress', 'published', 'completed')) DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES course_modules(id)
);

-- Admissions Table
CREATE TABLE IF NOT EXISTS admissions (
    id TEXT PRIMARY KEY,
    lead_id TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    discount_locked REAL,
    offer_expiry_date DATETIME,
    expected_sale_date DATETIME,
    status TEXT CHECK(status IN ('reserved', 'converted', 'expired', 'refunded', 'Active', 'Expired', 'Converted')) DEFAULT 'Active',
    created_by TEXT,
    referred_by_student_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id),
    FOREIGN KEY (created_by) REFERENCES erp_users(id)
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    admission_id TEXT,
    course_id TEXT NOT NULL,
    total_fee REAL NOT NULL,
    amount_paid REAL NOT NULL,
    payment_mode TEXT,
    status TEXT CHECK(status IN ('Sale Partial Closed', 'Sale Completed')) NOT NULL,
    sales_exec_id TEXT,
    referred_by_student_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id),
    FOREIGN KEY (admission_id) REFERENCES admissions(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (sales_exec_id) REFERENCES erp_users(id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id TEXT,
    created_by TEXT,
    priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
    due_date TEXT,
    status TEXT DEFAULT 'To Do',
    task_type TEXT CHECK(task_type IN ('One-Time', 'Daily', 'Yes/No', 'Number')) DEFAULT 'One-Time',
    target_number INTEGER,
    current_number INTEGER DEFAULT 0,
    related_entity TEXT,
    lead_id TEXT REFERENCES crm_leads(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES erp_users(id) ON DELETE CASCADE,
    start_date TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignee_id) REFERENCES erp_users(id),
    FOREIGN KEY (created_by) REFERENCES erp_users(id)
);

CREATE TABLE IF NOT EXISTS task_dependencies (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    depends_on_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    setting_group TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_group, key)
);

CREATE TABLE IF NOT EXISTS task_comments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES erp_users(id)
);

CREATE TABLE IF NOT EXISTS task_subtasks (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT CHECK(status IN ('To Do', 'Done')) DEFAULT 'To Do',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS crm_activities (
    id TEXT PRIMARY KEY,
    lead_id TEXT REFERENCES crm_leads(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES erp_users(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES erp_users(id),
    type TEXT CHECK(type IN ('Call', 'Email', 'Meeting', 'Note')) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_stage_history (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    old_stage TEXT,
    new_stage TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_progress (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES erp_users(id) ON DELETE CASCADE,
    attendance_score REAL DEFAULT 0,
    course_progress_percentage REAL DEFAULT 0,
    quiz_scores TEXT DEFAULT '[]',
    coins_spent INTEGER DEFAULT 0,
    leaderboard_rank INTEGER,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
