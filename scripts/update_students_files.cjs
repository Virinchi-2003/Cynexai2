const fs = require('fs');
let code = fs.readFileSync('src/pages/crm/manager/Students.tsx', 'utf8');

// 1. Add states
code = code.replace(
  'const [documentsSubmitted, setDocumentsSubmitted] = useState<number | \\'\\'>(0);',
  `const [documentsSubmitted, setDocumentsSubmitted] = useState<number | ''>(0);
  const [aadharFile, setAadharFile] = useState<string>('');
  const [otherAttachments, setOtherAttachments] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setter(ev.target?.result as string);
    reader.readAsDataURL(file);
  };`
);

// 2. Add to handleEditStudent
const editMarker = 'setTopicCompleted(stu.topic_completed || \'\');';
code = code.replace(
  editMarker,
  editMarker + '\n    setAadharFile(stu.aadhar_file || \'\');\n    setOtherAttachments(stu.other_attachments || \'\');'
);

// 3. Add to handleSaveStudent
const saveMarker = 'documents_submitted: Number(documentsSubmitted) || 0';
code = code.replace(
  saveMarker,
  saveMarker + ',\n        aadhar_file: aadharFile,\n        other_attachments: otherAttachments'
);

// 4. Add UI to side panel (Details Tab)
const detailsTab = `              {detailTab === 'details' && (
                <div className="space-y-4">`;
const newDetailsTab = `              {detailTab === 'details' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedStudent.aadhar_file && (
                      <a href={selectedStudent.aadhar_file} download="Aadhar.pdf" className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100 flex items-center gap-2"><FileText className="w-4 h-4" /> View Aadhar</a>
                    )}
                    {selectedStudent.other_attachments && (
                      <a href={selectedStudent.other_attachments} download="Attachments" className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold border border-purple-100 flex items-center gap-2"><FileText className="w-4 h-4" /> View Attachments</a>
                    )}
                  </div>`;
                  
code = code.replace(detailsTab, newDetailsTab);

fs.writeFileSync('src/pages/crm/manager/Students.tsx', code, 'utf8');
console.log('Done part 1');
