import React, { useEffect, useState, useMemo } from 'react';
import { Briefcase, MapPin, Calendar, ExternalLink, Search, Share2 } from 'lucide-react';
import { getJobListings, JobListing } from '../../lib/api/student';

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
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return expireDateStr;
  }
}

function ExpiryBadge({ expireDateStr }: { expireDateStr: string }) {
  const days = getDaysUntilExpiry(expireDateStr);
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
        <Calendar className="w-3 h-3" />
        Expired
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
        <Calendar className="w-3 h-3" />
        Expires today
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${days <= 3 ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
      <Calendar className="w-3 h-3" />
      Expires in {days}d
    </span>
  );
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function JobCard({ job, searchQuery }: { job: JobListing; searchQuery: string }) {
  const days = getDaysUntilExpiry(job.expire_date);
  const expired = days < 0;

  const handleApply = () => {
    window.open(job.source_url, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsApp = () => {
    const expireFormatted = formatExpireDate(job.expire_date);
    const message = encodeURIComponent(
      `🚀 Job Alert! ${job.title} at ${job.company} in ${job.location}. Apply before ${expireFormatted}: ${job.source_url} - Posted from CynexAI Career Center`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`flex flex-col bg-erp-surface border border-erp-border rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${expired ? 'opacity-70' : ''}`}>
      {/* Card header accent */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full" />

      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Title + expiry */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-erp-text text-base leading-tight">
              {highlight(job.title, searchQuery)}
            </h3>
          </div>
          <ExpiryBadge expireDateStr={job.expire_date} />
        </div>

        {/* Company */}
        <p className="text-erp-text/80 font-semibold text-sm">
          {highlight(job.company, searchQuery)}
        </p>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-erp-text/60 text-sm">
          <MapPin className="w-4 h-4 shrink-0" />
          <span>{highlight(job.location, searchQuery)}</span>
        </div>

        {/* Qualifications */}
        {job.qualifications && (
          <p className="text-erp-text/60 text-sm line-clamp-2 leading-relaxed border-t border-erp-border pt-3">
            {job.qualifications}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-3">
          <button
            onClick={handleApply}
            disabled={expired}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors ${expired ? 'bg-erp-border text-erp-text/40 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            <ExternalLink className="w-4 h-4" />
            Apply Now
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-colors"
            title="Share to WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CareerCenter() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [titleQuery, setTitleQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getJobListings()
      .then((data) => {
        if (!cancelled) {
          setJobs(data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load job listings. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
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

  const searchQuery = (titleQuery + ' ' + locationQuery).trim();

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-erp-text">
              Career Center
            </h1>
          </div>
          <p className="text-erp-text/60 font-medium ml-13 pl-0.5">
            Fresh Graduate Jobs — curated for CynexAI students
          </p>
        </div>

        {/* Search / filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title or company…"
              value={titleQuery}
              onChange={(e) => setTitleQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-erp-border bg-erp-surface text-erp-text text-sm placeholder:text-erp-text/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
            />
          </div>
          <div className="relative sm:w-60">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-erp-text/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by location…"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-erp-border bg-erp-surface text-erp-text text-sm placeholder:text-erp-text/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-erp-text/50 text-sm font-medium">Loading job listings…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto">
              <Briefcase className="w-7 h-7" />
            </div>
            <p className="text-erp-text font-bold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-blue-500 hover:underline font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
              <Briefcase className="w-8 h-8" />
            </div>
            <h2 className="text-erp-text font-display font-bold text-lg">
              {jobs.length === 0
                ? 'No job listings available right now. Check back soon!'
                : 'No results match your search.'}
            </h2>
            {jobs.length > 0 && (
              <button
                onClick={() => { setTitleQuery(''); setLocationQuery(''); }}
                className="text-sm text-blue-500 hover:underline font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <p className="text-erp-text/50 text-xs font-medium mb-4">
              {filtered.length} listing{filtered.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((job) => (
                <JobCard key={job.id} job={job} searchQuery={searchQuery} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
