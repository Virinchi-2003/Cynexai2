import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { getLeads, updateLeadStatus, addActivity, createLead, claimLead } from '../../lib/api/crm';
import { Lead, LeadStatus } from '../../lib/types';
import { getCurrentUser } from '../../lib/auth';
import { Button } from '../../components/ui/erp/Button';
import { LeadDetailPanel } from '../../components/crm/LeadDetailPanel';
import {
  Plus, Phone, MessageCircle, Search, Filter, User,
  Mail, Calendar, CheckCircle2, AlertTriangle, XCircle,
  PhoneOff, PhoneCall, UserX, RefreshCw, X, Upload, Download
} from 'lucide-react';

const PIPELINE_STAGES: { id: LeadStatus; label: string; color: string; bg: string; icon: React.ReactNode }[] = [
  { id: 'New',                  label: 'New Lead',            color: '#6366f1', bg: '#eef2ff', icon: <User className="w-3 h-3" /> },
  { id: 'Not answering',        label: 'Not Answering',       color: '#6b7280', bg: '#f3f4f6', icon: <PhoneOff className="w-3 h-3" /> },
  { id: 'Busy',                 label: 'Busy',                color: '#f59e0b', bg: '#fffbeb', icon: <PhoneCall className="w-3 h-3" /> },
  { id: 'Invalid number',       label: 'Invalid Number',      color: '#ef4444', bg: '#fef2f2', icon: <XCircle className="w-3 h-3" /> },
  { id: 'Interested',           label: 'Interested',          color: '#10b981', bg: '#ecfdf5', icon: <CheckCircle2 className="w-3 h-3" /> },
  { id: 'Not Interested',       label: 'Not Interested',      color: '#f43f5e', bg: '#fff1f2', icon: <UserX className="w-3 h-3" /> },
  { id: 'Demo Scheduled',       label: 'Demo Scheduled',      color: '#8b5cf6', bg: '#f5f3ff', icon: <Calendar className="w-3 h-3" /> },
  { id: 'Demo Completed',       label: 'Demo Completed',      color: '#0ea5e9', bg: '#f0f9ff', icon: <CheckCircle2 className="w-3 h-3" /> },
  { id: 'Admission Completed',  label: 'Admission',           color: '#f97316', bg: '#fff7ed', icon: <CheckCircle2 className="w-3 h-3" /> },
  { id: 'Sale Partial Closed',  label: 'Partial Sale',        color: '#eab308', bg: '#fefce8', icon: <AlertTriangle className="w-3 h-3" /> },
  { id: 'Onboarded',            label: 'Onboarded',           color: '#14b8a6', bg: '#f0fdfa', icon: <CheckCircle2 className="w-3 h-3" /> },
];

// Stages user can filter to (collapsed stages on kanban)
const HIDDEN_BY_DEFAULT = ['Not answering', 'Busy', 'Invalid number', 'Not Interested'];

