import React from 'react';
import { Activity, LayoutDashboard, FileText, ClipboardList, History } from 'lucide-react';
import { TabView } from '../types';

interface NavbarProps {
  currentTab: TabView;
  onTabChange: (tab: TabView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard' as TabView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'journal' as TabView, label: 'Journal', icon: FileText },
    { id: 'report' as TabView, label: 'Dr. Report', icon: ClipboardList },
    { id: 'history' as TabView, label: 'History', icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:relative md:border-t-0 md:border-r md:w-64 md:h-screen md:flex md:flex-col md:justify-between z-50">
      <div className="hidden md:flex items-center gap-3 p-6 border-b border-slate-100">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Activity className="text-primary h-6 w-6" />
        </div>
        <span className="font-bold text-lg text-slate-800">MediPattern</span>
      </div>

      <div className="flex md:flex-col justify-around md:justify-start md:p-4 gap-1 md:gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              flex flex-col md:flex-row items-center md:gap-3 p-3 md:px-4 md:py-3 rounded-xl transition-all
              ${currentTab === item.id 
                ? 'text-primary bg-primary/5 md:bg-primary/10 font-semibold' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
            `}
          >
            <item.icon size={20} strokeWidth={currentTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] md:text-sm mt-1 md:mt-0">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="hidden md:block p-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-400 text-center">
            &copy; {new Date().getFullYear()} MediPattern AI
          </p>
        </div>
      </div>
    </nav>
  );
};