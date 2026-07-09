import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { FolderOpen, Plus, ArrowRight, Video, FileText, ArrowLeft, X, Edit, Trash2 } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getModuleDetails, createClassForModule, deleteClass } from '../../lib/api/cms';

export default function ModuleEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/ceo') ? '/ceo' : '/manager';
  const { courseId, moduleId } = useParams();

  const [moduleData, setModuleData] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Class Modal
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassType, setNewClassType] = useState('video'); // video, pdf, zoom

  useEffect(() => {
    fetchModuleData();
  }, [moduleId]);

  const fetchModuleData = async () => {
    try {
      const data = await getModuleDetails(moduleId as string);
      if (data.module) {
        setModuleData(data.module);
      }
      setClasses(data.classes as any);
    } catch (e) {
      console.error("Failed to fetch module data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    if (!moduleId || !newClassTitle) return;
    const classId = 'cls_' + Date.now();
    try {
      const nextOrder = classes.length;
      await createClassForModule(classId, moduleId, newClassTitle, nextOrder, newClassType);
      setIsClassModalOpen(false);
      setNewClassTitle('');
      await fetchModuleData();
    } catch (e) {
      console.error("Error creating class:", e);
      alert("Failed to create class.");
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (confirm("Are you sure you want to delete this class?")) {
      try {
        await deleteClass(classId);
        await fetchModuleData();
      } catch (e) {
        console.error("Failed to delete class", e);
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-erp-text">Loading module classes...</div>;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-32 p-4 md:p-8 bg-erp-background">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-erp-text/50 font-bold mb-2 cursor-pointer hover:text-indigo-400" onClick={() => navigate(`${basePath}/courses`)}>
            <ArrowLeft className="w-4 h-4" /> Back to Courses
          </div>
          <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-indigo-500" /> 
            {moduleData?.title || 'Module Editor'}
          </h1>
        </div>
        <Button onClick={() => setIsClassModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Class
        </Button>
      </div>

      <div className="space-y-4 max-w-4xl">
        {classes.length === 0 ? (
          <div className="p-12 text-center bg-erp-surface border border-erp-border rounded-xl text-erp-text/50">
            No classes found in this module. Click "Add Class" to start building.
          </div>
        ) : (
          classes.map((cls, idx) => (
            <Card key={cls.id} className="bg-erp-surface border-erp-border p-4 flex justify-between items-center group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cls.type === 'video' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                  {cls.type === 'video' ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-erp-text">Class {idx + 1}: {cls.title}</h3>
                  <p className="text-xs text-erp-text/50 uppercase tracking-wider mt-1">{cls.type} Lesson</p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" onClick={() => navigate(`${basePath}/courses/${courseId}/modules/${moduleId}/classes/${cls.id}`)} className="h-8 px-3 text-xs flex items-center gap-1">
                  <Edit className="w-3 h-3" /> Edit Content
                </Button>
                <Button variant="danger" onClick={() => handleDeleteClass(cls.id as string)} className="h-8 w-8 p-0 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Class Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-erp-surface border border-erp-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-erp-border bg-slate-900/50">
              <h2 className="text-xl font-bold text-erp-text font-display flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-400" /> Add New Class
              </h2>
              <button onClick={() => setIsClassModalOpen(false)} className="text-erp-text/50 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-erp-text/70 mb-2">Class Title</label>
                <input 
                  type="text" 
                  value={newClassTitle}
                  onChange={(e) => setNewClassTitle(e.target.value)}
                  placeholder="e.g. Introduction to Variables"
                  className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-3 text-erp-text focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-erp-text/70 mb-2">Content Type</label>
                <select 
                  value={newClassType}
                  onChange={(e) => setNewClassType(e.target.value)}
                  className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-3 text-erp-text focus:outline-none focus:border-indigo-500"
                >
                  <option value="video">Video Lesson</option>
                  <option value="pdf">Reading / PDF</option>
                  <option value="zoom">Live Zoom Session</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-erp-border bg-slate-900/30 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsClassModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAddClass} disabled={!newClassTitle.trim()}>
                Create Class <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
