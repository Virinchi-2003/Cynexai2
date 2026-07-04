import React from 'react';
import { Card } from '../../../components/ui/erp/Card';
import { Button } from '../../../components/ui/erp/Button';
import { BookOpen, Plus } from 'lucide-react';

export default function CourseMgmt() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text">Course CMS</h1>
            <p className="text-erp-text/70 font-medium mt-1">Manage all academy courses</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> New Course
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-erp-primary/10 p-4 rounded-xl text-erp-primary">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-erp-text">Full Stack Web Dev</h3>
                <p className="text-sm font-bold text-erp-text/50">12 Modules • 45 Students</p>
              </div>
            </div>
            
            <div className="bg-erp-surface border border-erp-border rounded-xl p-3 mb-4">
              <h4 className="text-xs font-bold uppercase text-erp-text/70 mb-2">Rolling Modules</h4>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span>M1: HTML/CSS Foundations</span>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">15-30 Students</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span>M2: JavaScript Deep Dive</span>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">10-25 Students</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-auto">
              <Button variant="ghost" className="flex-1 border-2 border-erp-border hover:border-erp-primary">Edit Modules</Button>
            </div>
          </Card>
          
          <Card className="flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-purple-100 p-4 rounded-xl text-purple-700">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-erp-text">Data Science & ML</h3>
                <p className="text-sm font-bold text-erp-text/50">8 Modules • 28 Students</p>
              </div>
            </div>

            <div className="bg-erp-surface border border-erp-border rounded-xl p-3 mb-4">
              <h4 className="text-xs font-bold uppercase text-erp-text/70 mb-2">Rolling Modules</h4>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span>M1: Python Core</span>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">10-20 Students</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span>M2: SQL Mastery</span>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">10-25 Students</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-auto">
              <Button variant="ghost" className="flex-1 border-2 border-erp-border hover:border-erp-primary">Edit Modules</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
