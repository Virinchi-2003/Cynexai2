import React from 'react';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { BookOpen, Upload, FileText, Plus } from 'lucide-react';

export default function TeacherCMS() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text">Course CMS</h1>
            <p className="text-erp-text/70 font-medium mt-1">Manage modules, videos, and materials</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> New Module
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="border-l-4 border-erp-primary">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-erp-text">Module 1: Introduction to React</h2>
                <p className="text-sm font-bold text-erp-text/50">4 Topics • Last updated 2 days ago</p>
              </div>
              <Button variant="ghost" className="border-2 border-erp-border h-8 px-3 text-xs">Edit Module</Button>
            </div>
            
            <div className="bg-erp-surface rounded-xl border border-erp-border p-4 space-y-3">
              <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-erp-border">
                <div className="flex items-center gap-3">
                  <VideoIcon className="w-5 h-5 text-blue-500" />
                  <span className="font-bold text-sm">1.1 What is React?</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" className="h-8 w-8 p-0" title="Upload Video"><Upload className="w-4 h-4" /></Button>
                  <Button variant="ghost" className="h-8 w-8 p-0" title="Edit Script"><FileText className="w-4 h-4" /></Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-erp-border">
                <div className="flex items-center gap-3">
                  <VideoIcon className="w-5 h-5 text-blue-500" />
                  <span className="font-bold text-sm">1.2 Components and Props</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" className="h-8 w-8 p-0" title="Upload Video"><Upload className="w-4 h-4" /></Button>
                  <Button variant="ghost" className="h-8 w-8 p-0" title="Edit Script"><FileText className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="border-l-4 border-slate-300 opacity-70">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-erp-text">Module 2: State & Lifecycle</h2>
                <p className="text-sm font-bold text-erp-text/50">0 Topics • Draft</p>
              </div>
              <Button variant="ghost" className="border-2 border-erp-border h-8 px-3 text-xs">Add Topic</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const VideoIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="23 7 16 12 23 17 23 7"></polygon>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
  </svg>
);
