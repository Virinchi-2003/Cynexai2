import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { BookOpen, Upload, FileText, Plus, Sparkles, Video } from 'lucide-react';
import { client } from '../../lib/turso';
import { getCurrentUser } from '../../lib/auth';
import { useNavigate } from 'react-router-dom';

export default function TeacherCMS() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    fetchModules();
  }, []);

  async function fetchModules() {
    if (!client || !user) return;
    try {
      // 1. Fetch modules assigned to this instructor (or all if admin/ceo)
      const isSuper = ['Admin', 'Manager', 'CEO'].includes(user.role);
      let mRes;
      if (isSuper) {
        mRes = await client.execute("SELECT * FROM modules ORDER BY title ASC");
      } else {
        mRes = await client.execute({
          sql: "SELECT * FROM modules WHERE instructor_id = ? ORDER BY title ASC",
          args: [user.id]
        });
      }

      // 2. Fetch classes for those modules
      if (mRes.rows.length > 0) {
        const modIds = mRes.rows.map(m => `'${m.id}'`).join(',');
        const cRes = await client.execute(`SELECT * FROM classes WHERE module_id IN (${modIds}) ORDER BY order_index ASC`);
        
        const merged = mRes.rows.map(m => ({
          ...m,
          classes: cRes.rows.filter(c => c.module_id === m.id)
        }));
        setModules(merged);
      } else {
        setModules([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const generateAiContent = async (classId: string, title: string, topics: string) => {
    // Navigate to PresentationView where the AI generation happens
    navigate(`/teacher/presentation?classId=${classId}`);
  };

  if (loading) return <div className="p-8 text-erp-text">Loading Curriculum...</div>;

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text">Course CMS</h1>
            <p className="text-erp-text/70 font-medium mt-1">Manage your assigned modules and generate AI lessons</p>
          </div>
        </div>

        {modules.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-erp-text/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-erp-text mb-2">No modules assigned</h2>
            <p className="text-erp-text/50">Please contact the manager to assign modules to your account.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {modules.map(mod => (
              <Card key={mod.id as string} className="border-l-4 border-erp-primary">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-erp-text">{mod.title}</h2>
                    <p className="text-sm font-bold text-erp-text/50">{mod.description}</p>
                  </div>
                </div>
                
                <div className="bg-erp-surface rounded-xl border border-erp-border p-4 space-y-3">
                  {mod.classes.length === 0 ? (
                    <div className="text-center p-4 text-erp-text/50 text-sm">No classes in this module yet.</div>
                  ) : (
                    mod.classes.map((cls: any) => (
                      <div key={cls.id as string} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3 rounded-lg border border-erp-border gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${cls.type === 'live' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                            {cls.type === 'live' ? <RadioIcon className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-slate-800">{cls.title}</span>
                            <p className="text-xs text-slate-500 truncate max-w-sm">{cls.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          {cls.ai_ppt_markdown ? (
                            <Button 
                              onClick={() => generateAiContent(cls.id as string, cls.title as string, cls.description as string)}
                              variant="ghost" className="h-9 px-3 text-xs bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                            >
                              <FileText className="w-4 h-4 mr-2" /> View Slides
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => generateAiContent(cls.id as string, cls.title as string, cls.description as string)}
                              variant="ghost" className="h-9 px-3 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                            >
                              <Sparkles className="w-4 h-4 mr-2" /> Generate AI Slides
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const RadioIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="2"></circle>
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path>
  </svg>
);
