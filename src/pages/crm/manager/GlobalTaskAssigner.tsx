import React from 'react';
import { Card } from '../../../components/ui/erp/Card';
import { Button } from '../../../components/ui/erp/Button';
import { CheckSquare, Plus } from 'lucide-react';

export default function GlobalTaskAssigner() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text">Global Tasks</h1>
            <p className="text-erp-text/70 font-medium mt-1">Assign tasks to Sales, DM, and Teachers</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> New Task
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="flex flex-col border-l-4 border-erp-primary">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg text-erp-text">Follow up with Demo Leads</h3>
                <p className="text-sm font-bold text-erp-text/50">Assigned to: Sales Team</p>
              </div>
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-[10px] font-bold">
                In Progress
              </span>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs font-bold text-erp-text/70">Target: 20 Check-ins</span>
              <span className="text-xs font-bold text-erp-text">12/20</span>
            </div>
          </Card>
          
          <Card className="flex flex-col border-l-4 border-purple-500">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg text-erp-text">Post 2 Instagram Reels</h3>
                <p className="text-sm font-bold text-erp-text/50">Assigned to: DM Team</p>
              </div>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-bold">
                Completed
              </span>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs font-bold text-erp-text/70">Target: 2 Check-ins</span>
              <span className="text-xs font-bold text-erp-text">2/2</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
