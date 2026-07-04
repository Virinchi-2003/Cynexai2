import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { SearchableDropdown } from '../../components/ui/erp/SearchableDropdown';
import { createLead } from '../../lib/api/crm';

export default function LeadCapture() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState('');
  
  const handleSave = async () => {
    if(!name || !phone || !course) return alert('Fill all fields');
    await createLead({
      name,
      phone,
      course_interest: course,
      source: 'Manual Entry',
      bucket_stage: 'A',
      assigned_to: 'usr_sales' // default for now
    });
    navigate('/crm/leads');
  };

  return (
    <div className="p-4 pt-8 h-full bg-erp-background">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-bold text-erp-text">New Lead</h1>
        <Button variant="ghost" onClick={() => navigate('/crm/leads')} className="px-4">Cancel</Button>
      </div>
      <Card className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-bold text-erp-text/70 mb-2 uppercase">Full Name</label>
          <input 
            className="w-full bg-erp-surface border-2 border-erp-border rounded-2xl p-4 font-bold text-erp-text outline-none focus:border-erp-primary"
            value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-erp-text/70 mb-2 uppercase">Phone Number</label>
          <input 
            className="w-full bg-erp-surface border-2 border-erp-border rounded-2xl p-4 font-bold text-erp-text outline-none focus:border-erp-primary"
            value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit number"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-erp-text/70 mb-2 uppercase">Course Interest</label>
          <SearchableDropdown 
            options={[
              { value: 'Data Science', label: 'Data Science' },
              { value: 'Full Stack', label: 'Full Stack Web Dev' },
              { value: 'AI/ML', label: 'Artificial Intelligence' }
            ]}
            value={course}
            onChange={setCourse}
            placeholder="Select a Course"
          />
        </div>
        <Button className="mt-4" onClick={handleSave} fullWidth>Save Lead</Button>
      </Card>
    </div>
  );
}
