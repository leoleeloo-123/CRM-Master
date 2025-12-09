
import React, { useState } from 'react';
import { Customer, Sample, Rank, SampleStatus, CustomerStatus, FollowUpStatus, ProductCategory, ProductForm, Interaction } from '../types';
import { Card, Button, Badge, Modal } from '../components/Common';
import { Download, Upload, FileText, AlertCircle, CheckCircle2, Users, FlaskConical, Search, X, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface DataManagementProps {
  onImportCustomers: (newCustomers: Customer[]) => void;
  onImportSamples: (newSamples: Sample[]) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ 
  onImportCustomers, 
  onImportSamples
}) => {
  const { t, clearDatabase, customers, samples } = useApp();
  const [activeTab, setActiveTab] = useState<'customers' | 'samples'>('customers');
  const [importData, setImportData] = useState('');
  const [parsedPreview, setParsedPreview] = useState<any[] | null>(null);
  const [importStatus, setImportStatus] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const downloadCSV = (content: string, filename: string) => {
    // Use Blob for robust download handling (supports large files and UTF-8)
    // The previous data URI method has length limits that can truncate data
    const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to map Internal English Status -> Chinese Export Status
  const mapStatusToExport = (status: FollowUpStatus | string): string => {
    switch (status) {
      case 'My Turn': return '我方跟进';
      case 'Waiting for Customer': return '等待对方';
      case 'No Action': return '暂无';
      default: return '暂无';
    }
  };

  // Helper to map Import Status (Chinese or English) -> Internal English Status
  const mapStatusFromImport = (status: string): FollowUpStatus => {
    const s = status ? status.trim() : '';
    if (s === '我方跟进' || s === 'My Turn') return 'My Turn';
    if (s === '等待对方' || s === 'Waiting for Customer') return 'Waiting for Customer';
    if (s === '暂无' || s === 'No Action') return 'No Action';
    return 'No Action'; // Default fallback
  };

  const handleExportCustomers = () => {
    console.log(`Starting export for ${customers.length} customers...`);
    
    // 20 Columns matching the Updated Import Logic
    const headers = [
      "客户", // 0. Name
      "地区", // 1. Region
      "展会", // 2. Tags
      "展会官网", // 3. Website
      "等级", // 4. Rank
      "状态与产品总结", // 5. Product Summary
      "状态更新", // 6. Last Status Update
      "未更新", // 7. Ignored
      "对接人员", // 8. Contact Names
      "状态", // 9. FollowUp Status (Chinese)
      "下一步", // 10. Next Step
      "关键日期", // 11. Next Action Date
      "DDL", // 12. Ignored
      "对接流程总结", // 13. Interaction History
      "对方回复", // 14. Last Customer Reply
      "未回复", // 15. Ignored
      "我方跟进", // 16. Last My Reply
      "未跟进", // 17. Ignored
      "文档超链接", // 18. Doc Links
      "联系方式" // 19. Contact Info
    ];
    
    const rows = customers.map(c => {
      const tags = c.tags.map((tag, i) => `${i + 1}. ${tag}`).join(' ||| ');
      const regions = Array.isArray(c.region) ? c.region.join(' ||| ') : c.region;
      const contactNames = c.contacts.map(contact => contact.name).join(' ||| ');
      const contactInfos = c.contacts.map(contact => contact.email || contact.phone || '').join(' ||| ');
      const interactionText = [...c.interactions]
        .reverse()
        .map(i => `【${i.date}】 ${i.summary}`)
        .join(' ||| ');
      const nextStep = c.interactions.length > 0 ? (c.interactions[0].nextSteps || '') : '';
      const docLinks = c.docLinks ? c.docLinks.join(' ||| ') : '';
      const productSummaryExport = (c.productSummary || '').replace(/\n/g, ' ||| ');

      // Use the mapping function for Status
      const statusExport = mapStatusToExport(c.followUpStatus);

      return [
        c.name,
        regions,
        tags,
        "",
        c.rank,
        productSummaryExport,
        c.lastStatusUpdate,
        "",
        contactNames,
        statusExport, // Col 9: Exporting Chinese
        nextStep,
        c.nextActionDate,
        "",
        interactionText,
        c.lastCustomerReplyDate,
        "",
        c.lastMyReplyDate,
        "",
        docLinks,
        contactInfos
      ].map(field => {
        const stringField = String(field || '');
        return `"${stringField.replace(/"/g, '""')}"`;
      }).join(",");
    });
    
    const csvContent = [headers.join(","), ...rows].join("\n");
    downloadCSV(csvContent, "navi_customers_master_export.csv");
  };

  const handleExportSamples = () => {
    const headers = [
      "Customer Name", "Serial #", "Sample Name", "Category", "Form", "Quantity", "Status", "Status Date", "Details", "Tracking #"
    ];

    const rows = samples.map(s => {
       return [
         s.customerName,
         s.serialNumber,
         s.sampleName,
         s.productCategory?.join(', '),
         s.productForm,
         s.quantity,
         s.status,
         s.lastStatusDate,
         s.statusDetails,
         s.trackingNumber
       ].map(field => {
        const stringField = String(field || '');
        return `"${stringField.replace(/"/g, '""')}"`;
      }).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    downloadCSV(csvContent, "navi_samples_master_export.csv");
  };

  const splitByDelimiter = (str: string | undefined): string[] => {
    if (!str) return [];
    return str.split('|||').map(s => s.trim()).filter(s => s.length > 0);
  };

  const normalizeDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const trimmed = dateStr.trim();
    if (!trimmed) return '';
    const yearFirstMatch = trimmed.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
    if (yearFirstMatch) {
      const y = yearFirstMatch[1];
      const m = yearFirstMatch[2].padStart(2, '0');
      const d = yearFirstMatch[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const yearLastMatch = trimmed.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
    if (yearLastMatch) {
      const p1 = parseInt(yearLastMatch[1], 10);
      const p2 = parseInt(yearLastMatch[2], 10);
      const y = yearLastMatch[3];
      let m, d;
      if (p1 > 12) {
         d = p1.toString().padStart(2, '0');
         m = p2.toString().padStart(2, '0');
      } else {
         m = p1.toString().padStart(2, '0');
         d = p2.toString().padStart(2, '0');
      }
      return `${y}-${m}-${d}`;
    }
    const dateObj = new Date(trimmed);
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getFullYear();
      const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const d = dateObj.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
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
          const name = cols[0] || 'Unknown';
          const regions = splitByDelimiter(cols[1]);
          const finalRegions = regions.length > 0 ? regions : ['Unknown'];
          const rawTags = splitByDelimiter(cols[2]);
          const cleanTags = rawTags.map(t => t.replace(/^\d+[\.\、\s]*\s*/, ''));
          const rank = (parseInt(cols[4]) || 3) as Rank;
          const productSummary = (cols[5] || '').replace(/\|\|\|/g, '\n');
          const lastStatusUpdate = normalizeDate(cols[6]);
          
          // Use mapping helper for Status (Col 9)
          const followUpStatus = mapStatusFromImport(cols[9]);
          
          const nextSteps = cols[10] || '';
          const nextActionDate = normalizeDate(cols[11]);
          const lastCustomerReplyDate = normalizeDate(cols[14]);
          const lastMyReplyDate = normalizeDate(cols[16]);
          const docLinks = splitByDelimiter(cols[18]);
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
          if (contacts.length === 0 && contactNames.length === 0 && contactInfos.length > 0) {
             contacts.push({ name: 'Primary Contact', title: '', email: contactInfos[0].includes('@') ? contactInfos[0] : '', phone: ''});
          }
          const rawInteractions = splitByDelimiter(cols[13]);
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
               id: `int_${tempId}_${i}`,
               date: date,
               summary: summary,
               tags: []
             };
          }).reverse();
          if (interactions.length === 0 && nextSteps) {
             interactions.push({
               id: `int_${tempId}_next`,
               date: new Date().toISOString().split('T')[0],
               summary: 'Pending Next Step',
               nextSteps: nextSteps
             });
          } else if (interactions.length > 0 && nextSteps) {
             interactions[0].nextSteps = nextSteps;
          }

          return {
            id: `new_c_${tempId}`,
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

        } else {
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
                    Note: For Customers, data with the same Name will overwrite existing records (Upsert). Fields with "|||" will be split into lists. Status (Col 10) supports "我方跟进", "等待对方", "暂无".
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
          <Button variant="secondary" onClick={handleExportSamples} className="w-full flex justify-center items-center gap-2">
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
