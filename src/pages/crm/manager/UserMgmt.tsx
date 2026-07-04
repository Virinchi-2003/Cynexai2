import React from 'react';
import { Card } from '../../../components/ui/erp/Card';
import { Button } from '../../../components/ui/erp/Button';
import { UserPlus, User } from 'lucide-react';

export default function UserMgmt() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text">User Mgmt</h1>
            <p className="text-erp-text/70 font-medium mt-1">Manage staff and teacher accounts</p>
          </div>
          <Button className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Add Staff
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-erp-primary/10 p-4 rounded-xl text-erp-primary">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-erp-text">Sandeep Reddy</h3>
                <p className="text-sm font-bold text-erp-text/50">Manager</p>
              </div>
            </div>
            <Button variant="ghost" className="border-2 border-erp-border">Edit Role</Button>
          </Card>
          
          <Card className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-4 rounded-xl text-purple-700">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-erp-text">John Doe</h3>
                <p className="text-sm font-bold text-erp-text/50">Teacher</p>
              </div>
            </div>
            <Button variant="ghost" className="border-2 border-erp-border">Edit Role</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
