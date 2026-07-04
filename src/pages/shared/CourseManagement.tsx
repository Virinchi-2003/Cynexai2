import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { BookOpen, FolderOpen, Users, BarChart, FileVideo, Plus, ArrowRight, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';
import { client } from '../../lib/turso';

export default function CourseManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const basePath = location.pathname.startsWith('/ceo') ? '/ceo' : '/manager';

  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Course Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  // Add Module Modal State
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [selectedCourseForModule, setSelectedCourseForModule] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    if (!client) {
      console.error("Turso client not configured.");
      setLoading(false);
      return;
    }
    try {
      // Fetch Courses
      const coursesRes = await client.execute('SELECT * FROM courses ORDER BY created_at DESC');
      // Fetch Modules via junction mapping
      const modulesRes = await client.execute('SELECT m.*, cmm.course_id, cmm.order_index FROM modules m JOIN course_module_mapping cmm ON m.id = cmm.module_id ORDER BY cmm.order_index ASC');
      // Fetch Classes
      const classesRes = await client.execute('SELECT * FROM classes ORDER BY order_index ASC');

      const courseMap = new Map();
      
      coursesRes.rows.forEach(c => {
        courseMap.set(c.id, {
          id: c.id,
          name: c.title,
          description: c.description,
          studentsEnrolled: 0,
          modules: [],
          batches: [] // Keep empty for now as requested
        });
      });

      const moduleMap = new Map();
      modulesRes.rows.forEach(m => {
        const mod = {
          id: m.id,
          course_id: m.course_id,
          name: m.title,
          classes: [],
          completedBy: 0
        };
        moduleMap.set(m.id, mod);
        if (courseMap.has(m.course_id as string)) {
          courseMap.get(m.course_id as string).modules.push(mod);
        }
      });

      classesRes.rows.forEach(cls => {
        if (moduleMap.has(cls.module_id)) {
          moduleMap.get(cls.module_id).classes.push({
            id: cls.id,
            title: cls.title,
            type: cls.type
          });
        }
      });

      const finalCourses = Array.from(courseMap.values());
      if (finalCourses.length > 0 && !expandedCourse) {
        setExpandedCourse(finalCourses[0].id);
      }
      setCourses(finalCourses);
    } catch (e) {
      console.error("Failed to fetch courses:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!client || !newCourseName) return;
    const courseId = 'course_' + Date.now();
    try {
      await client.execute({
        sql: 'INSERT INTO courses (id, title, description, instructor_id, status) VALUES (?, ?, ?, ?, ?)',
        args: [courseId, newCourseName, newCourseDesc, user?.id || 'sys', 'published']
      });
      setIsModalOpen(false);
      setNewCourseName('');
      setNewCourseDesc('');
      await fetchCourses();
      setExpandedCourse(courseId);
    } catch (e) {
      console.error("Error creating course:", e);
      alert("Failed to create course. Please try again.");
    }
  };

  const handleAddModule = async () => {
    if (!client || !newModuleName || !selectedCourseForModule) return;
    const moduleId = 'mod_' + Date.now();
    try {
      const course = courses.find(c => c.id === selectedCourseForModule);
      const nextOrder = course ? course.modules.length : 0;
      // 1. Insert into global modules table
      await client.execute({
        sql: 'INSERT INTO modules (id, title, description) VALUES (?, ?, ?)',
        args: [moduleId, newModuleName, '']
      });
      // 2. Map global module to specific course
      await client.execute({
        sql: 'INSERT INTO course_module_mapping (course_id, module_id, order_index) VALUES (?, ?, ?)',
        args: [selectedCourseForModule, moduleId, nextOrder]
      });
      setIsModuleModalOpen(false);
      setNewModuleName('');
      await fetchCourses();
    } catch (e) {
      console.error("Error creating module:", e);
      alert("Failed to create module.");
    }
  };

  if (loading) {
    return <div className="p-8 text-erp-text flex items-center gap-4">
       <div className="w-8 h-8 border-4 border-erp-primary border-t-transparent rounded-full animate-spin"></div>
       Loading courses from Turso...
    </div>;
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-32 p-4 md:p-8 bg-erp-background relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-500" /> Course Management
          </h1>
          <p className="text-erp-text/70 font-medium mt-1">Manage curriculum, track batch progress, and generate AI materials.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course List & Modules */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold font-display text-erp-text">Active Courses</h2>
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Course
            </Button>
          </div>

          <div className="space-y-4">
            {courses.length === 0 && (
               <div className="p-8 text-center bg-erp-surface border border-erp-border rounded-xl text-erp-text/50">
                 No courses found. Click "New Course" to begin.
               </div>
            )}
            {courses.map(course => (
              <Card key={course.id} className="bg-erp-surface border-erp-border p-0 overflow-hidden transition-all">
                <div 
                  className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-800/50"
                  onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-erp-text">{course.name}</h3>
                      <p className="text-sm text-erp-text/50">{course.modules.length} Modules • {course.studentsEnrolled} Students Enrolled</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-erp-secondary">
                    {expandedCourse === course.id ? 'Hide Details' : 'View Details'}
                  </Button>
                </div>

                {expandedCourse === course.id && (
                  <div className="border-t border-erp-border bg-black/20 p-6 space-y-6">
                    
                    {/* Modules List */}
                    <div>
                      <h4 className="font-bold text-erp-text mb-4 flex items-center gap-2">
                        <FileVideo className="w-4 h-4 text-purple-400" /> Modules & Curriculum
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {course.modules.map((mod: any) => (
                          <div key={mod.id} className="bg-erp-surface border border-erp-border rounded-lg p-4 flex flex-col justify-between hover:border-indigo-400 transition-colors cursor-pointer" onClick={() => navigate(`${basePath}/courses/${course.id}/modules/${mod.id}`)}>
                            <div className="mb-4">
                              <h5 className="font-bold text-erp-text truncate">{mod.name}</h5>
                              <p className="text-xs text-erp-text/60 mt-1">{mod.classes.length} Classes</p>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-xs font-bold text-green-400">{mod.completedBy}% Completion</div>
                              <Button variant="ghost" className="h-6 px-2 text-xs flex items-center gap-1 border border-erp-border">
                                Edit Classes <ArrowRight className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="bg-erp-surface border-2 border-dashed border-erp-border rounded-lg p-4 flex flex-col items-center justify-center text-erp-text/50 hover:text-indigo-400 hover:border-indigo-400 cursor-pointer transition-colors min-h-[120px]" onClick={() => {
                          setSelectedCourseForModule(course.id);
                          setIsModuleModalOpen(true);
                        }}>
                          <Plus className="w-6 h-6 mb-2" />
                          <span className="font-bold text-sm">Add Module</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Batch Progress Widget */}
        <div className="space-y-6">
          <Card className="bg-erp-surface border-erp-border sticky top-8">
            <h2 className="text-xl font-bold font-display text-erp-text mb-6 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-green-500" /> Batch Progress
            </h2>
            
            {expandedCourse ? (
              <div className="space-y-6">
                <h3 className="font-bold text-erp-text/80 text-sm">
                  {courses.find(c => c.id === expandedCourse)?.name}
                </h3>
                {courses.find(c => c.id === expandedCourse)?.batches.length === 0 && (
                  <p className="text-erp-text/50 text-sm">No batches assigned to this course yet.</p>
                )}
                {courses.find(c => c.id === expandedCourse)?.batches.map((batch: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-erp-text">{batch.name}</span>
                      <span className="text-xs font-bold bg-slate-800 px-2 py-1 rounded text-slate-300">
                        {batch.students} Students
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${batch.progress > 70 ? 'bg-green-500' : batch.progress > 30 ? 'bg-blue-500' : 'bg-orange-500'}`} 
                        style={{ width: `${batch.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-right font-bold text-erp-text/50">{batch.progress}% Completed</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-erp-text/50">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a course to view detailed batch progress.</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* New Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-erp-surface border border-erp-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-erp-border bg-slate-900/50">
              <h2 className="text-xl font-bold text-erp-text font-display flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" /> Create New Course
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-erp-text/50 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-erp-text/70 mb-2">Course Name</label>
                <input 
                  type="text" 
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g. Advanced AI Integration"
                  className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-3 text-erp-text focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-erp-text/70 mb-2">Short Description</label>
                <textarea 
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  placeholder="What will students learn?"
                  rows={3}
                  className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-3 text-erp-text focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-erp-border bg-slate-900/30 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateCourse} disabled={!newCourseName.trim()}>
                Create Course <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Module Modal */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-erp-surface border border-erp-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-erp-border bg-slate-900/50">
              <h2 className="text-xl font-bold text-erp-text font-display flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-400" /> Add New Module
              </h2>
              <button onClick={() => setIsModuleModalOpen(false)} className="text-erp-text/50 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-erp-text/70 mb-2">Module Name</label>
                <input 
                  type="text" 
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  placeholder="e.g. Module 1: Introduction to Python"
                  className="w-full bg-erp-background border border-erp-border rounded-xl px-4 py-3 text-erp-text focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-6 border-t border-erp-border bg-slate-900/30 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsModuleModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAddModule} disabled={!newModuleName.trim()}>
                Add Module <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
