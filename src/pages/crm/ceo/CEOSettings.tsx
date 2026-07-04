import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/erp/Card';
import { Button } from '../../../components/ui/erp/Button';
import { Database, Save, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CEOSettings() {
  const navigate = useNavigate();
  const [dbUrl, setDbUrl] = useState('');
  const [dbToken, setDbToken] = useState('');

  useEffect(() => {
    setDbUrl(localStorage.getItem('TURSO_DB_URL') || '');
    setDbToken(localStorage.getItem('TURSO_AUTH_TOKEN') || '');
  }, []);

  const handleSave = () => {
    if (dbUrl) localStorage.setItem('TURSO_DB_URL', dbUrl);
    if (dbToken) localStorage.setItem('TURSO_AUTH_TOKEN', dbToken);
    alert('Settings saved. The app will reload to apply changes.');
    window.location.reload();
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-erp-background">
      <div className="flex-1 flex flex-col p-4 md:p-8 min-w-0 overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-erp-text">Dev Settings</h1>
            <p className="text-erp-text/70 font-medium mt-1">Manage external API keys and integrations</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/ceo/dashboard')}>
            Back to Hub
          </Button>
        </div>

        <div className="max-w-2xl">
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold font-display text-erp-text mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-erp-primary" /> Turso Database Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-erp-text/70 mb-1">Turso DB URL</label>
                <div className="flex bg-erp-surface rounded-xl border-2 border-erp-border focus-within:border-erp-primary transition-colors px-3 py-2">
                  <input
                    type="text"
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                    placeholder="libsql://your-db-url.turso.io"
                    className="bg-transparent border-none outline-none text-erp-text font-medium w-full text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-erp-text/70 mb-1">Turso Auth Token</label>
                <div className="flex bg-erp-surface rounded-xl border-2 border-erp-border focus-within:border-erp-primary transition-colors px-3 py-2 relative">
                  <input
                    type="password"
                    value={dbToken}
                    onChange={(e) => setDbToken(e.target.value)}
                    placeholder="eyJhbGci..."
                    className="bg-transparent border-none outline-none text-erp-text font-medium w-full pr-10 text-sm font-mono"
                  />
                  <Key className="w-4 h-4 text-erp-text/30 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Configuration
                </Button>
              </div>
            </div>
          </Card>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl mb-6">
            <h4 className="font-bold text-blue-800 text-sm mb-1">Security Notice</h4>
            <p className="text-xs font-medium text-blue-600/80 leading-relaxed">
              These credentials give full access to the production database. Only CEO and authorized DevOps personnel should have access to this page. Do not share your Auth Token.
            </p>
          </div>

          <Card className="p-6 cursor-pointer hover:border-erp-primary transition-colors" onClick={() => navigate('/ceo/ai-voice')}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold font-display text-erp-text flex items-center gap-2">
                  Self-Hosted AI Voice Stack
                </h2>
                <p className="text-sm text-erp-text/70 mt-1">Configure Whisper, Kokoro TTS, and Local LLMs</p>
              </div>
              <Button variant="ghost">Configure &rarr;</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
