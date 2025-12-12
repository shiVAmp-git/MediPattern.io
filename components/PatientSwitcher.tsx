import React, { useState } from 'react';
import { Users, Plus, ChevronDown, Check } from 'lucide-react';
import { PatientProfile } from '../types';

interface PatientSwitcherProps {
  patients: PatientProfile[];
  currentPatientId: string;
  onSwitch: (id: string) => void;
  onAdd: (name: string) => void;
}

export const PatientSwitcher: React.FC<PatientSwitcherProps> = ({ 
  patients, currentPatientId, onSwitch, onAdd 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');

  const currentPatient = patients.find(p => p.id === currentPatientId) || patients[0];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPatientName.trim()) {
      onAdd(newPatientName.trim());
      setNewPatientName('');
      setIsAdding(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm transition-all"
      >
        <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-md">
          <Users className="w-4 h-4 text-primary dark:text-primary-400" />
        </div>
        <div className="text-left hidden md:block">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Patient</p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight max-w-[100px] truncate">
            {currentPatient?.name || 'Select'}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => { setIsOpen(false); setIsAdding(false); }}
          />
          <div className="absolute right-0 md:left-0 md:right-auto mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">Select Profile</span>
            </div>
            
            <div className="max-h-60 overflow-y-auto p-1">
              {patients.map(patient => (
                <button
                  key={patient.id}
                  onClick={() => { onSwitch(patient.id); setIsOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between group transition-colors ${
                    patient.id === currentPatientId 
                      ? 'bg-primary/5 dark:bg-primary/20 text-primary dark:text-primary-400 font-medium' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="truncate">{patient.name}</span>
                  {patient.id === currentPatientId && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              {isAdding ? (
                <form onSubmit={handleAddSubmit} className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Patient Name"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-md focus:outline-none focus:border-primary"
                  />
                  <button 
                    type="submit"
                    className="px-2 py-1.5 bg-primary text-white rounded-md hover:bg-primary/90"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Patient</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};