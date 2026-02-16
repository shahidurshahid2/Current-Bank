import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Table, 
  Settings, 
  RefreshCw,
  AlertCircle,
  Wallet,
  Calendar,
  ExternalLink,
  Share2,
  Download,
  PlusSquare,
  MoreVertical,
  X
} from 'lucide-react';

import { Transaction, SheetStats, MonthYear } from './types';
import { parseCSV, getFixedMonthRange, calculateMonthlyStats } from './utils/csv';
import { DEFAULT_SHEET_URL } from './constants';
import { SettingsModal } from './components/SettingsModal';
import { AIChat } from './components/AIChat';

// Helper to convert Browser URL to CSV Export URL
const convertToCsvUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('output=csv') || url.includes('tqx=out:csv')) return url;
  const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (idMatch && idMatch[1]) {
    const id = idMatch[1];
    const gidMatch = url.match(/[#&]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;
  }
  return url;
};

function App() {
  const [userUrl, setUserUrl] = useState<string>(() => localStorage.getItem('sheet_raw_url') || DEFAULT_SHEET_URL);
  const [csvUrl, setCsvUrl] = useState<string>('');
  const [allData, setAllData] = useState<Transaction[]>([]);
  
  // Selection State (Fixed Range)
  const [availableMonths, setAvailableMonths] = useState<MonthYear[]>(getFixedMonthRange());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(0);

  const [stats, setStats] = useState<SheetStats>({ totalBalance: 0, totalIncome: 0, totalExpense: 0, transactionCount: 0 });
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => {
    // If we have a URL in query params, don't open settings automatically
    const params = new URLSearchParams(window.location.search);
    if (params.get('sheet')) return false;

    const hasUrl = localStorage.getItem('sheet_raw_url') || DEFAULT_SHEET_URL;
    return !hasUrl;
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'ai'>('dashboard');

  // PWA Install State
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  // Modals for manual installation help
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);

  // Deep Link Logic: Check for ?sheet=URL in the browser address bar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sheetParam = params.get('sheet');
    
    if (sheetParam) {
      try {
        // Decode the URL (URLSearchParams handles percent decoding automatically for .get(), 
        // but explicit decodeURIComponent is safer if double encoded)
        const decodedUrl = sheetParam; 
        
        // Update state and storage immediately
        if (decodedUrl !== userUrl) {
            setUserUrl(decodedUrl);
            localStorage.setItem('sheet_raw_url', decodedUrl);
            setCsvUrl(convertToCsvUrl(decodedUrl));
        }
        
        // Optional: Clean up the URL bar so it looks nice (removes the long query string)
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) {
        console.error("Error parsing sheet parameter", e);
      }
    }
  }, []);

  useEffect(() => {
    // Detect if already installed/standalone
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIphone = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIphone);

    // Android/Desktop Install Prompt
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log("Install prompt captured");
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (isIOS) {
      // iOS always needs manual instructions
      setShowIOSPrompt(true);
    } else if (installPrompt) {
      // If we have the system prompt captured, use it
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setInstallPrompt(null);
      });
    } else {
      // If Android/Desktop but no prompt (browser restricted or already dismissed), show manual instructions
      setShowAndroidPrompt(true);
    }
  };

  const handleUrlSave = (newUrl: string) => {
    setUserUrl(newUrl);
    localStorage.setItem('sheet_raw_url', newUrl);
    setCsvUrl(convertToCsvUrl(newUrl));
  };

  useEffect(() => {
    if (userUrl) setCsvUrl(convertToCsvUrl(userUrl));
  }, [userUrl]);

  const fetchData = useCallback(async () => {
    if (!csvUrl) return;
    try {
      const fetchUrl = csvUrl.includes('?') ? `${csvUrl}&t=${Date.now()}` : `${csvUrl}?t=${Date.now()}`;
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error(`Could not access sheet (${res.status}).`);
      
      const text = await res.text();
      const transactions = parseCSV(text);
      
      setAllData(transactions);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading data');
    }
  }, [csvUrl]);

  // Initial Fetch
  useEffect(() => {
    if (csvUrl) {
        setLoading(true);
        fetchData().finally(() => setLoading(false));
    }
  }, [csvUrl]); 

  // Polling
  useEffect(() => {
    if (!csvUrl) return;
    const interval = setInterval(fetchData, 3000); 
    return () => clearInterval(interval);
  }, [csvUrl, fetchData]);

  // Update Display Logic
  useEffect(() => {
    if (availableMonths.length > 0) {
        const index = Math.min(selectedMonthIndex, availableMonths.length - 1);
        const selection = availableMonths[index];
        const { stats, filteredData } = calculateMonthlyStats(allData, selection.month, selection.year);
        
        setStats(stats);
        setFilteredTransactions(filteredData);
    } 
  }, [allData, selectedMonthIndex, availableMonths]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const openSheet = () => {
    if (userUrl) window.open(userUrl, '_blank');
  };

  const handleShare = async () => {
    // Generate a Share Link that includes the specific Sheet URL
    const urlObj = new URL(window.location.origin + window.location.pathname);
    
    // Only append param if it's not the default sheet
    if (userUrl && userUrl !== DEFAULT_SHEET_URL) {
      // URLSearchParams automatically encodes values
      urlObj.searchParams.set('sheet', userUrl);
    }
    
    const shareableLink = urlObj.toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Current Bank',
          text: 'Check out this financial dashboard!',
          url: shareableLink,
        });
      } catch (err) {
        console.debug("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(shareableLink);
      alert('Shareable link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary-500/30">
      
      {/* HEADER */}
      <nav className="fixed top-0 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between h-auto md:h-16 py-2 md:py-0 gap-3 md:gap-0">
            
            {/* Logo */}
            <div className="flex items-center w-full md:w-auto justify-between">
                <div className="flex items-center gap-3">
                    <img 
                        src="https://cdn-icons-png.flaticon.com/512/2830/2830284.png" 
                        alt="Current Bank Logo" 
                        className="w-10 h-10 rounded-lg shadow-lg shadow-primary-500/20 object-contain bg-slate-800"
                    />
                    <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20 hidden">
                        <span className="font-bold text-white">CB</span>
                    </div>
                    
                    <span className="font-bold text-xl tracking-tight">Current Bank</span>
                </div>

                <div className="flex md:hidden gap-1">
                     {!isStandalone && (
                         <button onClick={handleInstallClick} className="p-2 text-primary-400 hover:text-white" title="Install App">
                            <Download size={18} />
                         </button>
                     )}
                     <button onClick={handleShare} className="p-2 text-slate-400 hover:text-white" title="Share App">
                        <Share2 size={18} />
                    </button>
                    <button onClick={() => { setLoading(true); fetchData().finally(() => setLoading(false)); }} className="p-2 text-slate-400 hover:text-white">
                        <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:text-white">
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* MONTH SELECTOR */}
            <div className="flex items-center bg-slate-800/50 rounded-xl p-1 border border-slate-700/50 w-full md:w-auto justify-center">
                <div className="px-3 text-slate-400">
                    <Calendar size={16} />
                </div>
                <div className="relative">
                    <select 
                        value={selectedMonthIndex}
                        onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                        className="appearance-none bg-transparent text-white font-medium py-1.5 pr-8 pl-1 focus:outline-none cursor-pointer text-sm md:text-base"
                    >
                        {availableMonths.map((m, idx) => (
                            <option key={`${m.year}-${m.month}`} value={idx} className="bg-slate-900 text-slate-200">
                                {m.label}
                            </option>
                        ))}
                    </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {!isStandalone && (
                 <button 
                    onClick={handleInstallClick}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors shadow-lg shadow-primary-500/30"
                  >
                    <Download size={14} /> Install App
                  </button>
              )}
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-primary-900/30 text-primary-300 border border-primary-500/30 rounded-lg hover:bg-primary-900/50 transition-colors"
              >
                <Share2 size={14} /> Share
              </button>
              <button 
                onClick={openSheet}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <ExternalLink size={14} /> Sheet
              </button>
              <button onClick={() => { setLoading(true); fetchData().finally(() => setLoading(false)); }} disabled={loading} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                <RefreshCw size={20} className={`${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-[110px] md:pt-24 pb-24 px-4 max-w-7xl mx-auto space-y-6">
        
        {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-start gap-3 animate-pulse">
                <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                <p className="text-sm whitespace-pre-line">{error}</p>
            </div>
        )}

        {/* TABS */}
        <div className="flex justify-center mb-6">
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex gap-1 shadow-inner">
                 <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <LayoutDashboard size={16} /> Balance
                  </button>
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'transactions' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <Table size={16} /> Data
                  </button>
                  <button 
                    onClick={() => setActiveTab('ai')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'ai' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <Wallet size={16} /> Analyst
                  </button>
            </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] fade-in">
            
            {/* BIG BALANCE CARD */}
            <div className="w-full max-w-lg bg-gradient-to-b from-slate-800 to-slate-900 p-12 rounded-[2rem] border border-slate-700/50 shadow-2xl shadow-blue-900/10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"></div>
                
                <h2 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-6 flex items-center justify-center gap-2">
                  Current Balance
                </h2>
                
                <div className="text-6xl md:text-7xl font-bold text-white tracking-tight mb-4 drop-shadow-xl">
                  {formatCurrency(stats.totalBalance)}
                </div>
                
                <p className="text-primary-400 font-medium text-lg">
                   {availableMonths[selectedMonthIndex]?.label}
                </p>
                
                {allData.length === 0 && !loading && (
                    <div className="mt-8 bg-slate-950/50 p-4 rounded-xl text-xs text-slate-400 border border-dashed border-slate-700">
                        No data loaded. Please ensure: <br/>
                        1. Sheet has month headers (e.g., "July 2025") <br/>
                        2. A row contains "Current Balance" and a value.
                    </div>
                )}
            </div>

          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden fade-in">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                    Raw Data ({availableMonths[selectedMonthIndex]?.label})
                </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950/50 uppercase text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Item / Name</th>
                    <th className="px-6 py-4 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">
                          <div className="flex flex-col">
                            <span>{tx.description}</span>
                            {tx.sheetBalance !== undefined && <span className="text-xs text-primary-400">Balance Row</span>}
                          </div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-200">
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                        <td colSpan={2} className="px-6 py-12 text-center text-slate-500">
                            No data found for this month in the sheet. <br/>
                            <span className="text-xs opacity-50">
                                (Checked header "{availableMonths[selectedMonthIndex]?.label}")
                            </span>
                        </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="fade-in h-full">
            <AIChat transactions={allData} />
          </div>
        )}
      </main>

      {/* IOS INSTRUCTION MODAL */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
            <button 
                onClick={() => setShowIOSPrompt(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
                <X size={20} />
            </button>
            
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center text-primary-500 mb-2">
                    <Download size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Install on iPhone</h3>
                <p className="text-sm text-slate-300">
                    iOS requires a manual step to install this app.
                </p>
                
                <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 text-left space-y-3 text-sm text-slate-300">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs font-bold">1</span>
                        <span>Tap the <span className="font-bold text-primary-400">Share</span> button in Safari.</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs font-bold">2</span>
                        <div className="flex items-center gap-2">
                            <span>Scroll down and tap</span>
                            <span className="flex items-center gap-1 font-bold text-white bg-slate-800 px-2 py-1 rounded">
                                <PlusSquare size={14} /> Add to Home Screen
                            </span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => setShowIOSPrompt(false)}
                    className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium mt-2"
                >
                    Got it
                </button>
            </div>
          </div>
        </div>
      )}

      {/* ANDROID INSTRUCTION MODAL */}
      {showAndroidPrompt && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
            <button 
                onClick={() => setShowAndroidPrompt(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
                <X size={20} />
            </button>
            
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center text-primary-500 mb-2">
                    <Download size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Install App</h3>
                <p className="text-sm text-slate-300">
                   The automatic installer isn't ready yet. You can install it manually:
                </p>
                
                <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 text-left space-y-3 text-sm text-slate-300">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs font-bold">1</span>
                        <div className="flex items-center gap-2">
                            <span>Tap the <strong>3 dots</strong> menu</span>
                            <MoreVertical size={14} />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs font-bold">2</span>
                        <div className="flex items-center gap-2">
                            <span>Select</span>
                            <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded">
                                Install App
                            </span>
                             <span className="text-xs opacity-70">or Add to Home Screen</span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => setShowAndroidPrompt(false)}
                    className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium mt-2"
                >
                    Got it
                </button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentUrl={userUrl}
        onSave={handleUrlSave}
      />
    </div>
  );
}

export default App;