
import React from 'react';
import { Rank } from '../types';
import { Star, AlertCircle, CheckCircle2, Clock, CalendarDays, Timer, X, Edit2, PencilLine } from 'lucide-react';
import { differenceInDays, isValid, startOfDay } from 'date-fns';

/**
 * Parses a YYYY-MM-DD string into a local Date object.
 * Standard new Date("YYYY-MM-DD") treats it as UTC, causing 1-day offsets in Western timezones.
 */
export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}>
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple' }> = ({ children, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    yellow: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    gray: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.7rem] xl:text-sm font-black uppercase tracking-wider ${colors[color]}`}>
      {children}
    </span>
  );
};

export const RankStars: React.FC<{ rank: Rank; onRankChange?: (newRank: Rank) => void; editable?: boolean }> = ({ rank, onRankChange, editable }) => {
  const filledCount = 6 - rank; 
  return (
    <div className={`flex gap-0.5 ${editable ? 'cursor-pointer' : ''}`} title={`Rank ${rank}`}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          onClick={(e) => {
            if (editable && onRankChange) {
              e.stopPropagation();
              const newRank = (6 - (i + 1)) as Rank;
              onRankChange(newRank);
            }
          }}
          className={`${i < filledCount ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'} w-[1em] h-[1em] ${editable ? 'hover:scale-125 transition-transform' : ''}`}
        />
      ))}
    </div>
  );
};

export const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  const iconClass = "w-[1.2em] h-[1.2em] shrink-0";
  if (!status) return <div className="w-[0.8em] h-[0.8em] rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />;
  
  switch (status.toLowerCase()) {
    case 'active':
    case 'delivered':
    case 'feedback received':
    case 'my turn':
    case '我方跟进':
      return <CheckCircle2 className={`${iconClass} text-emerald-500`} />;
    case 'pending':
    case 'processing':
    case 'testing':
    case 'waiting for customer':
    case '等待对方':
      return <Clock className={`${iconClass} text-amber-500`} />;
    default:
      return <div className="w-[0.8em] h-[0.8em] rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />;
  }
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded-md font-black text-sm xl:text-base transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const DaysCounter: React.FC<{ 
  date?: string; 
  label: string; 
  type: 'elapsed' | 'remaining';
  onDateChange?: (newDate: string) => void;
  title?: string;
}> = ({ date, label, type, onDateChange, title }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onDateChange) onDateChange(e.target.value);
  };

  const isInteractive = !!onDateChange;
  const targetDate = date ? parseLocalDate(date) : null;
  const daysDiff = targetDate && isValid(targetDate) ? differenceInDays(startOfDay(new Date()), startOfDay(targetDate)) : 0;
  const displayDays = type === 'elapsed' ? daysDiff : -daysDiff; 
  
  let colorClass = "text-slate-700 dark:text-slate-200";
  if (targetDate && isValid(targetDate)) {
    if (type === 'elapsed') {
      if (displayDays < 7) colorClass = "text-emerald-500";
      else if (displayDays < 30) colorClass = "text-amber-500";
      else colorClass = "text-red-500";
    } else {
      if (displayDays < 7) colorClass = "text-red-500";
      else if (displayDays < 30) colorClass = "text-amber-500";
      else colorClass = "text-emerald-500";
    }
  }

  const content = (
    <div className={`flex flex-col items-center justify-center p-4 min-w-[120px] h-32 xl:h-40 relative group transition-all`}>
      <div className={`font-black text-3xl xl:text-5xl mb-1 ${colorClass}`}>
        {!date ? '-' : Math.abs(displayDays)}
      </div>
      <span className="text-[10px] xl:text-xs text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest text-center px-2 leading-tight">{label}</span>
      
      {isInteractive && (
        <div className="absolute top-2 right-2 flex flex-col items-center">
           <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-sm pointer-events-none group-hover:scale-110 transition-transform">
              <PencilLine className="w-3 h-3 xl:w-4 xl:h-4" />
           </div>
           <input 
              type="date" 
              className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" 
              value={date || ''} 
              onChange={handleInputChange} 
           />
        </div>
      )}
    </div>
  );

  if (title) {
    return (
      <Card className="overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900/40">
        <div className="px-6 py-4 bg-slate-100 dark:bg-slate-800/80 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-black text-lg xl:text-xl text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-wider">{title}</h3>
        </div>
        {content}
      </Card>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative group transition-all hover:shadow-md ${isInteractive ? 'hover:border-blue-400' : ''}`}>
      {content}
    </div>
  );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 xl:p-6 border-b flex justify-between items-center">
          <h3 className="font-black text-base xl:text-lg text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 xl:w-6 xl:h-6 text-slate-500" />
          </button>
        </div>
        <div className="p-6 xl:p-8 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export const getUrgencyLevel = (dateStr?: string): 'urgent' | 'warning' | 'safe' | 'none' => {
  if (!dateStr) return 'none';
  const target = parseLocalDate(dateStr);
  if (!isValid(target)) return 'none';
  const diff = differenceInDays(startOfDay(target), startOfDay(new Date()));
  if (diff < 7) return 'urgent';
  if (diff <= 14) return 'warning';
  return 'safe';
};
