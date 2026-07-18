const fs = require('fs');

let content = fs.readFileSync('src/pages/crm/manager/Students.tsx', 'utf8');

// 1. Fix handleModuleAdjust to dynamically create dummy classes to allow incrementing
content = content.replace(
  `        if (res.rows.length > 0) {
          const classId = res.rows[0].id as string;
          await client.execute({
            sql: \`INSERT INTO student_progress (id, student_id, lesson_id, completed, created_at) VALUES (?, ?, ?, 1, ?)\`,
            args: [\`sp_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`, selectedStudent.id, classId, new Date().toISOString()]
          });
        }`,
  `        let classId;
        if (res.rows.length > 0) {
          classId = res.rows[0].id as string;
        } else {
          // Auto-generate a dummy class if none exist, so progress can be incremented anyway
          classId = \`cls_dummy_\${Date.now()}\`;
          await client.execute({
            sql: \`INSERT INTO classes (id, module_id, title, order_index) VALUES (?, ?, 'Manual Progress Step', 999)\`,
            args: [classId, moduleId]
          });
        }
        await client.execute({
          sql: \`INSERT INTO student_progress (id, student_id, lesson_id, completed, created_at) VALUES (?, ?, ?, 1, ?)\`,
          args: [\`sp_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`, selectedStudent.id, classId, new Date().toISOString()]
        });`
);

// Disable condition for Add button should be relaxed
content = content.replace(
  `<button onClick={() => handleModuleAdjust(mod.id, 'add')} disabled={done >= total || detailLoading}`,
  `<button onClick={() => handleModuleAdjust(mod.id, 'add')} disabled={detailLoading}`
);


// 2. Change batch to datalist input
content = content.replace(
  `                    <div>
                      <label className="text-xs font-bold mb-1 block">Batch</label>
                      <select className={inputCls} value={stuBatch} onChange={e=>setStuBatch(e.target.value)}>
                        <option value="">Select Batch</option>
                        {batches.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>`,
  `                    <div>
                      <label className="text-xs font-bold mb-1 block">Batch</label>
                      <input 
                        list="batch-options" 
                        className={inputCls} 
                        value={stuBatch} 
                        onChange={e=>setStuBatch(e.target.value)} 
                        placeholder="Select or type new batch"
                      />
                      <datalist id="batch-options">
                        {batches.map(b => <option key={b} value={b} />)}
                      </datalist>
                    </div>`
);

// 3. Decrypt and load password in handleEditStudent
content = content.replace(
  `        setPassword('');`,
  `        const uRes = await client.execute({ sql: 'SELECT password_encrypted FROM users WHERE email = ?', args: [r.portal_login_email || r.email] });
        if (uRes.rows.length > 0 && uRes.rows[0].password_encrypted) {
          try {
            setPassword(decryptPassword(uRes.rows[0].password_encrypted as string));
          } catch(e) { setPassword(''); }
        } else {
          setPassword('');
        }`
);

fs.writeFileSync('src/pages/crm/manager/Students.tsx', content, 'utf8');

// Ensure decryptPassword is imported in Students.tsx
if (!content.includes("decryptPassword")) {
    const lines = content.split('\\n');
    const cryptoImportIndex = lines.findIndex(l => l.includes("lib/crypto"));
    if (cryptoImportIndex !== -1) {
       // Append decryptPassword to existing import
    } else {
       // Not imported at all, add it near the top
       const lastImport = lines.findLastIndex(l => l.startsWith('import '));
       lines.splice(lastImport + 1, 0, "import { decryptPassword } from '../../../lib/crypto';");
       fs.writeFileSync('src/pages/crm/manager/Students.tsx', lines.join('\\n'), 'utf8');
    }
}

console.log('Students.tsx update completed.');
