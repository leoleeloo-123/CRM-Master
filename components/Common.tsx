
import React, { useRef } from 'react';
import { Rank } from '../types';
import { Star, AlertCircle, CheckCircle2, Clock, CalendarDays, Timer, X, Edit2 } from 'lucide-react';
import { differenceInDays, isValid } from 'date-fns';

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
    default:
      return <div className="w-3 h-3 xl:w-4 xl:h-4 rounded-full bg-slate-300 dark:bg-slate-600" />;
  }
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded-md font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
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
}> = ({ date, label, type, onDateChange }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onDateChange) onDateChange(e.target.value);
  };

  const isInteractive = !!onDateChange;
  const daysDiff = date && isValid(new Date(date)) ? differenceInDays(new Date(), new Date(date)) : 0;
  const displayDays = type === 'elapsed' ? daysDiff : -daysDiff; 
  
  let colorClass = "text-slate-700 dark:text-slate-200";
  if (date && isValid(new Date(date))) {
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

  return (
    <div className={`flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 min-w-[120px] h-40 shadow-sm relative group ${isInteractive ? 'cursor-pointer hover:border-blue-400' : ''}`}>
      <div className={`font-black text-4xl mb-1 ${colorClass}`}>
        {!date || !isValid(new Date(date)) ? '-' : Math.abs(displayDays)}
      </div>
      <span className="text-[10px] xl:text-xs text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest text-center px-2">{label}</span>
      
      {isInteractive && (
        <>
          <input type="date" className="absolute inset-0 opacity-0 cursor-pointer z-10" value={date || ''} onChange={handleInputChange} />
          <div className="absolute bottom-2 right-2 p-1 rounded-md bg-slate-50 dark:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 size={10} className="text-slate-400" />
          </div>
        </>
      )}
    </div>
  );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="font-black text-xl text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>
        <div className="p-8 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export const getUrgencyLevel = (dateStr?: string): 'urgent' | 'warning' | 'safe' | 'none' => {
  if (!dateStr) return 'none';
  const target = new Date(dateStr);
  if (!isValid(target)) return 'none';
  const diff = differenceInDays(target, new Date());
  if (diff < 7) return 'urgent';
  if (diff <= 14) return 'warning';
  return 'safe';
};
