
import React from 'react';
import { Rank } from '../types';
import { Star, AlertCircle, CheckCircle2, Clock, CalendarDays, Timer, X } from 'lucide-react';
import { differenceInDays, parseISO, isValid } from 'date-fns';

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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs xl:text-sm font-medium ${colors[color]}`}>
      {children}
    </span>
  );
};

// Rank 1 is HIGHEST priority (5 filled stars). Rank 5 is LOWEST (1 filled star).
export const RankStars: React.FC<{ rank: Rank; onRankChange?: (newRank: Rank) => void; editable?: boolean }> = ({ rank, onRankChange, editable }) => {
  const filledCount = 6 - rank; 
  return (
    <div className={`flex gap-0.5 ${editable ? 'cursor-pointer' : ''}`} title={`Rank ${rank} - ${rank === 1 ? 'Highest' : 'Lowest'} Importance`}>
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
          className={`${i < filledCount ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'} w-[14px] h-[14px] xl:w-[18px] xl:h-[18px] ${editable ? 'hover:scale-125 transition-transform' : ''}`}
        />
      ))}
    </div>
  );
};

export const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  const sizeClass = "w-4 h-4 xl:w-5 xl:h-5";
  if (!status) return <div className="w-3 h-3 xl:w-4 xl:h-4 rounded-full bg-slate-300 dark:bg-slate-600" />;
  
  switch (status.toLowerCase()) {
    case 'active':
    case 'delivered':
    case 'feedback received':
    case 'my turn':
    case '我方跟进':
      return <CheckCircle2 className={`${sizeClass} text-emerald-500`} />;
    case 'pending':
    case 'processing':
    case 'testing':
    case 'waiting for customer':
    case '等待对方':
      return <Clock className={`${sizeClass} text-amber-500`} />;
    case 'inactive':
    case 'closed':
    case 'no action':
    case '暂无':
      return <div className="w-3 h-3 xl:w-4 xl:h-4 rounded-full bg-slate-300 dark:bg-slate-600" />;
    case 'urgent':
    case 'overdue':
      return <AlertCircle className={`${sizeClass} text-red-500`} />;
    default:
      return <div className="w-3 h-3 xl:w-4 xl:h-4 rounded-full bg-blue-400" />;
  }
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "px-4 py-2 xl:px-6 xl:py-3 rounded-md font-medium text-sm xl:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-500 dark:text-slate-300 dark:hover:bg-slate-800"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const DaysCounter: React.FC<{ date?: string; label: string; type: 'elapsed' | 'remaining' }> = ({ date, label, type }) => {
  // If no date, render a placeholder
  if (!date || !isValid(parseISO(date))) return (
    <div className="flex flex-col items-center justify-center p-3 xl:p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[120px] h-full shadow-sm">
      <span className="text-slate-300 dark:text-slate-600 font-medium text-3xl xl:text-5xl mb-1">-</span>
      <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider text-center leading-tight">{label}</span>
    </div>
  );

  const daysDiff = differenceInDays(new Date(), parseISO(date));
  // If type is 'elapsed', we want positive numbers for past dates (now > date).
  // If type is 'remaining', we want positive numbers for future dates (date > now), so we invert.
  const displayDays = type === 'elapsed' ? daysDiff : -daysDiff; 
  
  let colorClass = "text-slate-700 dark:text-slate-200";

  if (type === 'elapsed') {
    // Logic: 
    // < 7 days: Green (Good, Recently Updated)
    // 7 - 30 days: Yellow (Warning)
    // 30+ days: Red (Bad, Stale)
    if (displayDays < 7) colorClass = "text-emerald-500 dark:text-emerald-400";
    else if (displayDays < 30) colorClass = "text-amber-500 dark:text-amber-400";
    else colorClass = "text-red-500 dark:text-red-400";
  } else {
    // Logic:
    // < 7 days: Red (Urgent or Overdue)
    // 7 - 30 days: Yellow (Approaching)
    // 30+ days: Green (Safe)
    if (displayDays < 7) colorClass = "text-red-500 dark:text-red-400";
    else if (displayDays < 30) colorClass = "text-amber-500 dark:text-amber-400";
    else colorClass = "text-emerald-500 dark:text-emerald-400";
  }

  const isOverdue = type === 'remaining' && displayDays < 0;

  return (
    <div className="flex flex-col items-center justify-center p-3 xl:p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[120px] h-full shadow-sm hover:shadow-md transition-all">
      <div className={`font-extrabold text-3xl md:text-4xl xl:text-5xl mb-1 xl:mb-2 flex items-baseline gap-1 ${colorClass}`}>
        {Math.abs(displayDays)} <span className="text-sm xl:text-base font-medium text-slate-400 dark:text-slate-500">days</span>
      </div>
      <span className="text-xs xl:text-sm text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider text-center leading-tight">{label}</span>
      {isOverdue && (
         <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full mt-2">OVERDUE</span>
      )}
    </div>
  );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl xl:max-w-4xl max-h-[90vh] flex flex-col mx-4">
        <div className="p-4 xl:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-lg xl:text-2xl text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <X className="w-5 h-5 xl:w-7 xl:h-7" />
          </button>
        </div>
        <div className="p-6 xl:p-8 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export const getUrgencyLevel = (dateStr?: string): 'urgent' | 'warning' | 'safe' | 'none' => {
  if (!dateStr) return 'none';
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today
  const target = parseISO(dateStr);
  
  if (!isValid(target)) return 'none';
  
  const diff = differenceInDays(target, today);
  
  // Logic: < 7 days = Urgent (Red), 7-14 days = Warning (Yellow), > 14 days = Safe (Green)
  if (diff < 7) return 'urgent';
  if (diff <= 14) return 'warning';
  return 'safe';
};
