import React, { useEffect, useState, useMemo } from 'react';
import { Briefcase, MapPin, Calendar, ExternalLink, Search, Share2, FileText, Linkedin, Download, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import { getJobListings, JobListing } from '../../lib/api/student';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDaysUntilExpiry(expireDateStr: string): number {
  const expiry = new Date(expireDateStr);
  const now = new Date();
  expiry.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatExpireDate(expireDateStr: string): string {
  try {
    return new Date(expireDateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return expireDateStr;
  }
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark> : part
  );
}

// ─── Components ─────────────────────────────────────────────────────────────

function ExpiryBadge({ expireDateStr }: { expireDateStr: string }) {
  const days = getDaysUntilExpiry(expireDateStr);
  if (days < 0) return <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200 uppercase tracking-widest"><Calendar className="w-3 h-3" /> Expired</span>;
  if (days === 0) return <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200 uppercase tracking-widest"><Calendar className="w-3 h-3" /> Expires today</span>;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${days <= 3 ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
      <Calendar className="w-3 h-3" /> Expires in {days}d
    </span>
  );
}

function JobCard({ job, searchQuery }: { job: JobListing; searchQuery: string }) {
  const expired = getDaysUntilExpiry(job.expire_date) < 0;

  return (
    <div className={`group flex flex-col bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] rounded-2xl shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300 overflow-hidden ${expired ? 'opacity-60 grayscale' : ''}`}>
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full" />
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-[#e2e8f0] text-base leading-tight">
                {highlight(job.title, searchQuery)}
              </h3>
              <p className="text-slate-600 dark:text-[#94a3b8] font-medium text-xs mt-0.5">
                {highlight(job.company, searchQuery)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#475569] text-xs font-medium">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{highlight(job.location, searchQuery)}</span>
          </div>
          <ExpiryBadge expireDateStr={job.expire_date} />
        </div>

        {job.qualifications && (
          <p className="text-slate-500 dark:text-[#94a3b8] text-xs line-clamp-2 leading-relaxed border-t border-slate-100 dark:border-white/[0.05] pt-3 mt-1">
            {job.qualifications}
          </p>
        )}

        <div className="flex gap-2 mt-auto pt-4">
          <button
            onClick={() => window.open(job.source_url, '_blank')}
            disabled={expired}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${expired ? 'bg-slate-100 dark:bg-white/[0.05] text-slate-400 dark:text-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 active:scale-[0.98]'}`}
          >
            <ExternalLink className="w-3.5 h-3.5" /> Apply
          </button>
          <button
            onClick={() => {
              const msg = encodeURIComponent(`🚀 Job Alert! ${job.title} at ${job.company} in ${job.location}. Apply before ${formatExpireDate(job.expire_date)}: ${job.source_url}`);
              window.open(`https://wa.me/?text=${msg}`, '_blank');
            }}
            className="flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tabs ───────────────────────────────────────────────────────────────────

function JobBoard() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [titleQuery, setTitleQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  useEffect(() => {
    getJobListings().then(setJobs).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const tq = titleQuery.trim().toLowerCase();
    const lq = locationQuery.trim().toLowerCase();
    return jobs.filter((j) => {
      const titleMatch = !tq || j.title.toLowerCase().includes(tq) || j.company.toLowerCase().includes(tq);
      const locMatch = !lq || j.location.toLowerCase().includes(lq);
      return titleMatch && locMatch;
    });
  }, [jobs, titleQuery, locationQuery]);

  if (loading) return <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search roles or companies..."
            value={titleQuery}
            onChange={(e) => setTitleQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] text-slate-900 dark:text-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative sm:w-64">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Location..."
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] text-slate-900 dark:text-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {filtered.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.05] mx-auto flex items-center justify-center text-slate-400">
            <Briefcase className="w-8 h-8" />
          </div>
          <p className="text-slate-600 dark:text-[#94a3b8] font-medium">No job listings found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(job => <JobCard key={job.id} job={job} searchQuery={(titleQuery + ' ' + locationQuery).trim()} />)}
        </div>
      )}
    </div>
  );
}

