import React from 'react';
import { Card } from '../../../components/ui/erp/Card';
import { Button } from '../../../components/ui/erp/Button';
import { BarChart3, TrendingUp, MousePointerClick, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DMDashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text">Marketing Hub</h1>
            <p className="text-erp-text/70 font-medium mt-1">Meta, Google, and Social Media Performance</p>
          </div>
          <Button className="flex items-center gap-2" onClick={() => navigate('/dm/planner')}>
            <Calendar className="w-5 h-5" /> Content Planner
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="flex flex-col border-l-4 border-blue-500">
            <h3 className="text-sm font-bold text-erp-text/50 uppercase">Meta Ads Spend</h3>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-display font-bold text-erp-text">₹45,200</span>
              <span className="text-sm font-bold text-green-500 mb-1 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" /> 12%
              </span>
            </div>
            <p className="text-xs font-bold text-erp-text/50 mt-2">320 Leads Generated (Cost: ₹141/lead)</p>
          </Card>
          
          <Card className="flex flex-col border-l-4 border-red-500">
            <h3 className="text-sm font-bold text-erp-text/50 uppercase">Google Ads Spend</h3>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-display font-bold text-erp-text">₹28,500</span>
              <span className="text-sm font-bold text-green-500 mb-1 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" /> 8%
              </span>
            </div>
            <p className="text-xs font-bold text-erp-text/50 mt-2">145 Leads Generated (Cost: ₹196/lead)</p>
          </Card>
          
          <Card className="flex flex-col border-l-4 border-erp-primary">
            <h3 className="text-sm font-bold text-erp-text/50 uppercase">Website Traffic</h3>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-display font-bold text-erp-text">12,450</span>
              <span className="text-sm font-bold text-green-500 mb-1 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" /> 24%
              </span>
            </div>
            <p className="text-xs font-bold text-erp-text/50 mt-2">Avg. Session: 2m 45s</p>
          </Card>
        </div>

        <h2 className="text-xl font-bold font-display text-erp-text mb-4">Active Campaigns</h2>
        <div className="grid grid-cols-1 gap-4">
          <Card className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-erp-text">July Batch - Full Stack (Facebook)</h3>
                <p className="text-sm font-bold text-erp-text/50">Running since July 1st • Budget: ₹1000/day</p>
              </div>
            </div>
            <div className="text-right">
              <span className="block font-bold text-erp-text">120 Leads</span>
              <span className="text-xs font-bold text-green-500">Active</span>
            </div>
          </Card>
          
          <Card className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-4 rounded-xl text-red-600">
                <MousePointerClick className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-erp-text">Search - Data Science Keywords (Google)</h3>
                <p className="text-sm font-bold text-erp-text/50">Running since June 15th • Budget: ₹800/day</p>
              </div>
            </div>
            <div className="text-right">
              <span className="block font-bold text-erp-text">85 Leads</span>
              <span className="text-xs font-bold text-green-500">Active</span>
            </div>
          </Card>
        </div>

        <h2 className="text-xl font-bold font-display text-erp-text mt-8 mb-4">Ad Assets & Content Hub</h2>
        <Card>
          <div className="flex justify-between items-center mb-6 border-b border-erp-border pb-4">
            <h3 className="font-bold text-lg">Asset Repository</h3>
            <Button variant="info" className="flex items-center gap-2 text-sm px-3 py-1.5 h-auto">
              Upload Assets
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Asset Item */}
            <div className="border border-erp-border rounded-xl p-3 flex gap-3 hover:border-erp-primary transition-colors cursor-pointer">
              <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=150&auto=format&fit=crop" alt="Web Dev Banner" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center overflow-hidden">
                <p className="font-bold text-sm text-erp-text truncate">FS_Summer_Banner_01.png</p>
                <p className="text-xs text-erp-text/50 font-medium mt-0.5">1.2 MB • Updated 2d ago</p>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1 w-fit font-bold">Meta Ads</span>
              </div>
            </div>
            
            {/* Asset Item */}
            <div className="border border-erp-border rounded-xl p-3 flex gap-3 hover:border-erp-primary transition-colors cursor-pointer">
              <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">
                  <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z" /></svg>
                </div>
              </div>
              <div className="flex flex-col justify-center overflow-hidden">
                <p className="font-bold text-sm text-erp-text truncate">DS_Student_Testimonial.mp4</p>
                <p className="text-xs text-erp-text/50 font-medium mt-0.5">45 MB • Updated 5d ago</p>
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full mt-1 w-fit font-bold">YouTube</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
