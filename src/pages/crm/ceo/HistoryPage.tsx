import React, { useState, useEffect, useMemo } from 'react';
import { client, isTursoConfigured } from '../../../lib/turso';
import { Search, Filter, History, Phone, CreditCard, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { getCurrentUser } from '../../../lib/auth';

type HistoryEvent = {
  id: string;
  type: 'sale' | 'activity' | 'stage_change';
  timestamp: string;
  user_name: string;
  title: string;
  details: string;
  amount?: number;
  old_val?: string;
  new_val?: string;
  lead_name?: string;
};

export default function HistoryPage() {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const loadHistory = async () => {
    if (!isTursoConfigured || !client) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const allEvents: HistoryEvent[] = [];

      // 1. Fetch Sales History
      const salesRes = await client.execute(`
        SELECT s.id, s.timestamp, s.total_fee, s.amount_paid, s.status, u.name as exec_name, l.name as lead_name
        FROM sales s
        LEFT JOIN users u ON s.sales_exec_id = u.id
        LEFT JOIN crm_leads l ON s.lead_id = l.id
        ORDER BY s.timestamp DESC LIMIT 100
      `);
      salesRes.rows.forEach(r => {
        allEvents.push({
          id: 'sale_' + r.id,
          type: 'sale',
          timestamp: (r.timestamp as string) || new Date().toISOString(),
          user_name: (r.exec_name as string) || 'Unknown Exec',
          title: 'Sale ' + ((r.status as string)?.includes('Completed') ? 'Completed' : 'Partial'),
          details: `Amount Paid: ₹${Number(r.amount_paid || 0).toLocaleString()} / ₹${Number(r.total_fee || 0).toLocaleString()}`,
          amount: Number(r.amount_paid || 0),
          lead_name: r.lead_name as string
        });
      });

      // 2. Fetch Lead Activities (Calls, Notes, WhatsApp)
      const actsRes = await client.execute(`
        SELECT a.id, a.created_at, a.type, a.content, u.name as user_name, l.name as lead_name
        FROM crm_activities a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN crm_leads l ON a.lead_id = l.id
        ORDER BY a.created_at DESC LIMIT 100
      `);
      actsRes.rows.forEach(r => {
        allEvents.push({
          id: 'act_' + r.id,
          type: 'activity',
          timestamp: (r.created_at as string) || new Date().toISOString(),
          user_name: (r.user_name as string) || 'System',
          title: r.type as string,
          details: r.content as string,
          lead_name: r.lead_name as string
        });
      });

      // 3. Fetch Stage History
      const stageRes = await client.execute(`
        SELECT h.id, h.created_at, h.old_stage, h.new_stage, l.name as lead_name, u.name as user_name
        FROM crm_stage_history h
        LEFT JOIN crm_leads l ON h.lead_id = l.id
        LEFT JOIN users u ON l.assigned_to = u.id
        ORDER BY h.created_at DESC LIMIT 100
      `);
      stageRes.rows.forEach(r => {
        allEvents.push({
          id: 'stage_' + r.id,
          type: 'stage_change',
          timestamp: (r.created_at as string) || new Date().toISOString(),
          user_name: (r.user_name as string) || 'System',
          title: 'Stage Changed',
          details: `Moved from ${r.old_stage} to ${r.new_stage}`,
          old_val: r.old_stage as string,
          new_val: r.new_stage as string,
          lead_name: r.lead_name as string
        });
      });

      // Sort combined events by descending timestamp
      allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setEvents(allEvents);
    } catch (e) {
      console.error("Failed to fetch history logs", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (filter !== 'all' && e.type !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (e.title?.toLowerCase().includes(q) || 
                e.user_name?.toLowerCase().includes(q) || 
                e.details?.toLowerCase().includes(q) ||
                e.lead_name?.toLowerCase().includes(q));
      }
      return true;
    });
  }, [events, search, filter]);

  const formatDate = (ds: string) => {
    const d = new Date(ds);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  return (
    <div className="flex h-full w-full bg-erp-background overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 pb-20 md:pb-8">
        
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-erp-text flex items-center gap-2">
              <History className="w-8 h-8 text-erp-primary" /> Master History
            </h1>
            <p className="text-sm font-bold text-erp-text/50 mt-1">Global audit log of all sales, calls, and stage changes</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-erp-text/40" />
              <input
                type="text"
                placeholder="Search history..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-full md:w-64 bg-erp-surface border-2 border-erp-border rounded-xl text-sm font-bold focus:outline-none focus:border-erp-primary text-erp-text"
              />
            </div>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="px-4 py-2 bg-erp-surface border-2 border-erp-border rounded-xl text-sm font-bold focus:outline-none focus:border-erp-primary appearance-none cursor-pointer text-erp-text"
            >
              <option value="all">All Logs</option>
              <option value="sale">Sales Only</option>
              <option value="activity">Activities (Calls/Notes)</option>
              <option value="stage_change">Stage Changes</option>
            </select>
            <button
              onClick={loadHistory}
              disabled={loading}
              className="px-4 py-2 bg-erp-surface hover:bg-erp-border/40 text-erp-text font-bold rounded-xl border-2 border-erp-border flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
        
        <div className="bg-erp-surface border-2 border-erp-border rounded-3xl overflow-hidden flex-1 flex flex-col shadow-sm">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-erp-text/40 gap-3">
              <Loader2 className="w-6 h-6 animate-spin" /> Loading master logs...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-erp-text/40 p-10">
              <History className="w-12 h-12 opacity-20 mb-3" />
              <p className="font-bold text-lg">No history logs found</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 p-4">
              <div className="relative border-l-2 border-erp-border/60 ml-4 space-y-6 pb-8">
                {filtered.map(ev => (
                  <div key={ev.id} className="relative pl-6">
                    {/* Icon */}
                    <div className={`absolute -left-[17px] top-0.5 w-8 h-8 rounded-full border-4 border-erp-surface flex items-center justify-center shadow-sm
                      ${ev.type === 'sale' ? 'bg-emerald-100 text-emerald-600' : 
                        ev.type === 'activity' ? 'bg-sky-100 text-sky-600' : 
                        'bg-amber-100 text-amber-600'}`}>
                      {ev.type === 'sale' ? <CreditCard className="w-3.5 h-3.5" /> :
                       ev.type === 'activity' ? <Phone className="w-3.5 h-3.5" /> : 
                       <History className="w-3.5 h-3.5" />}
                    </div>

                    <div className="bg-erp-background border border-erp-border/60 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-erp-text text-sm">{ev.title}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-erp-surface text-erp-text/60">
                            By {ev.user_name}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-erp-text/40">{formatDate(ev.timestamp)}</span>
                      </div>
                      
                      {ev.lead_name && (
                        <p className="text-xs font-bold text-erp-text/70 mb-1">
                          Lead: <span className="text-erp-primary">{ev.lead_name}</span>
                        </p>
                      )}

                      <div className="text-sm font-medium text-erp-text/80">
                        {ev.type === 'stage_change' ? (
                          <div className="flex items-center gap-2 text-xs font-bold bg-erp-surface w-fit px-3 py-1.5 rounded-lg border border-erp-border/50">
                            <span className="text-slate-500 line-through">{ev.old_val}</span>
                            <ArrowRight className="w-3 h-3 text-erp-text/30" />
                            <span className="text-erp-primary">{ev.new_val}</span>
                          </div>
                        ) : ev.type === 'sale' ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-emerald-600">{ev.details}</span>
                          </div>
                        ) : (
                          <p className="text-sm">{ev.details}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
