const fs = require('fs');

let content = fs.readFileSync('src/pages/crm/manager/Students.tsx', 'utf8');

// 1. Update the query to fetch the name from users table if missing
content = content.replace(
  `s.id, s.name, s.portal_login_email as email, s.phone, s.course,`,
  `s.id, COALESCE(s.name, (SELECT name FROM users u WHERE u.email = s.portal_login_email)) as name, s.portal_login_email as email, s.phone, s.course,`
);

// 2. Import saveStudent
content = content.replace(
  `bulkImportStudents, saveUser, updateStudentProfile`,
  `bulkImportStudents, saveStudent, updateStudentProfile, patchUser`
);

// 3. Fix handleSaveStudent to use saveStudent and include all fields
const oldHandleSave = `  const handleSaveStudent = async () => {
    if (!name.trim() || !email.trim()) { alert('Name and email required.'); return; }
    try {
      await saveUser({ id: '', name, email, password, role: 'Student', status, salary: 0, permissions_json: '{}' });
      await updateStudentProfile(email, {
        phone: stuPhone,
        course: stuCourse, batch_number: stuBatch, status,
      });
      await loadData();
      setIsStudentModalOpen(false);
      setName(''); setEmail(''); setPassword(''); setStuPhone(''); setStuCourse(''); setStuBatch('');
    } catch (e) {
      console.error(e);
      alert('Failed to save student.');
    }
  };`;

const newHandleSave = `  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  
  // Extended fields
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [feesTotal, setFeesTotal] = useState<number | ''>('');
  const [feesPaid, setFeesPaid] = useState<number | ''>('');
  const [joiningDate, setJoiningDate] = useState('');

  const handleEditStudent = async (stu: any) => {
    setEditStudentId(stu.id);
    setName(stu.name || '');
    setEmail(stu.email || '');
    setPassword('');
    setStuPhone(stu.phone || '');
    setStuCourse(stu.course || '');
    setStuBatch(stu.batch_number || '');
    setStatus(stu.status || 'Active');
    
    // Fetch full student profile
    try {
      const res = await client.execute({ sql: 'SELECT * FROM students WHERE id = ?', args: [stu.id] });
      if (res.rows.length > 0) {
        const r = res.rows[0];
        setDob(r.dob as string || '');
        setAddress(r.address as string || '');
        setGender(r.gender as string || '');
        setBloodGroup(r.blood_group as string || '');
        setFeesTotal(r.fees_total as number || '');
        setFeesPaid(r.fees_paid as number || '');
        setJoiningDate(r.joining_date as string || '');
      }
    } catch(e) {}
    
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = async () => {
    if (!name.trim() || !email.trim()) { alert('Name and email required.'); return; }
    try {
      const studentData = {
        id: editStudentId ? (await client.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] })).rows[0]?.id : undefined,
        name, email, password, status, phone: stuPhone, course: stuCourse, batch_number: stuBatch,
        joining_date: joiningDate
      };
      
      if (!editStudentId) {
        await saveStudent(studentData);
      } else {
        // Update user
        if (studentData.id) {
          await patchUser(studentData.id, { name, email, phone: stuPhone, status });
        }
      }
      
      // Update student profile
      await updateStudentProfile(email, {
        name, phone: stuPhone, course: stuCourse, batch_number: stuBatch, status,
        dob, address, gender, blood_group: bloodGroup, 
        fees_total: Number(feesTotal) || 0, 
        fees_paid: Number(feesPaid) || 0,
        joining_date: joiningDate
      });

      await loadData();
      setIsStudentModalOpen(false);
      setEditStudentId(null);
      setName(''); setEmail(''); setPassword(''); setStuPhone(''); setStuCourse(''); setStuBatch('');
      setDob(''); setAddress(''); setGender(''); setBloodGroup(''); setFeesTotal(''); setFeesPaid(''); setJoiningDate('');
    } catch (e) {
      console.error(e);
      alert('Failed to save student.');
    }
  };`;

content = content.replace(oldHandleSave, newHandleSave);

// 4. Update the "Add Student" button to reset the form
content = content.replace(
  `<Button onClick={() => setIsStudentModalOpen(true)}>`,
  `<Button onClick={() => { setEditStudentId(null); setName(''); setEmail(''); setPassword(''); setStuPhone(''); setStuCourse(''); setStuBatch(''); setStatus('Active'); setDob(''); setAddress(''); setGender(''); setBloodGroup(''); setFeesTotal(''); setFeesPaid(''); setJoiningDate(''); setIsStudentModalOpen(true); }}>`
);

