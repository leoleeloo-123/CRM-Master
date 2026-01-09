
import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Sample } from '../types';
import { Card, Badge, RankStars, getUrgencyLevel, Button, parseLocalDate } from '../components/Common';
import { AlertTriangle, Calendar as CalendarIcon, ArrowRight, Activity, FlaskConical, ChevronLeft, ChevronRight, Globe, Check, Box, Filter, Maximize2, Minimize2, ChevronDown, ChevronRight as ChevronRightSmall, ChevronUp } from 'lucide-react';
import { 
  format, isBefore, addDays, 
  endOfMonth, endOfWeek, eachDayOfInterval, 
  isSameMonth, isSameDay, addMonths, addWeeks, 
  isToday, startOfDay
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

type CalendarView = 'day' | 'week' | 'month';

interface SampleGroupInfo {
  customerId: string;
  customerName: string;
  count: number;
  dateObj: Date;
}

const DashboardCalendar: React.FC<{ customers: Customer[]; samples: Sample[] }> = ({ customers, samples }) => {
  const { t } = useApp();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
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
    if (view === 'day') setCurrentDate(addDays(currentDate, -1));
  };

  const handleNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

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
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="w-full">
         <div className="grid grid-cols-7 mb-2">
            {weekDays.map(d => (
              <div key={d} className="text-center text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest">{d}</div>
            ))}
         </div>
         <div className="grid grid-cols-7 gap-1 auto-rows-[minmax(120px,auto)]">
            {days.map(day => {
               const dayCustEvents = customerEvents.filter(e => isSameDay(e.dateObj, day));
               const dayStr = format(day, 'yyyy-MM-dd');
               const daySampleGroups = sampleGroups[dayStr] ? (Object.values(sampleGroups[dayStr]) as SampleGroupInfo[]) : [];
               const dayHolidays = checkHolidays(day);
               const isCurrentMonth = isSameMonth(day, monthStart);
               const isDayToday = isToday(day);
               const hasHoliday = dayHolidays.length > 0;
               
               return (
                 <div 
                   key={day.toISOString()} 
                   className={`p-1.5 border rounded-lg flex flex-col gap-1 transition-all ${
                     isCurrentMonth 
                       ? hasHoliday ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' 
                       : 'bg-slate-50 dark:bg-slate-900 border-transparent opacity-50'
                   } ${isDayToday ? 'ring-2 ring-blue-500 ring-inset z-10' : ''}`}
                 >
                    <div className="flex justify-between items-start h-8">
                      <div className="flex-1 overflow-hidden pr-1">
                        {dayHolidays.map((h, idx) => (
                           <div key={idx} className="text-[8px] xl:text-[9px] font-black text-slate-500/80 dark:text-slate-400 uppercase leading-none truncate whitespace-nowrap mb-0.5 bg-slate-200/50 dark:bg-slate-700/50 px-1 rounded-sm border border-slate-300/30">
                              {h.region.substring(0, 3)}: {h.name}
                           </div>
                        ))}
                      </div>
                      <span className={`text-[10px] xl:text-xs font-black px-1.5 rounded-full ${isDayToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                       {dayCustEvents.map(e => (
                          <div key={e.id} onClick={(e) => { e.stopPropagation(); navigate(`/customers/${e.id}`); }} className={`cursor-pointer rounded px-2 py-0.5 text-[0.65rem] xl:text-[0.75rem] font-black border truncate transition-all hover:scale-[1.02] hover:shadow-sm mb-1 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border-amber-200`}>
                             {e.name}
                          </div>
                       ))}
                       {daySampleGroups.map(g => (
                          <div key={g.customerId} onClick={(e) => { e.stopPropagation(); navigate(`/customers/${g.customerId}?tab=samples`); }} className="cursor-pointer rounded px-2 py-0.5 text-[0.65rem] xl:text-[0.75rem] font-black border border-blue-200 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 truncate transition-all hover:scale-[1.02] hover:shadow-sm mb-1">
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

  return (
    <Card className="p-4 xl:p-8 flex flex-col shadow-sm border-2">
       <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3">
             <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
             <h3 className="font-black text-slate-800 dark:text-white text-base xl:text-lg uppercase tracking-wider">{t('calendar')}</h3>
             <span className="text-sm xl:text-base font-black text-slate-400 ml-2">
                {format(currentDate, 'MMMM yyyy')}
             </span>
             
             <div className="relative ml-4">
                <button 
                  onClick={() => setIsHolidayMenuOpen(!isHolidayMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-[10px] font-black transition-all ${isHolidayMenuOpen ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md scale-105' : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-slate-50'}`}
                >
                   <Globe size={14} />
                   Holidays ({selectedHolidayRegions.length})
                </button>
                {isHolidayMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsHolidayMenuOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 duration-200">
                       <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Regions</span>
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
          
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl shadow-inner">
             <button onClick={() => setView('day')} className={`px-5 py-2 text-[10px] xl:text-xs font-black rounded-xl transition-all ${view === 'day' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>{t('viewDay')}</button>
             <button onClick={() => setView('week')} className={`px-5 py-2 text-[10px] xl:text-xs font-black rounded-xl transition-all ${view === 'week' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>{t('viewWeek')}</button>
             <button onClick={() => setView('month')} className={`px-5 py-2 text-[10px] xl:text-xs font-black rounded-xl transition-all ${view === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}>{t('viewMonth')}</button>
          </div>

          <div className="flex items-center gap-2">
             <button onClick={handlePrev} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 transition-all active:scale-90"><ChevronLeft className="w-5 h-5 xl:w-6 xl:h-6"/></button>
             <button onClick={handleToday} className="px-5 py-2 text-[10px] xl:text-xs font-black bg-white border-2 border-slate-100 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-sm transition-all active:scale-95">{t('today')}</button>
             <button onClick={handleNext} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 transition-all active:scale-90"><ChevronRight className="w-5 h-5 xl:w-6 xl:h-6"/></button>
          </div>
       </div>
       
       <div className="flex-1 animate-in fade-in duration-500">
          {view === 'month' && renderMonthView()}
       </div>
    </Card>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ customers, samples }) => {
  const navigate = useNavigate();
  const { t, tagOptions } = useApp();
  
  // StatusReview logic
  const [reviewStatus, setReviewStatus] = useState<string>('样品制作中');
  
  // Group samples for the review board
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

  // Default to expand all: initialize with all current group IDs
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());

  // Effect to handle "Default Expand All" when data or filter changes
  useEffect(() => {
    if (reviewGroups.length > 0) {
      setExpandedCustomers(new Set(reviewGroups.map(g => g.customerId)));
    }
  }, [reviewGroups]);

  // Priority Attention logic: Rank 1 Customers
  const priorityCustomers = useMemo(() => 
    customers.filter(c => c.rank === 1).sort((a, b) => {
      const dateA = a.nextActionDate || '9999-12-31';
      const dateB = b.nextActionDate || '9999-12-31';
      return dateA.localeCompare(dateB);
    }), [customers]
  );

  const toggleAllExpansion = () => {
    if (expandedCustomers.size === reviewGroups.length && reviewGroups.length > 0) {
      setExpandedCustomers(new Set());
    } else {
      setExpandedCustomers(new Set(reviewGroups.map(g => g.customerId)));
    }
  };

  const activeSamplesCount = samples.filter(s => !['Delivered', 'Closed', 'Feedback Received', '已送达', '已关闭', '已反馈'].includes(s.status)).length;
  const pendingFeedbackCount = samples.filter(s => ['Sent', 'Delivered', '已寄出', '已送达'].includes(s.status)).length;
  
  const iconClass = "w-6 h-6 xl:w-8 xl:h-8 shrink-0";
  const labelClass = "text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest";
  const sharedTitleClass = "font-black text-slate-800 dark:text-white text-base xl:text-lg uppercase tracking-wider flex items-center gap-3";
  // Fixed height for symmetry and controlled internal scrolling
  const sharedCardClass = "p-6 xl:p-8 shadow-sm flex flex-col border-2 overflow-hidden bg-white dark:bg-slate-900/40 h-[700px]";

  return (
    <div className="space-y-8 xl:space-y-12 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl xl:text-4xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">CRM Master</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm xl:text-lg font-bold tracking-tight">Welcome back</p>
        </div>
        <div className="text-sm xl:text-lg text-slate-400 font-black">
          Today: <span className="text-slate-900 dark:text-white">{format(new Date(), 'MMMM do, yyyy')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 xl:gap-8">
        <Card className="p-5 xl:p-8 flex items-center gap-5 xl:gap-8 border-l-4 border-l-blue-500 shadow-sm border-2">
          <div className="p-3 xl:p-5 bg-blue-50 dark:bg-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100">
            <Activity className={iconClass} />
          </div>
          <div>
            <p className={labelClass + " mb-1.5"}>{t('totalCustomers')}</p>
            <p className="text-3xl xl:text-5xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{customers.length}</p>
          </div>
        </Card>
        <Card className="p-5 xl:p-8 flex items-center gap-5 xl:gap-8 border-l-4 border-l-amber-500 shadow-sm border-2">
          <div className="p-3 xl:p-5 bg-amber-50 dark:bg-amber-900/50 rounded-2xl text-amber-600 dark:text-amber-400 shadow-sm border border-amber-100">
            <FlaskConical className={iconClass} />
          </div>
          <div>
            <p className={labelClass + " mb-1.5"}>{t('activeSamples')}</p>
            <p className="text-3xl xl:text-5xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{activeSamplesCount}</p>
          </div>
        </Card>
        <Card className="p-5 xl:p-8 flex items-center gap-5 xl:gap-8 border-l-4 border-l-purple-500 shadow-sm border-2">
          <div className="p-3 xl:p-5 bg-purple-50 dark:bg-purple-900/50 rounded-2xl text-purple-600 dark:text-purple-400 shadow-sm border border-purple-100">
            <CalendarIcon className={iconClass} />
          </div>
          <div>
            <p className={labelClass + " mb-1.5"}>{t('pendingFeedback')}</p>
            <p className="text-3xl xl:text-5xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{pendingFeedbackCount}</p>
          </div>
        </Card>
        <Card className="p-5 xl:p-8 flex items-center gap-5 xl:gap-8 border-l-4 border-l-red-500 shadow-sm border-2">
          <div className="p-3 xl:p-5 bg-red-50 dark:bg-red-900/50 rounded-2xl text-red-600 dark:text-red-400 shadow-sm border border-blue-100">
            <AlertTriangle className={iconClass} />
          </div>
          <div>
            <p className={labelClass + " mb-1.5"}>{t('criticalActions')}</p>
            <p className="text-3xl xl:text-5xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{priorityCustomers.length}</p>
          </div>
        </Card>
      </div>

      <div className="w-full">
         <DashboardCalendar customers={customers} samples={samples} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
        {/* Left Column: Priority Attention (Customers Only) */}
        <Card className={sharedCardClass}>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50 dark:border-slate-800">
            <h3 className={sharedTitleClass}>
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              {t('priorityAttention')}
            </h3>
            <button 
              onClick={() => navigate('/customers')} 
              className="text-xs font-black text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1.5 group transition-colors uppercase tracking-widest"
            >
              {t('viewAll')} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
            {priorityCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] opacity-30">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">No Priority Items</span>
              </div>
            ) : (
              priorityCustomers.map(c => { 
                const urgency = getUrgencyLevel(c.nextActionDate);
                const colorBorder = urgency === 'urgent' ? 'border-l-red-500' : urgency === 'warning' ? 'border-l-amber-500' : 'border-l-emerald-500';
                const dateColor = urgency === 'urgent' ? "text-red-600 dark:text-red-500 font-black" : urgency === 'warning' ? "text-amber-600 dark:text-amber-500 font-black" : "text-slate-400";

                return (
                  <Card key={c.id} className={`p-5 hover:shadow-lg border-l-4 transition-all cursor-pointer border border-slate-100 dark:border-slate-800 group hover:-translate-y-1 ${colorBorder}`} onClick={() => navigate(`/customers/${c.id}`)}>
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                         <div>
                            <h4 className="font-black text-slate-900 dark:text-white text-base group-hover:text-blue-600 transition-colors tracking-tight leading-tight uppercase">{c.name}</h4>
                            <div className="mt-2 text-[0.8em]"><RankStars rank={c.rank} /></div>
                         </div>
                         <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${dateColor}`}>
                           <CalendarIcon className="w-3.5 h-3.5" />
                           <span>{c.nextActionDate ? format(parseLocalDate(c.nextActionDate), 'MMM d') : 'N/A'}</span>
                         </div>
                      </div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed italic border-l-2 border-slate-50 dark:border-slate-800 pl-4">
                         {c.upcomingPlan || "Update required"}
                      </p>
                      <div className="flex justify-between items-center">
                         <Badge color={c.status === 'Active' ? 'green' : 'gray'}>{c.status}</Badge>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.region.join(', ')}</span>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Column: Status Summary */}
        <Card className={sharedCardClass}>
           <div className="flex flex-col gap-6 mb-8 pb-4 border-b border-slate-50 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className={sharedTitleClass}>
                   <FlaskConical className="w-6 h-6 text-blue-600" />
                   {t('statusReview')}
                </h3>
                <button 
                  onClick={toggleAllExpansion}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest hover:border-blue-300 transition-all active:scale-95"
                >
                   {expandedCustomers.size === reviewGroups.length && reviewGroups.length > 0 ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                   {expandedCustomers.size === reviewGroups.length && reviewGroups.length > 0 ? 'Collapse All' : 'Expand All'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                    <Filter size={14} />
                 </div>
                 <select 
                    className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-black uppercase tracking-tight outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    value={reviewStatus}
                    onChange={e => setReviewStatus(e.target.value)}
                 >
                    {tagOptions.sampleStatus.map(s => <option key={s} value={s}>{t(s as any) || s}</option>)}
                 </select>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
              {reviewGroups.map(group => {
                const isExpanded = expandedCustomers.has(group.customerId);
                return (
                  <div key={group.customerId} className="space-y-2">
                    <div 
                      onClick={() => setExpandedCustomers(prev => {
                         const next = new Set(prev);
                         if (next.has(group.customerId)) next.delete(group.customerId);
                         else next.add(group.customerId);
                         return next;
                      })}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                         {isExpanded ? <ChevronDown size={18} className="text-slate-400 shrink-0" /> : <ChevronRightSmall size={18} className="text-slate-400 shrink-0" />}
                         <span className="font-black text-sm text-slate-900 dark:text-white uppercase truncate tracking-tight">{group.customerName}</span>
                      </div>
                      <Badge color="gray">{group.samples.length}</Badge>
                    </div>

                    {isExpanded && (
                      <div className="pl-4 space-y-3 border-l-2 border-blue-100 dark:border-blue-900/40 ml-2 animate-in slide-in-from-top-2 duration-300">
                        {group.samples.map(s => {
                           const urgency = getUrgencyLevel(s.nextActionDate);
                           const colorBorder = urgency === 'urgent' ? 'border-l-red-500' : urgency === 'warning' ? 'border-l-amber-500' : 'border-l-emerald-500';
                           return (
                             <Card 
                               key={s.id} 
                               onClick={() => navigate(`/samples/${s.id}`)}
                               className={`p-4 cursor-pointer hover:shadow-lg border-l-4 transition-all hover:-translate-y-1 bg-white dark:bg-slate-800 ${colorBorder}`}
                             >
                                <div className="flex justify-between items-start mb-2">
                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{s.sampleIndex}</span>
                                   <div className="text-[10px] font-black text-blue-600 uppercase">
                                      DDL: {s.nextActionDate || 'TBD'}
                                   </div>
                                </div>
                                <p className="text-sm font-black text-slate-800 dark:text-white leading-snug line-clamp-1 uppercase tracking-tight">{s.sampleName}</p>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 dark:border-slate-700">
                                   <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px] uppercase">{s.sampleSKU || 'NOSKU'}</span>
                                   <span className="text-xs font-black text-slate-700 dark:text-slate-300">Qty: {s.quantity}</span>
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
                <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] opacity-30">
                   <Box size={40} className="text-slate-400 mb-2" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">No Samples Found</span>
                </div>
              )}
           </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
