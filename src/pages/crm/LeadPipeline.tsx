import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeads } from '../../lib/api/crm';
import { Lead, LeadBucket } from '../../lib/types';
import { getTasksForUser, checkInTask, Task } from '../../lib/api/tasks';
import { getCurrentUser } from '../../lib/auth';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { Plus, CheckCircle, Circle, Filter, Phone, MessageCircle } from 'lucide-react';
import { LeadDetailPanel } from '../../components/crm/LeadDetailPanel';

const STATUS_BUCKETS = [
  { value: 'All', label: 'All Leads' },
  { value: 'A', label: 'A: New Leads' },
  { value: 'B', label: 'B: Interested' },
  { value: 'C', label: 'C: Demo' },
  { value: 'D', label: 'D: Admission' },
  { value: 'E', label: 'E: Sales' },
  { value: 'F', label: 'F: Manager Approval' },
  { value: 'G', label: 'G: Onboarding' },
  { value: 'H', label: 'H: Learning' },
  { value: 'I', label: 'I: Placement' },
  { value: 'J', label: 'J: Alumni' }
];

export default function LeadPipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterBucket, setFilterBucket] = useState('All');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const user = getCurrentUser();

  const loadData = () => {
    getLeads().then(setLeads);
    if (user) {
      getTasksForUser(user.id).then(setTasks);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTaskCheckIn = async (task: Task) => {
    if (task.status === 'Completed') return;
    await checkInTask(task.id, task.check_in_count, task.target_check_in_count);
    loadData();
  };

  const filteredLeads = filterBucket === 'All' ? leads : leads.filter(l => l.bucket_stage === filterBucket);

  return (
    <div className="flex h-full w-full overflow-hidden relative bg-erp-background">
      {/* Main Table Area */}
      <div className={`flex-1 flex flex-col p-4 md:p-8 min-w-0 transition-all duration-300 ${selectedLeadId ? 'hidden md:flex md:w-2/3 lg:w-3/4' : 'w-full'}`}>
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-display font-bold text-erp-text">Leads Pipeline</h1>
          <Button onClick={() => navigate('/crm/leads/new')} className="w-12 h-12 p-0 rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all">
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar">
          <div className="flex items-center gap-2 text-erp-text/50 font-bold px-2 whitespace-nowrap">
            <Filter className="w-5 h-5" /> Filter by:
          </div>
          <select 
            value={filterBucket}
            onChange={(e) => setFilterBucket(e.target.value)}
            className="bg-erp-surface border-2 border-erp-border rounded-xl px-4 py-2 font-bold text-erp-text focus:outline-none focus:border-erp-primary max-w-[200px] md:max-w-xs"
          >
            {STATUS_BUCKETS.map(b => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>

        {/* Sales Warning Banner */}
        {filterBucket === 'E' && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-r-lg shadow-sm flex items-start gap-3">
            <div className="mt-0.5">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm">CRITICAL POLICY</p>
              <p className="text-sm">After receiving any course payment, do <strong>NOT</strong> promise batch dates. Batch allocation happens only after <strong>Manager Approval</strong>.</p>
            </div>
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block bg-erp-surface border-2 border-erp-border rounded-3xl overflow-hidden flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-erp-background sticky top-0 z-10 border-b-2 border-erp-border">
              <tr>
                <th className="p-4 font-bold text-erp-text/70 uppercase text-xs tracking-wider">Name</th>
                <th className="p-4 font-bold text-erp-text/70 uppercase text-xs tracking-wider">Phone</th>
                <th className="p-4 font-bold text-erp-text/70 uppercase text-xs tracking-wider">Course</th>
                <th className="p-4 font-bold text-erp-text/70 uppercase text-xs tracking-wider">Stage</th>
                <th className="p-4 font-bold text-erp-text/70 uppercase text-xs tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center font-bold text-erp-text/50">No leads found.</td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`cursor-pointer border-b border-erp-border/50 hover:bg-erp-primary/5 transition-colors ${selectedLeadId === lead.id ? 'bg-erp-primary/10' : ''}`}
                  >
                    <td className="p-4 font-bold text-erp-text">{lead.name}</td>
                    <td className="p-4 font-bold text-erp-text/70">{lead.phone}</td>
                    <td className="p-4 font-bold text-erp-secondary">{lead.course_interest}</td>
                    <td className="p-4">
                      <span className="bg-erp-background border border-erp-border px-3 py-1 rounded-full text-xs font-bold text-erp-text/80">
                        {lead.bucket_stage}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          className="p-2 h-8 w-8 hover:bg-erp-primary/10 hover:text-erp-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://wa.me/${lead.phone}`, '_blank');
                          }}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="p-2 h-8 w-8 hover:bg-blue-100 hover:text-blue-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${lead.phone}`, '_self');
                          }}
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden flex flex-col gap-4 overflow-y-auto flex-1 pb-32">
          {filteredLeads.length === 0 ? (
            <div className="text-center p-10 text-erp-text/50 font-bold border-2 border-dashed border-erp-border rounded-3xl">
              No leads found.
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <Card key={lead.id} onClick={() => setSelectedLeadId(lead.id)} className={`cursor-pointer ${selectedLeadId === lead.id ? 'ring-2 ring-erp-primary' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-xl text-erp-text">{lead.name}</h3>
                    <p className="text-erp-text/70 font-medium text-sm mb-2">{lead.course_interest}</p>
                    <span className="bg-erp-background border border-erp-border px-2 py-1 rounded-md text-xs font-bold text-erp-text/80 inline-block">
                      {lead.bucket_stage}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      className="p-2 h-10 w-10 hover:bg-erp-primary/10 hover:text-erp-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://wa.me/${lead.phone}`, '_blank');
                      }}
                    >
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="p-2 h-10 w-10 hover:bg-blue-100 hover:text-blue-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`tel:${lead.phone}`, '_self');
                      }}
                    >
                      <Phone className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Slide-out Panel */}
      {selectedLeadId && (
        <div className="absolute inset-0 z-20 bg-erp-background md:relative md:inset-auto md:w-1/3 lg:w-1/4 md:border-l-2 md:border-erp-border md:z-0 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] md:shadow-none animate-in slide-in-from-right duration-300">
          <LeadDetailPanel 
            leadId={selectedLeadId} 
            onClose={() => setSelectedLeadId(null)} 
            onUpdate={loadData}
          />
        </div>
      )}
    </div>
  );
}