// 5. Add the "Edit" button to the Student Profile panel
content = content.replace(
  `<h2 className="font-black text-erp-text text-base">Student Profile</h2>`,
  `<h2 className="font-black text-erp-text text-base">Student Profile</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => handleEditStudent(selectedStudent)} className="text-indigo-400 hover:text-indigo-500 text-sm font-bold flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Edit</button>`
);
content = content.replace(
  `<button onClick={() => setSelectedStudent(null)} className="text-erp-text/40 hover:text-erp-text"><X className="w-5 h-5" /></button>
          </div>`,
  `  <button onClick={() => setSelectedStudent(null)} className="text-erp-text/40 hover:text-erp-text"><X className="w-5 h-5" /></button>
            </div>
          </div>`
);

// 6. Update the Modal to show all fields
const oldModalGrid = `<div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold mb-1 block">Name *</label><input className={inputCls} value={name} onChange={e=>setName(e.target.value)} /></div>
                <div><label className="text-xs font-bold mb-1 block">Email *</label><input className={inputCls} value={email} onChange={e=>setEmail(e.target.value)} /></div>
                <div><label className="text-xs font-bold mb-1 block">Password</label><input className={inputCls} value={password} onChange={e=>setPassword(e.target.value)} placeholder="cynex123" /></div>
                <div><label className="text-xs font-bold mb-1 block">Course</label><input className={inputCls} value={stuCourse} onChange={e=>setStuCourse(e.target.value)} /></div>
                <div><label className="text-xs font-bold mb-1 block">Batch</label><input className={inputCls} value={stuBatch} onChange={e=>setStuBatch(e.target.value)} /></div>
                <div><label className="text-xs font-bold mb-1 block">Phone</label><input className={inputCls} value={stuPhone} onChange={e=>setStuPhone(e.target.value)} /></div>
              </div>`;

const newModalGrid = `<div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-erp-text mb-3 uppercase tracking-wider text-erp-text/50">Basic Info</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold mb-1 block">Name *</label><input className={inputCls} value={name} onChange={e=>setName(e.target.value)} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Email *</label><input className={inputCls} value={email} onChange={e=>setEmail(e.target.value)} disabled={!!editStudentId} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Password</label><input className={inputCls} value={password} onChange={e=>setPassword(e.target.value)} placeholder={editStudentId ? "Leave blank to keep" : "cynex123"} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Phone</label><input className={inputCls} value={stuPhone} onChange={e=>setStuPhone(e.target.value)} /></div>
                    <div><label className="text-xs font-bold mb-1 block">DOB</label><input type="date" className={inputCls} value={dob} onChange={e=>setDob(e.target.value)} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Gender</label><select className={inputCls} value={gender} onChange={e=>setGender(e.target.value)}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                    <div className="col-span-2"><label className="text-xs font-bold mb-1 block">Address</label><input className={inputCls} value={address} onChange={e=>setAddress(e.target.value)} /></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black text-erp-text mb-3 uppercase tracking-wider text-erp-text/50">Enrollment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold mb-1 block">Course</label><input className={inputCls} value={stuCourse} onChange={e=>setStuCourse(e.target.value)} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Batch</label><input className={inputCls} value={stuBatch} onChange={e=>setStuBatch(e.target.value)} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Joining Date</label><input type="date" className={inputCls} value={joiningDate} onChange={e=>setJoiningDate(e.target.value)} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Status</label><select className={inputCls} value={status} onChange={e=>setStatus(e.target.value)}><option value="Active">Active</option><option value="Suspended">Suspended</option><option value="Alumni">Alumni</option></select></div>
                    <div><label className="text-xs font-bold mb-1 block">Fees Total</label><input type="number" className={inputCls} value={feesTotal} onChange={e=>setFeesTotal(Number(e.target.value))} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Fees Paid</label><input type="number" className={inputCls} value={feesPaid} onChange={e=>setFeesPaid(Number(e.target.value))} /></div>
                  </div>
                </div>
              </div>`;

content = content.replace(oldModalGrid, newModalGrid);

content = content.replace(
  `<h2 className="font-bold text-xl">Add New Student</h2>`,
  `<h2 className="font-bold text-xl">{editStudentId ? 'Edit Student' : 'Add New Student'}</h2>`
);
content = content.replace(
  `<Button variant="primary" onClick={handleSaveStudent}>Add Student</Button>`,
  `<Button variant="primary" onClick={handleSaveStudent}>{editStudentId ? 'Save Changes' : 'Add Student'}</Button>`
);

fs.writeFileSync('src/pages/crm/manager/Students.tsx', content, 'utf8');
