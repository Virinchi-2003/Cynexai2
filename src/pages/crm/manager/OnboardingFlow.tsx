import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { client, isTursoConfigured } from '../../../lib/turso';
import { completeOnboarding } from '../../../lib/api/manager';
import { Card } from '../../../components/ui/erp/Card';
import { Button } from '../../../components/ui/erp/Button';
import { SearchableDropdown } from '../../../components/ui/erp/SearchableDropdown';

export default function OnboardingFlow() {
  const { id } = useParams(); // This is the saleId
  const navigate = useNavigate();
  
  const [sale, setSale] = useState<any>(null);
  const [batch, setBatch] = useState('');
  const [teacher, setTeacher] = useState('');
  const [mode, setMode] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [studentCode, setStudentCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchSale = async () => {
      if (isTursoConfigured && client) {
        const res = await client.execute({
          sql: `SELECT s.id, l.name as lead_name, l.id as lead_id, s.course_id 
                FROM sales s JOIN leads l ON s.lead_id = l.id WHERE s.id = ?`,
          args: [id as string]
        });
        if (res.rows.length > 0) setSale(res.rows[0]);
      }
    };
    fetchSale();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch || !teacher || !mode || !joiningDate) return alert("Fill all fields");
    const code = await completeOnboarding(id as string, batch, teacher, mode, joiningDate, remarks, sale.lead_id);
    if (code) {
      setStudentCode(code);
    }
  };

  if (!sale) return <div className="p-10 text-center font-bold">Loading...</div>;

  if (studentCode) {
    return (
      <div className="p-4 pt-8 min-h-screen bg-erp-background flex flex-col items-center justify-center">
        <Card className="text-center w-full max-w-md">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold font-display text-erp-text mb-2">Onboarding Complete</h2>
          <p className="text-erp-text/70 font-bold mb-4">Student portal account generated.</p>
          <div className="bg-erp-primary/10 text-erp-primary text-xl font-bold p-4 rounded-xl mb-6">
            {studentCode}
          </div>
          <Button fullWidth onClick={() => navigate('/crm/manager')}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 pt-8 min-h-screen bg-erp-background pb-32">
      <h1 className="text-2xl font-display font-bold text-erp-text mb-6">Onboard {sale.lead_name}</h1>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold text-erp-text/70 mb-1 uppercase">Select Batch</label>
          <SearchableDropdown 
            options={[
              { value: 'batch_july_ds', label: 'July Core - Data Science' },
              { value: 'batch_aug_ds', label: 'August Core - Data Science' }
            ]}
            value={batch} onChange={setBatch} placeholder="Choose Batch"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-erp-text/70 mb-1 uppercase">Assigned Teacher</label>
          <SearchableDropdown 
            options={[
              { value: 'tchr_rahul', label: 'Rahul Sharma' },
              { value: 'tchr_priya', label: 'Priya Desai' }
            ]}
            value={teacher} onChange={setTeacher} placeholder="Choose Teacher"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-erp-text/70 mb-1 uppercase">Mode</label>
            <select className="w-full bg-erp-surface border-2 border-erp-border rounded-xl p-3.5 font-bold text-erp-text outline-none" value={mode} onChange={e => setMode(e.target.value)} required>
              <option value="" disabled>Select</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-erp-text/70 mb-1 uppercase">Joining Date</label>
            <input required type="date" className="w-full bg-erp-surface border-2 border-erp-border rounded-xl p-3 font-bold" value={joiningDate} onChange={e => setJoiningDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-erp-text/70 mb-1 uppercase">Remarks</label>
          <textarea className="w-full bg-erp-surface border-2 border-erp-border rounded-xl p-3 font-bold text-erp-text h-20" value={remarks} onChange={e => setRemarks(e.target.value)} />
        </div>
        
        <Button type="submit" variant="primary" fullWidth className="mt-4">Generate Student Account</Button>
      </form>
    </div>
  );
}
