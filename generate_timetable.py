import pandas as pd
import json

df = pd.read_excel('Student_Data.xlsx')

try:
    xls_mod = pd.ExcelFile('Modules Data.xlsx')
    module_totals = {}
    for sheet in xls_mod.sheet_names:
        df_mod = pd.read_excel(xls_mod, sheet_name=sheet)
        module_totals[sheet.lower()] = len(df_mod.dropna(subset=['Topics'])) if 'Topics' in df_mod.columns else len(df_mod.dropna())
except:
    module_totals = {}

# Clean rows without Teacher or Batch
df = df.dropna(subset=['Teacher', 'Batch'])

# Map teacher names to IDs
TEACHER_MAP = {
    'Venkatesh': 'usr_venkatesh',
    'Prudhvi': 'usr_prudhvi'
}

data = {}

for index, row in df.iterrows():
    teacher_name = str(row['Teacher']).strip()
    teacher_id = TEACHER_MAP.get(teacher_name)
    if not teacher_id:
        continue
        
    batch_raw = str(row['Batch']).strip()
    if batch_raw.lower() == 'batch':
        continue
    batch_name = f"Batch {batch_raw}"
    
    course = str(row['Course']).strip()
    timing = str(row['Timing']).strip()
    module_name = str(row['Modules']).strip()
    if module_name == 'nan':
        module_name = 'General'
        
    classes_completed_raw = row['Class Number (Modules Data)']
    classes_completed = int(classes_completed_raw) if pd.notna(classes_completed_raw) else 0
    
    if teacher_id not in data:
        data[teacher_id] = {
            'batches': {},
            'timetable': []
        }
        
    batch_key = f"{batch_name}_{course}"
    total_classes = module_totals.get(module_name.lower(), max(30, classes_completed + 10))
    
    if batch_key not in data[teacher_id]['batches']:
        data[teacher_id]['batches'][batch_key] = {
            'id': batch_key.replace(" ", "_").lower(),
            'name': batch_name,
            'course': course,
            'timing': timing,
            'progress': {
                'modules': [
                    {'title': module_name, 'completed': classes_completed, 'total': total_classes}
                ]
            }
        }
    else:
        # Check if module exists
        mods = data[teacher_id]['batches'][batch_key]['progress']['modules']
        found = False
        for m in mods:
            if m['title'] == module_name:
                if classes_completed > m['completed']:
                    m['completed'] = classes_completed
                found = True
                break
        if not found:
            mods.append({'title': module_name, 'completed': classes_completed, 'total': total_classes})

# Generate Timetable (Mon-Fri)
for teacher_id, t_data in data.items():
    timetable = []
    for batch_key, batch_info in t_data['batches'].items():
        # Mon=1, Tue=2, Wed=3, Thu=4, Fri=5
        for day in range(1, 6):
            timetable.append({
                'day': day,
                'time': batch_info['timing'],
                'batchId': batch_info['id'],
                'batchName': batch_info['name'],
                'course': batch_info['course']
            })
    t_data['timetable'] = timetable

# Convert dict to list for batches
for teacher_id in data:
    data[teacher_id]['batches'] = list(data[teacher_id]['batches'].values())

with open('src/data/timetable.json', 'w') as f:
    json.dump(data, f, indent=2)

print("Generated src/data/timetable.json successfully!")

