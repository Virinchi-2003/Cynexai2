import os
import sys
import uuid
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(dotenv_path='../.env')

url = os.getenv('VITE_TURSO_DATABASE_URL')
if url and url.startswith('libsql://'):
    url = url.replace('libsql://', 'https://')
auth_token = os.getenv('VITE_TURSO_AUTH_TOKEN')

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
    
    res = requests.post(f"{url}/v2/pipeline", headers=headers, json=payload)
    res.raise_for_status()
    data = res.json()
    if "error" in data["results"][0]:
        raise Exception(f"SQL Error: {data['results'][0]['error']['message']}")
    return data["results"][0]["response"]["result"]

def main():
    teachers = [
        {"id": "usr_venkatesh", "name": "Venkatesh", "email": "venkatesh@cynexai.com", "pass": "admin123"},
        {"id": "usr_prudhvi", "name": "Prudhvi", "email": "prudhvi@cynexai.com", "pass": "admin123"}
    ]
    
    for t in teachers:
        try:
            execute_sql("DELETE FROM erp_users WHERE id = ?", [t["id"]])
            execute_sql(
                "INSERT INTO erp_users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                [t["id"], t["name"], t["email"], t["pass"], "Teacher", datetime.now().isoformat()]
            )
            print(f"Created teacher: {t['name']}")
        except Exception as e:
            print(f"Failed to create {t['name']}: {e}")

    # Modules
    res_modules = execute_sql("SELECT id, title FROM modules")
    modules = {row[1]["value"].lower(): row[0]["value"] for row in res_modules.get("rows", [])}
    
    # Assign SQL and ML to Venkatesh
    sql_id = next((mid for title, mid in modules.items() if 'sql' in title), None)
    ml_id = next((mid for title, mid in modules.items() if 'ml' in title or 'machine learning' in title), None)
    
    if sql_id:
        execute_sql("UPDATE modules SET instructor_id = ? WHERE id = ?", ["usr_venkatesh", sql_id])
        print("Assigned SQL to Venkatesh")
        
    if ml_id:
        execute_sql("UPDATE modules SET instructor_id = ? WHERE id = ?", ["usr_venkatesh", ml_id])
        print("Assigned ML to Venkatesh")
        
    # Assign Python to Prudhvi
    py_id = next((mid for title, mid in modules.items() if 'python' in title), None)
    if py_id:
        execute_sql("UPDATE modules SET instructor_id = ? WHERE id = ?", ["usr_prudhvi", py_id])
        print("Assigned Python to Prudhvi")

if __name__ == '__main__':
    main()