function ResumeBuilder() {
  const [data, setData] = useState({ name: 'John Doe', role: 'Software Engineer', email: 'john@example.com', phone: '+1 234 567 890', summary: 'Passionate software engineer with expertise in full-stack web development, specializing in React and Node.js. Strong problem-solving skills and a team player.', exp: 'Software Developer Intern at XYZ Corp (2025)\n- Built scalable APIs\n- Improved frontend performance by 40%', edu: 'B.Sc. Computer Science, University of Technology (2026)\n- GPA 3.8/4.0', skills: 'JavaScript, TypeScript, React, Node.js, SQL, Git' });

  const handlePrint = () => window.print();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Editor */}
      <div className="lg:col-span-4 space-y-4 print:hidden">
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-[#e2e8f0] mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" /> Resume Details
          </h3>
          <div className="space-y-3">
            <input className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.07] bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Full Name" />
            <input className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.07] bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={data.role} onChange={e => setData({...data, role: e.target.value})} placeholder="Target Role" />
            <div className="grid grid-cols-2 gap-2">
              <input className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.07] bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={data.email} onChange={e => setData({...data, email: e.target.value})} placeholder="Email" />
              <input className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.07] bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} placeholder="Phone" />
            </div>
            <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.07] bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 h-24" value={data.summary} onChange={e => setData({...data, summary: e.target.value})} placeholder="Professional Summary" />
            <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.07] bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 h-24 font-mono text-xs" value={data.exp} onChange={e => setData({...data, exp: e.target.value})} placeholder="Experience (Markdown-like list)" />
            <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.07] bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 h-16 font-mono text-xs" value={data.edu} onChange={e => setData({...data, edu: e.target.value})} placeholder="Education" />
            <input className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.07] bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" value={data.skills} onChange={e => setData({...data, skills: e.target.value})} placeholder="Skills (comma separated)" />
            
            <button onClick={handlePrint} className="w-full mt-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Preview (Printable area) */}
      <div className="lg:col-span-8">
        <div className="bg-white text-slate-900 shadow-xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="bg-slate-900 text-white p-8">
            <h1 className="text-3xl font-serif font-bold mb-1">{data.name || 'Your Name'}</h1>
            <p className="text-blue-400 font-medium tracking-wider uppercase text-sm mb-4">{data.role || 'Target Role'}</p>
            <div className="flex gap-4 text-xs text-slate-300">
              <span>{data.email}</span>
              <span>•</span>
              <span>{data.phone}</span>
            </div>
          </div>
          {/* Body */}
          <div className="p-8 space-y-6">
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-2 border-b border-slate-200 pb-1">Profile</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{data.summary}</p>
            </section>
            
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-2 border-b border-slate-200 pb-1">Experience</h2>
              <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{data.exp}</div>
            </section>

            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-2 border-b border-slate-200 pb-1">Education</h2>
              <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{data.edu}</div>
            </section>

            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-2 border-b border-slate-200 pb-1">Skills</h2>
              <div className="flex flex-wrap gap-2 pt-1">
                {data.skills.split(',').map((s, i) => s.trim() ? (
                  <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">{s.trim()}</span>
                ) : null)}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedInOptimizer() {
  const [headline, setHeadline] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const analyze = () => {
    if (!headline) return;
    setAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      setResult("Your headline lacks keywords. Instead of just 'Student', try:\n\n✨ 'CS Student @ CynexAI | Aspiring Full-Stack Developer | React & Node.js Enthusiast'\n\nThis highlights your current status, goal, and key skills!");
      setAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <Linkedin className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">LinkedIn Profile Optimizer</h2>
          <p className="text-blue-100">Make recruiters come to you. Analyze your headline and get AI-powered suggestions instantly.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] rounded-3xl p-6 md:p-8 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-[#e2e8f0] mb-4">Current Headline</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            placeholder="e.g. Student at CynexAI"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/[0.07] bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={analyze}
            disabled={!headline || analyzing}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {analyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {analyzing ? 'Analyzing...' : 'Optimize'}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-5 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
              <h4 className="font-bold text-blue-800 dark:text-blue-400">Optimization Result</h4>
            </div>
            <p className="text-sm text-blue-900 dark:text-blue-200 whitespace-pre-wrap leading-relaxed">
              {result}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Use a Professional Photo', desc: 'Clear, well-lit headshot with a neutral background.' },
          { title: 'Write a Compelling About', desc: 'Tell your story, not just a list of skills. Show passion.' },
          { title: 'Request Recommendations', desc: 'Ask mentors or peers to vouch for your work ethic.' },
        ].map((tip, i) => (
          <div key={i} className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05]">
            <h4 className="font-bold text-slate-900 dark:text-[#e2e8f0] text-sm mb-1">{tip.title}</h4>
            <p className="text-xs text-slate-500 dark:text-[#94a3b8] leading-relaxed">{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function CareerCenter() {
  const [tab, setTab] = useState<'jobs' | 'resume' | 'linkedin'>('jobs');

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#050814] pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-[#0d1526] border-b border-slate-200 dark:border-white/[0.05] sticky top-0 z-20 print:hidden">
        <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Career Center</h1>
            </div>
            <p className="text-slate-500 dark:text-[#94a3b8] text-sm font-medium ml-15 pl-0.5">Your launchpad to a successful tech career</p>
          </div>
          
          <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-[#050814] rounded-xl overflow-x-auto">
            <button onClick={() => setTab('jobs')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${tab === 'jobs' ? 'bg-white dark:bg-white/[0.1] text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'}`}>
              <Briefcase className="w-4 h-4" /> Jobs
            </button>
            <button onClick={() => setTab('resume')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${tab === 'resume' ? 'bg-white dark:bg-white/[0.1] text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'}`}>
              <FileText className="w-4 h-4" /> Resume Builder
            </button>
            <button onClick={() => setTab('linkedin')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${tab === 'linkedin' ? 'bg-white dark:bg-white/[0.1] text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white'}`}>
              <Linkedin className="w-4 h-4" /> LinkedIn Optimizer
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {tab === 'jobs' && <JobBoard />}
        {tab === 'resume' && <ResumeBuilder />}
        {tab === 'linkedin' && <LinkedInOptimizer />}
      </div>
    </div>
  );
}
