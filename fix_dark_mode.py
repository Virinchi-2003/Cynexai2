import os, re
src_dir = 'src'

text_re = re.compile(r'\b(text-(?:gray|slate|zinc|stone|neutral|red|green|blue)-(?:700|800|900|950))\b(?![^\"'']*dark:text-)')
bg_re = re.compile(r'\b(bg-(?:gray|slate|zinc|stone|neutral)-(?:50|100|200))\b(?![^\"'']*dark:bg-)')
border_re = re.compile(r'\b(border-(?:gray|slate|zinc|stone|neutral)-(?:200|300))\b(?![^\"'']*dark:border-)')
bg_white_re = re.compile(r'\b(bg-white)\b(?![^\"'']*dark:bg-)')

count = 0
for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith(('.tsx', '.ts', '.jsx', '.js')):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            orig = content
            # Add dark:text-white where needed
            content = text_re.sub(r'\1 dark:text-white', content)
            # Add dark:bg-zinc-900/50 where needed
            content = bg_re.sub(r'\1 dark:bg-zinc-900/50', content)
            # Add dark:border-white/10 where needed
            content = border_re.sub(r'\1 dark:border-white/10', content)
            # Add dark:bg-black for bg-white
            content = bg_white_re.sub(r'\1 dark:bg-black', content)
            
            if orig != content:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(content)
                count += 1

print(f'Patched {count} files with dark mode utility classes.')
