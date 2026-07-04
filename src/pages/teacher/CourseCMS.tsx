import React, { useState } from 'react';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { BookOpen, Plus, Sparkles, FileText, Video, Save, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CourseCMS() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([
    { id: 1, title: 'SQL Basics', type: 'video' },
    { id: 2, title: 'Relational DBs', type: 'reading' },
  ]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-32 p-4 md:p-8 bg-erp-background">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-erp-text flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-600" /> Course CMS
          </h1>
          <p className="text-erp-text/70 font-medium mt-1">Create modules, topics, class videos, and materials.</p>
        </div>
        <Button onClick={() => navigate('/teacher')} variant="secondary">Back to Portal</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Module Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="flex justify-between items-center bg-erp-surface border-erp-border">
            <h2 className="text-xl font-bold font-display text-erp-text">Data Foundations (Cohort A)</h2>
            <Button className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Lesson</Button>
          </Card>

          {/* List of Modules */}
          <div className="space-y-3">
            {modules.map((mod, idx) => (
              <Card key={mod.id} className="p-4 flex items-center justify-between border-erp-border hover:border-purple-400 cursor-pointer transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-erp-background border border-erp-border flex items-center justify-center font-bold text-erp-text/50">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-erp-text">{mod.title}</h3>
                    <p className="text-xs text-erp-text/50 uppercase">{mod.type}</p>
                  </div>
                </div>
                <Button variant="ghost" className="text-erp-secondary">Edit</Button>
              </Card>
            ))}
          </div>
          
          <Card className="border-dashed border-2 border-erp-border bg-transparent flex flex-col items-center justify-center p-8 cursor-pointer hover:border-purple-400 transition-all text-erp-text/50 hover:text-purple-600">
            <Plus className="w-8 h-8 mb-2" />
            <span className="font-bold">Drag and drop new content or click to create</span>
          </Card>
        </div>

        {/* AI Materials Generator */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-purple-900 to-indigo-900 border-none text-white">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-purple-300" />
              <h2 className="text-xl font-bold font-display">AI Material Generator</h2>
            </div>
            <p className="text-purple-200 text-sm mb-6">Automatically generate class scripts, PPTs, and summaries for your lessons.</p>
            
            <div className="space-y-3">
              <Button className="w-full justify-start bg-white/10 hover:bg-white/20 border-white/10 text-white flex gap-3">
                <PenTool className="w-4 h-4 text-purple-300" /> Generate Script & Keypoints
              </Button>
              <Button className="w-full justify-start bg-white/10 hover:bg-white/20 border-white/10 text-white flex gap-3">
                <Video className="w-4 h-4 text-blue-300" /> Generate Presentation (PPT)
              </Button>
              <Button className="w-full justify-start bg-white/10 hover:bg-white/20 border-white/10 text-white flex gap-3">
                <FileText className="w-4 h-4 text-green-300" /> Post-class Formal Summary
              </Button>
            </div>
          </Card>

          <Card className="bg-erp-surface border-erp-border">
            <h3 className="font-bold text-erp-text mb-4">Quick Actions</h3>
            <Button className="w-full mb-3 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Save Draft
            </Button>
            <Button variant="info" className="w-full flex items-center justify-center gap-2">
              Publish Course <Sparkles className="w-4 h-4" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
