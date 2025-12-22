import React, { useState, useRef } from 'react';
import { Customer, Sample, Rank, SampleStatus, CustomerStatus, FollowUpStatus, ProductCategory, ProductForm, Interaction, CrystalType, GradingStatus } from '../types';
import { Card, Button, Badge, Modal, RankStars, StatusIcon } from '../components/Common';
import { Download, Upload, FileText, AlertCircle, CheckCircle2, Users, FlaskConical, Search, X, Trash2, RefreshCcw, FileSpreadsheet, Eye, Database } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { differenceInDays, parseISO, isValid } from 'date-fns';
import * as XLSX from 'xlsx';
import { getCanonicalTag } from '../utils/i18n';

interface DataManagementProps {
  onImportCustomers: (newCustomers: Customer[], override?: boolean) => void;
  onImportSamples: (newSamples: Sample[], override?: boolean) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ 
  onImportCustomers, 
  onImportSamples
}) => {
  const { t, clearDatabase, customers, samples, syncSampleToCatalog, companyName, userName, refreshTagsFromSamples } = useApp();
  const [activeTab, setActiveTab] = useState<'customers' | 'samples'>('customers');
  const [panelMode, setPanelMode] = useState<'import' | 'review'>('import');
  
  // Text Import State
  const [importData, setImportData] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  
  // Excel Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelPreview, setExcelPreview] = useState<{ customers: Customer[], samples: Sample[] } | null>(null);

  // Common Preview State (Points to either text result or excel result)
  const [parsedPreview, setParsedPreview] = useState<any[] | null>(null);
  const [importStatus, setImportStatus] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('replace');

  // --- HELPERS ---

  const splitByDelimiter = (str: string | undefined): string[] => {
    if (!str) return [];
    return String(str).split('|||').map(s => s.trim()).filter(s => s.length > 0);
  };

  const normalizeDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const trimmed = String(dateStr).trim();
    if (!trimmed) return '';
    
    const bracketMatch = trimmed.match(/【(.*?)】/);
    if (bracketMatch) {
       return normalizeDate(bracketMatch[1]);
    }

    if (!isNaN(Number(trimmed)) && Number(trimmed) > 20000) {
        const date = new Date(Math.round((Number(trimmed) - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
    }

    const yearFirstMatch = trimmed.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
    if (yearFirstMatch) return `${yearFirstMatch[1]}-${yearFirstMatch[2].padStart(2, '0')}-${yearFirstMatch[3].padStart(2, '0')}`;
    
    const yearLastMatch = trimmed.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
    if (yearLastMatch) return `${yearLastMatch[3]}-${yearLastMatch[1].padStart(2, '0')}-${yearLastMatch[2].padStart(2, '0')}`;
    
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
    if (s === '暂无' || s === 'No Action') return 'No Action';
    return 'No Action'; 
  };

  const mapStatusToExport = (status: string | undefined): string => {
    return status || 'No Action';
  };

  // --- PARSING LOGIC ---

  const rowToCustomer = (cols: any[], tempIdPrefix: string): Customer => {
    const safeCol = (i: number) => cols[i] !== undefined && cols[i] !== null ? String(cols[i]).trim() : '';
    const name = safeCol(0) || 'Unknown';
    const regions = splitByDelimiter(safeCol(1));
    const finalRegions = regions.length > 0 ? regions : ['Unknown'];
    const rawTags = splitByDelimiter(safeCol(2));
    const cleanTags = rawTags.map(t => t.replace(/^\d+[\.\、\s]*\s*/, ''));
    const rank = (parseInt(safeCol(4)) || 3) as Rank;
    const productSummary = (safeCol(5) || '').replace(/\|\|\|/g, '\n');
    const lastStatusUpdate = normalizeDate(safeCol(6));
    const followUpStatus = mapStatusFromImport(safeCol(9));
    const nextSteps = safeCol(10) || '';
    const nextActionDate = normalizeDate(safeCol(11));
    const lastCustomerReplyDate = normalizeDate(safeCol(14));
    const lastMyReplyDate = normalizeDate(safeCol(16));
    const docLinks = splitByDelimiter(safeCol(18));
    const contactNames = splitByDelimiter(safeCol(8));
    const contactInfos = splitByDelimiter(safeCol(19));
    
    const contacts = contactNames.map((cName, i) => {
       const info = contactInfos[i] || '';
       const isEmail = info.includes('@');
       let cleanName = cName.replace(/^\d+[\.\s]*\s*/, '');
       let isPrimary = false;
       if (cleanName.includes('【主要联系人】')) {
           isPrimary = true;
           cleanName = cleanName.replace('【主要联系人】', '');
       }
       let title = '';
       const titleMatch = cleanName.match(/\((.*?)\)/);
       if (titleMatch) {
           title = titleMatch[1].trim();
           cleanName = cleanName.replace(titleMatch[0], '');
       }
       return {
         name: cleanName.trim(),
         title: title,
         isPrimary: isPrimary,
         email: isEmail ? info : '',
         phone: !isEmail ? info : ''
       };
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
       return {
         id: `int_${tempIdPrefix}_${i}`,
         date: date,
         summary: summary,
         tags: []
       };
    }).reverse();

    return {
      id: `new_c_${tempIdPrefix}`,
      name: name,
      region: finalRegions,
      tags: cleanTags,
      rank: rank,
      productSummary: productSummary,
      lastStatusUpdate: lastStatusUpdate,
      followUpStatus: followUpStatus,
      nextActionDate: nextActionDate,
      lastCustomerReplyDate: lastCustomerReplyDate,
      lastMyReplyDate: lastMyReplyDate,
      lastContactDate: lastMyReplyDate,
      contacts: contacts,
      docLinks: docLinks,
      status: 'Active' as CustomerStatus,
      interactions: interactions
    } as Customer;
  };

  const rowToSample = (cols: any[], tempIdPrefix: string, indexMap: Map<string, number>, lookupCustomers: Customer[]): Sample => {
    const safeCol = (i: number) => cols[i] !== undefined && cols[i] !== null ? String(cols[i]).trim() : '';
    const custName = safeCol(0) || 'Unknown';
    const matchedCustomer = lookupCustomers.find(c => c.name.toLowerCase() === custName.toLowerCase());
    
    const lowerCustName = custName.toLowerCase();
    let nextIndex = (indexMap.get(lowerCustName) || 0) + 1;
    indexMap.set(lowerCustName, nextIndex);
    
    const status = getCanonicalTag(safeCol(1)) as SampleStatus || 'Requested';
    const crystal = getCanonicalTag(safeCol(3)) || '';
    const form = getCanonicalTag(safeCol(5)) || 'Powder';
    const categories = safeCol(4) ? safeCol(4).split(',').map(c => getCanonicalTag(c.trim()) as ProductCategory) : [];
    const origSize = safeCol(6) || '';
    const procSize = safeCol(7) ? ` > ${safeCol(7)}` : '';
    const generatedName = `${crystal} ${categories.join(', ')} ${form} - ${origSize}${procSize}`.trim();

    return {
      id: `new_s_${tempIdPrefix}`,
      customerId: matchedCustomer ? matchedCustomer.id : 'unknown',
      customerName: custName,
      sampleIndex: nextIndex,
      status: status,
      isTestFinished: ['yes', 'true', '是', 'y', '1'].includes((safeCol(2) || '').toLowerCase()),
      crystalType: crystal as CrystalType,
      productCategory: categories,
      productForm: form as ProductForm,
      originalSize: safeCol(6) || '',
      processedSize: safeCol(7) || '',
      isGraded: (safeCol(8) as GradingStatus) || 'Graded',
      sampleSKU: safeCol(9) || '',
      sampleDetails: safeCol(10) || '',
      quantity: safeCol(11) || '',
      application: safeCol(12) || '',
      lastStatusDate: normalizeDate(safeCol(13)) || new Date().toISOString().split('T')[0],
      statusDetails: safeCol(15) || '',
      trackingNumber: safeCol(16) || '',
      sampleName: generatedName,
      productType: generatedName,
      specs: safeCol(6) ? `${safeCol(6)} -> ${safeCol(7)}` : '',
      requestDate: new Date().toISOString().split('T')[0],
    } as Sample;
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const custHeaders = ["客户", "地区", "展会", "等级", "状态与产品总结", "状态更新", "对接人员", "状态", "下一步", "关键日期", "流程总结", "联系方式"];
    const custRows = customers.map(c => [
      c.name, c.region.join(' | '), c.tags.join(', '), c.rank, c.productSummary.replace(/\n/g, ' '), c.lastStatusUpdate,
      c.contacts.map(ct => ct.name).join(', '), mapStatusToExport(c.followUpStatus), c.interactions[0]?.nextSteps || '',
      c.nextActionDate || '', c.interactions.map(i => i.summary).join(' | '), c.contacts.map(ct => ct.email || ct.phone).join(', ')
    ]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([custHeaders, ...custRows]), "Customers");

    const sampHeaders = ["Customer", "Status", "Test Finished", "Crystal", "Category", "Form", "Original Size", "Processed Size", "SKU", "Date", "Tracking"];
    const sampRows = samples.map(s => [
      s.customerName, s.status, s.isTestFinished ? 'Yes' : 'No', s.crystalType, s.productCategory?.join(', '),
      s.productForm, s.originalSize, s.processedSize, s.sampleSKU, s.lastStatusDate, s.trackingNumber
    ]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([sampHeaders, ...sampRows]), "Samples");

    const etDate = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    const timestamp = `${etDate.getFullYear()}${String(etDate.getMonth() + 1).padStart(2, '0')}${String(etDate.getDate()).padStart(2, '0')}_${String(etDate.getHours()).padStart(2, '0')}${String(etDate.getMinutes()).padStart(2, '0')}`;
    XLSX.writeFile(wb, `Master TB_${companyName.replace(/[^a-z0-9]/gi, '_')}_${userName.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.xlsx`);
  };

  const confirmImport = () => {
    const override = importMode === 'replace';
    const source = excelPreview ? (activeTab === 'customers' ? excelPreview.customers : excelPreview.samples) : parsedPreview;
    if (!source) return;

    if (activeTab === 'customers') {
      onImportCustomers(source as Customer[], override);
    } else {
      const imported = source as Sample[];
      imported.forEach(s => syncSampleToCatalog(s));
      onImportSamples(imported, override);
      refreshTagsFromSamples(imported, override);
    }
    setParsedPreview(null);
    setExcelPreview(null);
    setImportStatus({ type: 'success', message: 'Import completed successfully.' });
  };

  // Fix: Added missing handleFileUpload function to process Excel file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      
      let importedCustomers: Customer[] = [];
      let importedSamples: Sample[] = [];
      
      // Try to find sheets by common names
      const custSheet = wb.Sheets["Customers"] || wb.Sheets["客户"];
      const sampSheet = wb.Sheets["Samples"] || wb.Sheets["样品"];
      
      if (custSheet) {
        const data = XLSX.utils.sheet_to_json(custSheet, { header: 1 }) as any[][];
        importedCustomers = data.slice(1).filter(row => row.length > 0).map((row, i) => rowToCustomer(row, `ex_c_${i}`));
      }

      if (sampSheet) {
        const data = XLSX.utils.sheet_to_json(sampSheet, { header: 1 }) as any[][];
        const indexMap = new Map<string, number>();
        const lookup = importedCustomers.length > 0 ? importedCustomers : customers;
        importedSamples = data.slice(1).filter(row => row.length > 0).map((row, i) => rowToSample(row, `ex_s_${i}`, indexMap, lookup));
      }

      // Fallback: If no sheets matched or activeTab only, use the first sheet
      if (importedCustomers.length === 0 && importedSamples.length === 0) {
        const firstSheetName = wb.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(wb.Sheets[firstSheetName], { header: 1 }) as any[][];
        if (activeTab === 'customers') {
          importedCustomers = data.slice(1).filter(row => row.length > 0).map((row, i) => rowToCustomer(row, `ex_c_fb_${i}`));
        } else {
          const indexMap = new Map<string, number>();
          importedSamples = data.slice(1).filter(row => row.length > 0).map((row, i) => rowToSample(row, `ex_s_fb_${i}`, indexMap, customers));
        }
      }

      setExcelPreview({ customers: importedCustomers, samples: importedSamples });
      setImportStatus({ 
        type: 'info', 
        message: `Excel loaded: ${importedCustomers.length} customers, ${importedSamples.length} samples detected.` 
      });
    };
    reader.readAsBinaryString(file);
  };

  // Fix: Added missing parsePasteData function to process pasted text area data
  const parsePasteData = () => {
    if (!importData.trim()) {
      setImportStatus({ type: 'error', message: 'Please paste data first.' });
      return;
    }
    
    // Support tab separated values from Excel copy-paste
    const rows = importData.trim().split('\n').map(row => row.split('\t'));
    
    if (activeTab === 'customers') {
      const parsed = rows.map((row, i) => rowToCustomer(row, `txt_c_${i}`));
      setParsedPreview(parsed);
      setImportStatus({ type: 'info', message: `Parsed ${parsed.length} customers from text.` });
    } else {
      const indexMap = new Map<string, number>();
      const parsed = rows.map((row, i) => rowToSample(row, `txt_s_${i}`, indexMap, customers));
      setParsedPreview(parsed);
      setImportStatus({ type: 'info', message: `Parsed ${parsed.length} samples from text.` });
    }
  };

  const filteredReviewData = () => {
    const data = activeTab === 'customers' ? customers : samples;
    if (!reviewSearch) return data;
    const term = reviewSearch.toLowerCase();
    return data.filter((item: any) => {
      const nameMatch = (item.name || item.customerName || '').toLowerCase().includes(term);
      const skuMatch = (item.sampleSKU || '').toLowerCase().includes(term);
      const statusMatch = (item.status || item.followUpStatus || '').toLowerCase().includes(term);
      return nameMatch || skuMatch || statusMatch;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('dataManagement')}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t('bulkImport')} / {t('export')}</p>
        </div>
        <div className="flex gap-2">
           <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
           <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
              <Upload size={16} /> Upload Excel
           </Button>
           <Button variant="secondary" onClick={handleExportExcel} className="flex items-center gap-2 text-emerald-700">
              <FileSpreadsheet size={16} /> Export Excel
           </Button>
           <Button variant="danger" className="flex items-center gap-2" onClick={() => setIsClearModalOpen(true)}>
             <Trash2 size={16} /> Clear DB
           </Button>
        </div>
      </div>

      <Card className="p-0 border-l-0 overflow-hidden">
        {/* Toggle Switch between Import and Review */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 m-4 rounded-xl self-start w-fit">
           <button 
             onClick={() => setPanelMode('import')}
             className={`px-6 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${panelMode === 'import' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}
           >
             <Upload size={16} /> {t('import')} Tool
           </button>
           <button 
             onClick={() => setPanelMode('review')}
             className={`px-6 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${panelMode === 'review' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}
           >
             <Database size={16} /> {t('overview')} Database
           </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
           <button 
             onClick={() => setActiveTab('customers')}
             className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'customers' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-t-4 border-t-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Users size={20} /> {t('customers')} {panelMode === 'review' && `(${customers.length})`}
           </button>
           <button 
             onClick={() => setActiveTab('samples')}
             className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'samples' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-t-4 border-t-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <FlaskConical size={20} /> {t('samples')} {panelMode === 'review' && `(${samples.length})`}
           </button>
        </div>

        <div className="p-6">
          {panelMode === 'import' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50 flex justify-between items-center">
                <p className="text-xs font-mono text-slate-600 dark:text-slate-400 max-w-2xl">
                  {activeTab === 'customers' 
                    ? "Cols: 客户, 地区, 展会,官网,等级,总结,日期,Ignore,对接人,状态,下一步,DDL..." 
                    : "Cols: Customer, Status, Finished, Crystal, Cat, Form, OrigSize, ProcSize, Graded, SKU, Details, Qty, App, Date..."
                  }
                </p>
                <div className="flex items-center gap-2">
                   {parsedPreview ? (
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setParsedPreview(null)}>{t('cancel')}</Button>
                        <Button onClick={confirmImport} className="bg-emerald-600">Import {parsedPreview.length} Rows</Button>
                      </div>
                   ) : (
                      <Button onClick={parsePasteData}>{t('parseImport')}</Button>
                   )}
                </div>
              </div>
              {!parsedPreview && (
                <textarea 
                  className="w-full h-64 border rounded-lg p-3 font-mono text-xs bg-white dark:bg-slate-900 dark:border-slate-700"
                  placeholder="Paste Excel data here..."
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                />
              )}
              {parsedPreview && (
                <div className="overflow-auto max-h-[500px] border rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                      <tr>
                        {activeTab === 'customers' ? (
                          ["Name", "Rank", "Region", "Summary", "Status"].map(h => <th key={h} className="p-3">{h}</th>)
                        ) : (
                          ["Customer", "Name", "Specs", "Status", "Qty"].map(h => <th key={h} className="p-3">{h}</th>)
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedPreview.map((row, i) => (
                        <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                           {activeTab === 'customers' ? (
                             <>
                               <td className="p-3 font-bold">{row.name}</td>
                               <td className="p-3"><RankStars rank={row.rank} /></td>
                               <td className="p-3">{row.region.join(', ')}</td>
                               <td className="p-3 truncate max-w-[200px]">{row.productSummary}</td>
                               <td className="p-3"><Badge color="blue">{row.followUpStatus}</Badge></td>
                             </>
                           ) : (
                             <>
                               <td className="p-3 font-bold">{row.customerName}</td>
                               <td className="p-3">{row.sampleName}</td>
                               <td className="p-3">{row.originalSize} -> {row.processedSize}</td>
                               <td className="p-3"><Badge color="amber">{row.status}</Badge></td>
                               <td className="p-3">{row.quantity}</td>
                             </>
                           )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                <input 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={`Search current ${activeTab}...`}
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                />
              </div>
              <div className="overflow-auto max-h-[600px] border rounded-lg shadow-inner bg-slate-50 dark:bg-slate-900/20">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
                    <tr>
                      {activeTab === 'customers' ? (
                        <>
                          <th className="p-4 w-1/5">Company</th>
                          <th className="p-4 w-24">Rank</th>
                          <th className="p-4">Summary</th>
                          <th className="p-4 w-32">Status</th>
                          <th className="p-4 w-40">Next Step</th>
                          <th className="p-4 w-40">Contacts</th>
                        </>
                      ) : (
                        <>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Idx</th>
                          <th className="p-4 w-1/4">Sample Name</th>
                          <th className="p-4">Specs</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Test</th>
                          <th className="p-4">Update</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredReviewData().map((item: any, i: number) => (
                      <tr key={i} className="bg-white dark:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                        {activeTab === 'customers' ? (
                          <>
                            <td className="p-4 align-top">
                              <div className="font-bold text-slate-800 dark:text-white">{item.name}</div>
                              <div className="text-xs text-slate-400 mt-1">{item.region.join(', ')}</div>
                            </td>
                            <td className="p-4 align-top"><RankStars rank={item.rank} /></td>
                            <td className="p-4 align-top text-xs leading-relaxed line-clamp-2 max-w-xs">{item.productSummary}</td>
                            <td className="p-4 align-top">
                              <div className="flex items-center gap-2">
                                <StatusIcon status={item.followUpStatus} />
                                <span className="text-xs font-medium">{item.followUpStatus}</span>
                              </div>
                            </td>
                            <td className="p-4 align-top text-xs font-medium text-slate-600 dark:text-slate-300">
                              {item.interactions[0]?.nextSteps || "-"}
                            </td>
                            <td className="p-4 align-top text-xs text-slate-500">
                               {item.contacts.map((c:any) => c.name).join(', ')}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-4 align-top font-bold text-slate-700 dark:text-slate-300">{item.customerName}</td>
                            <td className="p-4 align-top font-mono text-slate-400">#{item.sampleIndex}</td>
                            <td className="p-4 align-top font-bold text-blue-600 dark:text-blue-400">{item.sampleName}</td>
                            <td className="p-4 align-top text-xs text-slate-500">
                               {item.crystalType} | {item.productForm} | {item.originalSize}
                            </td>
                            <td className="p-4 align-top">
                               <Badge color="blue">{item.status}</Badge>
                            </td>
                            <td className="p-4 align-top">
                               {item.isTestFinished ? <Badge color="green">Done</Badge> : <Badge color="gray">Open</Badge>}
                            </td>
                            <td className="p-4 align-top text-xs text-slate-400">{item.lastStatusDate}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="Clear Database">
        <div className="space-y-4">
           <p className="text-red-600 font-bold">This is irreversible. All data will be wiped.</p>
           <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsClearModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => { clearDatabase(); setIsClearModalOpen(false); }}>Clear Everything</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default DataManagement;