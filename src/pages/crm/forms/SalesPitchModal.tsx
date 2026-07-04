import React from 'react';
import { Card } from '../../../components/ui/erp/Card';
import { Button } from '../../../components/ui/erp/Button';
import { X, BookOpen, Share2 } from 'lucide-react';

interface SalesPitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseInterest: string;
}

const PITCH_DATA: Record<string, { summary: string, modules: string[], pitch: string }> = {
  'Data Science': {
    summary: 'Master Data Science with AI. Learn SQL, Python, ML, AI, and PowerBI.',
    modules: ['SQL', 'Python (for Data Science)', 'Machine Learning', 'AI Basics', 'Soft Skills', 'Excel', 'Power BI', 'SDLC'],
    pitch: "Hi! This is our flagship Data Science course. It's uniquely designed with an AI-driven learning portal. You'll get hands-on experience, mock interviews every 5 days, and direct placement support. Plus, if you refer friends, you can earn up to ₹6000 cash bonus!"
  },
  'Full Stack Web': {
    summary: 'Complete Web Development from Frontend to Backend.',
    modules: ['HTML/CSS', 'JavaScript/React', 'Node.js', 'Databases', 'Deployment', 'Soft Skills'],
    pitch: "Our Full Stack course takes you from zero to deployment. We have interactive coding environments built right into the portal. Mock technical interviews every 5 days guarantee you're interview-ready."
  }
};

export function SalesPitchModal({ isOpen, onClose, courseInterest }: SalesPitchModalProps) {
  if (!isOpen) return null;

  // Fallback to Data Science if unknown course
  const data = PITCH_DATA[courseInterest] || PITCH_DATA['Data Science'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-erp-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold font-display text-erp-text flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-erp-primary" />
            Pitch Assistant
          </h2>
          <button onClick={onClose} className="p-2 bg-erp-surface rounded-full text-erp-text/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-erp-text/70 mb-2">Course Summary</h3>
            <p className="text-sm font-medium">{data.summary}</p>
          </div>

          <div>
            <h3 className="font-bold text-erp-text/70 mb-2">Curriculum / Modules</h3>
            <div className="flex flex-wrap gap-2">
              {data.modules.map(mod => (
                <span key={mod} className="bg-erp-primary/10 text-erp-primary text-xs font-bold px-2 py-1 rounded-md">
                  {mod}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-erp-surface p-4 rounded-xl border-2 border-erp-border">
            <h3 className="font-bold text-erp-text mb-2">Script / Pitch</h3>
            <p className="text-sm italic text-erp-text/80">"{data.pitch}"</p>
          </div>

          <Button variant="info" fullWidth className="flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" /> Share Brochure via WhatsApp
          </Button>
        </div>
      </Card>
    </div>
  );
}
