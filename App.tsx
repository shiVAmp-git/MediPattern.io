import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PatientSwitcher } from './components/PatientSwitcher';
import { TabView, JournalEntry, PatientProfile } from './types';
import { getHistory, saveEntry, getPatients, addPatient, updatePatientInsight } from './services/storageService';
import { parseJournalEntry, generateDoctorReport, generateTrendInsight } from './services/geminiService';
import { StatCard } from './components/StatCard';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Send, AlertCircle, Moon, Activity, Smile, RefreshCw, ChevronRight, Calendar, FileText, Pill, Sparkles, CheckCircle2, AlertTriangle, Info, Sun
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Safe ID generator that works in all contexts
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Timeout helper to prevent infinite loading
const timeoutPromise = <T,>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabView>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Patient State
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [currentPatientId, setCurrentPatientId] = useState<string>('');
  
  // Data State
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const [journalInput, setJournalInput] = useState('');
  
  // UI States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  // Update Theme Class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Initialize Patients
  useEffect(() => {
    const loadedPatients = getPatients();
    setPatients(loadedPatients);
    if (loadedPatients.length > 0) {
      setCurrentPatientId(loadedPatients[0].id);
    }
  }, []);

  // Load History when Patient Changes
  useEffect(() => {
    if (currentPatientId) {
      setHistory(getHistory(currentPatientId) || []);
      setReport(null); // Reset report when switching patients
      setJournalInput(''); // Clear input
      setCurrentTab('dashboard'); // Return to dashboard
    }
  }, [currentPatientId]);

  const getCurrentPatient = () => patients.find(p => p.id === currentPatientId);

  const handlePatientAdd = (name: string) => {
    const newPatient = addPatient(name);
    setPatients(prev => [...prev, newPatient]);
    setCurrentPatientId(newPatient.id); // Auto switch to new patient
  };

  const handleJournalSubmit = async () => {
    if (!journalInput.trim()) return;
    
    setIsAnalyzing(true);
    try {
      // 1. Structure: Parse input
      const result = await timeoutPromise(
        parseJournalEntry(journalInput), 
        15000, 
        "Analysis timed out. Please check your connection."
      );
      
      const newEntry: JournalEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        originalText: journalInput,
        metrics: result.metrics
      };
      
      // 2. Memory: Save entry
      const updatedHistory = saveEntry(newEntry, currentPatientId);
      setHistory(updatedHistory);
      setJournalInput('');
      setCurrentTab('dashboard'); 
      setIsAnalyzing(false);

      // 3. Reasoning: Generate Insight (Background Process)
      setIsGeneratingInsight(true);
      try {
        const insight = await generateTrendInsight(updatedHistory);
        const updatedPatients = updatePatientInsight(currentPatientId, insight);
        setPatients(updatedPatients);
      } catch (err) {
        console.error("Insight generation failed", err);
      } finally {
        setIsGeneratingInsight(false);
      }

    } catch (error: any) {
      console.error("Analysis failed:", error);
      alert(error.message || "Failed to analyze entry. Please try again.");
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const text = await timeoutPromise(
        generateDoctorReport(history),
        25000,
        "Report generation timed out."
      );
      setReport(text);
    } catch (error) {
      console.error("Report generation failed:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Helper for Chart Data
  const chartData = history.length > 0 
    ? [...history].reverse().map(h => ({
        date: new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        pain: h.metrics.painLevel,
        sleep: h.metrics.sleepHours,
        mood: h.metrics.mood
      }))
    : [];

  // Averages
  const avgPain = history.length > 0 
    ? (history.reduce((acc, curr) => acc + curr.metrics.painLevel, 0) / history.length).toFixed(1)
    : 'N/A';
  
  const avgSleep = history.length > 0
    ? (history.reduce((acc, curr) => acc + curr.metrics.sleepHours, 0) / history.length).toFixed(1)
    : 'N/A';

  const renderInsightCard = () => {
    const patient = getCurrentPatient();
    const insight = patient?.latestInsight;

    if (!insight) return null;

    const styleMap = {
      positive: { 
        bg: 'bg-green-50 dark:bg-green-900/20', 
        border: 'border-green-100 dark:border-green-800', 
        text: 'text-green-800 dark:text-green-300', 
        icon: CheckCircle2, 
        iconColor: 'text-green-500 dark:text-green-400' 
      },
      warning: { 
        bg: 'bg-amber-50 dark:bg-amber-900/20', 
        border: 'border-amber-100 dark:border-amber-800', 
        text: 'text-amber-800 dark:text-amber-300', 
        icon: AlertTriangle, 
        iconColor: 'text-amber-500 dark:text-amber-400' 
      },
      info: { 
        bg: 'bg-blue-50 dark:bg-blue-900/20', 
        border: 'border-blue-100 dark:border-blue-800', 
        text: 'text-blue-800 dark:text-blue-300', 
        icon: Info, 
        iconColor: 'text-blue-500 dark:text-blue-400' 
      },
    };

    const styles = styleMap[insight.type] || styleMap.info;

    const Icon = styles.icon;

    return (
      <div className={`${styles.bg} border ${styles.border} p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-700`}>
        <div className={`mt-0.5 ${styles.iconColor} shrink-0`}>
          <Icon size={20} />
        </div>
        <div>
          <h4 className={`text-sm font-bold ${styles.text} uppercase tracking-wide mb-1`}>AI Agent Insight</h4>
          <p className={`${styles.text} text-sm leading-relaxed`}>
            {insight.text}
          </p>
          <p className={`text-xs ${styles.text} opacity-70 mt-2`}>
            Updated {new Date(insight.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            {isGeneratingInsight && <span className="ml-2 inline-block animate-pulse">Updating...</span>}
          </p>
        </div>
      </div>
    );
  };

  const renderJournalForm = (isZeroState = false) => (
    <div className={`bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 ${isZeroState ? 'animate-in zoom-in-95 duration-500' : ''}`}>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
        {isZeroState ? "Your First Entry" : `Journal Entry for ${patients.find(p => p.id === currentPatientId)?.name || 'Patient'}`}
      </label>
      <textarea
        value={journalInput}
        onChange={(e) => setJournalInput(e.target.value)}
        placeholder="e.g. Patient slept 6 hours. Reports level 4 back pain. Forgot to take meds this morning..."
        className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
      />
      
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleJournalSubmit}
          disabled={isAnalyzing || !journalInput.trim()}
          className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all transform active:scale-95 shadow-lg shadow-teal-600/20"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Entry
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            {history.length === 0 ? (
               <div className="max-w-2xl mx-auto pt-8">
                 <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary dark:text-primary-400">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Welcome to MediPattern</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                      AI-powered health tracking. Log your first entry below to generate your personal health dashboard.
                    </p>
                 </div>
                 {renderJournalForm(true)}
               </div>
            ) : (
              <>
                {/* Agent Insight Box */}
                {renderInsightCard()}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard 
                    title="Avg Pain Level" 
                    value={avgPain} 
                    icon={AlertCircle} 
                    trend="Last 30 days"
                    colorClass="bg-white dark:bg-slate-800"
                  />
                  <StatCard 
                    title="Avg Sleep" 
                    value={`${avgSleep} hrs`} 
                    icon={Moon} 
                    trend="Last 30 days"
                    colorClass="bg-white dark:bg-slate-800"
                  />
                  <StatCard 
                    title="Latest Mood" 
                    value={history[0]?.metrics.mood || "N/A"} 
                    icon={Smile} 
                    trend="Based on last entry"
                    colorClass="bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-accent" /> Pain Trends
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorPain" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "#334155" : "#f1f5f9"} />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: theme === 'dark' ? '#94a3b8' : '#94a3b8', fontSize: 12}}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: theme === 'dark' ? '#94a3b8' : '#94a3b8', fontSize: 12}}
                            domain={[0, 10]}
                          />
                          <RechartsTooltip 
                            contentStyle={{
                              borderRadius: '8px', 
                              border: 'none', 
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                              color: theme === 'dark' ? '#f1f5f9' : '#000'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="pain" 
                            stroke="#f43f5e" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorPain)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-500" /> Sleep Duration
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "#334155" : "#f1f5f9"} />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: theme === 'dark' ? '#94a3b8' : '#94a3b8', fontSize: 12}}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: theme === 'dark' ? '#94a3b8' : '#94a3b8', fontSize: 12}}
                          />
                          <RechartsTooltip 
                            contentStyle={{
                              borderRadius: '8px', 
                              border: 'none', 
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                              color: theme === 'dark' ? '#f1f5f9' : '#000'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="sleep" 
                            stroke="#6366f1" 
                            strokeWidth={3} 
                            dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'journal':
        return (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8 text-center">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-teal-600 dark:text-teal-400">
                 <FileText className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">New Journal Entry</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Describe how the patient is feeling.</p>
            </header>

            {renderJournalForm()}

            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex gap-3">
              <div className="shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-700 dark:text-blue-300 text-sm">AI Agent Processing</h4>
                <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1">
                  The Agent will extract pain, sleep, mood, and <b>medication status</b>. It will then analyze recent history to provide an immediate insight on the dashboard.
                </p>
              </div>
            </div>
          </div>
        );

      case 'report':
        return (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <header className="mb-8 flex justify-between items-center">
               <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Doctor's Report</h1>
                <p className="text-slate-500 dark:text-slate-400">Analysis for {patients.find(p => p.id === currentPatientId)?.name}</p>
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport || history.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors shadow-md shadow-indigo-500/20"
              >
                {isGeneratingReport ? (
                   <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                   <Activity className="w-4 h-4" />
                )}
                Generate Analysis
              </button>
            </header>

            {report ? (
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 prose prose-slate dark:prose-invert max-w-none">
                 <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardListIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">No Report Generated</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                  Click the button above to analyze journal history and generate a comprehensive summary.
                </p>
              </div>
            )}
          </div>
        );

      case 'history':
        return (
          <div className="animate-in fade-in duration-500">
             <header className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Full History</h1>
              <p className="text-slate-500 dark:text-slate-400">Raw data for {patients.find(p => p.id === currentPatientId)?.name}</p>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Date</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Pain</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Sleep</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Mood</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-sm">Meds</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-sm w-1/3">Original Text</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">No entries found</td>
                      </tr>
                    ) : (
                      history.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                              {new Date(entry.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 pl-6 mt-0.5">
                              {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                              entry.metrics.painLevel > 6 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                              entry.metrics.painLevel > 3 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                              'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            }`}>
                              {entry.metrics.painLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                            {entry.metrics.sleepHours} hrs
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-md capitalize border border-slate-200 dark:border-slate-600">
                              {entry.metrics.mood}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              entry.metrics.medicationStatus === 'Taken' ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-800' :
                              entry.metrics.medicationStatus === 'Missed' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800' :
                              'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}>
                              {entry.metrics.medicationStatus === 'Taken' && <CheckCircle2 size={12} />}
                              {entry.metrics.medicationStatus === 'Missed' && <AlertTriangle size={12} />}
                              {entry.metrics.medicationStatus || 'Unspecified'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm truncate max-w-xs" title={entry.originalText}>
                            {entry.originalText}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />
      
      <main className="flex-1 overflow-y-auto w-full h-full pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
           {/* Top Bar for Patient Switcher & Theme Toggle */}
           <div className="flex justify-between items-center mb-6 md:mb-8">
             <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 md:hidden flex items-center gap-2">
               <Activity className="text-primary dark:text-primary-400 w-6 h-6" />
               MediPattern
             </h1>
             <div className="ml-auto flex items-center gap-3">
               {/* Theme Toggle Button */}
               <button
                 onClick={toggleTheme}
                 className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary-400 transition-colors"
                 title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
               >
                 {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
               </button>

               <PatientSwitcher 
                  patients={patients}
                  currentPatientId={currentPatientId}
                  onSwitch={setCurrentPatientId}
                  onAdd={handlePatientAdd}
               />
             </div>
           </div>

           {renderContent()}
        </div>
      </main>
    </div>
  );
}

function ClipboardListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}