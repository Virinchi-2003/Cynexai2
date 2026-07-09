import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/erp/Card';
import { Button } from '../../../components/ui/erp/Button';
import { BarChart3, TrendingUp, MousePointerClick, Calendar, Key, AlertCircle, CheckCircle, Upload, Layout, FileText, Search, Sparkles, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMarketingMetrics, getMarketingCampaigns } from '../../../lib/api/marketing';
import { getBlogPosts, getScrapedJobs, getAISuggestions, getSEOKeywords, triggerJobScraper } from '../../../lib/api/dm';

type Tab = 'dashboard' | 'blog' | 'jobs' | 'ai' | 'seo';

export default function DMDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  // existing state
  const [metrics, setMetrics] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [hasApiKey, setHasApiKey] = useState(true); // default true for demo
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [metaKey, setMetaKey] = useState('');
  const [googleKey, setGoogleKey] = useState('');

  // new features state
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [keywords, setKeywords] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'dashboard') {
        setMetrics(await getMarketingMetrics() || []);
        setCampaigns(await getMarketingCampaigns() || []);
      } else if (activeTab === 'blog') {
        setBlogPosts(await getBlogPosts());
      } else if (activeTab === 'jobs') {
        setJobs(await getScrapedJobs());
      } else if (activeTab === 'ai') {
        setSuggestions(await getAISuggestions('Digital Marketing'));
      } else if (activeTab === 'seo') {
        setKeywords(await getSEOKeywords());
      }
    } catch (e) {
      console.error('Error fetching data', e);
    } finally {
      setLoading(false);
    }
  };

  const getMetric = (platform: string) => metrics.find(m => m.platform === platform);

  const renderTabs = () => (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
      <Button variant={activeTab === 'dashboard' ? 'primary' : 'ghost'} onClick={() => setActiveTab('dashboard')} className="flex items-center gap-2">
        <Layout className="w-4 h-4" /> Dashboard
      </Button>
      <Button variant={activeTab === 'blog' ? 'primary' : 'ghost'} onClick={() => setActiveTab('blog')} className="flex items-center gap-2">
        <FileText className="w-4 h-4" /> Blog Manager
      </Button>
      <Button variant={activeTab === 'jobs' ? 'primary' : 'ghost'} onClick={() => setActiveTab('jobs')} className="flex items-center gap-2">
        <Briefcase className="w-4 h-4" /> Job Scraper
      </Button>
      <Button variant={activeTab === 'ai' ? 'primary' : 'ghost'} onClick={() => setActiveTab('ai')} className="flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> AI Content
      </Button>
      <Button variant={activeTab === 'seo' ? 'primary' : 'ghost'} onClick={() => setActiveTab('seo')} className="flex items-center gap-2">
        <Search className="w-4 h-4" /> SEO Settings
      </Button>
    </div>
  );

  const renderBlog = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold font-display text-erp-text">Blog Posts</h2>
        <Button>+ New Post</Button>
      </div>
      <div className="grid gap-4">
        {blogPosts.length === 0 ? <p className="text-erp-text/50">No blog posts yet.</p> : blogPosts.map(post => (
          <Card key={post.id} className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg text-erp-text">{post.title}</h3>
              <p className="text-sm text-erp-text/50">{post.content}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="px-3 py-1">Edit</Button>
              <Button variant="danger" className="px-3 py-1">Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderJobs = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold font-display text-erp-text">Scraped Jobs</h2>
        <Button onClick={async () => { await triggerJobScraper('linkedin'); fetchData(); }}>Trigger Scraper</Button>
      </div>
      <div className="grid gap-4">
        {jobs.map(job => (
          <Card key={job.id}>
            <h3 className="font-bold text-lg text-erp-text">{job.title}</h3>
            <p className="text-sm text-erp-text/50">{job.company}</p>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAI = () => (
    <div>
      <h2 className="text-xl font-bold font-display text-erp-text mb-4">AI Content Suggestions</h2>
      <div className="grid gap-4">
        {suggestions.map((s, i) => (
          <Card key={i} className="border-l-4 border-indigo-500">
            <h3 className="font-bold text-lg text-erp-text">{s.title}</h3>
            <p className="text-sm text-erp-text/50">{s.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSEO = () => (
    <div>
      <h2 className="text-xl font-bold font-display text-erp-text mb-4">SEO Keywords</h2>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw, i) => (
          <div key={i} className="px-4 py-2 bg-erp-surface rounded-full text-sm font-bold border border-erp-border">
            {kw}
          </div>
        ))}
      </div>
    </div>
  );

  const renderDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="flex flex-col border-l-4 border-blue-500">
          <h3 className="text-sm font-bold text-erp-text/50 uppercase">Meta Ads Spend</h3>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-display font-bold text-erp-text">₹{getMetric('Meta')?.spend?.toLocaleString() || 0}</span>
          </div>
        </Card>
        <Card className="flex flex-col border-l-4 border-red-500">
          <h3 className="text-sm font-bold text-erp-text/50 uppercase">Google Ads Spend</h3>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-display font-bold text-erp-text">₹{getMetric('Google')?.spend?.toLocaleString() || 0}</span>
          </div>
        </Card>
        <Card className="flex flex-col border-l-4 border-erp-primary">
          <h3 className="text-sm font-bold text-erp-text/50 uppercase">Website Traffic</h3>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-display font-bold text-erp-text">{getMetric('Website')?.traffic?.toLocaleString() || 0}</span>
          </div>
        </Card>
      </div>

      <h2 className="text-xl font-bold font-display text-erp-text mb-4">Active Campaigns</h2>
      <div className="grid grid-cols-1 gap-4">
        {campaigns.map((camp: any) => (
          <Card key={camp.id} className="flex items-center justify-between hover:border-indigo-500 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl ${camp.platform === 'Meta' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                {camp.platform === 'Meta' ? <BarChart3 className="w-6 h-6" /> : <MousePointerClick className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-bold text-lg text-erp-text">{camp.name}</h3>
                <p className="text-sm font-bold text-erp-text/50">Daily Budget: ₹{camp.budget} • Total Spent: ₹{camp.spent}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text">Marketing Hub</h1>
            <p className="text-erp-text/70 font-medium mt-1">Manage Ads, Content, and SEO</p>
          </div>
        </div>

        {renderTabs()}

        {loading ? (
          <div className="flex justify-center items-center h-64 text-erp-text/50 animate-pulse font-bold">Loading...</div>
        ) : (
          <div>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'blog' && renderBlog()}
            {activeTab === 'jobs' && renderJobs()}
            {activeTab === 'ai' && renderAI()}
            {activeTab === 'seo' && renderSEO()}
          </div>
        )}
      </div>
    </div>
  );
}
