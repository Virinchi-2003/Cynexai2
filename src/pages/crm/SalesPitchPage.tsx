import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/erp/Card';
import { getCoursesForPitch, getCourseModules, updateCoursePitch } from '../../lib/api/sales';
import { createLead } from '../../lib/api/crm';
import { getCourseMaterials, addCourseMaterial, deleteCourseMaterial, CourseMaterial } from '../../lib/api/materials';
import { Button } from '../../components/ui/erp/Button';
import { BookOpen, Share2, ClipboardList, CheckCircle, AlertCircle, Edit2, Save, X, Download, UserPlus, Phone, Mail, User, Tag, MapPin, GraduationCap, Monitor, FileText, Plus, Trash2 } from 'lucide-react';
import { getCurrentUser } from '../../lib/auth';

interface CoursePitchData {
  id: string;
  title: string;
  sales_pitch_summary: string;
  sales_pitch_script: string;
  modules: string[];
}

export default function SalesPitchPage() {
  const [courses, setCourses] = useState<CoursePitchData[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editScript, setEditScript] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [saving, setSaving] = useState(false);

  // Material upload state
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ title: '', url: '' });

  // Full Lead Entry state
  const initialLeadState = { 
    name: '', phone: '', email: '', source: '', course_interest: '',
    grad_year: '', qualification: '', it_background: '', preferred_mode: '', location: '', notes: ''
  };
  const [newLead, setNewLead] = useState(initialLeadState);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadError, setLeadError] = useState('');

  const user = getCurrentUser();
  const canEdit = user?.role === 'Manager' || user?.role === 'CEO' || user?.role === 'DM' || user?.role === 'Admin';
  
  const scriptTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchPitchData = async () => {
      try {
        const { client, isTursoConfigured } = await import('../../lib/turso');
        if (!isTursoConfigured || !client) {
          setLoading(false);
          return;
        }

        const courseRes = await getCoursesForPitch();
        
        const fetchedCourses: CoursePitchData[] = [];
        for (const c of courseRes) {
          const modules = await getCourseModules(c.id as string);
          fetchedCourses.push({
            id: c.id as string,
            title: c.title as string,
            sales_pitch_summary: (c.sales_pitch_summary as string) || `Master ${c.title}. Enroll now!`,
            sales_pitch_script: (c.sales_pitch_script as string) || `Hi! This is our flagship ${c.title} course. You'll get hands-on experience and direct placement support!`,
            modules
          });
        }
        
        setCourses(fetchedCourses);
        if (fetchedCourses.length > 0) {
          setSelectedCourseId(fetchedCourses[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch pitch data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPitchData();
  }, []);

  const selectedData = courses.find(c => c.id === selectedCourseId);

  useEffect(() => {
    setIsEditing(false);
    if (selectedData) {
      setEditScript(selectedData.sales_pitch_script);
      setEditSummary(selectedData.sales_pitch_summary);
      setNewLead(prev => ({ ...prev, course_interest: selectedData.title }));
    }
  }, [selectedCourseId, selectedData]);

  useEffect(() => {
    if (selectedCourseId) {
      getCourseMaterials(selectedCourseId).then(setMaterials);
    }
  }, [selectedCourseId]);

  const handleSave = async () => {
    if (!selectedData) return;
    setSaving(true);
    const success = await updateCoursePitch(selectedData.id, editSummary, editScript);
    if (success) {
      setCourses(prev => prev.map(c => c.id === selectedData.id ? { ...c, sales_pitch_script: editScript, sales_pitch_summary: editSummary } : c));
      setIsEditing(false);
    } else {
      alert("Failed to save changes.");
    }
    setSaving(false);
  };

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditScript(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };
  
  useEffect(() => {
    if (isEditing && scriptTextareaRef.current) {
      scriptTextareaRef.current.style.height = 'auto';
      scriptTextareaRef.current.style.height = scriptTextareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadError('');
    
    if (!newLead.name || !newLead.phone || !newLead.email || !newLead.source) {
      setLeadError('Please fill out Name, Phone, Email, and Source.');
      return;
    }

    const phoneClean = newLead.phone.replace(/\D/g, '');
    if (phoneClean.length < 10 || phoneClean.length > 15) {
      setLeadError('Please enter a valid 10-15 digit phone number.');
      return;
    }
    
    setLeadSubmitting(true);
    const leadData = {
      ...newLead,
      status: 'New' as any,
      assigned_to: user?.id || ''
    };
    
    const id = await createLead(leadData);
    
    if (id) {
      setLeadSuccess(true);
      setNewLead({ ...initialLeadState, course_interest: selectedData?.title || '' });
      setTimeout(() => setLeadSuccess(false), 3000);
    } else {
      setLeadError('Failed to create lead. Please try again.');
    }
    setLeadSubmitting(false);
  };

  const handleAddMaterial = async () => {
    if (!selectedCourseId || !newMaterial.title || !newMaterial.url) return;
    const id = await addCourseMaterial(selectedCourseId, newMaterial.title, newMaterial.url);
    if (id) {
      setMaterials([...materials, { id, course_id: selectedCourseId, title: newMaterial.title, url: newMaterial.url, type: 'Demo Material' }]);
      setIsAddingMaterial(false);
      setNewMaterial({ title: '', url: '' });
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (window.confirm("Delete this demo material?")) {
      const success = await deleteCourseMaterial(id);
      if (success) {
        setMaterials(materials.filter(m => m.id !== id));
      }
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-erp-primary" /> Sales Pitch Assistant
            </h1>
            <p className="text-erp-text/70 font-medium mt-1">Dynamically updated pitch scripts, materials, and comprehensive lead entry.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 text-erp-text/50 font-bold">
            <div className="w-8 h-8 border-4 border-erp-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : courses.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12 text-erp-text/50">
            <AlertCircle className="w-12 h-12 mb-4 text-slate-300" />
            <h2 className="text-xl font-bold mb-2">No Courses Found</h2>
            <p>Please ensure courses are created in the Course CMS.</p>
          </Card>
        ) : selectedData ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              
              {/* Course Selection */}
              <Card className="bg-white">
                <h2 className="text-xl font-bold font-display mb-4 text-erp-text">1. Select Course Target</h2>
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar">
                  {courses.map(course => (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className={`px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${selectedCourseId === course.id ? 'bg-erp-primary text-white shadow-lg shadow-erp-primary/30 transform scale-105' : 'bg-erp-surface text-erp-text/70 hover:bg-erp-primary/10 hover:text-erp-primary border border-erp-border'}`}
                    >
                      {course.title}
                    </button>
                  ))}
                </div>

                {/* Script Box */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-100 rounded-2xl p-6 relative shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2 text-lg">
                      <ClipboardList className="w-6 h-6 text-indigo-600" /> Calling Script
                    </h3>
                    {canEdit && !isEditing && (
                      <button onClick={() => setIsEditing(true)} className="bg-white px-3 py-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-2 font-bold shadow-sm border border-indigo-100 transition-colors">
                        <Edit2 className="w-4 h-4" /> Edit Script
                      </button>
                    )}
                    {isEditing && (
                      <div className="flex gap-2">
                        <button onClick={() => setIsEditing(false)} className="bg-white px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-700 text-sm flex items-center gap-2 font-bold shadow-sm border border-gray-200 transition-colors">
                          <X className="w-4 h-4" /> Cancel
                        </button>
                        <button onClick={handleSave} disabled={saving} className="bg-indigo-600 px-4 py-1.5 rounded-lg text-white hover:bg-indigo-700 text-sm flex items-center gap-2 font-bold shadow-sm transition-colors">
                          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <textarea 
                      ref={scriptTextareaRef}
                      value={editScript}
                      onChange={handleScriptChange}
                      className="w-full min-h-[200px] p-4 rounded-xl border-2 border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none bg-white font-medium text-indigo-900 text-lg resize-none shadow-inner"
                      placeholder="Enter the sales script here..."
                    />
                  ) : (
                    <p className="text-xl font-medium text-indigo-900 leading-relaxed whitespace-pre-wrap">
                      "{selectedData.sales_pitch_script}"
                    </p>
                  )}
                </div>
              </Card>

              {/* Modules List */}
              <Card>
                <h3 className="font-bold text-erp-text mb-4 text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-erp-primary" /> 
                  Curriculum & Modules ({selectedData.modules.length})
                </h3>
                <div className="flex flex-wrap gap-3">
                  {selectedData.modules.length > 0 ? (
                    selectedData.modules.map((mod, idx) => (
                      <span key={idx} className="bg-erp-surface border-2 border-erp-border text-erp-text font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {mod}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm font-bold text-erp-text/40 bg-erp-surface p-4 rounded-xl w-full text-center border-2 border-dashed border-erp-border">No modules added yet.</p>
                  )}
                </div>
              </Card>

              {/* Course Summary */}
              <Card>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-erp-text text-sm uppercase">Course Summary</h3>
                </div>
                {isEditing ? (
                  <textarea 
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="w-full min-h-[100px] p-3 rounded-xl border-2 border-slate-200 focus:border-slate-400 focus:outline-none bg-erp-surface font-medium text-sm text-erp-text/80 resize-y"
                  />
                ) : (
                  <p className="text-erp-text/70 font-medium text-sm leading-relaxed">{selectedData.sales_pitch_summary}</p>
                )}
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              
              {/* Full Lead Entry Form */}
              <Card className="border-2 border-erp-primary/20 shadow-lg">
                <h3 className="font-bold text-erp-text mb-4 text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-erp-primary" /> Lead Entry Form
                </h3>
                
                <form onSubmit={handleCreateLead} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative col-span-2">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/40" />
                      <input type="text" required placeholder="Full Name *" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full bg-erp-surface border border-erp-border rounded-lg pl-10 pr-4 py-2 font-bold focus:border-erp-primary outline-none transition-colors text-gray-900 placeholder-gray-500" />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/40" />
                      <input type="tel" required minLength={10} maxLength={15} pattern="[0-9\+\-\s]+" title="Valid phone number required" placeholder="Phone *" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} className="w-full bg-erp-surface border border-erp-border rounded-lg pl-10 pr-4 py-2 font-bold focus:border-erp-primary outline-none transition-colors text-gray-900 placeholder-gray-500" />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/40" />
                      <input type="email" required placeholder="Email *" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} className="w-full bg-erp-surface border border-erp-border rounded-lg pl-10 pr-4 py-2 font-bold focus:border-erp-primary outline-none transition-colors text-gray-900 placeholder-gray-500" />
                    </div>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/40" />
                      <select required value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})} className="w-full bg-erp-surface border border-erp-border rounded-lg pl-10 pr-4 py-2 font-bold focus:border-erp-primary outline-none transition-colors appearance-none text-gray-900">
                        <option value="" disabled className="text-gray-500">Source *</option>
                        <option value="Walk-in">Walk-in</option>
                        <option value="Facebook Ad">Facebook Ad</option>
                        <option value="Google Ad">Google Ad</option>
                        <option value="Website">Website</option>
                        <option value="Referral">Referral</option>
                        <option value="Cold Call">Cold Call</option>
                      </select>
                    </div>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/40" />
                      <select value={newLead.course_interest} onChange={e => setNewLead({...newLead, course_interest: e.target.value})} className="w-full bg-erp-surface border border-erp-border rounded-lg pl-10 pr-4 py-2 font-bold focus:border-erp-primary outline-none transition-colors appearance-none text-gray-900">
                        <option value="" disabled className="text-gray-500">Course Interest</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.title}>{course.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/40" />
                      <input type="text" placeholder="Location" value={newLead.location} onChange={e => setNewLead({...newLead, location: e.target.value})} className="w-full bg-erp-surface border border-erp-border rounded-lg pl-10 pr-4 py-2 font-bold focus:border-erp-primary outline-none transition-colors text-gray-900 placeholder-gray-500" />
                    </div>
                    <div className="relative">
                      <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/40" />
                      <select value={newLead.preferred_mode} onChange={e => setNewLead({...newLead, preferred_mode: e.target.value})} className="w-full bg-erp-surface border border-erp-border rounded-lg pl-10 pr-4 py-2 font-bold focus:border-erp-primary outline-none transition-colors appearance-none text-gray-900">
                        <option value="" disabled className="text-gray-500">Pref. Mode</option>
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                      </select>
                    </div>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/40" />
                      <select value={newLead.qualification} onChange={e => setNewLead({...newLead, qualification: e.target.value})} className="w-full bg-erp-surface border border-erp-border rounded-lg pl-10 pr-4 py-2 font-bold focus:border-erp-primary outline-none transition-colors appearance-none text-gray-900">
                        <option value="" disabled className="text-gray-500">Qualification</option>
                        <option value="B.Tech/BE">B.Tech/BE</option>
                        <option value="M.Tech/ME">M.Tech/ME</option>
                        <option value="BCA">BCA</option>
                        <option value="MCA">MCA</option>
                        <option value="BSc">BSc</option>
                        <option value="MSc">MSc</option>
                        <option value="BBA/BBM">BBA/BBM</option>
                        <option value="MBA">MBA</option>
                        <option value="BCom">BCom</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/40" />
                      <input type="text" placeholder="Grad Year" value={newLead.grad_year} onChange={e => setNewLead({...newLead, grad_year: e.target.value})} className="w-full bg-erp-surface border border-erp-border rounded-lg pl-10 pr-4 py-2 font-bold focus:border-erp-primary outline-none transition-colors text-gray-900 placeholder-gray-500" />
                    </div>
                    <div className="relative col-span-2">
                      <select value={newLead.it_background} onChange={e => setNewLead({...newLead, it_background: e.target.value})} className="w-full bg-erp-surface border border-erp-border rounded-lg px-4 py-2 font-bold focus:border-erp-primary outline-none transition-colors appearance-none text-gray-900">
                        <option value="" disabled className="text-gray-500">IT Background?</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div className="relative col-span-2">
                      <textarea placeholder="Additional Notes..." value={newLead.notes} onChange={e => setNewLead({...newLead, notes: e.target.value})} className="w-full bg-erp-surface border border-erp-border rounded-lg px-4 py-2 font-medium focus:border-erp-primary outline-none transition-colors min-h-[60px] resize-y text-sm text-gray-900 placeholder-gray-500" />
                    </div>
                  </div>
                  
                  {leadError && (
                    <p className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded-md border border-red-200">{leadError}</p>
                  )}
                  {leadSuccess && (
                    <p className="text-green-600 text-xs font-bold bg-green-50 p-2 rounded-md border border-green-200 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Lead assigned as 'New'
                    </p>
                  )}
                  
                  <Button type="submit" variant="primary" fullWidth disabled={leadSubmitting} className="mt-2 text-sm shadow-md h-10">
                    {leadSubmitting ? 'Saving...' : 'Add Lead Record'}
                  </Button>
                </form>
              </Card>

              {/* Demo Materials Box */}
              <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-none shadow-xl shadow-indigo-500/20">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Download className="w-5 h-5" /> Demo Materials
                    </h3>
                    <p className="text-indigo-100 text-sm">Download or share course materials.</p>
                  </div>
                  {canEdit && (
                    <button onClick={() => setIsAddingMaterial(!isAddingMaterial)} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors">
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>

                {isAddingMaterial && (
                  <div className="bg-black/20 p-3 rounded-lg mb-4 space-y-2">
                    <input type="text" placeholder="Material Title (e.g. PDF Brochure)" value={newMaterial.title} onChange={e => setNewMaterial({...newMaterial, title: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm text-white placeholder-white/50 focus:outline-none" />
                    <input type="url" placeholder="URL Link (Drive, DropBox, etc)" value={newMaterial.url} onChange={e => setNewMaterial({...newMaterial, url: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded px-3 py-1.5 text-sm text-white placeholder-white/50 focus:outline-none" />
                    <div className="flex gap-2">
                      <Button variant="info" className="flex-1 py-1 h-auto text-xs bg-white text-indigo-700 font-bold" onClick={handleAddMaterial}>Add</Button>
                      <Button variant="ghost" className="flex-1 py-1 h-auto text-xs text-white hover:bg-white/20" onClick={() => setIsAddingMaterial(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {materials.length === 0 ? (
                    <div className="bg-white/10 border border-white/20 border-dashed p-4 rounded-xl text-center text-sm font-medium text-white/70">
                      No materials assigned yet.
                    </div>
                  ) : (
                    materials.map(mat => (
                      <div key={mat.id} className="flex gap-2 items-stretch">
                        <Button variant="info" className="flex-1 flex flex-col items-center justify-center gap-1 bg-white text-indigo-700 hover:bg-indigo-50 font-bold border-none shadow-md py-3 h-auto" onClick={() => window.open(mat.url, '_blank')}>
                          <Download className="w-4 h-4" />
                          <span className="text-xs truncate max-w-full px-1">{mat.title}</span>
                        </Button>
                        <Button variant="info" className="w-10 flex-shrink-0 flex items-center justify-center bg-green-500 text-white hover:bg-green-600 font-bold border-none shadow-md p-0" onClick={() => { navigator.clipboard.writeText(mat.url); alert("Link copied to clipboard for WhatsApp!"); }} title="Copy Link for WhatsApp">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        {canEdit && (
                          <Button variant="info" className="w-10 flex-shrink-0 flex items-center justify-center bg-red-500/20 text-white hover:bg-red-500 font-bold border border-red-500/50 shadow-md p-0" onClick={() => handleDeleteMaterial(mat.id)} title="Delete Material">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
