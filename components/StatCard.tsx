import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  colorClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, colorClass = "bg-white" }) => {
  return (
    <div className={`${colorClass} p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between transition-transform hover:scale-[1.02]`}>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {trend && <p className="text-xs text-slate-400 mt-2">{trend}</p>}
      </div>
      <div className="p-3 bg-slate-50 rounded-lg text-primary">
        <Icon size={24} />
      </div>
    </div>
  );
};