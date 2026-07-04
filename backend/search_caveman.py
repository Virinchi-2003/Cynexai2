import os

def search_in_files(dir_path, query1, query2):
    for root, dirs, files in os.walk(dir_path):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json', '.md')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if query1.lower() in content.lower() or query2.lower() in content.lower():
                            print(f"Found in {file_path}")
                except Exception:
                    pass

search_in_files('../', 'caveman', 'ardia')
