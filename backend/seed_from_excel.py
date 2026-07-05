import pandas as pd
import os
import sys
from dotenv import load_dotenv
from libsql_client import create_client_sync

load_dotenv(dotenv_path='../.env')

url = os.getenv('VITE_TURSO_DATABASE_URL')
if url and url.startswith('libsql://'):
    url = url.replace('libsql://', 'https://')
auth_token = os.getenv('VITE_TURSO_AUTH_TOKEN')

if not url or not auth_token:
    print("Missing Turso environment variables.")
    sys.exit(1)

client = create_client_sync(url, auth_token=auth_token)

def clean_value(val):
    if pd.isna(val):
        return "Class topics will cover key core concepts."
    return str(val).strip()

def main():
    try:
        xl = pd.ExcelFile('../Modules Data.xlsx')
        
        print("Recreating decoupled database tables...")
        # Drop old tables
        client.execute("DROP TABLE IF EXISTS course_classes")
        client.execute("DROP TABLE IF EXISTS course_modules")
        client.execute("DROP TABLE IF EXISTS classes")
        client.execute("DROP TABLE IF EXISTS course_module_mapping")
        client.execute("DROP TABLE IF EXISTS modules")
        client.execute("DROP TABLE IF EXISTS class_questions")
        
        # 1. Re-create Courses Table (safe keep)
        # 2. Create Global Modules Table
        client.execute("""
            CREATE TABLE IF NOT EXISTS modules (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                instructor_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (instructor_id) REFERENCES erp_users(id)
            )
        """)
        
        # 3. Create Course-Module Junction Table (Many-to-Many)
        client.execute("""
            CREATE TABLE IF NOT EXISTS course_module_mapping (
                course_id TEXT NOT NULL,
                module_id TEXT NOT NULL,
                order_index INTEGER NOT NULL,
                PRIMARY KEY (course_id, module_id),
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
            )
        """)
        
        # 4. Create Classes Table (belongs to Global Module)
        client.execute("""
            CREATE TABLE IF NOT EXISTS classes (
                id TEXT PRIMARY KEY,
                module_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                youtube_video_id TEXT,
                meet_link TEXT,
                type TEXT CHECK(type IN ('video', 'reading', 'quiz', 'code', 'live', 'assignment', 'practice', 'interview')) NOT NULL DEFAULT 'video',
                ai_ppt_markdown TEXT,
                ai_script TEXT,
                ai_keypoints TEXT,
                ai_summary TEXT,
                status TEXT CHECK(status IN ('draft', 'scheduled', 'in_progress', 'published', 'completed')) DEFAULT 'draft',
                order_index INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
            )
        """)
        
        # 5. Create Class Questions Table (MCQ + Coding tasks)
        client.execute("""
            CREATE TABLE IF NOT EXISTS class_questions (
                id TEXT PRIMARY KEY,
                class_id TEXT NOT NULL,
                type TEXT CHECK(type IN ('mcq', 'coding')) NOT NULL,
                question_text TEXT NOT NULL,
                options_json TEXT,
                correct_answer_idx INTEGER,
                boilerplate_json TEXT,
                test_cases_json TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
            )
        """)

        print("Tables created successfully.")
        
        # Create Data Science Course
        course_id = "course_ds_mastery"
        client.execute("DELETE FROM courses WHERE id = ?", (course_id,))
        client.execute(
            "INSERT INTO courses (id, title, description, instructor_id, status) VALUES (?, ?, ?, ?, ?)",
            (course_id, "Data Science Mastery", "Master Python, SQL, ML, AI, Excel, Power BI, SDLC and Softskills.", "usr_teacher", "published")
        )
        print("Seeded Course: Data Science Mastery")

        # Create Aider AI Mastery Course
        course_aider_id = "course_aider_ai"
        client.execute("DELETE FROM courses WHERE id = ?", (course_aider_id,))
        client.execute(
            "INSERT INTO courses (id, title, description, instructor_id, status) VALUES (?, ?, ?, ?, ?)",
            (course_aider_id, "Aider AI Mastery", "Learn how to use Aider, the leading AI pair programming tool.", "usr_teacher", "published")
        )
        print("Seeded Course: Aider AI Mastery")

        # Create Caveman Developer Skill Course
        course_caveman_id = "course_caveman"
        client.execute("DELETE FROM courses WHERE id = ?", (course_caveman_id,))
        client.execute(
            "INSERT INTO courses (id, title, description, instructor_id, status) VALUES (?, ?, ?, ?, ?)",
            (course_caveman_id, "Caveman Developer Skill", "Go back to basics and master low-level programming and offline dev tools.", "usr_teacher", "published")
        )
        print("Seeded Course: Caveman Developer Skill")

        # Define custom order of modules
        module_names = ['Python', 'SQL', 'ML', 'AI', 'Excel', 'Power BI', 'SDLC', 'Softskills']
        
        for idx, mod_name in enumerate(module_names):
            module_id = f"mod_{mod_name.lower().replace(' ', '_')}"
            
            # Insert Global Module
            client.execute(
                "INSERT INTO modules (id, title, description) VALUES (?, ?, ?)",
                (module_id, mod_name, f"Comprehensive guide to {mod_name}")
            )
            
            # Map Module to Data Science Course
            client.execute(
                "INSERT INTO course_module_mapping (course_id, module_id, order_index) VALUES (?, ?, ?)",
                (course_id, module_id, idx)
            )
            
            # Map common modules to Aider AI Course
            if mod_name in ['Python', 'SQL', 'SDLC', 'AI']:
                client.execute(
                    "INSERT INTO course_module_mapping (course_id, module_id, order_index) VALUES (?, ?, ?)",
                    (course_aider_id, module_id, idx)
                )
                print(f"Mapped Module: {mod_name} to course: {course_aider_id}")
                
            # Map common modules to Caveman Course
            if mod_name in ['Python', 'SDLC', 'Softskills']:
                client.execute(
                    "INSERT INTO course_module_mapping (course_id, module_id, order_index) VALUES (?, ?, ?)",
                    (course_caveman_id, module_id, idx)
                )
                print(f"Mapped Module: {mod_name} to course: {course_caveman_id}")
            
            print(f"Mapped Module: {mod_name} to course: {course_id}")
            
            if mod_name not in xl.sheet_names:
                continue
                
            df = xl.parse(mod_name)
            
            for row_idx, row in df.iterrows():
                class_label = clean_value(row.get('Class', f"Class {row_idx + 1}"))
                topics = clean_value(row.get('Topics', 'Core concepts training.'))
                
                class_id = f"class_{mod_name.lower().replace(' ', '_')}_{row_idx + 1}"
                
                # Check if it's the first class of Python, set type to 'live' for testing Jitsi
                class_type = 'live' if (mod_name == 'Python' and row_idx == 0) else 'video'
                
                # Insert class (now into decoupled "classes" table)
                client.execute(
                    "INSERT INTO classes (id, module_id, title, description, meet_link, type, order_index, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (class_id, module_id, f"{mod_name} - {class_label}", topics, "https://meet.jit.si/CynexAI", class_type, row_idx, "draft")
                )
            
            print(f"  -> Seeded {len(df)} classes for {mod_name}")
            
        print("Turso Database successfully seeded from Modules Data.xlsx!")
        
    except Exception as e:
        print("Execution failed:", e)
    finally:
        client.close()

if __name__ == '__main__':
    main()
