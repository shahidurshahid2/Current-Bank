import React, { useState } from 'react';
import { X, Link as LinkIcon, HelpCircle, ExternalLink } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onSave: (url: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentUrl, onSave }) => {
  const [url, setUrl] = useState(currentUrl);
  const [showHelp, setShowHelp] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-950">
          <h2 className="text-xl font-semibold text-white">Connect Google Sheet</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          
          {showHelp && (
            <div className="bg-primary-900/20 border border-primary-500/20 p-4 rounded-xl text-sm text-slate-300 space-y-3">
              <h3 className="text-primary-400 font-semibold flex items-center gap-2">
                <HelpCircle size={16} /> Connection Steps:
              </h3>
              <ol className="list-decimal pl-4 space-y-2 text-slate-400">
                <li>Open your Google Sheet in Chrome/Safari.</li>
                <li>Ensure Share settings are <strong>"Anyone with the link"</strong>.</li>
                <li>
                    Copy the URL directly from the address bar. <br/>
                    <span className="text-xs opacity-50">(e.g., docs.google.com/spreadsheets/d/..../edit)</span>
                </li>
                <li>Paste it below.</li>
              </ol>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Sheet URL
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
              />
            </div>
            {url && !url.includes('docs.google.com') && (
                 <p className="text-xs text-red-400 mt-2">That doesn't look like a Google Sheet link.</p>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(url);
                onClose();
              }}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-primary-900/20"
            >
              Sync Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
