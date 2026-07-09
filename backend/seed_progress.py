import pandas as pd
import os
import sys
import uuid
from datetime import datetime
import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

url = os.getenv('VITE_TURSO_DATABASE_URL')
if url and url.startswith('libsql://'):
    url = url.replace('libsql://', 'https://')
auth_token = os.getenv('VITE_TURSO_AUTH_TOKEN')

if not url or not auth_token:
    print("Missing Turso environment variables.")
    sys.exit(1)

def execute_sql(stmt, args=None):
    if args is None:
        args = []
    headers = {
        'Authorization': f'Bearer {auth_token}',
        'Content-Type': 'application/json'
    }
    formatted_args = []
    for arg in args:
        if isinstance(arg, int):
            formatted_args.append({"type": "integer", "value": str(arg)})
        elif isinstance(arg, float):
            formatted_args.append({"type": "float", "value": float(arg)})
        elif arg is None:
            formatted_args.append({"type": "null"})
        else:
            formatted_args.append({"type": "text", "value": str(arg)})
            
    payload = {
        "requests": [
            {
                "type": "execute",
                "stmt": {
                    "sql": stmt,
                    "args": formatted_args
                }
            },
            {"type": "close"}
        ]
    }
    
    try:
        res = requests.post(f"{url}/v2/pipeline", headers=headers, json=payload)
        res.raise_for_status()
        data = res.json()
        if "error" in data["results"][0]:
            raise Exception(f"SQL Error: {data['results'][0]['error']['message']}")
        return data["results"][0]["response"]["result"]
    except Exception as e:
        raise Exception(f"Failed to execute query: {stmt}. Error: {e}")

def main():
    try:
        # Get active course id
        res_course = execute_sql("SELECT id FROM courses ORDER BY created_at ASC LIMIT 1")
        if not res_course.get("rows"):
            print("No course found in DB.")
            return
        course_id = res_course["rows"][0][0]["value"]
        print(f"Active Course ID: {course_id}")

        # Get modules mapping
        res_modules = execute_sql("SELECT id, title FROM modules")
        modules = {row[1]["value"].lower(): row[0]["value"] for row in res_modules.get("rows", [])}
        print(f"Found {len(modules)} modules in DB.")

        print("Reading Student_Data.xlsx...")
        xl = pd.ExcelFile('../Student_Data.xlsx')
        df = xl.parse(xl.sheet_names[0])
        print(f"Loaded {len(df)} entries.")
        
        inserted = 0
        
        for idx, row in df.iterrows():
            student_id = str(row.get('ID', '')).strip()
            if not student_id or pd.isna(student_id) or student_id.lower() == 'nan':
                continue
                
            module_name = str(row.get('Modules', '')).strip().lower()
            if not module_name or pd.isna(module_name) or module_name == 'nan':
                continue
                
            class_num_raw = row.get('Class Number (Modules Data)')
            if pd.isna(class_num_raw):
                continue
                
            try:
                class_num = int(float(class_num_raw))
            except:
                continue

            # Map to module id
            mod_id = None
            for title, mid in modules.items():
                if module_name in title or title in module_name:
                    mod_id = mid
                    break
            
            if not mod_id:
                print(f"Skipping row {idx}: Could not map module '{module_name}' to any of {list(modules.keys())}")
                continue
                
            # Fetch classes for this module ordered by order_index
            res_classes = execute_sql("SELECT id FROM classes WHERE module_id = ? ORDER BY order_index ASC", [mod_id])
            class_rows = res_classes.get("rows", [])
            
            # We want to mark the first `class_num` classes as completed
            classes_to_complete = class_rows[:class_num]
            if len(classes_to_complete) > 0:
                print(f"Inserting {len(classes_to_complete)} classes for student {student_id} in {module_name}")
            
            for crow in classes_to_complete:
                class_id = crow[0]["value"]
                
                # Check if already exists
                check_res = execute_sql("SELECT id FROM student_progress WHERE student_id = ? AND lesson_id = ?", [student_id, class_id])
                if len(check_res.get("rows", [])) == 0:
                    prog_id = str(uuid.uuid4())
                    execute_sql(
                        "INSERT INTO student_progress (id, student_id, course_id, lesson_id, completed, progress_percentage, last_accessed) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [prog_id, student_id, course_id, class_id, 1, 100, datetime.now().isoformat()]
                    )
                    inserted += 1

        print(f"Successfully inserted {inserted} class completion records into student_progress.")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Execution failed:", e)

if __name__ == '__main__':
    main()
