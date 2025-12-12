import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  colorClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, colorClass = "bg-white dark:bg-slate-800" }) => {
  return (
    <div className={`${colorClass} p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-start justify-between transition-transform hover:scale-[1.02]`}>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</h3>
        {trend && <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{trend}</p>}
      </div>
      <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg text-primary dark:text-primary-400">
        <Icon size={24} />
      </div>
    </div>
  );
};