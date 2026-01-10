import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Sample } from '../types';
import { Card, Badge, RankStars, getUrgencyLevel, Button, parseLocalDate, Modal } from '../components/Common';
import { AlertTriangle, Calendar as CalendarIcon, ArrowRight, Activity, FlaskConical, ChevronLeft, ChevronRight, Globe, Check, Box, Filter, Maximize2, Minimize2, ChevronDown, ChevronRight as ChevronRightSmall, ChevronUp, Clock, ListTodo, FileText, Download, Printer, X } from 'lucide-react';
import { 
  format, isBefore, addDays, 
  endOfMonth, endOfWeek, eachDayOfInterval, 
  isSameMonth, isSameDay, addMonths, addWeeks, 
  isToday, startOfDay, isValid, startOfWeek
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

/**
 * Hardcoded Holiday Data for 2024 - 2028
 */
const HOLIDAY_DATA: Record<string, Record<string, string>> = {
  'China': {
    '2024-01-01': '元旦', '2024-02-10': '春节', '2024-02-11': '春节', '2024-02-12': '春节', '2024-02-13': '春节', '2024-02-14': '春节', '2024-02-15': '春节', '2024-02-16': '春节', '2024-02-17': '春节',
    '2024-04-04': '清明节', '2024-04-05': '清明节', '2024-04-06': '清明节', '2024-05-01': '劳动节', '2024-05-02': '劳动节', '2024-05-03': '劳动节', '2024-05-04': '劳动节', '2024-05-05': '劳动节',
    '2024-06-10': '端午节', '2024-09-15': '中秋节', '2024-09-16': '中秋节', '2024-09-17': '中秋节',
    '2024-10-01': '国庆节', '2024-10-02': '国庆节', '2024-10-03': '国庆节', '2024-10-04': '国庆节', '2024-10-05': '国庆节', '2024-10-06': '国庆节', '2024-10-07': '国庆节',
    '2025-01-01': '元旦', '2025-01-28': '除夕', '2025-01-29': '春节', '2025-01-30': '春节', '2025-01-31': '春节', '2025-02-01': '春节', '2025-02-02': '春节', '2025-02-03': '春节', '2025-02-04': '春节',
    '2026-01-01': '元旦', '2026-02-17': '春节', '2026-02-18': '春节', '2026-02-19': '春节',
  },
  'USA': {
    '2024-01-01': 'New Year', '2024-01-15': 'MLK Day', '2024-02-19': 'Presidents Day', '2024-05-27': 'Memorial Day', '2024-07-04': 'Independence Day', '2024-09-02': 'Labor Day', '2024-11-28': 'Thanksgiving', '2024-12-25': 'Christmas',
  },
  'Japan': {
    '2024-01-01': 'New Year', '2024-05-03': 'Const. Day', '2024-05-04': 'Greenery Day', '2024-05-05': 'Childrens Day',
  }
};

const mapRegionToHolidayKey = (region: string): string | null => {
  const r = region.toLowerCase();
  if (r.includes('china') || r.includes('中国')) return 'China';
  if (r.includes('usa') || r.includes('america') || r.includes('美国')) return 'USA';
  if (r.includes('japan') || r.includes('日本')) return 'Japan';
  return null;
};

interface DashboardProps {
  customers: Customer[];
  samples: Sample[];
}

type CalendarView = 'week' | 'month';

interface SampleGroupInfo {
  customerId: string;
  customerName: string;
  count: number;
  dateObj: Date;
}

const DashboardCalendar: React.FC<{ 
  customers: Customer[]; 
  samples: Sample[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
}> = ({ customers, samples, selectedDate, onSelectDate, currentDate, setCurrentDate }) => {
  const { t } = useApp();
  const navigate = useNavigate();
  const [view, setView] = useState<CalendarView>('month');
  
  const availableRegions = useMemo(() => {
    const regions = new Set<string>();
    customers.forEach(c => {
      c.region.forEach(r => {
        const key = mapRegionToHolidayKey(r);
        if (key) regions.add(key);
      });
    });
    ['China', 'USA', 'Japan'].forEach(r => regions.add(r));
    return Array.from(regions);
  }, [customers]);

  const [selectedHolidayRegions, setSelectedHolidayRegions] = useState<string[]>(['China', 'USA', 'Japan']);
  const [isHolidayMenuOpen, setIsHolidayMenuOpen] = useState(false);

  const customerEvents = useMemo(() => 
    customers.filter(c => c.rank <= 2 && c.nextActionDate).map(c => ({
      ...c,
      dateObj: parseLocalDate(c.nextActionDate!),
      type: 'customer' as const
    })), [customers]
  );

  const sampleGroups = useMemo(() => {
    const groups: Record<string, Record<string, SampleGroupInfo>> = {};
    samples.forEach(s => {
      if (s.nextActionDate && (s.testStatus === 'Ongoing' || s.testStatus === undefined)) {
        const dateStr = s.nextActionDate;
        const cid = s.customerId;
        if (!groups[dateStr]) groups[dateStr] = {};
        if (!groups[dateStr][cid]) {
          groups[dateStr][cid] = { customerId: cid, customerName: s.customerName, count: 0, dateObj: parseLocalDate(dateStr) };
        }
        groups[dateStr][cid].count++;
      }
    });
    return groups;
  }, [samples]);

  const handlePrev = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, -1));
    if (view === 'week') setCurrentDate(addWeeks(currentDate, -1));
  };

  const handleNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    onSelectDate(startOfDay(now));
  };

  const checkHolidays = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const activeHolidays: { region: string; name: string }[] = [];
    selectedHolidayRegions.forEach(region => {
      if (HOLIDAY_DATA[region] && HOLIDAY_DATA[region][dateStr]) {
        activeHolidays.push({ region, name: HOLIDAY_DATA[region][dateStr] });
      }
    });
    return activeHolidays;
  };

  const renderMonthView = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = endOfMonth(monthStart);
    const startDate = addDays(monthStart, -monthStart.getDay());
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    return (
      <div className="w-full flex flex-col">
         <div className="grid grid-cols-7 mb-3">
            {weekDays.map(d => (
              <div key={d} className="text-center text-xs xl:text-sm font-black text-slate-400 uppercase tracking-widest">{d}</div>
            ))}
         </div>
         <div className="grid grid-cols-7 gap-1.5">
            {days.map(day => {
               const dayCustEvents = customerEvents.filter(e => isSameDay(e.dateObj, day));
               const dayStr = format(day, 'yyyy-MM-dd');
               const daySampleGroups = sampleGroups[dayStr] ? (Object.values(dayStr ? sampleGroups[dayStr] : {}) as SampleGroupInfo[]) : [];
               const dayHolidays = checkHolidays(day);
               const isCurrentMonth = isSameMonth(day, monthStart);
               const isDayToday = isToday(day);
               const isDaySelected = isSameDay(day, selectedDate);
               const hasHoliday = dayHolidays.length > 0;
               
               return (
                 <div 
                   key={day.toISOString()} 
                   onClick={() => onSelectDate(startOfDay(day))}
                   className={`p-1 border rounded-xl flex flex-col gap-0.5 cursor-pointer transition-all min-h-[90px] xl:min-h-[110px] ${
                     isDaySelected 
                       ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20 z-10 shadow-md' 
                       : isCurrentMonth 
                         ? hasHoliday ? 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-100 dark:border-slate-800' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800' 
                         : 'bg-slate-50 dark:bg-slate-900 border-transparent opacity-40'
                   } ${isDayToday && !isDaySelected ? 'border-amber-400' : ''}`}
                 >
                    <div className="flex justify-between items-start h-4 pr-0.5">
                      <div className="flex-1 overflow-hidden">
                        {dayHolidays.map((h, idx) => (
                           <div key={idx} className="text-[8.5px] xl:text-[9.5px] font-black text-slate-500/80 dark:text-slate-400 uppercase leading-none truncate bg-slate-100 dark:bg-slate-700/50 px-1 py-0.5 rounded-sm">
                              {h.name}
                           </div>
                        ))}
                      </div>
                      <span className={`text-xs font-black px-1.5 rounded-full ${isDayToday ? 'bg-amber-500 text-white shadow-sm' : isDaySelected ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5 overflow-hidden mt-1">
                       {dayCustEvents.map(e => {
                          const urgency = getUrgencyLevel(e.nextActionDate!);
                          const urgencyBg = urgency === 'urgent' ? 'bg-rose-50 text-rose-800 border-rose-100' : urgency === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100';
                          return (
                            <div key={e.id} onClick={(ev) => { ev.stopPropagation(); navigate(`/customers/${e.id}`); }} className={`rounded px-1 py-0.5 text-[0.8rem] xl:text-[0.85rem] font-black border truncate transition-all hover:scale-[1.02] hover:shadow-sm ${urgencyBg}`}>
                               {e.name}
                            </div>
                          );
                       })}
                       {daySampleGroups.map(g => (
                          <div key={g.customerId} onClick={(ev) => { ev.stopPropagation(); navigate(`/customers/${g.customerId}?tab=samples`); }} className="rounded px-1 py-0.5 text-[0.8rem] xl:text-[0.85rem] font-black border border-blue-200 bg-blue-100/50 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 truncate transition-all hover:scale-[1.02] hover:shadow-sm">
                             {g.customerName}: {g.count}
                          </div>
                       ))}
                    </div>
                 </div>
               );
            })}
         </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const endDate = addDays(startDate, 6);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    return (
      <div className="w-full flex flex-col animate-in fade-in duration-300">
         <div className="grid grid-cols-7 mb-3">
            {weekDays.map(d => (
              <div key={d} className="text-center text-xs xl:text-sm font-black text-slate-400 uppercase tracking-widest">{d}</div>
            ))}
         </div>
         <div className="grid grid-cols-7 gap-3">
            {days.map(day => {
               const dayCustEvents = customerEvents.filter(e => isSameDay(e.dateObj, day));
               const dayStr = format(day, 'yyyy-MM-dd');
               const daySampleGroups = sampleGroups[dayStr] ? (Object.values(dayStr ? sampleGroups[dayStr] : {}) as SampleGroupInfo[]) : [];
               const dayHolidays = checkHolidays(day);
               const isDayToday = isToday(day);
               const isDaySelected = isSameDay(day, selectedDate);
               
               return (
                 <div 
                   key={day.toISOString()} 
                   onClick={() => onSelectDate(startOfDay(day))}
                   className={`p-3 border rounded-2xl flex flex-col gap-1 cursor-pointer transition-all min-h-[300px] xl:min-h-[450px] ${
                     isDaySelected 
                       ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20 z-10 shadow-md' 
                       : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800'
                   } ${isDayToday && !isDaySelected ? 'border-amber-400' : ''}`}
                 >
                    <div className="flex justify-between items-start h-5 pr-0.5">
                      <div className="flex-1 overflow-hidden">
                        {dayHolidays.map((h, idx) => (
                           <div key={idx} className="text-[10px] xl:text-[11px] font-black text-slate-500/80 dark:text-slate-400 uppercase leading-none truncate bg-slate-100 dark:bg-slate-700/50 px-1.5 py-1 rounded-md mb-1">
                              {h.name}
                           </div>
                        ))}
                      </div>
                      <span className={`text-sm font-black px-2 py-0.5 rounded-full ${isDayToday ? 'bg-amber-500 text-white shadow-sm' : isDaySelected ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col gap-2 overflow-y-auto mt-3 scrollbar-hide">
                       {dayCustEvents.map(e => {
                          const urgency = getUrgencyLevel(e.nextActionDate!);
                          const urgencyBg = urgency === 'urgent' ? 'bg-rose-50 text-rose-800 border-rose-100' : urgency === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100';
                          return (
                            <div key={e.id} onClick={(ev) => { ev.stopPropagation(); navigate(`/customers/${e.id}`); }} className={`rounded-xl p-3 text-sm xl:text-base font-black border transition-all hover:scale-[1.02] hover:shadow-sm ${urgencyBg}`}>
                               <div className="flex justify-between items-center mb-1">
                                  <span className="truncate pr-1">{e.name}</span>
                                  <div className="scale-75 origin-right shrink-0 opacity-60"><RankStars rank={e.rank} /></div>
                               </div>
                               <p className="text-xs text-slate-500/80 line-clamp-3 italic leading-relaxed">{e.upcomingPlan || "Action needed"}</p>
                            </div>
                          );
                       })}
                       {daySampleGroups.map(g => (
                          <div key={g.customerId} onClick={(ev) => { ev.stopPropagation(); navigate(`/customers/${g.customerId}?tab=samples`); }} className="rounded-xl p-3 text-sm xl:text-base font-black border border-blue-200 bg-blue-100/50 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 transition-all hover:scale-[1.02] hover:shadow-sm">
                             <div className="flex justify-between items-center">
                                <span className="truncate">{g.customerName}</span>
                                <span className="px-2 bg-blue-600 text-white rounded-md text-[10px] font-black">{g.count}</span>
                             </div>
                             <p className="text-xs text-blue-500/70 mt-1 uppercase tracking-widest">Active Samples</p>
                          </div>
                       ))}
                    </div>
                 </div>
               );
            })}
         </div>
      </div>
    );
  };

  return (
    <Card className="p-4 xl:p-8 flex flex-col shadow-sm border-2 h-full">
       <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
             <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
             <h3 className="font-black text-slate-800 dark:text-white text-base xl:text-xl uppercase tracking-wider">{t('calendar')}</h3>
             <span className="text-sm xl:text-lg font-black text-slate-400 ml-2">
                {view === 'month' ? format(currentDate, 'MMMM yyyy') : `Week of ${format(startOfWeek(currentDate), 'MMM do')}`}
             </span>
             
             <div className="relative ml-4">
                <button 
                  onClick={() => setIsHolidayMenuOpen(!isHolidayMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-[10px] xl:text-[11px] font-black transition-all ${isHolidayMenuOpen ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md scale-105' : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-slate-50'}`}
                >
                   <Globe size={12} />
                   Holidays ({selectedHolidayRegions.length})
                </button>
                {isHolidayMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsHolidayMenuOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 duration-200">
                       <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                          <span className="text-[10px] xl:text-[11px] font-black uppercase text-slate-400 tracking-widest">Select Regions</span>
                       </div>
                       <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                          {availableRegions.map(region => (
                            <button 
                              key={region} 
                              onClick={() => setSelectedHolidayRegions(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region])}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black transition-all ${selectedHolidayRegions.includes(region) ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                               {region}
                               {selectedHolidayRegions.includes(region) && <Check size={14} className="text-blue-600" />}
                            </button>
                          ))}
                       </div>
                    </div>
                  </>
                )}
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shadow-inner">
                <button onClick={() => setView('week')} className={`px-6 py-1.5 text-[11px] xl:text-[12px] font-black rounded-lg transition-all ${view === 'week' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>{t('viewWeek')}</button>
                <button onClick={() => setView('month')} className={`px-6 py-1.5 text-[11px] xl:text-[12px] font-black rounded-lg transition-all ${view === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}>{t('viewMonth')}</button>
             </div>

             <div className="flex items-center gap-2">
                <button onClick={handlePrev} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-all active:scale-90"><ChevronLeft className="w-4 h-4 xl:w-5 xl:h-5"/></button>
                <button onClick={handleToday} className="px-4 py-1.5 text-[11px] xl:text-[12px] font-black bg-white border-2 border-slate-100 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 rounded-lg shadow-sm transition-all active:scale-95">{t('today')}</button>
                <button onClick={handleNext} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-all active:scale-90"><ChevronRight className="w-4 h-4 xl:w-5 xl:h-5"/></button>
             </div>
          </div>
       </div>
       
       <div className="animate-in fade-in duration-500 overflow-hidden">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
       </div>
    </Card>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ customers, samples }) => {
  const navigate = useNavigate();
  const { t, tagOptions, companyName, userName } = useApp();
  
  // State for StatusReview
  const [reviewStatus, setReviewStatus] = useState<string>('样品制作中');
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Shared Calendar & Daily Agenda State
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Filter Items for the daily agenda
  const dailyCustomers = useMemo(() => {
    return customers.filter(c => c.nextActionDate === selectedDateStr)
      .sort((a, b) => a.rank - b.rank);
  }, [customers, selectedDateStr]);

  const dailySamples = useMemo(() => {
    return samples.filter(s => s.nextActionDate === selectedDateStr && s.testStatus === 'Ongoing');
  }, [samples, selectedDateStr]);

  const reviewGroups = useMemo(() => {
    const filtered = samples.filter(s => s.status === reviewStatus);
    const groupsMap: Record<string, { customerName: string; samples: Sample[] }> = {};
    
    filtered.forEach(s => {
      if (!groupsMap[s.customerId]) {
        groupsMap[s.customerId] = { customerName: s.customerName, samples: [] };
      }
      groupsMap[s.customerId].samples.push(s);
    });

    return Object.entries(groupsMap).map(([id, data]) => ({
      customerId: id,
      ...data
    })).sort((a, b) => a.customerName.localeCompare(b.customerName, 'zh-Hans-CN'));
  }, [samples, reviewStatus]);

  useEffect(() => {
    if (reviewGroups.length > 0) {
      setExpandedCustomers(new Set(reviewGroups.map(g => g.customerId)));
    }
  }, [reviewGroups]);

  const toggleAllExpansion = () => {
    if (expandedCustomers.size === reviewGroups.length && reviewGroups.length > 0) {
      setExpandedCustomers(new Set());
    } else {
      setExpandedCustomers(new Set(reviewGroups.map(g => g.customerId)));
    }
  };

  const activeSamplesCount = samples.filter(s => !['Delivered', 'Closed', 'Feedback Received', '已送达', '已关闭', '已反馈'].includes(s.status)).length;
  const pendingFeedbackCount = samples.filter(s => ['Sent', 'Delivered', '已寄出', '已送达'].includes(s.status)).length;
  
  const iconClass = "w-4 h-4 xl:w-5 xl:h-5 shrink-0";
  const labelClass = "text-[11px] xl:text-xs font-black uppercase text-slate-400 tracking-widest";
  const sharedTitleClass = "font-black text-slate-800 dark:text-white text-sm xl:text-lg uppercase tracking-wider flex items-center gap-3";
  const statCardClass = "p-3 xl:p-4 flex items-center gap-4 border-l-4 shadow-sm border-2 rounded-2xl";

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = parseLocalDate(e.target.value);
    if (isValid(newDate)) {
      setSelectedDate(startOfDay(newDate));
      setCurrentCalendarMonth(newDate);
    }
  };

  const handleExportPdf = () => {
    const originalTitle = document.title;
    const now = new Date();
    const dateStr = format(now, 'yyyyMMdd');
    const timeStr = format(now, 'HHmm');
    const fileName = `样品报告_${companyName}_${userName}_${dateStr}_${timeStr}`;
    
    document.title = fileName;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="space-y-8 xl:space-y-12 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl xl:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('dashboard')}</h2>
          <p className="text-sm xl:text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">{t('dashboardDesc')}</p>
        </div>
        <div className="text-sm xl:text-lg text-slate-400 font-black">
          Today: <span className="text-slate-900 dark:text-white">{format(new Date(), 'MMM do, yyyy')}</span>
        </div>
      </div>

      {/* Flattened top row stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 xl:gap-6">
        <Card className={`${statCardClass} border-l-blue-500`}>
          <div className="p-2 xl:p-2.5 bg-blue-50 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm">
            <Activity className={iconClass} />
          </div>
          <div>
            <p className={labelClass}>{t('totalCustomers')}</p>
            <p className="text-xl xl:text-3xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{customers.length}</p>
          </div>
        </Card>
        <Card className={`${statCardClass} border-l-amber-500`}>
          <div className="p-2 xl:p-2.5 bg-amber-50 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400 shadow-sm">
            <FlaskConical className={iconClass} />
          </div>
          <div>
            <p className={labelClass}>{t('activeSamples')}</p>
            <p className="text-xl xl:text-3xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{activeSamplesCount}</p>
          </div>
        </Card>
        <Card className={`${statCardClass} border-l-purple-500`}>
          <div className="p-2 xl:p-2.5 bg-purple-50 dark:bg-purple-900/50 rounded-xl text-purple-600 dark:text-purple-400 shadow-sm">
            <CalendarIcon className={iconClass} />
          </div>
          <div>
            <p className={labelClass}>{t('pendingFeedback')}</p>
            <p className="text-xl xl:text-3xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{pendingFeedbackCount}</p>
          </div>
        </Card>
        <Card className={`${statCardClass} border-l-red-500`}>
          <div className="p-2 xl:p-2.5 bg-red-50 dark:bg-red-900/50 rounded-xl text-red-600 dark:text-red-400 shadow-sm">
            <AlertTriangle className={iconClass} />
          </div>
          <div>
            <p className={labelClass}>{t('criticalActions')}</p>
            <p className="text-xl xl:text-3xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{dailyCustomers.length + dailySamples.length}</p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Daily Agenda (1/4) and Calendar (3/4) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 xl:gap-8 items-stretch h-full min-h-[600px] lg:min-h-[800px]">
        {/* Daily Agenda Side with Constrained Height and Internal Scroll */}
        <Card className="lg:col-span-1 p-5 xl:p-8 shadow-sm flex flex-col border-2 overflow-hidden bg-white dark:bg-slate-900/40 h-full max-h-[850px]">
          <div className="flex flex-col mb-4 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <h3 className={sharedTitleClass}>
              <ListTodo className="w-6 h-6 text-blue-600" />
              DAILY AGENDA
            </h3>
            <div className="mt-4 relative group">
               <input 
                 type="date" 
                 className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm xl:text-base font-black uppercase tracking-tighter outline-none focus:border-blue-500 transition-all dark:text-white cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                 value={selectedDateStr}
                 onChange={handleDateFilterChange}
               />
               <div className="absolute right-3 top-3.5 flex items-center gap-1.5 pointer-events-none text-slate-300 group-hover:text-blue-500 transition-colors">
                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
                  <Clock className="w-5 h-5" />
               </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-5 pr-2 scrollbar-hide">
            {dailyCustomers.length === 0 && dailySamples.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[1.5rem] opacity-30 text-center p-4">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 italic">No Scheduled Actions</span>
              </div>
            ) : (
              <>
                {dailyCustomers.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[11px] xl:text-xs font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Customers</span>
                    {dailyCustomers.map(c => {
                      const urgency = getUrgencyLevel(c.nextActionDate);
                      const urgencyColor = urgency === 'urgent' ? 'border-l-rose-500' : urgency === 'warning' ? 'border-l-amber-500' : 'border-l-emerald-500';
                      return (
                        <Card key={c.id} className={`p-4 hover:shadow-md border-l-4 ${urgencyColor} transition-all cursor-pointer border border-slate-50 dark:border-slate-800 group`} onClick={() => navigate(`/customers/${c.id}`)}>
                          <div className="flex flex-col gap-2">
                             <h4 className="font-black text-slate-900 dark:text-white text-sm xl:text-base group-hover:text-blue-600 transition-colors tracking-tight uppercase truncate">{c.name}</h4>
                             <div className="scale-75 origin-left -mt-1"><RankStars rank={c.rank} /></div>
                             <p className="text-xs xl:text-sm font-bold text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed italic border-l-2 border-slate-100 dark:border-slate-800 pl-2">
                                {c.upcomingPlan || "Action needed"}
                             </p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {dailySamples.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <span className="text-[11px] xl:text-xs font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Samples</span>
                    {dailySamples.map(s => (
                      <Card key={s.id} className="p-4 hover:shadow-md border-l-4 border-l-blue-500 transition-all cursor-pointer border border-slate-50 dark:border-slate-800 group" onClick={() => navigate(`/samples/${s.id}`)}>
                        <div className="flex flex-col gap-1.5">
                           <h4 className="font-black text-blue-600 dark:text-blue-400 text-sm xl:text-base group-hover:text-blue-800 transition-colors tracking-tight uppercase truncate">{s.sampleName}</h4>
                           <span className="text-[11px] xl:text-xs font-black text-slate-400 uppercase tracking-widest">{s.customerName}</span>
                           <p className="text-xs xl:text-sm font-bold text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed italic border-l-2 border-slate-100 dark:border-slate-800 pl-2 mt-1">
                              {s.upcomingPlan || "Production check"}
                           </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="pt-4 mt-2 border-t border-slate-50 dark:border-slate-800 shrink-0">
             <button 
                onClick={() => navigate('/customers')} 
                className="w-full text-center text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center justify-center gap-2 group transition-colors uppercase tracking-[0.1em]"
              >
                {t('viewAll')} <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
          </div>
        </Card>

        {/* Calendar - Height master */}
        <div className="lg:col-span-3 h-full">
           <DashboardCalendar 
             customers={customers} 
             samples={samples} 
             selectedDate={selectedDate}
             onSelectDate={setSelectedDate}
             currentDate={currentCalendarMonth}
             setCurrentDate={setCurrentCalendarMonth}
           />
        </div>
      </div>

      {/* Full Width Status Summary */}
      <Card className="p-8 xl:p-10 shadow-sm flex flex-col border-2 overflow-hidden bg-white dark:bg-slate-900/40 min-h-[500px]">
         <div className="flex flex-col gap-6 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className={sharedTitleClass}>
                 <FlaskConical className="w-6 h-6 text-blue-600" />
                 {t('statusReview')}
              </h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-emerald-100 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/20 text-[11px] xl:text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest hover:border-emerald-300 transition-all active:scale-95"
                >
                   <FileText size={16} />
                   {t('generateReport')}
                </button>
                <button 
                  onClick={toggleAllExpansion}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] xl:text-xs font-black uppercase tracking-widest hover:border-blue-300 transition-all active:scale-95"
                >
                   {expandedCustomers.size === reviewGroups.length && reviewGroups.length > 0 ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                   {expandedCustomers.size === reviewGroups.length && reviewGroups.length > 0 ? 'Collapse All' : 'Expand All'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                  <Filter size={18} />
               </div>
               <select 
                  className="flex-1 max-w-xs bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm xl:text-base font-black uppercase tracking-tight outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  value={reviewStatus}
                  onChange={e => setReviewStatus(e.target.value)}
               >
                  {tagOptions.sampleStatus.map(s => <option key={s} value={s}>{t(s as any) || s}</option>)}
               </select>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-hide">
            {reviewGroups.map(group => {
              const isExpanded = expandedCustomers.has(group.customerId);
              return (
                <div key={group.customerId} className="space-y-4">
                  <div 
                    onClick={() => setExpandedCustomers(prev => {
                       const next = new Set(prev);
                       if (next.has(group.customerId)) next.delete(group.customerId);
                       else next.add(group.customerId);
                       return next;
                    })}
                    className="flex items-center justify-between p-4 xl:p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                       {isExpanded ? <ChevronDown size={22} className="text-slate-400 shrink-0" /> : <ChevronRight size={22} className="text-slate-400 shrink-0" />}
                       <span className="font-black text-sm xl:text-lg text-slate-900 dark:text-white uppercase truncate tracking-tight">{group.customerName}</span>
                    </div>
                    <Badge color="gray">{group.samples.length} Samples</Badge>
                  </div>

                  {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6 pl-4 border-l-2 border-blue-100 dark:border-blue-900/40 ml-2 animate-in slide-in-from-top-2 duration-300">
                      {group.samples.map(s => {
                         const urgency = getUrgencyLevel(s.nextActionDate);
                         const colorBorder = urgency === 'urgent' ? 'border-l-rose-500' : urgency === 'warning' ? 'border-l-amber-500' : 'border-l-emerald-500';
                         return (
                           <Card 
                             key={s.id} 
                             onClick={() => navigate(`/samples/${s.id}`)}
                             className={`p-5 cursor-pointer hover:shadow-lg border-l-4 transition-all hover:-translate-y-1 bg-white dark:bg-slate-800 ${colorBorder}`}
                           >
                              <div className="flex justify-between items-start mb-2">
                                 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">#{s.sampleIndex}</span>
                                 <div className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase">
                                    {s.nextActionDate || 'TBD'}
                                 </div>
                              </div>
                              <p className="text-sm xl:text-base font-black text-slate-800 dark:text-white leading-snug line-clamp-2 uppercase tracking-tight">{s.sampleName}</p>
                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50 dark:border-slate-700">
                                 <span className="text-[11px] font-mono text-slate-400 truncate max-w-[120px] uppercase">{s.sampleSKU || 'NOSKU'}</span>
                                 <span className="text-xs xl:text-sm font-black text-slate-700 dark:text-slate-300">Qty: {s.quantity}</span>
                              </div>
                           </Card>
                         );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            
            {reviewGroups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] opacity-30">
                 <Box size={44} className="text-slate-400 mb-2" />
                 <span className="text-xs xl:text-sm font-black uppercase tracking-[0.2em] text-slate-400 italic">No Samples Found</span>
              </div>
            )}
         </div>
      </Card>

      {/* Report Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 print:p-0 print:bg-white print:backdrop-blur-none">
           <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 print:h-auto print:max-w-none print:shadow-none print:rounded-none print:static">
              {/* Modal Header - Hidden on Print */}
              <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0 print:hidden">
                 <div className="flex items-center gap-3">
                    <FileText className="text-blue-600 w-6 h-6" />
                    <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-wider">{t('reportDetails')}</h3>
                 </div>
                 <div className="flex items-center gap-4">
                    <button 
                       onClick={handleExportPdf}
                       className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                    >
                       <Printer size={16} /> {t('exportPdf')}
                    </button>
                    <button onClick={() => setIsPreviewModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                       <X className="w-6 h-6 text-slate-400" />
                    </button>
                 </div>
              </div>

              {/* Modal Content - The "A4 Paper" Area */}
              <div className="flex-1 overflow-y-auto p-10 bg-slate-100 dark:bg-slate-950 print:p-0 print:bg-white print:overflow-visible">
                 <div id="sample-status-report" className="mx-auto w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl p-[20mm] print:shadow-none print:w-full print:p-0 print:min-h-0">
                    {/* Report Header */}
                    <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
                       <div className="space-y-1">
                          <h2 className="text-4xl font-black uppercase tracking-tight leading-none text-blue-700">{companyName}</h2>
                          <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{t('sampleReportTitle')}</p>
                       </div>
                       <div className="text-right space-y-1">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Report Date</p>
                          <p className="text-sm font-black">{format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-3">Prepared By</p>
                          <p className="text-sm font-black">{userName}</p>
                       </div>
                    </div>

                    {/* Report Info Banner */}
                    <div className="bg-slate-100 p-6 rounded-2xl mb-10 flex justify-between items-center">
                       <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Filter Criteria</span>
                          <h4 className="text-xl font-black uppercase mt-1">Status: <span className="text-blue-600">{reviewStatus}</span></h4>
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Summary</span>
                          <h4 className="text-xl font-black uppercase mt-1">{reviewGroups.length} <span className="text-slate-400 font-bold">Customers</span></h4>
                       </div>
                    </div>

                    {/* Report Content Table */}
                    <div className="space-y-10">
                       {reviewGroups.map(group => (
                          <div key={group.customerId} className="space-y-4 break-inside-avoid">
                             <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-2">
                                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                                <h5 className="font-black text-lg uppercase tracking-tight">{group.customerName}</h5>
                             </div>
                             <table className="w-full text-left">
                                <thead>
                                   <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border-y">
                                      <th className="p-3 w-10">#</th>
                                      <th className="p-3">Sample Item & SKU</th>
                                      <th className="p-3 w-24">Quantity</th>
                                      <th className="p-3">Plan / Next Steps</th>
                                      <th className="p-3 w-28">Key Date</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                   {group.samples.map(s => (
                                      <tr key={s.id} className="text-[11px]">
                                         <td className="p-3 font-bold text-slate-400 align-top">{s.sampleIndex}</td>
                                         <td className="p-3 align-top">
                                            <div className="font-black uppercase leading-tight">{s.sampleName}</div>
                                            <div className="font-mono text-[9px] text-slate-400 mt-1">{s.sampleSKU || 'NO SKU'}</div>
                                         </td>
                                         <td className="p-3 align-top font-black">{s.quantity}</td>
                                         <td className="p-3 align-top italic text-slate-600 leading-relaxed">
                                            {s.upcomingPlan || '-'}
                                         </td>
                                         <td className="p-3 align-top font-black uppercase whitespace-nowrap">
                                            {s.nextActionDate || '-'}
                                         </td>
                                      </tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>
                       ))}
                    </div>

                    {/* Report Footer */}
                    <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] print:fixed print:bottom-10 print:left-0 print:right-0">
                       <span>© {companyName} Confidential Report</span>
                       <span>Page 1 of 1</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;