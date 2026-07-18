const fs = require('fs');

let content = fs.readFileSync('src/pages/crm/manager/Students.tsx', 'utf8');

// 1. Fix the SQL error in openStudentDetail
content = content.replace(
  `WHERE (co.name = ? OR co.title = ?)`,
  `WHERE (co.title = ?)`
);
content = content.replace(
  `args: [stu.id, stu.course || '', stu.course || ''],`,
  `args: [stu.id, stu.course || ''],`
);

// 2. Remove "Manage Staff" button
content = content.replace(
  `            <Button variant="secondary" onClick={() => navigate('/user-management')}>
              <Edit2 className="w-4 h-4 mr-2" /> Manage Staff
            </Button>`,
  ``
);

// 3. Add more fields to state and handleEditStudent
const stateStr = `  const [joiningDate, setJoiningDate] = useState('');`;
const newStateStr = `  const [joiningDate, setJoiningDate] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [trainingStartDate, setTrainingStartDate] = useState('');
  const [topicCompleted, setTopicCompleted] = useState('');
  const [documentsSubmitted, setDocumentsSubmitted] = useState<number | ''>('');`;

content = content.replace(stateStr, newStateStr);

const fetchProfileStr = `        setFeesPaid(r.fees_paid as number || '');
        setJoiningDate(r.joining_date as string || '');`;
const newFetchProfileStr = `        setFeesPaid(r.fees_paid as number || '');
        setJoiningDate(r.joining_date as string || '');
        setFatherName(r.father_name as string || '');
        setMotherName(r.mother_name as string || '');
        setEmergencyContact(r.emergency_contact as string || '');
        setTrainingStartDate(r.training_start_date as string || '');
        setTopicCompleted(r.topic_completed as string || '');
        setDocumentsSubmitted(r.documents_submitted as number || '');`;

content = content.replace(fetchProfileStr, newFetchProfileStr);

const saveProfileStr = `        fees_paid: Number(feesPaid) || 0,
        joining_date: joiningDate
      });`;
const newSaveProfileStr = `        fees_paid: Number(feesPaid) || 0,
        joining_date: joiningDate,
        father_name: fatherName,
        mother_name: motherName,
        emergency_contact: emergencyContact,
        training_start_date: trainingStartDate,
        topic_completed: topicCompleted,
        documents_submitted: Number(documentsSubmitted) || 0
      });`;

content = content.replace(saveProfileStr, newSaveProfileStr);

const resetStr = `setDob(''); setAddress(''); setGender(''); setBloodGroup(''); setFeesTotal(''); setFeesPaid(''); setJoiningDate('');`;
const newResetStr = `setDob(''); setAddress(''); setGender(''); setBloodGroup(''); setFeesTotal(''); setFeesPaid(''); setJoiningDate(''); setFatherName(''); setMotherName(''); setEmergencyContact(''); setTrainingStartDate(''); setTopicCompleted(''); setDocumentsSubmitted('');`;
content = content.replace(resetStr, newResetStr);

// Also reset on Add Student button
content = content.replace(
  `setJoiningDate(''); setIsStudentModalOpen(true); }>`,
  `setJoiningDate(''); setFatherName(''); setMotherName(''); setEmergencyContact(''); setTrainingStartDate(''); setTopicCompleted(''); setDocumentsSubmitted(''); setIsStudentModalOpen(true); }>`
);

// 4. Update the Modal Grid to include dropdowns and new fields
const oldModalGrid = `                <div>
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
                </div>`;

const newModalGrid = `                <div>
                  <h3 className="text-sm font-black text-erp-text mb-3 uppercase tracking-wider text-erp-text/50">Basic Info</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold mb-1 block">Name *</label><input className={inputCls} value={name} onChange={e=>setName(e.target.value)} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Email *</label><input className={inputCls} value={email} onChange={e=>setEmail(e.target.value)} disabled={!!editStudentId} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Password</label><input className={inputCls} value={password} onChange={e=>setPassword(e.target.value)} placeholder={editStudentId ? "Leave blank to keep" : "cynex123"} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Phone</label><input className={inputCls} value={stuPhone} onChange={e=>setStuPhone(e.target.value)} /></div>
                    <div><label className="text-xs font-bold mb-1 block">DOB</label><input type="date" className={inputCls} value={dob} onChange={e=>setDob(e.target.value)} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Gender</label><select className={inputCls} value={gender} onChange={e=>setGender(e.target.value)}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                    <div><label className="text-xs font-bold mb-1 block">Blood Group</label><input className={inputCls} value={bloodGroup} onChange={e=>setBloodGroup(e.target.value)} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Emergency Contact</label><input className={inputCls} value={emergencyContact} onChange={e=>setEmergencyContact(e.target.value)} /></div>
                    <div className="col-span-2"><label className="text-xs font-bold mb-1 block">Address</label><input className={inputCls} value={address} onChange={e=>setAddress(e.target.value)} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Father's Name</label><input className={inputCls} value={fatherName} onChange={e=>setFatherName(e.target.value)} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Mother's Name</label><input className={inputCls} value={motherName} onChange={e=>setMotherName(e.target.value)} /></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black text-erp-text mb-3 uppercase tracking-wider text-erp-text/50">Enrollment & Progress</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold mb-1 block">Course</label>
                      <select className={inputCls} value={stuCourse} onChange={e=>setStuCourse(e.target.value)}>
                        <option value="">Select Course</option>
                        {courses.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold mb-1 block">Batch</label>
                      <select className={inputCls} value={stuBatch} onChange={e=>setStuBatch(e.target.value)}>
                        <option value="">Select Batch</option>
                        {batches.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div><label className="text-xs font-bold mb-1 block">Joining Date</label><input type="date" className={inputCls} value={joiningDate} onChange={e=>setJoiningDate(e.target.value)} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Training Start Date</label><input type="date" className={inputCls} value={trainingStartDate} onChange={e=>setTrainingStartDate(e.target.value)} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Status</label><select className={inputCls} value={status} onChange={e=>setStatus(e.target.value)}><option value="Active">Active</option><option value="Suspended">Suspended</option><option value="Alumni">Alumni</option></select></div>
                    <div><label className="text-xs font-bold mb-1 block">Topic Completed</label><input className={inputCls} value={topicCompleted} onChange={e=>setTopicCompleted(e.target.value)} placeholder="e.g. 10/20" /></div>
                    <div><label className="text-xs font-bold mb-1 block">Fees Total</label><input type="number" className={inputCls} value={feesTotal} onChange={e=>setFeesTotal(Number(e.target.value))} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Fees Paid</label><input type="number" className={inputCls} value={feesPaid} onChange={e=>setFeesPaid(Number(e.target.value))} /></div>
                    <div><label className="text-xs font-bold mb-1 block">Docs Submitted</label><input type="number" className={inputCls} value={documentsSubmitted} onChange={e=>setDocumentsSubmitted(Number(e.target.value))} /></div>
                  </div>
                </div>`;

content = content.replace(oldModalGrid, newModalGrid);

fs.writeFileSync('src/pages/crm/manager/Students.tsx', content, 'utf8');
