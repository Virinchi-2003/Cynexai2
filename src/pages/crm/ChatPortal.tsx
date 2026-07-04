import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/erp/Card';
import { Button } from '../../components/ui/erp/Button';
import { MessageCircle, FileText, Send, Download, Users, Server, QrCode } from 'lucide-react';
import { getLeads } from '../../lib/api/crm';
import { Lead } from '../../lib/types';
import { QRCodeSVG } from 'qrcode.react';

const TEMPLATES = [
  {
    id: 1,
    title: 'Initial Outreach',
    text: "Hi [Name], welcome to CynexAI! I'm reaching out regarding your interest in our [Course] course. Do you have a quick moment to chat?"
  },
  {
    id: 2,
    title: 'Demo Follow-up',
    text: "Hi [Name], I hope you enjoyed the demo today! Let me know if you have any questions about the curriculum or next steps for admission."
  },
  {
    id: 3,
    title: 'Missing Documents',
    text: "Hi [Name], just a quick reminder to submit your pending onboarding documents so we can assign you to the upcoming batch. Thanks!"
  }
];

export default function ChatPortal() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'templates' | 'bulk' | 'server'>('server');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<string>('checking...');

  useEffect(() => {
    getLeads().then(setLeads);
    checkWhatsAppStatus();
    const interval = setInterval(checkWhatsAppStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkWhatsAppStatus = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/whatsapp/status');
      const data = await res.json();
      setWaStatus(data.status);
      if (data.qr) setQrCode(data.qr);
    } catch (e) {
      setWaStatus('offline');
    }
  };

  const handleOpenWhatsApp = (templateText: string, name?: string, course?: string, phoneInput?: string) => {
    const finalName = name || "[Name]";
    const finalCourse = course || "[Course]";
    const msg = encodeURIComponent(templateText.replace('[Name]', finalName).replace('[Course]', finalCourse));
    
    let phone = phoneInput;
    if (!phone) {
      phone = window.prompt("Enter the 10-digit phone number:");
    }
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    }
  };

  const downloadVCF = (lead: Lead) => {
    const vcfContent = `BEGIN:VCARD
VERSION:3.0
N:;${lead.name} - ${lead.course_interest};;;
FN:${lead.name} - ${lead.course_interest}
TEL;TYPE=CELL:${lead.phone}
END:VCARD`;
    
    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${lead.name}_${lead.course_interest}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkSend = (templateText: string) => {
    const selected = leads.filter(l => selectedLeads.includes(l.id));
    if (selected.length === 0) return alert("Select leads first");
    
    const confirm = window.confirm(`Ready to send to ${selected.length} leads? A new window will open for the first lead. Come back and click next for the rest.`);
    if (confirm) {
      handleOpenWhatsApp(templateText, selected[0].name, selected[0].course_interest, selected[0].phone);
      setSelectedLeads(selectedLeads.filter(id => id !== selected[0].id));
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="w-8 h-8 text-erp-primary" />
          <h1 className="text-3xl font-display font-bold text-erp-text">WhatsApp Center</h1>
        </div>

        <div className="flex gap-4 mb-6">
          <button 
            className={`font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${activeTab === 'server' ? 'bg-erp-primary text-white' : 'bg-erp-surface text-erp-text'}`}
            onClick={() => setActiveTab('server')}
          >
            <Server className="w-4 h-4" /> Server Sync
          </button>
          <button 
            className={`font-bold px-4 py-2 rounded-xl transition-colors ${activeTab === 'templates' ? 'bg-erp-primary text-white' : 'bg-erp-surface text-erp-text'}`}
            onClick={() => setActiveTab('templates')}
          >
            Templates & Direct Message
          </button>
          <button 
            className={`font-bold px-4 py-2 rounded-xl transition-colors ${activeTab === 'bulk' ? 'bg-erp-primary text-white' : 'bg-erp-surface text-erp-text'}`}
            onClick={() => setActiveTab('bulk')}
          >
            Bulk Sequencer & Contacts
          </button>
        </div>

        {activeTab === 'server' && (
          <div className="flex flex-col items-center justify-center max-w-lg mx-auto w-full mt-8">
            <Card className="w-full text-center">
              <h2 className="text-xl font-bold font-display text-erp-text mb-2">WhatsApp Web Automation</h2>
              <p className="text-sm text-erp-text/70 mb-8">
                Connect your business WhatsApp to automatically sync inbound messages directly into the Turso CRM database.
              </p>

              {waStatus === 'offline' && (
                <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 font-bold">
                  The local backend server is offline. Please run "node server.js" in the backend folder.
                </div>
              )}
              
              {waStatus === 'needs_login' && qrCode && (
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
                    <QRCodeSVG value={qrCode} size={256} />
                  </div>
                  <p className="text-erp-text font-bold animate-pulse flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-erp-primary" />
                    Scan this QR code with WhatsApp
                  </p>
                </div>
              )}

              {waStatus === 'ready' && (
                <div className="bg-green-500/10 text-green-500 p-6 rounded-xl border border-green-500/20">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-1">Successfully Connected!</h3>
                  <p className="text-sm opacity-80">WhatsApp is actively syncing inbound messages to Turso CRM.</p>
                </div>
              )}

              {waStatus === 'initializing' && (
                <div className="text-erp-text/70 p-8 flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-erp-primary border-t-transparent rounded-full animate-spin"></div>
                  Initializing headless browser...
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'templates' && (
          <>
            <p className="text-erp-text/70 font-medium mb-6 max-w-2xl">
              Quickly launch WhatsApp chats using our optimized sales templates. For specific leads, use the WhatsApp button directly on their Lead Profile.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEMPLATES.map(template => (
                <Card key={template.id} className="flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3 border-b-2 border-erp-border pb-2">
                    <FileText className="w-5 h-5 text-erp-primary" />
                    <h3 className="font-bold text-lg text-erp-text">{template.title}</h3>
                  </div>
                  <p className="text-sm text-erp-text/80 flex-1 mb-6 font-medium leading-relaxed italic bg-erp-surface p-3 rounded-xl">
                    "{template.text}"
                  </p>
                  <Button variant="info" fullWidth onClick={() => handleOpenWhatsApp(template.text)} className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Use Template
                  </Button>
                </Card>
              ))}
            </div>
          </>
        )}

        {activeTab === 'bulk' && (
          <div className="flex flex-col md:flex-row gap-6">
            <Card className="flex-1">
              <h2 className="text-xl font-bold font-display text-erp-text mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-erp-primary" /> Lead Selection
              </h2>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {leads.map(lead => (
                  <label key={lead.id} className="flex items-center justify-between p-3 bg-erp-surface rounded-xl border border-erp-border cursor-pointer hover:border-erp-primary transition-colors">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-erp-primary"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedLeads([...selectedLeads, lead.id]);
                          else setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                        }}
                      />
                      <div>
                        <p className="font-bold text-erp-text">{lead.name}</p>
                        <p className="text-xs text-erp-text/70">{lead.phone} • {lead.course_interest}</p>
                      </div>
                    </div>
                    <Button variant="ghost" className="p-2 h-auto" onClick={(e) => { e.preventDefault(); downloadVCF(lead); }} title="Download VCF">
                      <Download className="w-4 h-4 text-erp-secondary" />
                    </Button>
                  </label>
                ))}
              </div>
            </Card>

            <Card className="flex-1">
              <h2 className="text-xl font-bold font-display text-erp-text mb-4">Sequencer ({selectedLeads.length} selected)</h2>
              <p className="text-sm text-erp-text/70 mb-4">Choose a template to start the sequence. The browser will open WhatsApp Web for the first lead. Once sent, return here to continue the sequence.</p>
              
              <div className="space-y-4">
                {TEMPLATES.map(template => (
                  <Button 
                    key={template.id} 
                    variant="secondary" 
                    fullWidth 
                    onClick={() => handleBulkSend(template.text)}
                    disabled={selectedLeads.length === 0}
                    className="flex justify-between items-center"
                  >
                    <span>{template.title}</span>
                    <Send className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
