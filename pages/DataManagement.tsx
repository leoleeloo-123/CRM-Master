
import React, { useState } from 'react';
import { Customer, Sample, Rank, SampleStatus, CustomerStatus, FollowUpStatus, ProductCategory, ProductForm, Interaction } from '../types';
import { Card, Button, Badge, Modal } from '../components/Common';
import { Download, Upload, FileText, AlertCircle, CheckCircle2, Users, FlaskConical, Search, X, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface DataManagementProps {
  customers: Customer[];
  samples: Sample[];
  onImportCustomers: (newCustomers: Customer[]) => void;
  onImportSamples: (newSamples: Sample[]) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ customers, samples, onImportCustomers, onImportSamples }) => {
  const { t, clearDatabase } = useApp();
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
    const headers = [
      "ID", "Name", "Tags (Exhibitions)", "Rank", "Status", "Product Summary", "Last Status Update", 
      "FollowUp Status", "Next Action Date", "Last Contact", "Last Customer Reply", "Last My Reply",
      "Key Contact Name", "Key Contact Email"
    ];
    
    const rows = customers.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.tags.join('; ').replace(/"/g, '""')}"`,
      c.rank,
      c.status,
      `"${c.productSummary.replace(/"/g, '""')}"`,
      c.lastStatusUpdate,
      c.followUpStatus,
      c.nextActionDate,
      c.lastContactDate,
      c.lastCustomerReplyDate,
      c.lastMyReplyDate,
      c.contacts[0]?.name || '',
      c.contacts[0]?.email || ''
    ].join(","));
    
    const csvContent = [headers.join(","), ...rows].join("\n");
    downloadCSV(csvContent, "navi_customers_master.csv");
  };

  const splitByDelimiter = (str: string | undefined): string[] => {
    if (!str) return [];
    return str.split('|||').map(s => s.trim()).filter(s => s.length > 0);
  };

  // Helper to ensure dates are YYYY-MM-DD
  const normalizeDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const trimmed = dateStr.trim();
    if (!trimmed) return '';

    // Split by any non-digit char
    const parts = trimmed.split(/[^0-9]/).filter(p => p.length > 0);
    
    if (parts.length >= 3) {
      // Assume YYYY MM DD order if first part is 4 digits
      if (parts[0].length === 4) {
        const y = parts[0];
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
    
    // Fallback replacement if regex fail, try basic replacement
    return trimmed.replace(/[\.\/]/g, '-');
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
          // Column Mapping:
          // 0: 客户 (Name)
          // 1: 展会 (Tags) -> Clean numbering
          // 2: 展会官网 (Ignored)
          // 3: 等级 (Rank)
          // 4: 状态与产品总结 (Summary)
          // 5: 状态更新 (Last Update)
          // 6: 未更新 (Skipped)
          // 7: 对接人员 (Contact Name List) -> Zip with Col 18
          // 8: 状态 (FollowUp Status)
          // 9: 下一步 (Next Step)
          // 10: 关键日期 (Next Action Date)
          // 11: DDL (Skipped)
          // 12: 对接流程总结 (Interaction List) -> Extract Date 【】
          // 13: 对方回复 (Last Customer Reply)
          // 14: 未回复 (Skipped)
          // 15: 我方跟进 (Last My Reply)
          // 16: 未跟进 (Skipped)
          // 17: 文档超链接 (Doc Links)
          // 18: 联系方式 (Contact Info List) -> Zip with Col 7

          const name = cols[0] || 'Unknown';
          
          // 1. Tags Parsing: Remove "1.", "1、" etc.
          const rawTags = splitByDelimiter(cols[1]);
          const cleanTags = rawTags.map(t => t.replace(/^\d+[\.\、\s]*\s*/, ''));

          const rank = (parseInt(cols[3]) || 3) as Rank;
          const productSummary = cols[4] || '';
          
          // Normalize Dates
          const lastStatusUpdate = normalizeDate(cols[5]);
          
          const followUpStatus = (cols[8] as FollowUpStatus) || 'No Action';
          const nextSteps = cols[9] || '';
          
          const nextActionDate = normalizeDate(cols[10]);
          const lastCustomerReplyDate = normalizeDate(cols[13]);
          const lastMyReplyDate = normalizeDate(cols[15]);
          
          // 3. Document Links Parsing
          const docLinks = splitByDelimiter(cols[17]);

          // 2. Contacts Parsing: Zip Names (Col 7) and Info (Col 18)
          const contactNames = splitByDelimiter(cols[7]);
          const contactInfos = splitByDelimiter(cols[18]);
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
          const rawInteractions = splitByDelimiter(cols[12]);
          
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
            region: 'Unknown',
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
                      ? "1.客户 | 2.展会 | 3.展会官网(Ignore) | 4.等级 | 5.状态与产品总结 | 6.状态更新 | 7.未更新(Ignore) | 8.对接人员 | 9.状态(My Turn/etc) | 10.下一步 | 11.关键日期 | 12.DDL(Ignore) | 13.对接流程总结 | 14.对方回复 | 15.未回复(Ignore) | 16.我方跟进 | 17.未跟进(Ignore) | 18.文档超链接 | 19.联系方式"
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
