import pandas as pd
import os
import sys
import requests
import json
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
    
    # Format arguments for Turso API
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
            {
                "type": "close"
            }
        ]
    }
    
    try:
        res = requests.post(f"{url}/v2/pipeline", headers=headers, json=payload)
        res.raise_for_status()
        data = res.json()
        
        # Check for error in pipeline results
        if "error" in data["results"][0]:
            raise Exception(f"SQL Error: {data['results'][0]['error']['message']}")
            
        return data["results"][0]["response"]["result"]
    except Exception as e:
        raise Exception(f"Failed to execute query: {stmt}. Error: {e}")

def main():
    try:
        print("Reading Student_Data.xlsx...")
        xl = pd.ExcelFile('../Student_Data.xlsx')
        df = xl.parse(xl.sheet_names[0])
        print(f"Loaded {len(df)} rows. Processing students...")
        
        count = 0
        for idx, row in df.iterrows():
            student_id = str(row.get('ID', '')).strip()
            name = str(row.get('Names', '')).strip()
            
            if not student_id or pd.isna(student_id) or student_id.lower() == 'nan':
                continue
            if not name or pd.isna(name) or name.lower() == 'nan':
                name = f"Student {student_id}"
                
            email = f"{student_id.lower()}@student.cynexai.com"
            password = "password123"
            role = "Student"
            
            try:
                # Check if user already exists
                res = execute_sql("SELECT id FROM erp_users WHERE id = ?", [student_id])
                if len(res.get("rows", [])) == 0:
                    execute_sql(
                        "INSERT INTO erp_users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
                        [student_id, name, email, password, role]
                    )
                    count += 1
                    
                lead_id = f"lead_{student_id}"
                l_res = execute_sql("SELECT id FROM crm_leads WHERE id = ?", [lead_id])
                if len(l_res.get("rows", [])) == 0:
                    execute_sql(
                        "INSERT INTO crm_leads (id, name, email, status) VALUES (?, ?, ?, ?)",
                        [lead_id, name, email, "Closed Won"]
                    )
                
                a_res = execute_sql("SELECT id FROM admissions WHERE id = ?", [f"adm_{student_id}"])
                if len(a_res.get("rows", [])) == 0:
                    execute_sql(
                        "INSERT INTO admissions (id, lead_id, amount, status) VALUES (?, ?, ?, ?)",
                        [f"adm_{student_id}", lead_id, 0.0, "converted"]
                    )
            except Exception as row_err:
                print(f"Skipping student {student_id} due to error: {row_err}")
                
        print(f"Successfully seeded {count} students into erp_users and admissions.")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Execution failed:", e)

if __name__ == '__main__':
    main()
