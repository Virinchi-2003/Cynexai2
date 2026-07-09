import React, { useState } from 'react';
import { Card } from '../../../components/ui/erp/Card';
import { Button } from '../../../components/ui/erp/Button';
import { Calendar, Users, AlertTriangle, Plus, UserX, Clock, BookOpen } from 'lucide-react';
import { getCurrentUser } from '../../../lib/auth';

interface Batch {
  id: string;
  name: string;
  module: string;
  primary_teacher: string;
  students_count: number;
  schedule: string;
  status: string;
}

interface LeaveRequest {
  id: string;
  teacher_name: string;
  date: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Substitute Assigned';
  batch_id: string;
}

export default function TimetableManager() {
  const currentUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState<'batches' | 'leaves'>('batches');
  
  const [batches, setBatches] = useState<Batch[]>([
    { id: 'B1', name: 'July Full Stack', module: 'ReactJS', primary_teacher: 'Sandeep', students_count: 24, schedule: 'Mon, Wed, Fri (10:00 AM)', status: 'Active' },
    { id: 'B2', name: 'Data Science Weekend', module: 'Python Basics', primary_teacher: 'Rahul', students_count: 15, schedule: 'Sat, Sun (09:00 AM)', status: 'Active' },
  ]);

  const [leaves, setLeaves] = useState<LeaveRequest[]>([
    { id: 'L1', teacher_name: 'Rahul', date: '2026-07-15', reason: 'Sick Leave', status: 'Pending', batch_id: 'B2' }
  ]);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [substituteTeacher, setSubstituteTeacher] = useState('');

  const handleAssignSubstitute = () => {
    if (selectedLeave && substituteTeacher) {
      setLeaves(leaves.map(l => l.id === selectedLeave.id ? { ...l, status: 'Substitute Assigned' } : l));
      alert(`Substitute ${substituteTeacher} assigned to cover ${selectedLeave.teacher_name}'s classes.`);
      setIsAssignModalOpen(false);
      setSubstituteTeacher('');
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3">
              <Calendar className="w-8 h-8 text-erp-primary" /> Timetable & Batch Dashboard
            </h1>
            <p className="text-erp-text/70 font-medium mt-1">Manage batches, modules, and handle teacher substitutes seamlessly.</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> Create Batch
          </Button>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-erp-surface border border-erp-border p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl"><BookOpen className="w-6 h-6 text-indigo-500" /></div>
            <div>
              <p className="text-sm font-bold text-erp-text/50">Active Batches</p>
              <h3 className="text-2xl font-bold text-erp-text">{batches.length}</h3>
            </div>
          </Card>
          <Card className="bg-erp-surface border border-erp-border p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl"><Users className="w-6 h-6 text-emerald-500" /></div>
            <div>
              <p className="text-sm font-bold text-erp-text/50">Total Students</p>
              <h3 className="text-2xl font-bold text-erp-text">{batches.reduce((acc, b) => acc + b.students_count, 0)}</h3>
            </div>
          </Card>
          <Card className="bg-erp-surface border border-erp-border p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl"><Clock className="w-6 h-6 text-amber-500" /></div>
            <div>
              <p className="text-sm font-bold text-erp-text/50">Classes Today</p>
              <h3 className="text-2xl font-bold text-erp-text">4</h3>
            </div>
          </Card>
          <Card className="bg-erp-surface border border-erp-border p-4 flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 rounded-xl"><UserX className="w-6 h-6 text-rose-500" /></div>
            <div>
              <p className="text-sm font-bold text-erp-text/50">Teachers on Leave</p>
              <h3 className="text-2xl font-bold text-erp-text">{leaves.filter(l => l.status === 'Pending').length}</h3>
            </div>
          </Card>
        </div>

        <div className="flex gap-4 mb-6 border-b border-erp-border">
          <button
            className={`pb-2 px-1 font-bold ${activeTab === 'batches' ? 'text-erp-primary border-b-2 border-erp-primary' : 'text-erp-text/50 hover:text-erp-text'}`}
            onClick={() => setActiveTab('batches')}
          >
            Active Batches
          </button>
          <button
            className={`pb-2 px-1 font-bold ${activeTab === 'leaves' ? 'text-erp-primary border-b-2 border-erp-primary' : 'text-erp-text/50 hover:text-erp-text'}`}
            onClick={() => setActiveTab('leaves')}
          >
            Leaves & Substitutes
            {leaves.filter(l => l.status === 'Pending').length > 0 && (
              <span className="ml-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {leaves.filter(l => l.status === 'Pending').length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'batches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map(batch => (
              <Card key={batch.id} className="bg-erp-surface border border-erp-border p-5 hover:border-erp-primary transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-erp-text font-display">{batch.name}</h3>
                  <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-lg">{batch.status}</span>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-erp-text/60 font-medium">Module:</span>
                    <span className="text-erp-text font-bold">{batch.module}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-erp-text/60 font-medium">Teacher:</span>
                    <span className="text-erp-text font-bold">{batch.primary_teacher}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-erp-text/60 font-medium">Schedule:</span>
                    <span className="text-erp-text font-bold">{batch.schedule}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-erp-text/60 font-medium">Students:</span>
                    <span className="text-erp-text font-bold">{batch.students_count}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1 text-xs">View Students</Button>
                  <Button variant="secondary" className="flex-1 text-xs">Edit Schedule</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'leaves' && (
          <div className="bg-erp-surface border border-erp-border rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-erp-border bg-erp-background/50">
                  <th className="p-4 font-bold text-sm text-erp-text/60">Teacher</th>
                  <th className="p-4 font-bold text-sm text-erp-text/60">Date</th>
                  <th className="p-4 font-bold text-sm text-erp-text/60">Reason</th>
                  <th className="p-4 font-bold text-sm text-erp-text/60">Status</th>
                  <th className="p-4 font-bold text-sm text-erp-text/60">Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(leave => (
                  <tr key={leave.id} className="border-b border-erp-border/50 hover:bg-erp-background/20 transition-colors">
                    <td className="p-4 font-bold text-sm text-erp-text">{leave.teacher_name}</td>
                    <td className="p-4 font-medium text-sm text-erp-text/80">{leave.date}</td>
                    <td className="p-4 font-medium text-sm text-erp-text/80">{leave.reason}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-lg ${
                        leave.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' :
                        leave.status === 'Substitute Assigned' ? 'bg-indigo-500/10 text-indigo-500' :
                        'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {leave.status === 'Pending' && (
                        <Button 
                          variant="primary" 
                          className="text-xs py-1.5"
                          onClick={() => {
                            setSelectedLeave(leave);
                            setIsAssignModalOpen(true);
                          }}
                        >
                          Assign Substitute
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-erp-text/50 font-bold">No leave requests found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Substitute Modal */}
      {isAssignModalOpen && selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-erp-surface border border-erp-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-erp-border bg-slate-900/50">
              <h2 className="text-xl font-bold text-erp-text font-display flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" /> Assign Substitute
              </h2>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-erp-text/50 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-erp-text/70 mb-4">
                <strong>{selectedLeave.teacher_name}</strong> is on leave on <strong>{selectedLeave.date}</strong>. Select a substitute teacher for their batches.
              </p>
              
              <div>
                <label className="block text-sm font-bold text-erp-text/70 mb-2">Available Substitutes</label>
                <select 
                  value={substituteTeacher}
                  onChange={e => setSubstituteTeacher(e.target.value)}
                  className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-3 text-erp-text focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Substitute --</option>
                  <option value="Sandeep (Manager)">Sandeep (Manager)</option>
                  <option value="Amit (DM)">Amit (DM)</option>
                  <option value="Sneha (Sales/HR)">Sneha (Sales/HR)</option>
                  <option value="Vikram (Teacher)">Vikram (Teacher)</option>
                </select>
                <p className="text-xs text-erp-text/50 mt-2 font-medium">Managers, DMs, and Sales/HR can also be assigned as substitute teachers.</p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleAssignSubstitute} disabled={!substituteTeacher}>Assign & Notify</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
