import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Customer, Sample } from '../types';
import { Card, Badge, RankStars, getUrgencyLevel, Button, parseLocalDate, Modal } from '../components/Common';
import { AlertTriangle, Calendar as CalendarIcon, ArrowRight, Activity, FlaskConical, ChevronLeft, ChevronRight, Globe, Check, Box, Filter, Maximize2, Minimize2, ChevronDown, ChevronRight as ChevronRightSmall, ChevronUp, Clock, ListTodo, FileText, Download, Printer, X, Image as ImageIcon, RefreshCcw } from 'lucide-react';
import { 
  format, isBefore, addDays, 
  endOfMonth, endOfWeek, eachDayOfInterval, 
  isSameMonth, isSameDay, addMonths, addWeeks, 
  isToday, startOfDay, isValid, startOfWeek
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { toJpeg } from 'html-to-image';

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
                <button onClick={() => setView('month')} className={`px-6 py-1.5 text-[11px] xl:text-[12px] font-black rounded-lg transition-all ${view === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-50'}`}>{t('viewMonth')}</button>
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
  const [isExporting, setIsExporting] = useState(false);

  // Shared Calendar & Daily Agenda State
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());

  const reportRef = useRef<HTMLDivElement>(null);
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

  const handleExportJpg = async () => {
    if (!reportRef.current || isExporting) return;
    
    setIsExporting(true);
    try {
      const now = new Date();
      const dateStr = format(now, 'yyyyMMdd');
      const timeStr = format(now, 'HHmm');
      const fileName = `样品报告_${companyName}_${userName}_${dateStr}_${timeStr}.jpg`;
      
      const dataUrl = await toJpeg(reportRef.current, { 
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true
      });
      
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
      alert('Failed to generate image report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 xl:space-y-12 pb-20">
      <style>{`
        /* Hide browser-native calendar icon in date inputs to avoid double-icons */
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
      `}</style>

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl xl:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('dashboard')}</h2>
          <p className="text-sm xl:text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">{t('dashboardDesc')}</p>
        </div>
        <div className="text-sm xl:text-lg text-slate-400 font-black">
          Today: <span className="text-slate-900 dark:text-white">{format(new Date(), 'MMM do, yyyy')}</span>
        </div>
      </div>

      {/* Stats row */}
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 xl:gap-8 items-stretch min-h-[600px]">
        <Card className="lg:col-span-1 p-5 xl:p-8 shadow-sm flex flex-col border-2 overflow-hidden bg-white dark:bg-slate-900/40 h-full max-h-[850px]">
          <div className="flex flex-col mb-4 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <h3 className={sharedTitleClass}>
              <ListTodo className="w-6 h-6 text-blue-600" />
              DAILY AGENDA
            </h3>
            <div className="mt-4 relative group">
               <input 
                 type="date" 
                 className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm xl:text-base font-black uppercase tracking-tighter outline-none focus:border-blue-500 transition-all dark:text-white cursor-pointer"
                 value={selectedDateStr}
                 onChange={handleDateFilterChange}
               />
               <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none text-slate-300">
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
                    {dailyCustomers.map(c => (
                        <Card key={c.id} className="p-4 hover:shadow-md border-l-4 border-l-rose-500 bg-rose-50/20 transition-all cursor-pointer border border-slate-50 dark:border-slate-800" onClick={() => navigate(`/customers/${c.id}`)}>
                             <h4 className="font-black text-rose-800 dark:text-rose-400 text-sm xl:text-base tracking-tight uppercase truncate">{c.name}</h4>
                             <p className="text-xs xl:text-sm font-bold text-slate-500 dark:text-slate-400 line-clamp-2 italic pl-2 border-l-2 border-rose-100 dark:border-slate-800 mt-2">{c.upcomingPlan || "Action needed"}</p>
                        </Card>
                    ))}
                  </div>
                )}
                {dailySamples.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <span className="text-[11px] xl:text-xs font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Samples</span>
                    {dailySamples.map(s => (
                      <Card key={s.id} className="p-4 hover:shadow-md border-l-4 border-l-blue-500 bg-blue-50/20 transition-all cursor-pointer border border-slate-50 dark:border-slate-800 group" onClick={() => navigate(`/samples/${s.id}`)}>
                         <h4 className="font-black text-blue-800 dark:text-blue-400 text-sm xl:text-base tracking-tight uppercase truncate">{s.sampleName}</h4>
                         <p className="text-xs xl:text-sm font-bold text-slate-500 line-clamp-2 italic pl-2 border-l-2 border-blue-100 mt-1">{s.customerName}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

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

      {/* Report Trigger Card - Visual cleanup for uniformity */}
      <Card className="p-10 xl:p-12 shadow-sm flex flex-col border-2 overflow-hidden bg-white dark:bg-slate-900/40 min-h-[350px] items-center justify-center text-center">
         <div className="max-w-3xl">
            <h3 className="text-3xl xl:text-4xl font-black text-slate-900 dark:text-white uppercase mb-4 tracking-tight">
               {t('generateReport')}
            </h3>
            <p className="text-slate-500 font-bold mb-10 uppercase tracking-widest text-sm xl:text-base leading-relaxed">
               {t('reportSubtitlePrefix')}
               <span className="text-blue-600 px-1 font-black">{t(reviewStatus as any) || reviewStatus}</span>
               {t('reportSubtitleSuffix')}
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 sm:h-16">
               <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-sm min-w-[280px]">
                  <Filter size={20} className="text-blue-500 shrink-0" />
                  <select 
                     className="flex-1 bg-transparent border-none py-2 text-sm xl:text-base font-black uppercase tracking-tight outline-none cursor-pointer appearance-none text-slate-900 dark:text-white"
                     value={reviewStatus}
                     onChange={e => setReviewStatus(e.target.value)}
                  >
                     {tagOptions.sampleStatus.map(s => <option key={s} value={s}>{t(s as any) || s}</option>)}
                  </select>
                  <ChevronDown size={16} className="text-slate-400 shrink-0" />
               </div>

               <button 
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="flex items-center justify-center gap-4 px-10 bg-blue-600 text-white rounded-2xl font-black text-sm xl:text-lg uppercase tracking-widest shadow-xl shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all min-h-[64px] sm:min-h-0"
               >
                  <FileText size={22} />
                  {t('previewExportJpg')}
               </button>
            </div>
         </div>
      </Card>

      {/* Report Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
           <div className="bg-white dark:bg-slate-900 w-full max-w-[1200px] h-[95vh] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
              {/* Header UI */}
              <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-3">
                    <ImageIcon className="text-blue-600 w-6 h-6" />
                    <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-wider">{t('previewExportJpg')}</h3>
                    <Badge color="gray">{reviewGroups.length} {t('customers')}</Badge>
                 </div>
                 <div className="flex items-center gap-4">
                    <button 
                       onClick={handleExportJpg}
                       disabled={isExporting}
                       className="flex items-center gap-3 px-8 py-3 bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                       {isExporting ? <RefreshCcw className="animate-spin" size={20} /> : <Download size={20} />} 
                       {isExporting ? 'Capturing...' : t('export')}
                    </button>
                    <button onClick={() => setIsPreviewModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                       <X className="w-7 h-7 text-slate-400" />
                    </button>
                 </div>
              </div>

              {/* Content Area - Uses real scaling */}
              <div className="flex-1 overflow-y-auto p-12 bg-slate-100 dark:bg-slate-950 flex flex-col items-center">
                 <div className="bg-white shadow-2xl">
                    <div ref={reportRef} id="sample-status-report">
                       {/* Header - Strictly separated columns to prevent overlapping */}
                       <div className="border-b-[12px] border-slate-900 pb-16 mb-20" style={{ display: 'block', clear: 'both', height: 'auto', overflow: 'hidden' }}>
                          <div style={{ float: 'left', width: '650px' }}>
                             <h2 style={{ fontSize: '64px', fontWeight: '900', color: '#1d4ed8', margin: '0 0 10px 0', textTransform: 'uppercase' }}>{companyName}</h2>
                             <p style={{ fontSize: '20px', fontWeight: '900', color: '#94a3b8', letterSpacing: '8px', margin: '0', textTransform: 'uppercase' }}>{t('sampleReportTitle')}</p>
                          </div>
                          <div style={{ float: 'right', width: '300px', textAlign: 'right' }}>
                             <p style={{ fontSize: '12px', fontWeight: '900', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>Report Date</p>
                             <p style={{ fontSize: '24px', fontWeight: '900', color: '#000', margin: '0 0 25px 0' }}>{format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
                             <p style={{ fontSize: '12px', fontWeight: '900', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>Prepared By</p>
                             <p style={{ fontSize: '24px', fontWeight: '900', color: '#000', margin: '0' }}>{userName}</p>
                          </div>
                          <div style={{ clear: 'both' }}></div>
                       </div>

                       {/* Banner - Filter Context */}
                       <div className="bg-slate-100 p-12 rounded-[3rem] mb-20 border-2 border-slate-200" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: '1' }}>
                             <span style={{ fontSize: '14px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' }}>Filter Criteria</span>
                             <h4 style={{ fontSize: '36px', fontWeight: '900', marginTop: '10px', textTransform: 'uppercase' }}>Status: <span style={{ color: '#2563eb' }}>{t(reviewStatus as any) || reviewStatus}</span></h4>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                             <span style={{ fontSize: '14px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' }}>Summary</span>
                             <h4 style={{ fontSize: '36px', fontWeight: '900', marginTop: '10px', textTransform: 'uppercase' }}>{reviewGroups.length} <span style={{ color: '#94a3b8' }}>{t('customers')}</span></h4>
                          </div>
                       </div>

                       {/* Content Groups */}
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
                          {reviewGroups.map(group => (
                             <div key={group.customerId} style={{ display: 'block' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '4px solid #f1f5f9', paddingBottom: '15px', marginBottom: '30px' }}>
                                   <div style={{ width: '12px', height: '40px', backgroundColor: '#1d4ed8', borderRadius: '10px' }}></div>
                                   <h5 style={{ fontSize: '32px', fontWeight: '900', textTransform: 'uppercase', margin: '0' }}>{group.customerName}</h5>
                                </div>
                                <table className="w-full">
                                   <thead>
                                      <tr style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', color: '#64748b', backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>
                                         <th style={{ padding: '20px', textAlign: 'left', width: '60px' }}>#</th>
                                         <th style={{ padding: '20px', textAlign: 'left', width: '380px' }}>Sample Details</th>
                                         <th style={{ padding: '20px', textAlign: 'left', width: '150px' }}>Quantity</th>
                                         <th style={{ padding: '20px', textAlign: 'left' }}>Plan / Next Steps</th>
                                         <th style={{ padding: '20px', textAlign: 'right', width: '180px' }}>Key Date</th>
                                      </tr>
                                   </thead>
                                   <tbody>
                                      {group.samples.map(s => (
                                         <tr key={s.id}>
                                            <td style={{ padding: '20px', fontWeight: '900', color: '#94a3b8', fontSize: '20px' }}>{s.sampleIndex}</td>
                                            <td style={{ padding: '20px' }}>
                                               <div style={{ fontSize: '22px', fontWeight: '900', textTransform: 'uppercase', color: '#000', marginBottom: '8px' }}>{s.sampleName}</div>
                                               <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#64748b', letterSpacing: '2px' }}>{s.sampleSKU || 'NO SKU RECORD'}</div>
                                            </td>
                                            <td style={{ padding: '20px', fontWeight: '900', fontSize: '20px' }}>{s.quantity}</td>
                                            <td style={{ padding: '20px', fontStyle: 'italic', color: '#334155', fontSize: '20px' }}>
                                               {s.upcomingPlan || '-'}
                                            </td>
                                            <td style={{ padding: '20px', fontWeight: '900', textTransform: 'uppercase', textAlign: 'right', fontSize: '20px', color: '#1d4ed8' }}>
                                               {s.nextActionDate || '-'}
                                            </td>
                                         </tr>
                                      ))}
                                   </tbody>
                                </table>
                             </div>
                          ))}
                       </div>

                       {/* Footer */}
                       <div style={{ marginTop: '100px', paddingTop: '40px', borderTop: '4px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '3px' }}>
                          <span>© {companyName} • Confidential Sample Status Log</span>
                          <span style={{ fontStyle: 'italic' }}>High Definition Long Image Export</span>
                       </div>
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
