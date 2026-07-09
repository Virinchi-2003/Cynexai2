import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingApprovals, PendingApproval, getManagerAnalytics } from '../../../lib/api/manager';
import { Card } from '../../../components/ui/erp/Card';
import { CheckCircle, Users, BookOpen, CheckSquare, Settings, Calendar } from 'lucide-react';

export default function ManagerDashboard() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalLeads: 0, totalRevenue: 0, classesCompleted: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    getPendingApprovals().then(setApprovals);
    getManagerAnalytics().then(setStats);
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text">Manager Hub</h1>
            <p className="text-erp-text/70 font-medium mt-1">Global operations and analytics</p>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-indigo-50 border-indigo-200 p-4">
            <h3 className="text-xs font-bold text-indigo-700 uppercase">Total Revenue</h3>
            <p className="text-2xl font-bold text-indigo-900 mt-1 font-mono">₹{stats.totalRevenue.toLocaleString()}</p>
          </Card>
          <Card className="bg-emerald-50 border-emerald-200 p-4">
            <h3 className="text-xs font-bold text-emerald-700 uppercase">Active Students</h3>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.totalStudents}</p>
          </Card>
          <Card className="bg-blue-50 border-blue-200 p-4">
            <h3 className="text-xs font-bold text-blue-700 uppercase">Total Leads</h3>
            <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalLeads}</p>
          </Card>
          <Card className="bg-orange-50 border-orange-200 p-4">
            <h3 className="text-xs font-bold text-orange-700 uppercase">Classes Completed</h3>
            <p className="text-2xl font-bold text-orange-900 mt-1">{stats.classesCompleted}</p>
          </Card>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-erp-primary/5 transition-colors border-erp-primary" onClick={() => navigate('/manager/courses')}>
            <BookOpen className="w-8 h-8 text-erp-primary mb-2" />
            <span className="font-bold text-erp-text text-sm text-center">Course CMS</span>
          </Card>
          
          <Card className="flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-purple-50 transition-colors border-purple-200" onClick={() => navigate('/manager/timetable')}>
            <Calendar className="w-8 h-8 text-purple-600 mb-2" />
            <span className="font-bold text-erp-text text-sm text-center">Timetable</span>
          </Card>
          
          <Card className="flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-green-50 transition-colors border-green-200" onClick={() => navigate('/manager/users')}>
            <Users className="w-8 h-8 text-green-600 mb-2" />
            <span className="font-bold text-erp-text text-sm text-center">Staff Mgmt</span>
          </Card>
          
          <Card className="flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-orange-50 transition-colors border-orange-200" onClick={() => navigate('/manager/tasks')}>
            <CheckSquare className="w-8 h-8 text-orange-600 mb-2" />
            <span className="font-bold text-erp-text text-sm text-center">Assign Tasks</span>
          </Card>
        </div>

        {/* Approvals Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold font-display text-erp-text">Pending Approvals</h2>
            <div className="bg-erp-primary text-white font-bold px-3 py-1 rounded-full text-xs">
              {approvals.length} Action Needed
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {approvals.length === 0 ? (
              <div className="col-span-full text-center p-10 text-erp-text/50 font-bold border-2 border-dashed border-erp-border rounded-3xl">
                You're all caught up!
              </div>
            ) : (
              approvals.map(app => (
                <Card key={app.id} className="cursor-pointer active:translate-y-1 active:shadow-none transition-transform" onClick={() => navigate(`/manager/approvals/${app.id}`)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-xl text-erp-text">{app.lead_name}</h3>
                      <p className="text-erp-text/70 font-medium text-sm">{app.course.toUpperCase()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="bg-erp-secondary/10 text-erp-secondary font-bold px-3 py-1 rounded-xl text-xs">
                        ₹{app.amount_paid} / ₹{app.total_fee}
                      </div>
                      {app.amount_paid >= app.total_fee && (
                        <div className="flex items-center text-green-500 text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3 mr-1" /> FULLY PAID
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
