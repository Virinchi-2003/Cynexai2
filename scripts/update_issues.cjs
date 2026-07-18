const fs = require('fs');

// 1. Fix AsanaTaskApp.tsx
let asanaContent = fs.readFileSync('src/components/crm/tasks/AsanaTaskApp.tsx', 'utf8');
asanaContent = asanaContent.replace(
  `    if (user && isManagerOrAbove) {
      getErpUsers().then(setUsers);
    }`,
  `    if (user) {
      getErpUsers().then(setUsers);
    }`
);
fs.writeFileSync('src/components/crm/tasks/AsanaTaskApp.tsx', asanaContent, 'utf8');

// 2. Fix users.ts to save permissions
let usersApiContent = fs.readFileSync('src/lib/api/users.ts', 'utf8');
usersApiContent = usersApiContent.replace(
  `"UPDATE users SET name=?, email=?, phone=?, role=?, salary=?, status=?, password_hash=?, password_encrypted=? WHERE id=?",
        [user.name, user.email, user.phone || '', user.role, salary, status, encPw, encPw, user.id]`,
  `"UPDATE users SET name=?, email=?, phone=?, role=?, salary=?, status=?, password_hash=?, password_encrypted=?, permissions_json=? WHERE id=?",
        [user.name, user.email, user.phone || '', user.role, salary, status, encPw, encPw, user.permissions_json, user.id]`
);
usersApiContent = usersApiContent.replace(
  `"INSERT INTO users (id, name, email, phone, role, salary, status, password_hash, password_encrypted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [newId, user.name, user.email, user.phone || '', user.role, salary, status, encPw, encPw]`,
  `"INSERT INTO users (id, name, email, phone, role, salary, status, password_hash, password_encrypted, permissions_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [newId, user.name, user.email, user.phone || '', user.role, salary, status, encPw, encPw, user.permissions_json]`
);
fs.writeFileSync('src/lib/api/users.ts', usersApiContent, 'utf8');

// 3. Fix Students.tsx
let studentsContent = fs.readFileSync('src/pages/crm/manager/Students.tsx', 'utf8');

// Fix the dropdown queries
studentsContent = studentsContent.replace(
  `const cRes = await client.execute({ sql: \`SELECT DISTINCT course FROM students WHERE course IS NOT NULL AND course != '' ORDER BY course\`, args: [] }).catch(() => ({ rows: [] }));`,
  `const cRes = await client.execute({ sql: \`SELECT title FROM courses ORDER BY title\`, args: [] }).catch(() => ({ rows: [] }));`
);
studentsContent = studentsContent.replace(
  `const bRes = await client.execute({ sql: \`SELECT DISTINCT batch_number FROM students WHERE batch_number IS NOT NULL AND batch_number != '' ORDER BY batch_number\`, args: [] }).catch(() => ({ rows: [] }));`,
  `const bRes = await client.execute({ sql: \`SELECT name FROM batches ORDER BY name\`, args: [] }).catch(() => ({ rows: [] }));`
);
studentsContent = studentsContent.replace(
  `setCourses(cRes.rows.map((r: any) => r.course).filter(Boolean));`,
  `setCourses(cRes.rows.map((r: any) => r.title).filter(Boolean));`
);

// Fix the UI for "Existing Student" instead of "Docs Submitted" as number
studentsContent = studentsContent.replace(
  `const [documentsSubmitted, setDocumentsSubmitted] = useState<number | ''>('');`,
  `const [documentsSubmitted, setDocumentsSubmitted] = useState<number | ''>(0);`
);

studentsContent = studentsContent.replace(
  `<div><label className="text-xs font-bold mb-1 block">Docs Submitted</label><input type="number" className={inputCls} value={documentsSubmitted} onChange={e=>setDocumentsSubmitted(Number(e.target.value))} /></div>`,
  `<div>
     <label className="text-xs font-bold mb-1 block">Existing Student?</label>
     <select className={inputCls} value={documentsSubmitted === 1 ? 'Y' : 'N'} onChange={e=>setDocumentsSubmitted(e.target.value === 'Y' ? 1 : 0)}>
       <option value="Y">Y</option>
       <option value="N">N</option>
     </select>
   </div>`
);

// Add better error handling to the handleSaveStudent catch
studentsContent = studentsContent.replace(
  `    } catch (e) {
      console.error(e);
      alert('Failed to save student.');
    }`,
  `    } catch (e: any) {
      console.error(e);
      alert('Failed to save student. ' + (e.message || ''));
    }`
);

fs.writeFileSync('src/pages/crm/manager/Students.tsx', studentsContent, 'utf8');

console.log('Update script completed successfully.');
