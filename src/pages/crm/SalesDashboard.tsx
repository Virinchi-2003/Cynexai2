import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/erp/Card';
import { getCurrentUser } from '../../lib/auth';
import { getLeads } from '../../lib/api/crm';
import { getSales } from '../../lib/api/sales';
import { Calendar, TrendingUp, Users, Target, Phone, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SalesDashboard() {
  const user = getCurrentUser();
  const [dateRange, setDateRange] = useState('This Month');
  const [chartData, setChartData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    activeAdmissions: 0,
    totalRevenue: 0,
    collectedRevenue: 0
  });
  
  useEffect(() => {
    // Load and crunch data
    const loadData = async () => {
      const leads = await getLeads();
      const sales = await getSales();
      
      const totalRev = sales.reduce((acc, s) => acc + s.total_fee, 0);
      const collected = sales.reduce((acc, s) => acc + s.amount_paid, 0);
      
      setMetrics({
        totalLeads: leads.length,
        activeAdmissions: leads.filter(l => l.bucket_stage === 'Admission Completed').length,
        totalRevenue: totalRev,
        collectedRevenue: collected
      });

      // Mock chart data for weekly performance
      setChartData([
        { name: 'Week 1', target: 50000, collected: 25000 },
        { name: 'Week 2', target: 60000, collected: 45000 },
        { name: 'Week 3', target: 50000, collected: 50000 },
        { name: 'Week 4', target: 80000, collected: 65000 },
      ]);
    };
    loadData();
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text">Sales Dashboard</h1>
            <p className="text-erp-text/70 font-medium mt-1">Advanced metrics and pipeline performance</p>
          </div>
          
          <div className="flex items-center gap-3 bg-erp-surface p-2 rounded-xl border-2 border-erp-border">
            <Calendar className="w-5 h-5 text-erp-text/50 ml-2" />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent border-none font-bold text-erp-text focus:outline-none focus:ring-0 mr-2"
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>This Quarter</option>
            </select>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="flex items-center gap-4 border-erp-primary">
            <div className="bg-erp-primary/10 p-4 rounded-xl text-erp-primary">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-erp-text/50 uppercase tracking-wider">Total Leads</p>
              <h3 className="text-3xl font-display font-bold text-erp-text">{metrics.totalLeads}</h3>
            </div>
          </Card>
          
          <Card className="flex items-center gap-4">
            <div className="bg-purple-100 p-4 rounded-xl text-purple-700">
              <Target className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-erp-text/50 uppercase tracking-wider">Active Admissions</p>
              <h3 className="text-3xl font-display font-bold text-erp-text">{metrics.activeAdmissions}</h3>
            </div>
          </Card>
          
          <Card className="flex items-center gap-4">
            <div className="bg-green-100 p-4 rounded-xl text-green-700">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-erp-text/50 uppercase tracking-wider">Total Pipeline Value</p>
              <h3 className="text-2xl font-display font-bold text-erp-text">₹{metrics.totalRevenue.toLocaleString()}</h3>
            </div>
          </Card>
          
          {/* Hide collected revenue from regular Sales execs if needed, or show a team total. We'll show team total for now. */}
          <Card className="flex items-center gap-4">
            <div className="bg-yellow-100 p-4 rounded-xl text-yellow-700">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-erp-text/50 uppercase tracking-wider">Revenue Collected</p>
              <h3 className="text-2xl font-display font-bold text-erp-text">₹{metrics.collectedRevenue.toLocaleString()}</h3>
            </div>
          </Card>
        </div>

        {/* Charts and Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Revenue Chart */}
          <Card className="col-span-1 lg:col-span-2">
            <h3 className="text-xl font-bold font-display text-erp-text mb-6">Revenue Performance</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{fill: '#333', fontWeight: 'bold'}} />
                  <YAxis tick={{fill: '#333', fontWeight: 'bold'}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontWeight: 'bold', border: '2px solid #e5e7eb' }} />
                  <Legend wrapperStyle={{ fontWeight: 'bold', paddingTop: '20px' }} />
                  <Bar dataKey="target" name="Target Revenue (₹)" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Collected Revenue (₹)" fill="#b8ff22" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Pipeline Funnel */}
          <Card className="col-span-1 flex flex-col">
            <h3 className="text-xl font-bold font-display text-erp-text mb-6">Conversion Funnel</h3>
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div className="flex flex-col items-center">
                <div className="w-full bg-erp-surface border-2 border-erp-border rounded-xl p-3 flex justify-between items-center relative z-10 shadow-sm">
                  <span className="font-bold text-erp-text/70 text-sm">1. Leads Generated</span>
                  <span className="font-bold text-erp-text bg-white px-2 py-1 rounded-md">{metrics.totalLeads}</span>
                </div>
                <div className="w-0.5 h-6 bg-erp-border"></div>
                
                <div className="w-5/6 bg-erp-surface border-2 border-erp-border rounded-xl p-3 flex justify-between items-center relative z-10 shadow-sm">
                  <span className="font-bold text-erp-text/70 text-sm">2. Demo Scheduled</span>
                  <span className="font-bold text-erp-text bg-white px-2 py-1 rounded-md">{Math.floor(metrics.totalLeads * 0.4)}</span>
                </div>
                <div className="w-0.5 h-6 bg-erp-border"></div>
                
                <div className="w-4/6 bg-erp-surface border-2 border-erp-border rounded-xl p-3 flex justify-between items-center relative z-10 shadow-sm">
                  <span className="font-bold text-erp-text/70 text-sm">3. Demo Completed</span>
                  <span className="font-bold text-erp-text bg-white px-2 py-1 rounded-md">{Math.floor(metrics.totalLeads * 0.35)}</span>
                </div>
                <div className="w-0.5 h-6 bg-erp-border"></div>
                
                <div className="w-3/6 bg-erp-primary text-white border-2 border-erp-primary rounded-xl p-3 flex justify-between items-center relative z-10 shadow-md transform hover:scale-105 transition-transform">
                  <span className="font-bold text-sm">4. Admissions</span>
                  <span className="font-bold bg-white text-erp-primary px-2 py-1 rounded-md">{metrics.activeAdmissions}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
