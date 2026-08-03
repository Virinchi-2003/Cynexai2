import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '../../ui/erp/Button';
import { createProject, Project } from '../../../lib/api/projects';
import { getCurrentUser } from '../../../lib/auth';

interface ProjectModalProps {
  onClose: () => void;
  onSuccess: (projectId: string) => void;
  project?: Project | null;
}

const COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#0ea5e9', // Light Blue
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
  '#64748b', // Slate
];

export function ProjectModal({ onClose, onSuccess, project }: ProjectModalProps) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [color, setColor] = useState(project?.color || COLORS[5]);
  const [loading, setLoading] = useState(false);
  const user = getCurrentUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    
    setLoading(true);
    try {
      if (project) {
        const { updateProject } = await import('../../../lib/api/projects');
        await updateProject(project.id, {
          name: name.trim(),
          description: description.trim() || null,
          color,
        });
        onSuccess(project.id);
      } else {
        const id = await createProject({
          name: name.trim(),
          description: description.trim() || null,
          color,
          owner_id: user.id,
          status: 'Active'
        });
        if (id) onSuccess(id);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-erp-background rounded-2xl shadow-2xl border-2 border-erp-border overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-erp-border bg-white dark:bg-black">
          <h2 className="text-xl font-display font-bold text-erp-text">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="p-1 text-erp-text/50 hover:text-erp-text hover:bg-erp-surface rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-erp-text/70 uppercase tracking-wider">Project Name</label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white dark:bg-black border-2 border-erp-border rounded-xl px-3 py-2.5 text-sm font-semibold text-erp-text focus:outline-none focus:border-erp-primary"
              placeholder="e.g., Marketing Q3 Launch"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-erp-text/70 uppercase tracking-wider">Description (Optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-white dark:bg-black border-2 border-erp-border rounded-xl px-3 py-2.5 text-sm font-medium text-erp-text focus:outline-none focus:border-erp-primary min-h-[80px] resize-none"
              placeholder="What's this project about?"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-erp-text/70 uppercase tracking-wider">Project Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm"
                  style={{ backgroundColor: c, border: color === c ? '2px solid #1e293b' : '2px solid transparent' }}
                >
                  {color === c && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || loading} className="min-w-[100px]">
              {loading ? 'Saving...' : (project ? 'Save Changes' : 'Create Project')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
