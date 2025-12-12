import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TabView, JournalEntry } from './types';
import { getHistory, saveEntry } from './services/storageService';
import { parseJournalEntry, generateDoctorReport } from './services/geminiService';
import { StatCard } from './components/StatCard';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Send, AlertCircle, Moon, Activity, Smile, RefreshCw, ChevronRight, Calendar, FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabView>('dashboard');
  const [history, setHistory] = useState<JournalEntry[]>([]);
  
  // Journal State
  const [journalInput, setJournalInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Report State
  const [report, setReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleJournalSubmit = async () => {
    if (!journalInput.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await parseJournalEntry(journalInput);
      
      const newEntry: JournalEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        originalText: journalInput,
        metrics: result.metrics
      };
      
      const updatedHistory = saveEntry(newEntry);
      setHistory(updatedHistory);
      setJournalInput('');
      setCurrentTab('dashboard'); // Redirect to dashboard to show results
    } catch (error) {
      alert("Failed to analyze entry. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const text = await generateDoctorReport(history);
      setReport(text);
    } catch (error) {
      alert("Failed to generate report.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Helper for Chart Data - Reverse history for chronological order
  const chartData = [...history].reverse().map(h => ({
    date: new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    pain: h.metrics.painLevel,
    sleep: h.metrics.sleepHours,
    mood: h.metrics.mood
  }));

  // Average Calculations
  const avgPain = history.length > 0 
    ? (history.reduce((acc, curr) => acc + curr.metrics.painLevel, 0) / history.length).toFixed(1)
    : 'N/A';
  
  const avgSleep = history.length > 0
    ? (history.reduce((acc, curr) => acc + curr.metrics.sleepHours, 0) / history.length).toFixed(1)
    : 'N/A';

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800">Health Dashboard</h1>
              <p className="text-slate-500">Overview of your recent health metrics</p>
            </header>

            {history.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
                 <div className="bg-slate-50 p-4 rounded-full mb-4">
                   <Activity className="h-8 w-8 text-slate-400" />
                 </div>
                 <h3 className="text-lg font-semibold text-slate-700">No Data Yet</h3>
                 <p className="text-slate-500 text-center mb-6 max-w-sm">
                   Start by writing a journal entry to track your health patterns using AI.
                 </p>
                 <button 
                    onClick={() => setCurrentTab('journal')}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Create First Entry
                 </button>
               </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard 
                    title="Avg Pain Level" 
                    value={avgPain} 
                    icon={AlertCircle} 
                    trend="Last 30 days"
                    colorClass="bg-white"
                  />
                  <StatCard 
                    title="Avg Sleep" 
                    value={`${avgSleep} hrs`} 
                    icon={Moon} 
                    trend="Last 30 days"
                    colorClass="bg-white"
                  />
                  <StatCard 
                    title="Latest Mood" 
                    value={history[0]?.metrics.mood || "N/A"} 
                    icon={Smile} 
                    trend="Based on last entry"
                    colorClass="bg-white"
                  />
                </div>

                {/* Main Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-semibold text-slate-700 mb-6 flex items-center gap-2">
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
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 12}}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 12}}
                            domain={[0, 10]}
                          />
                          <RechartsTooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
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

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-semibold text-slate-700 mb-6 flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-500" /> Sleep Duration
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 12}}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 12}}
                          />
                          <RechartsTooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
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
              <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-teal-600">
                 <FileText className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">New Journal Entry</h1>
              <p className="text-slate-500 mt-2">Describe how you're feeling. The AI will extract the metrics.</p>
            </header>

            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                How are you feeling today?
              </label>
              <textarea
                value={journalInput}
                onChange={(e) => setJournalInput(e.target.value)}
                placeholder="e.g. I slept about 6 hours last night. My lower back pain is around a 4 today, but I feel generally happy..."
                className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-slate-700 placeholder-slate-400"
              />
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleJournalSubmit}
                  disabled={isAnalyzing || !journalInput.trim()}
                  className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all transform active:scale-95 shadow-lg shadow-teal-600/20"
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

            <div className="mt-8 bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
              <div className="shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-700 text-sm">AI Processing</h4>
                <p className="text-sm text-blue-600/80 mt-1">
                  The AI will automatically quantify your pain levels (1-10), track sleep duration, and categorize your mood based on your text.
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
                <h1 className="text-2xl font-bold text-slate-800">Doctor's Report</h1>
                <p className="text-slate-500">AI-generated analysis for medical consultation</p>
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport || history.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors shadow-md shadow-indigo-500/20"
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
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 prose prose-slate max-w-none">
                 <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardListIcon className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-700">No Report Generated</h3>
                <p className="text-slate-500 mt-2 max-w-md mx-auto">
                  Click the button above to analyze your journal history and generate a comprehensive summary for your healthcare provider.
                </p>
              </div>
            )}
          </div>
        );

      case 'history':
        return (
          <div className="animate-in fade-in duration-500">
             <header className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800">Full History</h1>
              <p className="text-slate-500">Raw data from all your journal entries</p>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Date</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Pain</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Sleep</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Mood</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-sm w-1/3">Original Text</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No entries found</td>
                      </tr>
                    ) : (
                      history.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {new Date(entry.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-400 pl-6 mt-0.5">
                              {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                              entry.metrics.painLevel > 6 ? 'bg-red-100 text-red-600' :
                              entry.metrics.painLevel > 3 ? 'bg-orange-100 text-orange-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {entry.metrics.painLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-700 font-medium">
                            {entry.metrics.sleepHours} hrs
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md capitalize border border-slate-200">
                              {entry.metrics.mood}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-sm truncate max-w-xs" title={entry.originalText}>
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
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />
      
      <main className="flex-1 overflow-y-auto w-full h-full pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
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