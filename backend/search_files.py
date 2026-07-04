import os

def search_in_files(dir_path, search_str):
    for root, dirs, files in os.walk(dir_path):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if search_str in content:
                            print(f"Found in {file_path}")
                except Exception:
                    pass

search_in_files('../src', 'whatsapp/status')
