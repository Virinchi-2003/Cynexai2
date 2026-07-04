import React from 'react';
import { Card } from '../../../components/ui/erp/Card';
import { Button } from '../../../components/ui/erp/Button';
import { TrendingUp, Users, DollarSign, Target, Settings, Building2, BrainCircuit, Gift, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CEODashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text">CEO Dashboard</h1>
            <p className="text-erp-text/70 font-medium mt-1">Global Academy Overview</p>
          </div>
          <Button className="flex items-center gap-2" variant="secondary" onClick={() => navigate('/ceo/settings')}>
            <Settings className="w-5 h-5" /> Dev Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="flex flex-col border-l-4 border-green-500">
            <h3 className="text-sm font-bold text-erp-text/50 uppercase">Total Revenue</h3>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-display font-bold text-erp-text">₹24.5L</span>
            </div>
            <p className="text-xs font-bold text-green-500 mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +15% from last month
            </p>
          </Card>
          
          <Card className="flex flex-col border-l-4 border-blue-500">
            <h3 className="text-sm font-bold text-erp-text/50 uppercase">Active Students</h3>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-display font-bold text-erp-text">1,240</span>
            </div>
            <p className="text-xs font-bold text-green-500 mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +45 new enrollments
            </p>
          </Card>

          <Card className="flex flex-col border-l-4 border-purple-500">
            <h3 className="text-sm font-bold text-erp-text/50 uppercase">Marketing Spend</h3>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-display font-bold text-erp-text">₹73.7K</span>
            </div>
            <p className="text-xs font-bold text-erp-text/50 mt-2">
              CAC: ₹1,637 / student
            </p>
          </Card>

          <Card className="flex flex-col border-l-4 border-yellow-500">
            <h3 className="text-sm font-bold text-erp-text/50 uppercase">Sales Conversion</h3>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-display font-bold text-erp-text">8.4%</span>
            </div>
            <p className="text-xs font-bold text-green-500 mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +1.2% from last month
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-indigo-50 transition-colors border-indigo-200" onClick={() => navigate('/ceo/courses')}>
            <BookOpen className="w-8 h-8 text-indigo-600 mb-2" />
            <span className="font-bold text-erp-text text-sm text-center">Course Management</span>
          </Card>
          
          <Card className="flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-slate-50 transition-colors border-slate-200" onClick={() => navigate('/ceo/settings')}>
            <Settings className="w-8 h-8 text-slate-600 mb-2" />
            <span className="font-bold text-erp-text text-sm text-center">Global Settings</span>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card className="border-l-4 border-blue-600">
            <h2 className="text-xl font-bold font-display text-erp-text mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-blue-500" /> Pending Referral Payouts
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-erp-surface p-3 rounded-xl border border-erp-border">
                <div>
                  <span className="font-bold text-sm block">Student: Amit Kumar</span>
                  <span className="text-xs font-bold text-erp-text/50">Referred by: Rahul S. • ₹2,000</span>
                </div>
                <Button className="h-8 text-xs bg-green-500 hover:bg-green-600">Mark Paid</Button>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
            <h2 className="text-xl font-bold font-display text-white mb-4 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-blue-400" /> AI Strategic Advisory
            </h2>
            <div className="space-y-4">
              <div className="bg-white/10 p-3 rounded-xl border border-white/20">
                <p className="text-sm text-blue-100 italic leading-relaxed">
                  "Based on last week's data, Facebook Ads CAC increased by 15%. I recommend shifting ₹10,000 daily budget to Google Search Ads for the 'Data Science' keyword, which currently shows a 22% better conversion rate."
                </p>
              </div>
              <Button variant="secondary" className="w-full bg-white text-slate-900 hover:bg-blue-50">Generate New Insights</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
