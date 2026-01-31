
import React, { useState, useRef } from 'react';
import { Customer, Sample, Rank, SampleStatus, CustomerStatus, FollowUpStatus, ProductCategory, ProductForm, Interaction, CrystalType, GradingStatus, TestStatus, SampleDocLink, Exhibition, MailingInfo } from '../types';
import { Card, Button, Badge, Modal, RankStars } from '../components/Common';
import { Download, Upload, FileText, AlertCircle, CheckCircle2, Users, FlaskConical, Search, X, Trash2, RefreshCcw, FileSpreadsheet, Eye, ClipboardList, Presentation, ChevronDown, Database, Info } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { differenceInDays, isValid, format } from 'date-fns';
import * as XLSX from 'xlsx';
import { getCanonicalTag, translateToZh } from '../utils/i18n';

interface DataManagementProps {
  onImportCustomers: (newCustomers: Customer[], override?: boolean) => void;
  onImportSamples: (newSamples: Sample[], override?: boolean) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ 
  onImportCustomers, 
  onImportSamples
}) => {
  const { t, clearDatabase, customers, samples, exhibitions, setExhibitions, syncSampleToCatalog, companyName, userName, refreshTagsFromSamples } = useApp();
  const [activeTab, setActiveTab] = useState<'customers' | 'samples' | 'exhibitions'>('customers');
  const [viewMode, setViewMode] = useState<'import' | 'review'>('import');
  
  // Text Import State
  const [importData, setImportData] = useState('');
  
  // Excel Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelPreview, setExcelPreview] = useState<{ customers: Customer[], samples: Sample[], exhibitions: Exhibition[] } | null>(null);

  // Common Preview State
  const [parsedPreview, setParsedPreview] = useState<any[] | null>(null);
  const [importStatus, setImportStatus] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('replace');

  // --- HELPERS ---

  const toggleReviewMode = () => {
    setViewMode(prev => prev === 'import' ? 'review' : 'import');
  };

  const clearPreview = () => {
    setParsedPreview(null);
    setExcelPreview(null);
    setImportData('');
    setImportStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const splitByDelimiter = (str: string | undefined): string[] => {
    if (!str) return [];
    return String(str).split('|||').map(s => s.trim()).filter(s => s.length > 0);
  };

  const normalizeDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const trimmed = String(dateStr).trim();
    if (!trimmed) return '';
    const bracketMatch = trimmed.match(/【(.*?)】/);
    if (bracketMatch) return normalizeDate(bracketMatch[1]);
    if (!isNaN(Number(trimmed)) && Number(trimmed) > 20000) {
        const date = new Date(Math.round((Number(trimmed) - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
    }
    const yearFirstMatch = trimmed.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
    if (yearFirstMatch) return `${yearFirstMatch[1]}-${yearFirstMatch[2].padStart(2, '0')}-${yearFirstMatch[3].padStart(2, '0')}`;
    const dateObj = new Date(trimmed);
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getFullYear();
      const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const d = dateObj.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return trimmed;
  };

  const mapStatusFromImport = (status: string): FollowUpStatus => {
    const s = status ? String(status).trim() : '';
    if (s === '我方跟进' || s === 'My Turn') return 'My Turn';
    if (s === '等待对方' || s === 'Waiting for Customer') return 'Waiting for Customer';
    return 'No Action'; 
  };

  const mapStatusToExport = (status: string | undefined): string => {
    if (!status) return '暂无';
    return translateToZh(status);
  };

  const rowToCustomer = (cols: any[], tempIdPrefix: string): Customer => {
    const safeCol = (i: number) => cols[i] !== undefined && cols[i] !== null ? String(cols[i]).trim() : '';
    const name = safeCol(0) || 'Unknown';
    const regions = splitByDelimiter(safeCol(1));
    const cleanTags = splitByDelimiter(safeCol(2));
    const rank = (parseInt(safeCol(4)) || 3) as Rank;
    const productSummary = (safeCol(5) || '').replace(/\|\|\|/g, '\n');
    const lastStatusUpdate = normalizeDate(safeCol(6));
    const followUpStatus = mapStatusFromImport(safeCol(9));
    const upcomingPlan = safeCol(10) || '';
    const nextActionDate = normalizeDate(safeCol(11));
    const lastCustomerReplyDate = normalizeDate(safeCol(14));
    const lastMyReplyDate = normalizeDate(safeCol(16));
    const titles = splitByDelimiter(safeCol(20));
    const urls = splitByDelimiter(safeCol(21));
    let docLinks: SampleDocLink[] = [];
    if (urls.length > 0) {
      docLinks = titles.map((t, idx) => ({ title: t || `Link ${idx + 1}`, url: urls[idx] || '#' }));
    } else {
      const legacyLinks = splitByDelimiter(safeCol(18));
      docLinks = legacyLinks.map((entry, idx) => {
        if (entry.includes(': ')) {
          const [t, u] = entry.split(': ');
          return { title: t, url: u };
        }
        return { title: `Link ${idx + 1}`, url: entry };
      });
    }
    const contactNames = splitByDelimiter(safeCol(8));
    const contactInfos = splitByDelimiter(safeCol(19));
    const contacts = contactNames.map((cName, i) => {
       const info = contactInfos[i] || '';
       const isEmail = info.includes('@');
       let cleanName = cName.trim();
       let isPrimary = cleanName.includes('【主要联系人】');
       if (isPrimary) cleanName = cleanName.replace('【主要联系人】', '');
       let title = '';
       const titleMatch = cleanName.match(/\((.*?)\)/);
       if (titleMatch) {
           title = titleMatch[1].trim();
           cleanName = cleanName.replace(titleMatch[0], '');
       }
       return { name: cleanName.trim(), title: title, isPrimary: isPrimary, email: isEmail ? info : '', phone: !isEmail ? info : '' };
    });
    const rawInteractions = splitByDelimiter(safeCol(13));
    const interactions: Interaction[] = rawInteractions.map((raw, i) => {
       const dateMatch = raw.match(/【(.*?)】/);
       let date = lastMyReplyDate || new Date().toISOString().split('T')[0];
       let summary = raw;
       if (dateMatch) {
         date = normalizeDate(dateMatch[1]);
         summary = raw.replace(/^[\s\-\.\*]*【.*?】/, '').trim();
       } else {
         summary = raw.replace(/^[\s\-\.\*]+/, '').trim();
       }
       return { id: `int_${tempIdPrefix}_${i}`, date: date, summary: summary };
    }).reverse();
    
    const mParts = splitByDelimiter(safeCol(22));
    const mailingInfo: MailingInfo = {
      recipient: mParts[0] || '',
      phone: mParts[1] || '',
      company: mParts[2] || '',
      address: mParts[3] || ''
    };

    return { id: `new_c_${tempIdPrefix}`, name: name, region: regions.length > 0 ? regions : ['Unknown'], tags: cleanTags, rank: rank, productSummary: productSummary, lastStatusUpdate: lastStatusUpdate, followUpStatus: followUpStatus, nextActionDate: nextActionDate, upcomingPlan: upcomingPlan, lastCustomerReplyDate: lastCustomerReplyDate, lastMyReplyDate: lastMyReplyDate, lastContactDate: lastMyReplyDate, contacts: contacts, docLinks: docLinks, status: 'Active' as CustomerStatus, interactions: interactions, mailingInfo: mailingInfo } as Customer;
  };

  const rowToSample = (cols: any[], tempIdPrefix: string, indexMap: Map<string, number>, lookupCustomers: Customer[]): Sample => {
    const safeCol = (i: number) => cols[i] !== undefined && cols[i] !== null ? String(cols[i]).trim() : '';
    const custName = safeCol(0) || 'Unknown';
    const matchedCustomer = lookupCustomers.find(c => c.name.toLowerCase() === custName.toLowerCase());
    const lowerCustName = custName.toLowerCase();
    let nextIndex = (indexMap.get(lowerCustName) || 0) + 1;
    indexMap.set(lowerCustName, nextIndex);
    
    // Status normalization - Ensure we get the Canonical Key (The Chinese string used by board)
    const rawStatus = safeCol(1);
    const status = getCanonicalTag(rawStatus) as SampleStatus || '等待中';
    
    const crystal = getCanonicalTag(safeCol(3)) || '';
    const form = getCanonicalTag(safeCol(5)) || '微粉';
    const categories = safeCol(4) ? safeCol(4).split(',').map(c => getCanonicalTag(c.trim()) as ProductCategory) : [];
    
    const testFinishedColVal = (safeCol(2) || '').trim().toLowerCase();
    let testStatus: TestStatus = 'Ongoing';
    if (['yes', 'finished', '测试完成', 'true', '1', '是', '完成'].includes(testFinishedColVal)) testStatus = 'Finished';
    else if (['terminated', '终止', '项目终止', '放弃', 'canceled'].includes(testFinishedColVal)) testStatus = 'Terminated';
    
    const titles = splitByDelimiter(safeCol(19));
    const urls = splitByDelimiter(safeCol(20));
    let docLinks: SampleDocLink[] = [];
    if (urls.length > 0) docLinks = titles.map((t, idx) => ({ title: t || `Link ${idx + 1}`, url: urls[idx] || '#' }));
    else docLinks = titles.map((entry, idx) => {
        if (entry.includes(': ')) { const [t, u] = entry.split(': '); return { title: t, url: u }; }
        return { title: `Link ${idx + 1}`, url: entry };
    });
    
    const genName = `${crystal} ${categories.join(', ')} ${form} - ${safeCol(6)}${safeCol(7) ? ` > ${safeCol(7)}` : ''}${safeCol(21) ? ` (${safeCol(21)})` : ''}`.trim();
    
    // Fee Information Parsing
    const rawPaidValue = safeCol(23).toLowerCase();
    const otherFeeFields = [24, 25, 26, 27, 28, 29, 30, 31, 32, 33];
    const hasAnyFeeDetail = otherFeeFields.some(idx => safeCol(idx) !== '');
    const isPaid = ['yes', 'paid', 'true', '1', '付费', '是'].includes(rawPaidValue) || hasAnyFeeDetail;

    return { 
      id: `new_s_${tempIdPrefix}`, customerId: matchedCustomer ? matchedCustomer.id : 'unknown', customerName: custName, sampleIndex: nextIndex, status: status, testStatus: testStatus, crystalType: crystal as CrystalType, productCategory: categories, productForm: form as ProductForm, originalSize: safeCol(6), processedSize: safeCol(7), nickname: safeCol(21), 
      isStarredSample: ['yes', 'paid', 'true', '1', '付费', '是', 'yes'].includes((safeCol(22) || '').toLowerCase()), 
      isGraded: (safeCol(8) as GradingStatus) || 'Graded', sampleSKU: safeCol(9), sampleDetails: safeCol(10), quantity: safeCol(11), application: safeCol(12), lastStatusDate: normalizeDate(safeCol(13)) || new Date().toISOString().split('T')[0], statusDetails: safeCol(15), trackingNumber: safeCol(16), sampleName: genName, requestDate: new Date().toISOString().split('T')[0], upcomingPlan: safeCol(17), nextActionDate: normalizeDate(safeCol(18)), docLinks: docLinks,
      // Fee fields import
      isPaid: isPaid,
      feeCategory: safeCol(24) || (isPaid ? translateToZh('defaultFeeCategory') : ''),
      feeType: safeCol(25) || (isPaid ? translateToZh('income') : ''),
      actualUnitPrice: safeCol(26),
      standardUnitPrice: safeCol(27),
      originationDate: normalizeDate(safeCol(28)),
      transactionDate: normalizeDate(safeCol(29)),
      feeStatus: safeCol(30),
      currency: safeCol(31),
      balance: safeCol(32),
      feeComment: safeCol(33)
    } as Sample;
  };

  const rowToExhibition = (cols: any[], tempIdPrefix: string): Exhibition => {
    const safeCol = (i: number) => cols[i] !== undefined && cols[i] !== null ? String(cols[i]).trim() : '';
    return { id: `new_ex_${tempIdPrefix}`, name: safeCol(0) || 'Unnamed Event', date: normalizeDate(safeCol(1)), location: safeCol(2) || 'TBD', link: safeCol(3) || '#', eventSeries: safeCol(4) ? safeCol(4).split('|||').map(s => s.trim()) : [], summary: safeCol(5) || '' };
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const custHeaders = ["客户", "地区", "展会", "展会官网", "等级", "状态与产品总结", "状态更新", "未更新", "对接人员", "状态", "下一步", "关键日期", "DDL", "对接流程总结", "对方回复", "未回复", "我方跟进", "未跟进", "文档超链接", "联系方式", "File Link Titles", "File link URLs", "邮寄信息"];
    const custRows = customers.map(c => {
      const mailingStr = c.mailingInfo ? [c.mailingInfo.recipient, c.mailingInfo.phone, c.mailingInfo.company, c.mailingInfo.address].join(' ||| ') : '';
      return [c.name, Array.isArray(c.region) ? c.region.join(' ||| ') : c.region, c.tags.join(' ||| '), "", c.rank, (c.productSummary || '').replace(/\n/g, ' ||| '), c.lastStatusUpdate, "", c.contacts.map(ct => `${ct.name}${ct.title?` (${ct.title})`:''}${ct.isPrimary?' 【主要联系人】':''}`).join(' ||| '), mapStatusToExport(c.followUpStatus), c.upcomingPlan || '', c.nextActionDate, "", [...c.interactions].reverse().map(i => `【${i.date}】 ${i.summary}`).join(' ||| '), c.lastCustomerReplyDate, "", c.lastMyReplyDate, "", c.docLinks ? c.docLinks.map(l => `${l.title}: ${l.url}`).join(' ||| ') : '', c.contacts.map(ct => ct.email || ct.phone || '').join(' ||| '), (c.docLinks || []).map(l => l.title).join(' ||| '), (c.docLinks || []).map(l => l.url).join(' ||| '), mailingStr];
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([custHeaders, ...custRows]), "Customers");
    
    const sampHeaders = ["1.Customer", "2.Status", "3.Test Finished", "4.Crystal Type", "5.Sample Category", "6.Form", "7.Original Size", "8.Processed Size", "9.Is Graded", "10.Sample SKU", "11.Details", "12.Quantity", "13.Customer Application", "14.Status Date", "15.Days Since Update", "16.Status Details", "17.Tracking #", "18.Next Step", "19.Key Date", "20.File Link Titles", "21.File Link URLs", "22.Nickname", "23.Starred", "24.Is Paid", "25.Fee Category", "26.Fee Type", "27.Actual Unit Price", "28.Standard Unit Price", "29.Origination Date", "30.Transaction Date", "31.Fee Status", "32.Currency", "33.Balance", "34.Fee Comment"];
    const sampRows = samples.map(s => [
      s.customerName, 
      translateToZh(s.status || ''), 
      s.testStatus === 'Finished' ? '完成' : s.testStatus === 'Terminated' ? '项目终止' : '未完成', 
      translateToZh(s.crystalType || ''), 
      (s.productCategory || []).map(c => translateToZh(c)).join(', '), 
      translateToZh(s.productForm || ''), 
      s.originalSize, 
      s.processedSize, 
      translateToZh(s.isGraded || ''), 
      s.sampleSKU, 
      s.sampleDetails, 
      s.quantity, 
      s.application, 
      s.lastStatusDate, 
      s.lastStatusDate ? String(differenceInDays(new Date(), new Date(s.lastStatusDate))) : "", 
      (s.statusDetails || '').replace(/\n/g, ' ||| '), 
      s.trackingNumber, 
      s.upcomingPlan || '', 
      s.nextActionDate || '', 
      (s.docLinks || []).map(l => l.title).join(' ||| '), 
      (s.docLinks || []).map(l => l.url).join(' ||| '), 
      s.nickname || '', 
      s.isStarredSample ? 'True' : 'False',
      s.isPaid ? 'Yes' : 'No',
      s.feeCategory || '',
      s.feeType || '',
      s.actualUnitPrice || '',
      s.standardUnitPrice || '',
      s.originationDate || '',
      s.transactionDate || '',
      s.feeStatus || '',
      s.currency || '',
      s.balance || '',
      s.feeComment || ''
    ]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([sampHeaders, ...sampRows]), "Samples");
    
    const exhHeaders = ["Name", "Date", "Location", "Link", "Event Series", "Summary"];
    const exhRows = exhibitions.map(e => [e.name, e.date, e.location, e.link, (e.eventSeries || []).join(' ||| '), e.summary || '']);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([exhHeaders, ...exhRows]), "Exhibitions");
    XLSX.writeFile(wb, `Master TB_${companyName.replace(/[^a-z0-9]/gi, '_')}_${userName.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const pCust = wb.Sheets['Customers'] ? XLSX.utils.sheet_to_json(wb.Sheets['Customers'], { header: 1 }).slice(1).filter((r: any) => r.length > 0).map((row: any) => rowToCustomer(row, Math.random().toString(36).substr(2, 9))) : [];
        const indexMap = new Map<string, number>();
        if (importMode === 'merge') samples.forEach(s => { const cur = indexMap.get(s.customerName.toLowerCase()) || 0; if (s.sampleIndex > cur) indexMap.set(s.customerName.toLowerCase(), s.sampleIndex); });
        const pSamp = wb.Sheets['Samples'] ? XLSX.utils.sheet_to_json(wb.Sheets['Samples'], { header: 1 }).slice(1).filter((r: any) => r.length > 0).map((row: any) => rowToSample(row, Math.random().toString(36).substr(2, 9), indexMap, [...pCust, ...customers])) : [];
        const pExh = wb.Sheets['Exhibitions'] ? XLSX.utils.sheet_to_json(wb.Sheets['Exhibitions'], { header: 1 }).slice(1).filter((r: any) => r.length > 0).map((row: any) => rowToExhibition(row, Math.random().toString(36).substr(2, 9))) : [];
        if (!pCust.length && !pSamp.length && !pExh.length) { setImportStatus({ type: 'error', message: 'No valid data found.' }); return; }
        setExcelPreview({ customers: pCust, samples: pSamp, exhibitions: pExh });
        setParsedPreview(activeTab === 'customers' ? pCust : activeTab === 'samples' ? pSamp : pExh);
        setImportStatus({ type: 'info', message: `File Loaded. Found: ${pCust.length} Customers, ${pSamp.length} Samples, ${pExh.length} Events.` });
      } catch (err) { setImportStatus({ type: 'error', message: 'Failed to read Excel file.' }); }
    };
    reader.readAsBinaryString(file);
  };

  const parsePasteData = () => {
    if (!importData.trim()) { setImportStatus({ type: 'error', message: 'Please paste data.' }); return; }
    try {
      const parsed = importData.trim().split('\n').filter(r => r.trim() !== '').map((row) => {
        const cols = row.split('\t').map(c => c.trim());
        const tid = Math.random().toString(36).substr(2, 9);
        if (activeTab === 'customers') return rowToCustomer(cols, tid);
        if (activeTab === 'samples') { const im = new Map(); if (importMode === 'merge') samples.forEach(s => im.set(s.customerName.toLowerCase(), Math.max(im.get(s.customerName.toLowerCase()) || 0, s.sampleIndex))); return rowToSample(cols, tid, im, customers); }
        return rowToExhibition(cols, tid);
      });
      setParsedPreview(parsed);
      setImportStatus({ type: 'info', message: `Previewing ${parsed.length} rows.` });
    } catch (e) { setImportStatus({ type: 'error', message: 'Parsing failed.' }); }
  };

  const confirmImport = () => {
    const override = importMode === 'replace';
    if (excelPreview) {
       if (excelPreview.customers.length) onImportCustomers(excelPreview.customers, override);
       if (excelPreview.samples.length) { excelPreview.samples.forEach(s => syncSampleToCatalog(s)); onImportSamples(excelPreview.samples, override); refreshTagsFromSamples(excelPreview.samples, override); }
       if (excelPreview.exhibitions.length) setExhibitions(prev => override ? excelPreview.exhibitions : [...prev, ...excelPreview.exhibitions]);
       setImportStatus({ type: 'success', message: 'Excel import complete.' });
    } else if (parsedPreview) {
       if (activeTab === 'customers') onImportCustomers(parsedPreview, override);
       else if (activeTab === 'samples') { parsedPreview.forEach(s => syncSampleToCatalog(s)); onImportSamples(parsedPreview, override); refreshTagsFromSamples(parsedPreview, override); }
       else if (activeTab === 'exhibitions') setExhibitions(prev => override ? parsedPreview : [...prev, ...parsedPreview]);
       setImportStatus({ type: 'success', message: `Imported ${parsedPreview.length} records.` });
    }
    setParsedPreview(null); setExcelPreview(null); setImportData(''); if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderCurrentDataTable = () => {
    const data = activeTab === 'customers' ? customers : activeTab === 'samples' ? samples : exhibitions;
    return (
      <div className="overflow-hidden border-2 rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="bg-slate-100 dark:bg-slate-800/80 p-5 border-b-2 border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
             <Database className="w-5 h-5 text-blue-600" /> Database Review: {activeTab} ({data.length})
          </h3>
          <Button variant="secondary" onClick={() => setViewMode('import')} className="text-xs py-2 px-6">Back to Import</Button>
        </div>
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase text-[10px] font-black tracking-widest sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
              <tr>
                {activeTab === 'customers' ? (
                  <><th className="p-4 pl-6">Name</th><th className="p-4">Rank</th><th className="p-4">Region</th><th className="p-4">Summary</th><th className="p-4">Status</th><th className="p-4">Next</th><th className="p-4">Contacts</th><th className="p-4 pr-6">Date</th></>
                ) : activeTab === 'samples' ? (
                  <><th className="p-4 pl-6">Customer</th><th className="p-4">Idx</th><th className="p-4">Name</th><th className="p-4">Specs</th><th className="p-4">Qty</th><th className="p-4">Status</th><th className="p-4">Test</th><th className="p-4">Paid</th><th className="p-4">Balance</th><th className="p-4 pr-6">Next</th></>
                ) : (
                  <><th className="p-4 pl-6">Name</th><th className="p-4">Date</th><th className="p-4">Location</th><th className="p-4">Link</th><th className="p-4">Series</th><th className="p-4 pr-6">Summary</th></>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              {data.map((row: any, idx) => (
                <tr key={idx} className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-colors">
                  {activeTab === 'customers' ? (
                    <><td className="p-4 pl-6 text-blue-600 font-black uppercase">{row.name}</td><td className="p-4"><RankStars rank={row.rank} /></td><td className="p-4 text-[10px]">{Array.isArray(row.region) ? row.region.join(', ') : row.region}</td><td className="p-4 truncate max-w-[150px] italic">{row.productSummary}</td><td className="p-4"><Badge color="blue">{row.followUpStatus}</Badge></td><td className="p-4 truncate max-w-[120px]">{row.upcomingPlan}</td><td className="p-4 text-[10px] uppercase">{row.contacts?.map((c:any) => c.name).join(', ')}</td><td className="p-4 pr-6 whitespace-nowrap">{row.lastStatusUpdate}</td></>
                  ) : activeTab === 'samples' ? (
                    <><td className="p-4 pl-6 uppercase text-slate-400">{row.customerName}</td><td className="p-4">{row.sampleIndex}</td><td className="p-4 font-black text-blue-600 uppercase">{row.sampleName}</td><td className="p-4 text-[9px] uppercase"><div>{row.crystalType}/{row.productForm}</div><div>{row.originalSize}{" -> "}{row.processedSize}</div></td><td className="p-4 font-black">{row.quantity}</td><td className="p-4"><Badge color="blue">{row.status}</Badge></td><td className="p-4"><Badge color={row.testStatus==='Finished'?'green':row.testStatus==='Terminated'?'red':'yellow'}>{row.testStatus}</Badge></td><td className="p-4">{row.isPaid ? 'Yes' : 'No'}</td><td className="p-4 text-amber-600 font-black">{row.balance || '-'}</td><td className="p-4 pr-6 italic truncate max-w-[120px]">{row.upcomingPlan}</td></>
                  ) : (
                    <><td className="p-4 pl-6 font-black uppercase text-blue-600">{row.name}</td><td className="p-4 whitespace-nowrap">{row.date}</td><td className="p-4">{row.location}</td><td className="p-4 text-blue-500 underline text-[10px]">{row.link}</td><td className="p-4 text-[10px] uppercase">{row.eventSeries?.join(', ')}</td><td className="p-4 pr-6 truncate max-w-[150px] italic">{row.summary}</td></>
                  )}
                </tr>
              ))}
              {!data.length && <tr><td colSpan={12} className="p-20 text-center text-slate-300 font-black uppercase tracking-widest italic opacity-40">Database is empty.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl xl:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('dataManagement')}</h2>
          <p className="text-sm xl:text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">{t('dataManagementDesc')}</p>
        </div>
        <div className="flex gap-4">
           <button onClick={toggleReviewMode} className={`p-3 rounded-xl border-2 transition-all active:scale-90 bg-white dark:bg-slate-900 shadow-sm ${viewMode === 'review' ? 'border-indigo-200 text-indigo-600 bg-indigo-50' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:text-indigo-600'}`}>
              {viewMode === 'review' ? <ClipboardList size={20} /> : <Eye size={20} />}
           </button>
           <Button onClick={() => { setViewMode('import'); fileInputRef.current?.click(); }} className="flex items-center gap-2 px-8 py-3 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all bg-blue-600 text-white">
              <Upload size={20} /> <span className="font-black uppercase tracking-widest text-sm">Upload Excel</span>
           </Button>
           <Button variant="secondary" onClick={handleExportExcel} className="flex items-center gap-2 px-8 py-3 rounded-2xl shadow-sm border-emerald-600 text-emerald-700 hover:bg-emerald-50 active:scale-95">
              <FileSpreadsheet size={20} /> <span className="font-black uppercase tracking-widest text-sm">Export Excel</span>
           </Button>
           <Button variant="danger" className="flex items-center gap-2 px-8 py-3 rounded-2xl shadow-sm active:scale-95" onClick={() => setIsClearModalOpen(true)}>
             <Trash2 size={20} /> <span className="font-black uppercase tracking-widest text-sm">Clear DB</span>
           </Button>
           <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
        </div>
      </div>

      <Card className="p-0 border-2 rounded-3xl overflow-hidden shadow-sm">
        <div className="flex border-b-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
           {[
             { id: 'customers', icon: <Users size={20} />, label: 'Customers' },
             { id: 'samples', icon: <FlaskConical size={20} />, label: 'Samples' },
             { id: 'exhibitions', icon: <Presentation size={20} />, label: 'Exhibitions' }
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => { setActiveTab(tab.id as any); setParsedPreview(excelPreview ? (excelPreview as any)[tab.id] : null); if (!excelPreview) setImportData(''); }}
               className={`flex-1 py-5 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm transition-all relative ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'}`}
             >
               {tab.icon} {tab.label}
               {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />}
             </button>
           ))}
        </div>

        <div className="p-8">
          {viewMode === 'review' ? renderCurrentDataTable() : (
            <div className="space-y-8">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800 space-y-4">
                 <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3 ml-1">
                   <Info size={18} className="text-blue-500" /> Instructions
                 </h4>
                 
                 <div className="flex items-stretch gap-4 h-12 xl:h-14">
                   <div className="w-[70%] flex items-center px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                      <p className="font-mono text-[10px] xl:text-xs font-bold text-slate-500 dark:text-slate-400 truncate whitespace-nowrap">
                        {activeTab === 'customers' 
                          ? "1.客户 | 2.地区 | 3.展会 | 4.官网 | 5.等级 | 6.产品总结 | 7.更新日期 | 8.NA | 9.人员 | 10.状态 | 11.下一步 | 12.关键日期 | 13.NA | 14.流程总结 | 15.对方回复 | 16.NA | 17.我方跟进 | 18.NA | 19.NA | 20.联系方式 | 21.Titles | 22.URLs | 23.邮寄信息"
                          : activeTab === 'samples'
                          ? "1.Customer | ... | 23.Starred | 24.Paid | 25.FeeCat | 26.Type | 27.ActualPrice | 28.StdPrice | 29.OrigDate | 30.TransDate | 31.FeeStatus | 32.Currency | 33.Balance | 34.Comment"
                          : "1.Name | 2.Date | 3.Location | 4.Link | 5.Event Series | 6.Summary"
                        }
                      </p>
                   </div>
                   
                   <div className="w-[30%] flex items-stretch gap-3">
                     {!parsedPreview ? (
                       <>
                        <div className="flex-[2] flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border-2 border-slate-100 dark:border-slate-700 shadow-inner">
                          <button onClick={() => setImportMode('merge')} className={`flex-1 h-full text-[10px] xl:text-xs font-black uppercase tracking-widest rounded-lg transition-all ${importMode === 'merge' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Merge</button>
                          <button onClick={() => setImportMode('replace')} className={`flex-1 h-full text-[10px] xl:text-xs font-black uppercase tracking-widest rounded-lg transition-all ${importMode === 'replace' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Replace</button>
                        </div>
                        <div className="flex-1 flex items-stretch p-1">
                           <button 
                             onClick={parsePasteData} 
                             className="w-full bg-blue-600 text-white rounded-lg shadow-xl shadow-blue-600/20 active:scale-95 font-black uppercase tracking-widest text-[10px] xl:text-xs flex items-center justify-center"
                           >
                             Parse Text Paste
                           </button>
                        </div>
                       </>
                     ) : (
                       <>
                        <div className="flex-1 flex items-stretch p-1">
                           <button 
                             onClick={clearPreview} 
                             className="w-full rounded-lg font-black uppercase tracking-widest text-[10px] xl:text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all active:scale-95"
                           >
                             Cancel
                           </button>
                        </div>
                        <div className="flex-[1.5] flex items-stretch p-1">
                           <button 
                             onClick={confirmImport} 
                             className="w-full bg-emerald-600 text-white rounded-lg shadow-xl shadow-emerald-600/20 active:scale-95 font-black uppercase tracking-widest text-[10px] xl:text-xs flex items-center justify-center transition-all"
                           >
                             Confirm Import
                           </button>
                        </div>
                       </>
                     )}
                   </div>
                 </div>
                 {importStatus && (
                    <div className={`flex items-center gap-3 p-3 rounded-2xl border font-black uppercase text-[10px] tracking-widest ${importStatus.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : importStatus.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                       {importStatus.type === 'success' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>} {importStatus.message}
                    </div>
                 )}
              </div>
              
              {!parsedPreview ? (
                <textarea 
                  className="w-full h-44 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 font-mono text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-inner"
                  placeholder={`Paste ${activeTab} data here...`}
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                />
              ) : (
                <div className="border-2 rounded-3xl border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                   <div className="bg-slate-100 dark:bg-slate-800/80 p-5 border-b-2 border-slate-200 dark:border-slate-700 flex justify-between items-center">
                     <span className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-3"><Eye size={18} className="text-blue-600" /> Import Preview: {activeTab}</span>
                     {excelPreview && <Badge color="green">Excel Loaded</Badge>}
                   </div>
                   <div className="max-h-[500px] overflow-auto">
                     <table className="w-full text-left">
                       <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-black uppercase text-[10px] tracking-widest sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                         <tr>
                           {activeTab === 'customers' ? (<><th className="p-4 pl-6">Name</th><th className="p-4">Rank</th><th className="p-4">Region</th><th className="p-4">Summary</th><th className="p-4">Status</th><th className="p-4">Next</th><th className="p-4">Contacts</th><th className="p-4 pr-6">Updated</th></>) : 
                            activeTab === 'samples' ? (<><th className="p-4 pl-6">Customer</th><th className="p-4">Idx</th><th className="p-4">Name</th><th className="p-4">Paid</th><th className="p-4">Balance</th><th className="p-4">Status</th><th className="p-4">Test</th><th className="p-4">Date</th><th className="p-4 pr-6">History</th></>) : 
                            (<><th className="p-4 pl-6">Name</th><th className="p-4">{t('dateLabel')}</th><th className="p-4">Location</th><th className="p-4">Link</th><th className="p-4">Series</th><th className="p-4 pr-6">Summary</th></>)}
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
                         {parsedPreview.map((row, idx) => (
                           <tr key={idx} className="hover:bg-blue-50/10 transition-colors">
                             {activeTab === 'customers' ? (
                               <><td className="p-4 pl-6 font-black text-blue-600 uppercase">{row.name}</td><td className="p-4"><RankStars rank={row.rank} /></td><td className="p-4">{Array.isArray(row.region) ? row.region.join(', ') : row.region}</td><td className="p-4 truncate max-w-[150px]">{row.productSummary}</td><td className="p-4"><Badge color="blue">{row.followUpStatus}</Badge></td><td className="p-4 truncate max-w-[120px]">{row.upcomingPlan}</td><td className="p-4 truncate max-w-[120px] uppercase">{row.contacts?.map((c:any) => c.name).join(', ')}</td><td className="p-4 pr-6">{row.lastStatusUpdate}</td></>
                             ) : activeTab === 'samples' ? (
                               <><td className="p-4 pl-6 uppercase text-slate-400">{row.customerName}</td><td className="p-4">{row.sampleIndex}</td><td className="p-4 font-black text-blue-600 uppercase">{row.sampleName}</td><td className="p-4">{row.isPaid ? 'Yes' : 'No'}</td><td className="p-4 font-black text-amber-600">{row.balance || '-'}</td><td className="p-4"><Badge color="blue">{t(row.status as any) || row.status}</Badge></td><td className="p-4"><Badge color={row.testStatus==='Finished'?'green':row.testStatus==='Terminated'?'red':'yellow'}>{t(row.testStatus as any) || row.testStatus}</Badge></td><td className="p-4">{row.lastStatusDate}</td><td className="p-4 pr-6 truncate max-w-[150px] italic">{row.statusDetails}</td></>
                             ) : (
                               <><td className="p-4 pl-6 font-black uppercase text-blue-600">{row.name}</td><td className="p-4">{row.date}</td><td className="p-4">{row.location}</td><td className="p-4">{row.link}</td><td className="p-4 text-[10px] uppercase">{row.eventSeries?.join(', ')}</td><td className="p-4 pr-6 truncate max-w-[150px] italic">{row.summary}</td></>
                             )}
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
      
      <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="Clear Database">
        <div className="space-y-6">
           <div className="flex items-start gap-4 bg-rose-50 dark:bg-rose-900/20 p-6 rounded-3xl border-2 border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-10 h-10 shrink-0" />
              <div>
                <h4 className="font-black uppercase tracking-widest text-sm mb-2">Irreversible Action</h4>
                <p className="text-sm font-bold opacity-80">This will permanently delete all customers, samples, exhibitions and interaction records. This action cannot be undone.</p>
              </div>
           </div>
           <p className="text-slate-700 dark:text-slate-300 font-bold px-1">Are you absolutely sure you want to completely wipe the system database?</p>
           <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
              <Button variant="secondary" onClick={() => setIsClearModalOpen(false)} className="px-8 font-black uppercase text-xs tracking-widest">Cancel</Button>
              <Button variant="danger" onClick={async () => { await clearDatabase(); setIsClearModalOpen(false); }} className="px-10 font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-600/20">Wipe Database</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default DataManagement;
