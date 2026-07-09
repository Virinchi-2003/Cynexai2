import React, { useEffect, useState } from 'react';
import { Activity, Phone, Mail, Users, PenTool, Send } from 'lucide-react';
import { Button } from '../ui/erp/Button';
import { getActivitiesByLead, getActivitiesByStudent, createActivity, Activity as ActivityType } from '../../lib/api/activities';

interface ActivityLogProps {
  entityType: 'lead' | 'student';
  entityId: string;
}

export function ActivityLog({ entityType, entityId }: ActivityLogProps) {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newActivityType, setNewActivityType] = useState<'Call' | 'Email' | 'Meeting' | 'Note'>('Call');
  const [newActivityContent, setNewActivityContent] = useState('');

  const fetchActivities = async () => {
    setLoading(true);
    let data: ActivityType[] = [];
    if (entityType === 'lead') {
      data = await getActivitiesByLead(entityId);
    } else if (entityType === 'student') {
      data = await getActivitiesByStudent(entityId);
    }
    setActivities(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();
  }, [entityType, entityId]);

  const handleAddActivity = async () => {
    if (!newActivityContent) return;
    
    await createActivity({
      type: newActivityType,
      content: newActivityContent,
      lead_id: entityType === 'lead' ? entityId : null,
      student_id: entityType === 'student' ? entityId : null,
    });
    
    setNewActivityContent('');
    await fetchActivities();
  };

  if (loading) {
    return <div className="p-4 text-center text-sm font-bold text-erp-text/50">Loading activities...</div>;
  }

  return (
    <div className="mb-8">
      <h3 className="text-sm font-bold text-erp-text/50 uppercase mb-3 px-2 flex items-center gap-2">
        <Activity className="w-4 h-4" /> Activity Timeline
      </h3>
      <div className="bg-erp-surface rounded-2xl border-2 border-erp-border p-4">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex gap-2">
            <select 
              value={newActivityType}
              onChange={e => setNewActivityType(e.target.value as any)}
              className="bg-erp-background border border-erp-border rounded-lg p-2 text-sm font-bold text-erp-text outline-none"
            >
              <option value="Call">Call</option>
              <option value="Email">Email</option>
              <option value="Meeting">Meeting</option>
              <option value="Note">Note</option>
            </select>
            <input 
              type="text" 
              value={newActivityContent}
              onChange={e => setNewActivityContent(e.target.value)}
              placeholder="Activity details..."
              className="flex-1 bg-erp-background border border-erp-border rounded-lg p-2 text-sm text-erp-text outline-none"
              onKeyDown={e => e.key === 'Enter' && handleAddActivity()}
            />
            <Button aria-label="Add activity" onClick={handleAddActivity} className="px-3 h-auto">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
          {activities.length === 0 ? (
            <p className="text-center text-erp-text/40 text-sm font-bold py-4">No activities yet.</p>
          ) : (
            activities.map(act => (
              <div key={act.id} className="flex gap-3">
                <div className="mt-1 bg-erp-background p-2 rounded-full border border-erp-border h-fit">
                  {act.type === 'Call' && <Phone className="w-3 h-3 text-blue-500" />}
                  {act.type === 'Email' && <Mail className="w-3 h-3 text-orange-500" />}
                  {act.type === 'Meeting' && <Users className="w-3 h-3 text-indigo-500" />}
                  {act.type === 'Note' && <PenTool className="w-3 h-3 text-slate-500" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-erp-text">{act.content}</p>
                  <p className="text-xs text-erp-text/50">
                    {act.user_name && <span className="font-semibold mr-1">{act.user_name}</span>}
                    {act.created_at ? new Date(act.created_at).toLocaleString() : ''}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
