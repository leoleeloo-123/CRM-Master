
import React, { useState } from 'react';
import { Customer, Sample, Rank, SampleStatus, CustomerStatus, FollowUpStatus, ProductCategory, ProductForm, Interaction } from '../types';
import { Card, Button, Badge, Modal } from '../components/Common';
import { Download, Upload, FileText, AlertCircle, CheckCircle2, Users, FlaskConical, Search, X, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface DataManagementProps {
  // Props are kept for compatibility but components should prefer context for global state
  customers: Customer[];
  samples: Sample[];
  onImportCustomers: (newCustomers: Customer[]) => void;
  onImportSamples: (newSamples: Sample[]) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ 
  onImportCustomers, 
  onImportSamples 
  // We ignore passed customers/samples props in favor of context to ensure we have the latest state
}) => {
  const { t, clearDatabase, customers, samples } = useApp();
  const [activeTab, setActiveTab] = useState<'customers' | 'samples'>('customers');
  const [importData, setImportData] = useState('');
  const [parsedPreview, setParsedPreview] = useState<any[] | null>(null);
  const [importStatus, setImportStatus] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const downloadCSV = (content: string, filename: string) => {
    const bom = "\uFEFF"; 
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + bom + content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCustomers = () => {
    // 20 Columns matching the Updated Import Logic
    // Col 0: Name
    // Col 1: Region (NEW)
    // Col 2: Tags
    // ... shifted by 1
    const headers = [
      "客户", // 0. Name
      "地区", // 1. Region (New Column)
      "展会", // 2. Tags (Numbered + |||)
      "展会官网", // 3. Website (Ignored)
      "等级", // 4. Rank
      "状态与产品总结", // 5. Product Summary
      "状态更新", // 6. Last Status Update
      "未更新", // 7. Ignored
      "对接人员", // 8. Contact Names (|||)
      "状态", // 9. FollowUp Status
      "下一步", // 10. Next Step
      "关键日期", // 11. Next Action Date
      "DDL", // 12. Ignored
      "对接流程总结", // 13. Interaction History (【Date】 Summary |||)
      "对方回复", // 14. Last Customer Reply
      "未回复", // 15. Ignored
      "我方跟进", // 16. Last My Reply
      "未跟进", // 17. Ignored
      "文档超链接", // 18. Doc Links (|||)
      "联系方式" // 19. Contact Info (|||) matching col 8
    ];
    
    // Use the customers from context (source of truth)
    const rows = customers.map(c => {
      // 1. Reverse Tags Logic: Add numbering and join with |||
      const tags = c.tags.map((tag, i) => `${i + 1}. ${tag}`).join(' ||| ');

      // New: Regions joined by |||
      const regions = Array.isArray(c.region) ? c.region.join(' ||| ') : c.region;

      // 2. Reverse Contacts Logic: Split Name and Info
      const contactNames = c.contacts.map(contact => contact.name).join(' ||| ');
      const contactInfos = c.contacts.map(contact => contact.email || contact.phone || '').join(' ||| ');

      // 3. Reverse Interactions Logic: 
      // App stores Newest First. Excel Source had Oldest First.
      // So we reverse back to Oldest First.
      // Format: 【YYYY-MM-DD】 Summary text
      const interactionText = [...c.interactions]
        .reverse()
        .map(i => `【${i.date}】 ${i.summary}`)
        .join(' ||| ');

      // 4. Next Step (Usually derived from the latest interaction in App)
      // We check the first interaction (Newest) for next steps
      const nextStep = c.interactions.length > 0 ? (c.interactions[0].nextSteps || '') : '';

      // 5. Doc Links
      const docLinks = c.docLinks ? c.docLinks.join(' ||| ') : '';

      // 6. Product Summary: Convert newlines back to ||| for flattened export
      const productSummaryExport = (c.productSummary || '').replace(/\n/g, ' ||| ');

      return [
        c.name,
        regions, // New Column 1
        tags,
        "", // Website placeholder
        c.rank,
        productSummaryExport,
        c.lastStatusUpdate,
        "", // Un-updated placeholder
        contactNames,
        c.followUpStatus,
        nextStep,
        c.nextActionDate,
        "", // DDL placeholder
        interactionText,
        c.lastCustomerReplyDate,
        "", // Un-replied placeholder
        c.lastMyReplyDate,
        "", // Un-followed placeholder
        docLinks,
        contactInfos
      ].map(field => {
        // CSV Escape: Wrap in quotes, escape existing quotes
        const stringField = String(field || '');
        return `"${stringField.replace(/"/g, '""')}"`;
      }).join(",");
    });
    
    const csvContent = [headers.join(","), ...rows].join("\n");
    downloadCSV(csvContent, "navi_customers_master_export.csv");
  };

  const splitByDelimiter = (str: string | undefined): string[] => {
    if (!str) return [];
    return str.split('|||').map(s => s.trim()).filter(s => s.length > 0);
  };

  // Helper to ensure dates are strict ISO 8601 (YYYY-MM-DD)
  // This is crucial for the DaysCounter component and date-fns parsing
  const normalizeDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const trimmed = dateStr.trim();
    if (!trimmed) return '';

    // 1. Try explicit YYYY-MM-DD regex (Most reliable)
    // Supports separators: - . /
    const yearFirstMatch = trimmed.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
    if (yearFirstMatch) {
      const y = yearFirstMatch[1];
      const m = yearFirstMatch[2].padStart(2, '0');
      const d = yearFirstMatch[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // 2. Try explicit MM/DD/YYYY or DD/MM/YYYY regex
    // Supports separators: - . /
    const yearLastMatch = trimmed.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
    if (yearLastMatch) {
      const p1 = parseInt(yearLastMatch[1], 10);
      const p2 = parseInt(yearLastMatch[2], 10);
      const y = yearLastMatch[3];
      
      let m, d;
      // Heuristic: If first part > 12, it has to be Day (DD-MM-YYYY)
      if (p1 > 12) {
         d = p1.toString().padStart(2, '0');
         m = p2.toString().padStart(2, '0');
      } else {
         // Ambiguity Case (e.g. 1/7/2025). 
         // Default to MM-DD-YYYY as it's common in spreadsheet exports in many locales
         m = p1.toString().padStart(2, '0');
         d = p2.toString().padStart(2, '0');
      }
      return `${y}-${m}-${d}`;
    }

    // 3. Last resort: JS Date Parsing (handles "Jan 1, 2025", etc.)
    // Only works if the string is understandable by the browser
    const dateObj = new Date(trimmed);
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getFullYear();
      const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const d = dateObj.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // If all else fails, return original. 
    // Note: This will likely fail isValid() checks in the UI, showing "-", which is better than crashing.
    return trimmed;
  };

  const parsePasteData = () => {
    if (!importData.trim()) {
      setImportStatus({ type: 'error', message: 'Please paste data into the text area.' });
      return;
    }

    try {
      const rows = importData.trim().split('\n').filter(r => r.trim() !== '');
      const parsed = rows.map((row, index) => {
        const cols = row.split('\t').map(c => c.trim());
        const tempId = Math.random().toString(36).substr(2, 9);
        
        if (activeTab === 'customers') {
          // Column Mapping (Updated):
          // 0: 客户 (Name)
          // 1: 地区 (Region) -- NEW
          // 2: 展会 (Tags) -> Clean numbering
          // 3: 展会官网 (Ignored)
          // 4: 等级 (Rank)
          // 5: 状态与产品总结 (Summary)
          // 6: 状态更新 (Last Update)
          // 7: 未更新 (Skipped)
          // 8: 对接人员 (Contact Name List) -> Zip with Col 19
          // 9: 状态 (FollowUp Status)
          // 10: 下一步 (Next Step)
          // 11: 关键日期 (Next Action Date)
          // 12: DDL (Skipped)
          // 13: 对接流程总结 (Interaction List) -> Extract Date 【】
          // 14: 对方回复 (Last Customer Reply)
          // 15: 未回复 (Skipped)
          // 16: 我方跟进 (Last My Reply)
          // 17: 未跟进 (Skipped)
          // 18: 文档超链接 (Doc Links)
          // 19: 联系方式 (Contact Info List) -> Zip with Col 8

          const name = cols[0] || 'Unknown';
          
          // 1. Region Parsing (Col 1)
          const regions = splitByDelimiter(cols[1]);
          const finalRegions = regions.length > 0 ? regions : ['Unknown'];

          // 2. Tags Parsing (Col 2): Remove "1.", "1、" etc.
          const rawTags = splitByDelimiter(cols[2]);
          const cleanTags = rawTags.map(t => t.replace(/^\d+[\.\、\s]*\s*/, ''));

          const rank = (parseInt(cols[4]) || 3) as Rank;
          
          // REPLACE ||| with newlines for display
          const productSummary = (cols[5] || '').replace(/\|\|\|/g, '\n');
          
          // Normalize Dates
          const lastStatusUpdate = normalizeDate(cols[6]);
          
          const followUpStatus = (cols[9] as FollowUpStatus) || 'No Action';
          const nextSteps = cols[10] || '';
          
          const nextActionDate = normalizeDate(cols[11]);
          const lastCustomerReplyDate = normalizeDate(cols[14]);
          const lastMyReplyDate = normalizeDate(cols[16]);
          
          // 3. Document Links Parsing
          const docLinks = splitByDelimiter(cols[18]);

          // 2. Contacts Parsing: Zip Names (Col 8) and Info (Col 19)
          const contactNames = splitByDelimiter(cols[8]);
          const contactInfos = splitByDelimiter(cols[19]);
          const contacts = contactNames.map((cName, i) => {
             const info = contactInfos[i] || '';
             const isEmail = info.includes('@');
             return {
               name: cName,
               title: '',
               email: isEmail ? info : '',
               phone: !isEmail ? info : ''
             };
          });
          // Fallback if no contacts found but info exists
          if (contacts.length === 0 && contactNames.length === 0 && contactInfos.length > 0) {
             contacts.push({ name: 'Primary Contact', title: '', email: contactInfos[0].includes('@') ? contactInfos[0] : '', phone: ''});
          }

          // 4. Interactions Parsing: Extract Date from 【】
          // Data format is often: "- 【2025.1.7】 Content..."
          const rawInteractions = splitByDelimiter(cols[13]);
          
          // REVERSE Logic: Source has Oldest at Top (first in split), Newest at Bottom.
          // App displays Newest at Top. So we MUST reverse the array.
          const interactions: Interaction[] = rawInteractions.map((raw, i) => {
             // Regex to find content inside 【】 anywhere in string (handling leading dashes/spaces)
             const dateMatch = raw.match(/【(.*?)】/);
             
             // Prioritize extracted date. Fallback to today/last reply if missing.
             let date = lastMyReplyDate || new Date().toISOString().split('T')[0];
             let summary = raw;

             if (dateMatch) {
               date = normalizeDate(dateMatch[1]);
               // Remove the date part AND any leading dashes/bullets/spaces before it
               // e.g., "- 【2025.1.7】 Text" -> "Text"
               summary = raw.replace(/^[\s\-\.\*]*【.*?】/, '').trim();
             } else {
               // If no date found, still clean leading bullets
               summary = raw.replace(/^[\s\-\.\*]+/, '').trim();
             }

             return {
               id: `int_${tempId}_${i}`,
               date: date,
               summary: summary,
               tags: []
             };
          }).reverse(); // <--- This ensures Newest (Bottom of Excel) becomes Top of App

          // Add "Next Step" as a separate interaction or logic if needed
          if (interactions.length === 0 && nextSteps) {
             interactions.push({
               id: `int_${tempId}_next`,
               date: new Date().toISOString().split('T')[0],
               summary: 'Pending Next Step',
               nextSteps: nextSteps
             });
          } else if (interactions.length > 0 && nextSteps) {
             // Attach next steps to the most recent interaction (now index 0 after reverse)
             interactions[0].nextSteps = nextSteps;
          }

          return {
            id: `new_c_${tempId}`, // This ID might be overwritten by Upsert logic in App.tsx
            name: name,
            region: finalRegions, // Now an array
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

        } else {
          // Mapping: CustName | Serial | SampleName | Category | Form | Qty | Status | StatusDate | Details | Tracking
          // Attempt to find customer ID by name
          const matchedCustomer = customers.find(c => c.name.toLowerCase() === (cols[0] || '').toLowerCase());
          
          return {
            id: `new_s_${tempId}`,
            customerName: cols[0] || 'Unknown',
            customerId: matchedCustomer ? matchedCustomer.id : 'unknown',
            serialNumber: cols[1] || '',
            sampleName: cols[2] || 'New Sample',
            productCategory: cols[3] ? cols[3].split(',').map(c => c.trim() as ProductCategory) : [],
            productForm: (cols[4] as ProductForm) || 'Powder',
            quantity: cols[5] || '',
            status: (cols[6] as SampleStatus) || 'Requested',
            lastStatusDate: normalizeDate(cols[7]) || new Date().toISOString().split('T')[0],
            statusDetails: cols[8] || '',
            trackingNumber: cols[9] || '',
            productType: cols[2] || 'Sample',
            specs: cols[2] || '',
            requestDate: new Date().toISOString().split('T')[0],
            isTestFinished: false
          } as Sample;
        }
      });

      setParsedPreview(parsed);
      setImportStatus({ 
        type: 'info', 
        message: `Previewing ${parsed.length} rows. Please review below and click "Confirm Import".` 
      });
    } catch (e) {
      console.error(e);
      setImportStatus({ type: 'error', message: 'Failed to parse data. Please check column format.' });
    }
  };

  const confirmImport = () => {
    if (!parsedPreview || parsedPreview.length === 0) return;
    
    if (activeTab === 'customers') {
      onImportCustomers(parsedPreview as Customer[]);
    } else {
      onImportSamples(parsedPreview as Sample[]);
    }

    setImportStatus({ type: 'success', message: `Successfully imported ${parsedPreview.length} records!` });
    setParsedPreview(null);
    setImportData('');
  };

  const clearPreview = () => {
    setParsedPreview(null);
    setImportStatus(null);
  };

  const handleClearDatabase = () => {
    clearDatabase();
    setIsClearModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('dataManagement')}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t('bulkImport')} / {t('export')}</p>
        </div>
        <Button variant="danger" className="flex items-center gap-2" onClick={() => setIsClearModalOpen(true)}>
           <Trash2 size={16} /> Clear Database
        </Button>
      </div>

      {/* IMPORT SECTION */}
      <Card className="p-0 border-l-0 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
           <button 
             onClick={() => { setActiveTab('customers'); clearPreview(); setImportData(''); }}
             className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'customers' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-t-4 border-t-blue-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
           >
             <Users size={20} /> Import Customers
           </button>
           <button 
             onClick={() => { setActiveTab('samples'); clearPreview(); setImportData(''); }}
             className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'samples' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-t-4 border-t-amber-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
           >
             <FlaskConical size={20} /> Import Samples
           </button>
        </div>

        <div className="p-6">
          {/* Helper / Status Box */}
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
             <div className="flex justify-between items-start">
               <div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                    <AlertCircle size={16} className="text-blue-500" /> Instructions & Required Columns (Tab Separated)
                  </h4>
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                    {activeTab === 'customers' 
                      ? "1.客户 | 2.地区(NEW) | 3.展会 | 4.展会官网(Ignore) | 5.等级 | 6.状态与产品总结 | 7.状态更新 | 8.未更新(Ignore) | 9.对接人员 | 10.状态(My Turn/etc) | 11.下一步 | 12.关键日期 | 13.DDL(Ignore) | 14.对接流程总结 | 15.对方回复 | 16.未回复(Ignore) | 17.我方跟进 | 18.未跟进(Ignore) | 19.文档超链接 | 20.联系方式"
                      : "Customer Name | Serial # | Sample Name | Category (comma sep) | Form | Quantity | Status | Status Date | Details | Tracking #"
                    }
                  </p>
                  <p className="mt-2 text-xs text-slate-500 italic">
                    Note: For Customers, data with the same Name will overwrite existing records (Upsert). Fields with "|||" will be split into lists.
                  </p>
               </div>
               
               {/* Action Buttons (Sticky-ish) */}
               <div className="flex gap-2">
                 {!parsedPreview ? (
                   <Button onClick={parsePasteData} className={activeTab === 'customers' ? 'bg-blue-600' : 'bg-amber-600 hover:bg-amber-700'}>
                     {t('parseImport')} (Preview)
                   </Button>
                 ) : (
                   <>
                     <Button onClick={clearPreview} variant="secondary">Cancel</Button>
                     <Button onClick={confirmImport} className="bg-emerald-600 hover:bg-emerald-700 text-white flex gap-2">
                       <CheckCircle2 size={16} /> Confirm Import ({parsedPreview.length})
                     </Button>
                   </>
                 )}
               </div>
             </div>

             {importStatus && (
                <div className={`mt-3 pt-3 border-t border-blue-200 dark:border-blue-800/50 flex items-center gap-2 text-sm font-medium ${
                  importStatus.type === 'success' ? 'text-emerald-600' : importStatus.type === 'error' ? 'text-red-600' : 'text-blue-600'
                }`}>
                   {importStatus.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                   {importStatus.message}
                </div>
             )}
          </div>
          
          {/* Input Area */}
          {!parsedPreview && (
            <textarea 
              className="w-full h-64 border border-slate-300 dark:border-slate-700 rounded-lg p-3 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder={`Paste ${activeTab === 'customers' ? 'Customer' : 'Sample'} Excel data here (rows copied from Excel)...`}
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
            />
          )}

          {/* Preview Table */}
          {parsedPreview && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
               <div className="bg-slate-100 dark:bg-slate-800 p-2 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700">
                 Data Preview
               </div>
               <div className="max-h-[500px] overflow-auto">
                 <table className="w-full text-left text-xs">
                   <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold sticky top-0 z-10">
                     <tr className="border-b border-slate-200 dark:border-slate-700">
                       {activeTab === 'customers' ? (
                         <>
                           <th className="p-3 whitespace-nowrap min-w-[120px]">Name</th>
                           <th className="p-3 whitespace-nowrap min-w-[120px]">Region</th>
                           <th className="p-3 whitespace-nowrap min-w-[120px]">Tags</th>
                           <th className="p-3 whitespace-nowrap">Rank</th>
                           <th className="p-3 whitespace-nowrap">Status</th>
                           <th className="p-3 whitespace-nowrap min-w-[200px]">Product Summary</th>
                           <th className="p-3 whitespace-nowrap">Last Update</th>
                           <th className="p-3 whitespace-nowrap min-w-[150px]">Contact</th>
                           <th className="p-3 whitespace-nowrap min-w-[150px]">Next Action</th>
                           <th className="p-3 whitespace-nowrap min-w-[200px]">Last Interaction</th>
                           <th className="p-3 whitespace-nowrap">Reply Dates</th>
                           <th className="p-3 whitespace-nowrap">Docs</th>
                         </>
                       ) : (
                         <>
                           <th className="p-3 whitespace-nowrap min-w-[120px]">Customer</th>
                           <th className="p-3 whitespace-nowrap">Serial #</th>
                           <th className="p-3 whitespace-nowrap min-w-[150px]">Sample</th>
                           <th className="p-3 whitespace-nowrap">Category</th>
                           <th className="p-3 whitespace-nowrap">Form</th>
                           <th className="p-3 whitespace-nowrap">Qty</th>
                           <th className="p-3 whitespace-nowrap">Status</th>
                           <th className="p-3 whitespace-nowrap">Date</th>
                           <th className="p-3 whitespace-nowrap min-w-[200px]">Details</th>
                           <th className="p-3 whitespace-nowrap">Tracking</th>
                         </>
                       )}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {parsedPreview.map((row, idx) => (
                       <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                         {activeTab === 'customers' ? (
                           <>
                             <td className="p-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap align-top">{row.name}</td>
                             <td className="p-3 align-top">
                               <div className="flex flex-wrap gap-1 w-[120px]">
                                 {Array.isArray(row.region) && row.region.map((r: string) => <span key={r} className="bg-slate-100 dark:bg-slate-700 px-1 rounded block mb-1">{r}</span>)}
                               </div>
                             </td>
                             <td className="p-3 align-top">
                               <div className="flex flex-wrap gap-1 w-[150px]">
                                 {row.tags?.map((t: string) => <span key={t} className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{t}</span>)}
                               </div>
                             </td>
                             <td className="p-3 align-top">{row.rank}</td>
                             <td className="p-3 align-top whitespace-nowrap"><Badge color="blue">{row.followUpStatus}</Badge></td>
                             <td className="p-3 text-slate-500 truncate max-w-[200px] align-top" title={row.productSummary}>{row.productSummary}</td>
                             <td className="p-3 text-slate-500 whitespace-nowrap align-top">{row.lastStatusUpdate}</td>
                             <td className="p-3 align-top">
                               {row.contacts.map((c: any, i: number) => (
                                 <div key={i} className="whitespace-nowrap">{c.name} <span className="text-slate-400 text-[10px]">{c.email || c.phone}</span></div>
                               ))}
                             </td>
                             <td className="p-3 align-top">
                                <div className="font-bold">{row.nextActionDate}</div>
                                <div className="text-slate-500 text-[10px] truncate max-w-[150px]">{row.interactions[0]?.nextSteps}</div>
                             </td>
                             <td className="p-3 text-slate-500 truncate max-w-[200px] align-top" title={row.interactions[0]?.summary}>
                               {row.interactions[0]?.summary}
                             </td>
                             <td className="p-3 text-xs text-slate-500 whitespace-nowrap align-top">
                                <div>C: {row.lastCustomerReplyDate || '-'}</div>
                                <div>M: {row.lastMyReplyDate || '-'}</div>
                             </td>
                             <td className="p-3 text-xs text-slate-500 align-top">
                                {row.docLinks?.length || 0}
                             </td>
                           </>
                         ) : (
                           <>
                             <td className="p-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap align-top">{row.customerName}</td>
                             <td className="p-3 whitespace-nowrap align-top">{row.serialNumber}</td>
                             <td className="p-3 font-medium align-top">{row.sampleName}</td>
                             <td className="p-3 align-top text-xs">{row.productCategory?.join(', ')}</td>
                             <td className="p-3 align-top">{row.productForm}</td>
                             <td className="p-3 align-top">{row.quantity}</td>
                             <td className="p-3 align-top whitespace-nowrap"><Badge color="blue">{row.status}</Badge></td>
                             <td className="p-3 text-slate-500 whitespace-nowrap align-top">{row.lastStatusDate}</td>
                             <td className="p-3 text-slate-500 truncate max-w-[200px] align-top" title={row.statusDetails}>{row.statusDetails}</td>
                             <td className="p-3 text-slate-500 align-top">{row.trackingNumber}</td>
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

      {/* EXPORT SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Customer Master CSV</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{customers.length} records</p>
            </div>
          </div>
          <Button variant="secondary" onClick={handleExportCustomers} className="w-full flex justify-center items-center gap-2">
            <Download size={16} /> {t('exportCustomers')}
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Sample Master CSV</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{samples.length} records</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => {}} className="w-full flex justify-center items-center gap-2">
            <Download size={16} /> {t('exportSamples')}
          </Button>
        </Card>
      </div>

      {/* Clear DB Modal */}
      <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="Dangerous Action">
        <div className="p-2 space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            Are you sure you want to <strong>permanently delete ALL data</strong> (Customers and Samples)? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsClearModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleClearDatabase}>Yes, Clear Everything</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DataManagement;