export default function LeadPipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenStages, setHiddenStages] = useState<Set<string>>(new Set(HIDDEN_BY_DEFAULT));
  const [showAllStages, setShowAllStages] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'All' | 'Mine'>('All');
  
  // Advanced Filters
  const [filterYear, setFilterYear] = useState('');
  const [filterQual, setFilterQual] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterIt, setFilterIt] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // For quick activity log on drag
  const [pendingActivity, setPendingActivity] = useState<{leadId: string, toStatus: LeadStatus} | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Onboarding Modal State
  const [onboardingLead, setOnboardingLead] = useState<Lead | null>(null);
  const [onboardForm, setOnboardForm] = useState({ fee: '', mode: 'Online', batchPrefs: '' });

  const navigate = useNavigate();
  const user = getCurrentUser();

  const loadData = useCallback(() => {
    getLeads().then(setLeads);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const visibleStages = showAllStages
    ? PIPELINE_STAGES
    : PIPELINE_STAGES.filter(s => !hiddenStages.has(s.id));

  const filteredLeads = leads.filter(l => {
    // Search query match (name, phone, course)
    const matchesSearch = !searchQuery.trim() || 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.phone && l.phone.includes(searchQuery)) ||
      (l.course_interest && l.course_interest.toLowerCase().includes(searchQuery.toLowerCase()));
      
    // Advanced filters
    const matchesYear = !filterYear || (l.grad_year && l.grad_year.includes(filterYear));
    const matchesQual = !filterQual || (l.qualification && l.qualification.toLowerCase().includes(filterQual.toLowerCase()));
    const matchesCourse = !filterCourse || (l.course_interest && l.course_interest.toLowerCase().includes(filterCourse.toLowerCase()));
    const matchesIt = !filterIt || (l.it_background === filterIt);
    
    const matchesView = viewMode === 'All' || l.assigned_to === user?.id;
    
    return matchesSearch && matchesYear && matchesQual && matchesCourse && matchesIt && matchesView;
  });

  const handleDragStart = () => setIsDragging(true);

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    if (!result.destination) return;

    const leadId = result.draggableId;
    const newStatus = result.destination.droppableId as LeadStatus;
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    setMoveError(null);

    // Prompt for partial sale
    let partialAmount = '';
    if (newStatus === 'Sale Partial Closed') {
      const amount = prompt("How much was paid for the partial close?");
      if (amount === null) {
        setLeads([...leads]);
        return;
      }
      partialAmount = amount;
    }

    if (newStatus === 'Onboarded') {
      setOnboardingLead(lead);
      return; // Stop here, modal will handle the actual move
    }

    executeMove(leadId, newStatus, partialAmount);
  };

  const executeMove = async (leadId: string, newStatus: LeadStatus, partialAmount: string = '', onboardData?: any) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const res = await updateLeadStatus(leadId, newStatus, user?.id || '');
    if (!res.success) {
      // Revert
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: lead.status } : l));
      setMoveError(res.error || 'Cannot move lead to this stage');
      setTimeout(() => setMoveError(null), 5000);
    } else {
      // Auto-log an activity for the move
      if (user) {
        let note = `Status changed to: ${newStatus}`;
        if (partialAmount) note += ` (Amount: ${partialAmount})`;
        if (onboardData) note += ` (Fee: ${onboardData.fee}, Mode: ${onboardData.mode}, Prefs: ${onboardData.batchPrefs})`;
        await addActivity(leadId, user.id, 'Note', note);
      }
    }
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingLead) return;
    
    // First execute the move visually
    executeMove(onboardingLead.id, 'Onboarded', '', onboardForm);
    
    // Notify manager (in a real app, this creates a notification/task for the manager)
    alert(`Notification sent to Manager: New Student Onboarded - ${onboardingLead.name}. Action Required: Assign Batch & Generate ID.`);
    
    setOnboardingLead(null);
    setOnboardForm({ fee: '', mode: 'Online', batchPrefs: '' });
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCsv(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      let successCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const leadData: any = {
          name: '',
          email: '',
          phone: '',
          course_interest: '',
          source: 'CSV Upload',
          status: 'New',
          assigned_to: ''
        };

        headers.forEach((h, index) => {
          if (h.includes('name')) leadData.name = values[index];
          else if (h.includes('email')) leadData.email = values[index];
          else if (h.includes('phone') || h.includes('number')) leadData.phone = values[index];
          else if (h.includes('course')) leadData.course_interest = values[index];
          else if (h.includes('source')) leadData.source = values[index] || 'CSV Upload';
          else if (h.includes('grad')) leadData.grad_year = values[index];
          else if (h.includes('qual')) leadData.qualification = values[index];
          else if (h.includes('it') && h.includes('non')) leadData.it_background = values[index];
          else if (h.includes('mode') || h.includes('offline') || h.includes('online')) leadData.preferred_mode = values[index];
          else if (h.includes('locat')) leadData.location = values[index];
          else if (h.includes('date')) {
            // Attempt to parse standard date
            const dateStr = values[index];
            if (dateStr) {
              const parsedDate = new Date(dateStr);
              if (!isNaN(parsedDate.getTime())) {
                leadData.created_at = parsedDate.toISOString();
              }
            }
          }
          else if (h.includes('status') || h.includes('stage')) {
            const statusVal = values[index];
            if (statusVal) leadData.status = statusVal as LeadStatus;
          }
        });

        if (leadData.name && (leadData.phone || leadData.email)) {
          const newId = await createLead(leadData);
          if (newId) successCount++;
        }
      }
      
      alert(`Successfully imported ${successCount} leads!`);
      loadData();
    } catch (e: any) {
      alert("Error importing CSV: " + e.message);
    } finally {
      setIsUploadingCsv(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const leadsByStage = (stageId: string) =>
    filteredLeads.filter(l => l.status === stageId);

  const totalByStage = (stageId: string) =>
    leads.filter(l => l.status === stageId).length;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-erp-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-erp-border bg-white flex-shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-erp-text">CRM Pipeline</h1>
          <p className="text-xs font-medium text-erp-text/50 mt-0.5">{leads.length} total leads · Drag cards to update stage</p>
        </div>
          <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-erp-text/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search leads or phone..."
              className="bg-erp-surface border-2 border-erp-border rounded-xl pl-9 pr-3 py-2 text-sm w-56 focus:outline-none focus:border-erp-primary focus:ring-2 focus:ring-erp-primary/20 font-medium transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2.5">
                <X className="w-4 h-4 text-erp-text/30 hover:text-erp-text" />
              </button>
            )}
          </div>

          <div className="flex bg-erp-background border-2 border-erp-border rounded-xl overflow-hidden p-0.5">
            <button
              onClick={() => setViewMode('All')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'All' ? 'bg-erp-surface shadow-sm text-erp-text border border-erp-border/50' : 'text-erp-text/50 hover:text-erp-text'}`}
            >
              All Leads
            </button>
            <button
              onClick={() => setViewMode('Mine')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'Mine' ? 'bg-erp-surface shadow-sm text-erp-text border border-erp-border/50' : 'text-erp-text/50 hover:text-erp-text'}`}
            >
              My Leads
            </button>
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border-2 transition-colors ${showAdvancedFilters ? 'border-erp-primary text-erp-primary bg-erp-primary/5' : 'border-erp-border hover:border-erp-primary text-erp-text/70'}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>

          {/* Toggle collapsed stages */}
          <button
            onClick={() => setShowAllStages(v => !v)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border-2 border-erp-border hover:border-erp-primary text-erp-text/70 hover:text-erp-primary transition-colors"
          >
            {showAllStages ? 'Fewer Stages' : 'All Stages'}
          </button>

          <button onClick={loadData} className="p-2 rounded-xl border-2 border-erp-border hover:border-erp-primary text-erp-text/50 hover:text-erp-primary transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>

          {(user?.role === 'Manager' || user?.role === 'CEO' || user?.role === 'DM' || user?.role === 'Admin') && (
            <>
              <a 
                href="/sample-leads.csv" 
                download 
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-erp-surface border-2 border-erp-border hover:bg-erp-border text-erp-text rounded-2xl transition-colors"
                title="Download Sample CSV Template"
              >
                <Download className="w-4 h-4" /> Sample CSV
              </a>
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleCsvUpload} 
              />
              <Button 
                variant="ghost" 
                onClick={() => fileInputRef.current?.click()} 
                className="flex items-center gap-2 border-2 border-erp-border"
                disabled={isUploadingCsv}
              >
                <Upload className="w-4 h-4" /> {isUploadingCsv ? 'Uploading...' : 'Upload CSV'}
              </Button>
            </>
          )}

          <Button onClick={() => navigate('/sales/leads/new')} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Lead
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="px-6 py-3 border-b-2 border-erp-border bg-erp-surface flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Grad Year (e.g. 2024)"
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="border-2 border-erp-border rounded-lg px-3 py-1.5 text-sm font-bold w-40 focus:outline-none focus:border-erp-primary focus:ring-2 focus:ring-erp-primary/20 text-gray-900 bg-white placeholder-gray-400"
          />
          <input
            type="text"
            placeholder="Degree/Qual"
            value={filterQual}
            onChange={e => setFilterQual(e.target.value)}
            className="border-2 border-erp-border rounded-lg px-3 py-1.5 text-sm font-bold w-40 focus:outline-none focus:border-erp-primary focus:ring-2 focus:ring-erp-primary/20 text-gray-900 bg-white placeholder-gray-400"
          />
          <input
            type="text"
            placeholder="Course Interest"
            value={filterCourse}
            onChange={e => setFilterCourse(e.target.value)}
            className="border-2 border-erp-border rounded-lg px-3 py-1.5 text-sm font-bold w-40 focus:outline-none focus:border-erp-primary focus:ring-2 focus:ring-erp-primary/20 text-gray-900 bg-white placeholder-gray-400"
          />
          <select
            value={filterIt}
            onChange={e => setFilterIt(e.target.value)}
            className="border-2 border-erp-border rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-erp-primary focus:ring-2 focus:ring-erp-primary/20 text-gray-900 bg-white"
          >
            <option value="">Any Background</option>
            <option value="IT">IT</option>
            <option value="Non-IT">Non-IT</option>
          </select>
          {(filterYear || filterQual || filterCourse || filterIt) && (
            <button
              onClick={() => { setFilterYear(''); setFilterQual(''); setFilterCourse(''); setFilterIt(''); }}
              className="text-xs font-bold text-erp-primary hover:underline ml-2"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
      
      {/* Onboarding Modal */}
      {onboardingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-erp-surface border border-erp-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-erp-border bg-slate-900/50">
              <h2 className="text-xl font-bold text-erp-text font-display flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-400" /> Onboard Student
              </h2>
              <button onClick={() => setOnboardingLead(null)} className="text-erp-text/50 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleOnboardSubmit} className="p-6 space-y-4">
              <p className="text-sm text-erp-text/70 mb-4">
                You are moving <strong>{onboardingLead.name}</strong> to Onboarded. Please collect the final details to notify the Manager for batch assignment.
              </p>
              
              <div>
                <label className="block text-sm font-bold text-erp-text/70 mb-2">Total Fee Paid</label>
                <input 
                  type="number" 
                  required
                  value={onboardForm.fee}
                  onChange={e => setOnboardForm({...onboardForm, fee: e.target.value})}
                  className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-3 text-erp-text focus:outline-none focus:border-indigo-500" 
                  placeholder="e.g. 50000"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-erp-text/70 mb-2">Preferred Mode</label>
                <select 
                  value={onboardForm.mode}
                  onChange={e => setOnboardForm({...onboardForm, mode: e.target.value})}
                  className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-3 text-erp-text focus:outline-none focus:border-indigo-500"
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-erp-text/70 mb-2">Batch/Module Preferences</label>
                <textarea 
                  required
                  value={onboardForm.batchPrefs}
                  onChange={e => setOnboardForm({...onboardForm, batchPrefs: e.target.value})}
                  className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-3 text-erp-text focus:outline-none focus:border-indigo-500 min-h-[80px]" 
                  placeholder="e.g. Wants weekend morning batch for Python module"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setOnboardingLead(null)}>Cancel</Button>
                <Button type="submit" variant="primary" className="bg-teal-600 hover:bg-teal-500 text-white">Complete Onboarding</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {moveError && (
        <div className="mx-6 mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3 text-sm font-bold text-red-700 animate-in slide-in-from-top duration-200">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{moveError}</span>
          <button onClick={() => setMoveError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Hidden Stages Indicator */}
      {!showAllStages && hiddenStages.size > 0 && (
        <div className="flex items-center gap-2 px-6 pt-3 flex-wrap flex-shrink-0">
          <span className="text-xs font-bold text-erp-text/40">Hidden:</span>
          {Array.from(hiddenStages).map(s => {
            const stage = PIPELINE_STAGES.find(p => p.id === s);
            const count = totalByStage(s);
            return stage ? (
              <button
                key={s}
                onClick={() => setHiddenStages(prev => { const n = new Set(prev); n.delete(s); return n; })}
                className="text-xs font-bold px-2 py-1 rounded-full border-2 hover:border-erp-primary transition-colors"
                style={{ borderColor: stage.color + '44', color: stage.color, background: stage.bg }}
              >
                {stage.label} {count > 0 && `(${count})`} ×
              </button>
            ) : null;
          })}
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 p-6 h-full items-start min-w-max">
            {visibleStages.map(stage => {
              const stageLeads = leadsByStage(stage.id);
              return (
                <div
                  key={stage.id}
                  className="flex-shrink-0 w-[270px] flex flex-col rounded-2xl"
                  style={{ background: stage.bg, border: `1.5px solid ${stage.color}33`, maxHeight: 'calc(100vh - 220px)' }}
                >
                  {/* Stage Header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b flex-shrink-0" style={{ borderColor: `${stage.color}33` }}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: stage.color }}>{stage.icon}</span>
                      <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wider leading-tight">{stage.label}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: stage.color }}>
                        {stageLeads.length}
                      </span>
                      {!showAllStages && (
                        <button
                          onClick={() => setHiddenStages(prev => { const n = new Set(prev); n.add(stage.id); return n; })}
                          className="text-gray-300 hover:text-gray-500 transition-colors"
                          title="Collapse stage"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Droppable */}
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 overflow-y-auto flex flex-col gap-2 p-2 transition-colors min-h-[120px]"
                        style={{ background: snapshot.isDraggingOver ? `${stage.color}18` : 'transparent' }}
                      >
                        {stageLeads.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-xl" style={{ borderColor: `${stage.color}44` }}>
                            <p className="text-xs font-medium text-gray-400">No leads</p>
                          </div>
                        )}

                        {stageLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={async () => {
                                  if (user && (!lead.assigned_to || lead.assigned_to === '')) {
                                    const res = await claimLead(lead.id, user.id);
                                    if (!res.success && res.alreadyClaimed) {
                                      alert('This lead is already being handled by someone else!');
                                      loadData();
                                      return;
                                    } else {
                                      loadData();
                                    }
                                  }
                                  setSelectedLeadId(lead.id);
                                }}
                                className="bg-white rounded-2xl p-4 cursor-pointer group select-none flex flex-col gap-1"
                                style={{
                                  ...provided.draggableProps.style,
                                  boxShadow: snapshot.isDragging
                                    ? '0 20px 40px rgba(0,0,0,0.12)'
                                    : '0 2px 6px rgba(0,0,0,0.06)',
                                  borderLeft: `4px solid ${stage.color}`,
                                  transform: snapshot.isDragging
                                    ? `${provided.draggableProps.style?.transform} rotate(2deg) scale(1.02)`
                                    : provided.draggableProps.style?.transform,
                                  outline: selectedLeadId === lead.id ? `2px solid ${stage.color}` : 'none',
                                }}
                              >
                                {/* Lead Name */}
                                <p className="font-bold text-[15px] text-gray-900 truncate">{lead.name}</p>
                                
                                {lead.course_interest && (
                                  <p className="text-xs font-semibold text-erp-primary truncate bg-erp-primary/10 w-max px-2 py-0.5 rounded-full mt-1">
                                    {lead.course_interest}
                                  </p>
                                )}

                                <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-medium text-gray-500">
                                  {lead.grad_year && <div><span className="text-gray-400">Grad:</span> {lead.grad_year}</div>}
                                  {lead.qualification && <div className="truncate"><span className="text-gray-400">Qual:</span> {lead.qualification}</div>}
                                  {lead.it_background && <div><span className="text-gray-400">IT:</span> {lead.it_background}</div>}
                                  {lead.preferred_mode && <div><span className="text-gray-400">Mode:</span> {lead.preferred_mode}</div>}
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                  <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                                    <span className="text-xs font-bold text-gray-500 truncate">{lead.phone || '—'}</span>
                                    {lead.assignee_name && (
                                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded truncate" title={`Handled by: ${lead.assignee_name}`}>
                                        👤 {lead.assignee_name.split(' ')[0]}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        window.open(`https://wa.me/${lead.phone?.replace(/\D/g,'')}`, '_blank'); 
                                      }}
                                      className="w-7 h-7 rounded-md bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors"
                                      title="WhatsApp"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        window.open(`tel:${lead.phone}`, '_self'); 
                                      }}
                                      className="w-7 h-7 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition-colors"
                                      title="Call"
                                    >
                                      <Phone className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Lead Detail Panel */}
      {selectedLeadId && (
        <div className="absolute inset-0 z-30 bg-erp-background md:inset-auto md:right-0 md:top-0 md:h-full md:w-[500px] shadow-[-10px_0_40px_rgba(0,0,0,0.12)] border-l-2 border-erp-border animate-in slide-in-from-right duration-250">
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
