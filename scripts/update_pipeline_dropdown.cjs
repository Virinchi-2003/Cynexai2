const fs = require('fs');
let code = fs.readFileSync('src/pages/crm/LeadPipeline.tsx', 'utf8');

// 1. Add state for courses
if (!code.includes('const [courses, setCourses]')) {
    code = code.replace(
        'const [onboardForm, setOnboardForm] = useState({',
        'const [courses, setCourses] = useState<string[]>([]);\n  const [onboardForm, setOnboardForm] = useState({'
    );
}

// 2. Fetch courses in loadData
if (!code.includes('setCourses(cRes.rows.map(r => r.title')) {
    code = code.replace(
        'const data = await getLeads(filters);',
        `const data = await getLeads(filters);
      if (client) {
        const cRes = await client.execute('SELECT title FROM courses ORDER BY title');
        setCourses(cRes.rows.map(r => r.title as string));
      }`
    );
}

// 3. Replace course input with datalist
const oldOnboardCourse = `<div>
                  <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Course</label>
                  <input type="text" required value={onboardForm.course} onChange={e => setOnboardForm({...onboardForm, course: e.target.value})} className="w-full bg-erp-background border-2 border-erp-border rounded-xl px-3 py-2 text-erp-text focus:outline-none focus:border-erp-primary text-sm" />
                </div>`;

const newOnboardCourse = `<div>
                  <label className="block text-xs font-bold text-erp-text/60 mb-1.5">Course</label>
                  <input 
                    list="onboard-course-options"
                    type="text" 
                    required 
                    value={onboardForm.course} 
                    onChange={e => setOnboardForm({...onboardForm, course: e.target.value})} 
                    className="w-full bg-erp-background border-2 border-erp-border rounded-xl px-3 py-2 text-erp-text focus:outline-none focus:border-erp-primary text-sm" 
                    placeholder="Select or type course" 
                  />
                  <datalist id="onboard-course-options">
                    {courses.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>`;

code = code.replace(oldOnboardCourse, newOnboardCourse);

fs.writeFileSync('src/pages/crm/LeadPipeline.tsx', code, 'utf8');
console.log('Fixed Pipeline courses dropdown');
