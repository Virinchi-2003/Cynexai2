import pandas as pd
import json

def main():
    try:
        df = pd.read_excel('Student_Data.xlsx')
        # Clean rows without Teacher or Batch
        df = df.dropna(subset=['Teacher', 'Batch'])

        # Drop rows where 'ID' or 'Names' is null to ensure valid students
        df = df.dropna(subset=['Names'])
        
        # Deduplicate based on 'ID' if present, otherwise 'Names'
        if 'ID' in df.columns:
            df_unique = df.drop_duplicates(subset=['ID']).copy()
        else:
            df_unique = df.drop_duplicates(subset=['Names']).copy()

        students = []
        for index, row in df_unique.iterrows():
            name = str(row['Names']).strip() if pd.notna(row.get('Names')) else f"Student_{index}"
            batch = str(row['Batch']).strip() if pd.notna(row.get('Batch')) else ""
            course = str(row['Course']).strip() if pd.notna(row.get('Course')) else ""
            
            # The columns might be 'Fee' or 'Amount ' depending on version
            total_fee = 0
            if 'Fee' in row and pd.notna(row['Fee']):
                try:
                    total_fee = float(str(row['Fee']).replace(',', ''))
                except ValueError:
                    pass
            
            amount_paid = total_fee # assuming paid in full for now if no amount due is specified
            
            joining_date = "2026-07-01T10:00:00Z"
            if 'Joining date' in row and pd.notna(row['Joining date']):
                joining_date = str(row['Joining date'])

            # Assuming ID is stored in 'ID' column
            stu_id_val = str(row['ID']).strip() if 'ID' in row and pd.notna(row['ID']) else f"stu_{index}"

            students.append({
                "id": stu_id_val,
                "name": name,
                "batch": batch,
                "course": course,
                "amount_paid": amount_paid,
                "total_fee": total_fee,
                "joining_date": joining_date
            })

        with open('students_seed.json', 'w') as f:
            json.dump(students, f, indent=2)
            
        print("Successfully exported students_seed.json!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
