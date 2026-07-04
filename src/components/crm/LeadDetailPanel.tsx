import React, { useEffect, useState } from 'react';
import { updateLeadStatus, getLeadById } from '../../lib/api/crm';
import { Lead } from '../../lib/types';
import { Card } from '../ui/erp/Card';
import { Button } from '../ui/erp/Button';
import { X, Phone, MessageCircle, RefreshCw } from 'lucide-react';
import { AdmissionForm } from '../../pages/crm/forms/AdmissionForm';
import { SaleForm } from '../../pages/crm/forms/SaleForm';
import { SalesPitchModal } from '../../pages/crm/forms/SalesPitchModal';

const STATUS_BUCKETS = [
  'Not answering/Lifting',
  'Busy',
  'Invalid number',
  'Interested',
  'Not Interested',
  'Demo Scheduled',
  'Demo Completed',
  'Admission Completed',
  'Sale Partial Closed',
  'Sale completed',
  'Onboarding completed'
];

interface LeadDetailPanelProps {
  leadId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function LeadDetailPanel({ leadId, onClose, onUpdate }: LeadDetailPanelProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [showAdmission, setShowAdmission] = useState(false);
  const [showSale, setShowSale] = useState(false);
  const [showPitch, setShowPitch] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchLead = async () => {
    const result = await getLeadById(leadId);
    setLead(result);
  };

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setIsUpdatingStatus(true);
    await updateLeadStatus(leadId, newStatus);
    await fetchLead();
    setIsUpdatingStatus(false);
    onUpdate(); // refresh table
  };

  const handleWhatsApp = () => {
    if (lead) {
      const msg = encodeURIComponent(`Hi ${lead.name}, welcome to CynexAI! I'm reaching out regarding your interest in our ${lead.course_interest} course.`);
      const phone = lead.phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    }
  };

  if (!lead) return <div className="p-10 text-center font-bold text-erp-text">Loading...</div>;

  return (
    <div className="h-full flex flex-col bg-erp-background border-l-2 border-erp-border">
      <div className="flex items-center justify-between p-4 border-b-2 border-erp-border bg-erp-surface">
        <h2 className="text-xl font-display font-bold text-erp-text">Lead Details</h2>
        <Button variant="ghost" onClick={onClose} className="p-2 h-auto rounded-full">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <Card className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1 text-erp-text">{lead.name}</h2>
              <div className="flex items-center text-erp-text/70 font-bold">
                <Phone className="w-4 h-4 mr-2" />
                {lead.phone}
              </div>
            </div>
            <div className="inline-block bg-erp-secondary/10 text-erp-secondary font-bold px-3 py-1 rounded-xl text-sm text-right">
              {lead.course_interest}
            </div>
          </div>

          <div className="mt-4 p-4 bg-erp-background rounded-2xl border-2 border-erp-border">
            <label className="block text-sm font-bold text-erp-text/70 mb-2">Current Status (Bucket)</label>
            <div className="flex items-center gap-2">
              <select 
                value={lead.bucket_stage} 
                onChange={handleStatusChange}
                disabled={isUpdatingStatus}
                className="w-full bg-erp-surface border-2 border-erp-border rounded-xl p-3 font-bold text-erp-text focus:outline-none focus:border-erp-primary"
              >
                {!STATUS_BUCKETS.includes(lead.bucket_stage) && (
                   <option value={lead.bucket_stage}>Legacy: Bucket {lead.bucket_stage}</option>
                )}
                {STATUS_BUCKETS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              {isUpdatingStatus && <RefreshCw className="w-5 h-5 text-erp-primary animate-spin" />}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Button 
            variant="info" 
            onClick={handleWhatsApp}
            className="flex flex-col items-center gap-2 py-4"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs">WhatsApp</span>
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => window.open(`tel:${lead.phone}`)}
            className="flex flex-col items-center gap-2 py-4 border-2 border-erp-border bg-erp-surface"
          >
            <Phone className="w-6 h-6" />
            <span className="text-xs">Call</span>
          </Button>
        </div>

        <h3 className="text-sm font-bold text-erp-text/50 uppercase mb-3 px-2">Actions</h3>
        <div className="flex flex-col gap-4">
          <Button variant="info" onClick={() => setShowPitch(true)} fullWidth>Sales Pitch Assistant</Button>
          <Button variant="secondary" onClick={() => setShowAdmission(true)} fullWidth>Record Admission</Button>
          <Button variant="primary" onClick={() => setShowSale(true)} fullWidth>Record Sale</Button>
        </div>
      </div>

      <SalesPitchModal isOpen={showPitch} onClose={() => setShowPitch(false)} courseInterest={lead.course_interest} />
      <AdmissionForm isOpen={showAdmission} onClose={() => setShowAdmission(false)} leadId={leadId} onSuccess={() => { setShowAdmission(false); onUpdate(); }} />
      <SaleForm isOpen={showSale} onClose={() => setShowSale(false)} leadId={leadId} onSuccess={() => { setShowSale(false); onUpdate(); }} />
    </div>
  );
}
