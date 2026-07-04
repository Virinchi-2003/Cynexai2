import React, { useState } from 'react';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { FileText, Linkedin, ChevronRight, CheckCircle, Sparkles } from 'lucide-react';
import StudentLayout from '../../components/layout/StudentLayout';

const RESUME_STEPS = ['Personal Info', 'Education', 'Projects', 'Skills', 'Preview'];

export default function CareerCenter() {
  const [activeTab, setActiveTab] = useState<'resume' | 'linkedin'>('resume');
  const [resumeStep, setResumeStep] = useState(0);

  return (
    <StudentLayout>
      <div className="flex-1 overflow-y-auto pb-32 pt-8 px-4 flex flex-col w-full max-w-6xl mx-auto custom-scrollbar">
        
        <div className="flex items-center gap-4 mb-8 border-b-2 border-slate-800 pb-4">
          <button 
            className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition-colors ${activeTab === 'resume' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setActiveTab('resume')}
          >
            <FileText className="w-5 h-5" /> Resume Builder
          </button>
          <button 
            className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition-colors ${activeTab === 'linkedin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setActiveTab('linkedin')}
          >
            <Linkedin className="w-5 h-5" /> LinkedIn Optimizer
          </button>
        </div>

        {activeTab === 'resume' && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Wizard Form */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                {RESUME_STEPS.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx <= resumeStep ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                      {idx < resumeStep ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 hidden sm:block">{step}</span>
                  </div>
                ))}
              </div>

              <Card className="bg-slate-900 border-slate-800 p-6">
                <h3 className="text-xl font-bold text-white mb-4">{RESUME_STEPS[resumeStep]}</h3>
                
                {resumeStep === 0 && (
                  <div className="flex flex-col gap-4">
                    <input className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white" placeholder="Full Name" defaultValue="John Doe" />
                    <input className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white" placeholder="Email" defaultValue="john@example.com" />
                    <input className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white" placeholder="Phone" defaultValue="+91 9876543210" />
                    <textarea className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white h-24" placeholder="Professional Summary" defaultValue="Aspiring Data Scientist with strong SQL and Python skills..." />
                  </div>
                )}

                {resumeStep === 1 && (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 border-2 border-slate-700 rounded-xl bg-slate-800">
                      <p className="font-bold text-white">B.Tech in Computer Science</p>
                      <p className="text-sm text-slate-400">XYZ University • 2020 - 2024</p>
                    </div>
                    <Button variant="secondary" className="w-full">+ Add Education</Button>
                  </div>
                )}

                {resumeStep === 2 && (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 border-2 border-slate-700 rounded-xl bg-slate-800">
                      <p className="font-bold text-white">E-commerce Sales Dashboard</p>
                      <p className="text-sm text-slate-400 mb-2">PowerBI, SQL, Python</p>
                      <ul className="text-xs text-slate-300 list-disc pl-4 space-y-1">
                        <li>Designed data warehouse for 1M+ sales records</li>
                        <li>Built interactive PowerBI dashboards</li>
                      </ul>
                    </div>
                    <Button variant="secondary" className="w-full">+ Add Project</Button>
                  </div>
                )}

                {resumeStep === 3 && (
                  <div className="flex flex-col gap-4">
                    <input className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white" placeholder="e.g. Python, SQL, React (Comma separated)" defaultValue="Python, SQL, PowerBI, React, Tailwind CSS" />
                  </div>
                )}

                {resumeStep === 4 && (
                  <div className="flex flex-col gap-4 text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Resume is Ready!</h3>
                    <p className="text-slate-400 mb-6">Your professional resume is generated based on your profile.</p>
                    <Button variant="primary" className="mx-auto">Download PDF</Button>
                  </div>
                )}

                <div className="flex justify-between mt-8 pt-4 border-t-2 border-slate-800">
                  <Button variant="ghost" onClick={() => setResumeStep(Math.max(0, resumeStep - 1))} disabled={resumeStep === 0}>Back</Button>
                  {resumeStep < 4 && (
                    <Button variant="primary" onClick={() => setResumeStep(resumeStep + 1)}>Next Step <ChevronRight className="w-4 h-4 ml-1" /></Button>
                  )}
                </div>
              </Card>
            </div>

            {/* Live Preview (Hidden on mobile unless on Preview step) */}
            <div className={`flex-1 ${resumeStep === 4 ? 'block' : 'hidden lg:block'}`}>
              <div className="sticky top-8 bg-white text-slate-900 p-8 shadow-2xl min-h-[800px]">
                <h1 className="text-3xl font-serif text-slate-900 mb-2 uppercase tracking-wide">John Doe</h1>
                <p className="text-sm text-slate-600 mb-6">john@example.com • +91 9876543210 • LinkedIn • GitHub</p>
                
                <h2 className="text-lg font-bold border-b border-slate-300 mb-2 uppercase text-slate-800">Summary</h2>
                <p className="text-sm text-slate-700 mb-6 leading-relaxed">Aspiring Data Scientist with strong SQL and Python skills. Passionate about building data pipelines and creating actionable insights.</p>
                
                <h2 className="text-lg font-bold border-b border-slate-300 mb-2 uppercase text-slate-800">Education</h2>
                <div className="mb-6">
                  <div className="flex justify-between">
                    <span className="font-bold text-sm">B.Tech in Computer Science</span>
                    <span className="text-sm">2020 - 2024</span>
                  </div>
                  <p className="text-sm text-slate-600">XYZ University</p>
                </div>

                <h2 className="text-lg font-bold border-b border-slate-300 mb-2 uppercase text-slate-800">Projects</h2>
                <div className="mb-6">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-sm">E-commerce Sales Dashboard</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 italic">PowerBI, SQL, Python</p>
                  <ul className="text-sm text-slate-700 list-disc pl-4 space-y-1">
                    <li>Designed data warehouse for 1M+ sales records</li>
                    <li>Built interactive PowerBI dashboards for executive team</li>
                  </ul>
                </div>

                <h2 className="text-lg font-bold border-b border-slate-300 mb-2 uppercase text-slate-800">Skills</h2>
                <p className="text-sm text-slate-700">Python, SQL, PowerBI, React, Tailwind CSS</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'linkedin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <Card className="bg-slate-900 border-blue-900 border-2 shadow-[0_0_20px_rgba(30,58,138,0.3)] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">AI Headline Generator</h3>
                </div>
                <p className="text-sm text-slate-400 mb-6">Based on your skills (SQL, Python), here are some optimized headlines:</p>
                
                <div className="space-y-3">
                  <div className="p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 border border-slate-700">
                    <p className="text-white font-medium text-sm">Aspiring Data Analyst | Python & SQL | Turning Data into Actionable Insights</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 border border-slate-700">
                    <p className="text-white font-medium text-sm">Data Science Enthusiast | PowerBI & Python Developer | B.Tech CS '24</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 border border-slate-700">
                    <p className="text-white font-medium text-sm">Future Data Engineer | Building Scalable Data Pipelines in Python/SQL</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-900 border-slate-800 p-6">
                <h3 className="text-xl font-bold text-white mb-4">About Section AI Prompt</h3>
                <textarea 
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white h-32 text-sm leading-relaxed" 
                  defaultValue="I am a passionate data analyst with a strong foundation in SQL and Python. I love solving complex problems and finding patterns in large datasets..." 
                />
                <Button variant="info" fullWidth className="mt-4"><Sparkles className="w-4 h-4 mr-2 inline" /> Rewrite with AI</Button>
              </Card>
            </div>

            <div className="flex flex-col gap-6">
              <h3 className="text-2xl font-bold font-display text-white">Daily LinkedIn Tips</h3>
              <Card className="bg-blue-600 border-transparent text-white p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Linkedin className="w-32 h-32" />
                </div>
                <h4 className="font-bold text-xl mb-2 relative z-10">Tip of the Day: The 3-Sentence Rule</h4>
                <p className="text-blue-100 text-sm leading-relaxed relative z-10 mb-4">When sending a connection request, always add a note. Keep it under 3 sentences: Who you are, why you want to connect, and a polite sign-off.</p>
                <button className="bg-white text-blue-600 font-bold px-4 py-2 rounded-lg text-sm relative z-10 hover:bg-blue-50 transition-colors">Mark as Read</button>
              </Card>

              <Card className="bg-slate-900 border-slate-800 p-6 opacity-75">
                <h4 className="font-bold text-lg mb-2 text-white">Previous: Optimize your profile photo</h4>
                <p className="text-slate-400 text-sm leading-relaxed">Ensure your face takes up 60% of the frame and you have a neutral, uncluttered background...</p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
