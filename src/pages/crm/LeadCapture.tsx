import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { SearchableDropdown } from '../../components/ui/erp/SearchableDropdown';
import { createLead } from '../../lib/api/crm';
import { getCoursesForPitch } from '../../lib/api/sales';

export default function LeadCapture() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [qualification, setQualification] = useState('');
  const [itBackground, setItBackground] = useState('');
  const [mode, setMode] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<{value: string, label: string}[]>([]);

  React.useEffect(() => {
    getCoursesForPitch().then(res => {
      setCourses(res.map(c => ({ value: c.title || '', label: c.title || '' })));
    });
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!name || !phone || !course) return alert('Fill required fields (Name, Phone, Course)');
    
    const phoneClean = phone.replace(/\D/g, '');
    if (phoneClean.length < 10) return alert('Phone number must be at least 10 digits.');

    setLoading(true);
    await createLead({
      name,
      email,
      phone,
      course_interest: course,
      grad_year: gradYear,
      qualification,
      it_background: itBackground,
      preferred_mode: mode,
      location,
      source: 'Manual Entry',
      status: 'New',
      assigned_to: ''
    });
    setLoading(false);
    navigate('/sales/pipeline');
  };

  const qualOptions = [
    { value: 'B.Tech', label: 'B.Tech' },
    { value: 'Degree', label: 'Degree' },
    { value: 'BCA', label: 'BCA' },
    { value: 'MCA', label: 'MCA' },
    { value: 'B.Sc', label: 'B.Sc' },
    { value: 'M.Sc', label: 'M.Sc' },
    { value: 'MBA', label: 'MBA' },
    { value: 'BBA', label: 'BBA' },
    { value: 'B.Com', label: 'B.Com' },
    { value: 'Diploma', label: 'Diploma' },
    { value: '12th Pass', label: '12th Pass' },
    { value: '10th Pass', label: '10th Pass' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <div className="p-4 pt-8 h-full bg-erp-background overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-bold text-erp-text">New Lead</h1>
        <Button variant="ghost" onClick={() => navigate('/sales/pipeline')} className="px-4">Cancel</Button>
      </div>
      <Card className="flex flex-col gap-5 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-bold text-erp-text/70 mb-2 uppercase">Full Name *</label>
              <input 
                required
                className="w-full bg-erp-surface border-2 border-erp-border rounded-2xl p-4 font-bold text-gray-900 outline-none focus:border-erp-primary"
                value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-erp-text/70 mb-2 uppercase">Phone Number *</label>
              <input 
                type="tel" required minLength={10} maxLength={15} pattern="[0-9\+\-\s]+" title="Valid phone number required"
                className="w-full bg-erp-surface border-2 border-erp-border rounded-2xl p-4 font-bold text-gray-900 outline-none focus:border-erp-primary"
                value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit number"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-erp-text/70 mb-2 uppercase">Email</label>
              <input 
                type="email"
                className="w-full bg-erp-surface border-2 border-erp-border rounded-2xl p-4 font-bold text-gray-900 outline-none focus:border-erp-primary"
                value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-erp-text/70 mb-2 uppercase">Location</label>
              <input 
                className="w-full bg-erp-surface border-2 border-erp-border rounded-2xl p-4 font-bold text-gray-900 outline-none focus:border-erp-primary"
                value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. New York"
              />
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t-2 border-erp-border pt-5">
          <div>
            <label className="block text-sm font-bold text-erp-text/70 mb-2 uppercase">Course Interest *</label>
            <SearchableDropdown 
              options={courses}
              value={course}
              onChange={setCourse}
              placeholder="Select a Course"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-erp-text/70 mb-2 uppercase">Mode</label>
            <SearchableDropdown 
              options={[
                { value: 'Online', label: 'Online' },
                { value: 'Offline', label: 'Offline' },
                { value: 'Hybrid', label: 'Hybrid' }
              ]}
              value={mode}
              onChange={setMode}
              placeholder="Select Mode"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-bold text-erp-text/70 mb-2 uppercase">Qualification</label>
            <SearchableDropdown 
              options={qualOptions}
              value={qualification}
              onChange={setQualification}
              placeholder="Select Qual"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-erp-text/70 mb-2 uppercase">IT Background</label>
            <SearchableDropdown 
              options={[
                { value: 'IT', label: 'IT' },
                { value: 'Non-IT', label: 'Non-IT' }
              ]}
              value={itBackground}
              onChange={setItBackground}
              placeholder="Select"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-erp-text/70 mb-2 uppercase">Grad Year</label>
            <input 
              className="w-full bg-erp-surface border-2 border-erp-border rounded-2xl p-4 font-bold text-erp-text outline-none focus:border-erp-primary"
              value={gradYear} onChange={e => setGradYear(e.target.value)} placeholder="e.g. 2024"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="mt-4 py-4 text-lg" fullWidth>{loading ? 'Saving...' : 'Save Lead'}</Button>
        </form>
      </Card>
    </div>
  );
}
