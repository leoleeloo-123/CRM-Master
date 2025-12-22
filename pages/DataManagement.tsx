
import React, { useState, useRef } from 'react';
import { Customer, Sample, Rank, SampleStatus, ProductCategory, Interaction, CrystalType, ProductForm, TestStatus } from '../types';
import { Card, Button, Badge, Modal, RankStars } from '../components/Common';
import { Upload, FileSpreadsheet, Search, Database, CheckCircle2, AlertTriangle, Info, Trash2, Users, FlaskConical, FileText, ArrowRight, Check } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface DataManagementProps {
  onImportCustomers: (newCustomers: Customer[], override?: boolean) => void;
  onImportSamples: (newSamples: Sample[], override?: boolean) => void;
}

interface PendingData {
  customers: Customer[];
  samples: Partial<Sample>[];
  sourceFile?: string;
}

const DataManagement: React.FC<DataManagementProps> = ({ 
  onImportCustomers, 
  onImportSamples
}) => {
  const { t, customers, samples, clearDatabase } = useApp();
  const [activeTab, setActiveTab] = useState<'customers' | 'samples'>('customers');
  const [panelMode, setPanelMode] = useState<'import' | 'review' | 'preview'>('import');
  
  const [importDataText, setImportDataText] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [pendingData, setPendingData] = useState<PendingData>({ customers: [], samples: [] });
  const [importOption, setImportOption] = useState<'merge' | 'replace'>('merge');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Robust parsing for a single row of data based on headers
  const mapRowToCustomer = (row: any[], headers: string[], idx: number): Customer => {
    const getVal = (possibleHeaders: string[]) => {
      const foundIdx = headers.findIndex(h => possibleHeaders.some(ph => h.includes(ph.toLowerCase())));
      return foundIdx !== -1 ? String(row[foundIdx] || '').trim() : '';
    };

    const rawRank = getVal(['rank', '等级', 'importance', 'priority']);
    let rank: Rank = 3;
    if (rawRank.includes('1') || rawRank.toLowerCase().includes('high')) rank = 1;
    else if (rawRank.includes('2')) rank = 2;
    else if (rawRank.includes('4')) rank = 4;
    else if (rawRank.includes('5')) rank = 5;

    const regionStr = getVal(['region', '地区', 'location', 'area']);
    const region = regionStr ? regionStr.split(/[|,&]/).map(s => s.trim()) : ['Global'];

    return {
      id: `imp_c_${idx}_${Date.now()}`,
      name: getVal(['name', 'customer', '客户', 'company', '企业']),
      region,
      rank,
      status: 'Active',
      productSummary: getVal(['summary', '总结', 'product', 'detail', '摘要']),
      lastStatusUpdate: getVal(['update', '更新', 'date']) || format(new Date(), 'yyyy-MM-dd'),
      followUpStatus: getVal(['status', '跟进', 'state', '进度']) || 'No Action',
      contacts: [],
      lastContactDate: format(new Date(), 'yyyy-MM-dd'),
      tags: getVal(['exhibition', '展会', 'tag', '标签']).split(/[;,]/).map(s => s.trim()).filter(s => s),
      interactions: []
    } as Customer;
  };

  const mapRowToSample = (row: any[], headers: string[], idx: number): Partial<Sample> => {
    const getVal = (possibleHeaders: string[]) => {
      const foundIdx = headers.findIndex(h => possibleHeaders.some(ph => h.includes(ph.toLowerCase())));
      return foundIdx !== -1 ? String(row[foundIdx] || '').trim() : '';
    };

    const testVal = getVal(['test', '测试', 'progress', '进度']).toLowerCase();
    const testStatus: TestStatus = testVal.includes('finish') || testVal.includes('完成') || testVal.includes('done') 
      ? 'Finished' 
      : testVal.includes('term') || testVal.includes('终止') 
        ? 'Terminated' 
        : 'Ongoing';

    return {
      id: `imp_s_${idx}_${Date.now()}`,
      customerName: getVal(['customer', '客户', 'client', 'company']),
      sampleIndex: parseInt(getVal(['idx', '序号', 'index', 'number'])) || idx + 1,
      sampleName: getVal(['product', '产品', 'name', 'item', '名称']),
      sampleSKU: getVal(['sku', '编号', 'code']),
      status: getVal(['status', '状态', 'stage', '当前状态']) || 'Requested',
      testStatus,
      crystalType: getVal(['crystal', '晶体', 'type']) as CrystalType,
      productForm: getVal(['form', '形态', 'shape']) as ProductForm,
      originalSize: getVal(['original', '原料', 'size', '粒度']),
      processedSize: getVal(['processed', '加工', 'after']),
      quantity: getVal(['qty', 'quantity', '数量', 'amount']),
      lastStatusDate: getVal(['date', '日期', 'update', '更新时间']) || format(new Date(), 'yyyy-MM-dd'),
      requestDate: getVal(['request', '申请日期', 'start']) || format(new Date(), 'yyyy-MM-dd'),
      statusDetails: getVal(['details', '详情', 'history', '日志'])
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      
      const allDetectedCustomers: Customer[] = [];
      const allDetectedSamples: Partial<Sample>[] = [];

      wb.SheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (data.length < 2) return;

        const headers = data[0].map(h => String(h || '').toLowerCase());
        const dataRows = data.slice(1);

        // Advanced sheet detection
        const customerScore = headers.filter(h => ['客户', 'customer', 'rank', '等级', '地区', '总结'].some(k => h.includes(k))).length;
        const sampleScore = headers.filter(h => ['idx', '序号', 'sample', '样品', '测试', '规格'].some(k => h.includes(k))).length;

        if (customerScore > sampleScore && customerScore >= 2) {
          const sheetCustomers = dataRows.filter(r => r[0]).map((row, idx) => mapRowToCustomer(row, headers, idx));
          allDetectedCustomers.push(...sheetCustomers);
        } else if (sampleScore >= 2) {
          const sheetSamples = dataRows.filter(r => r[0]).map((row, idx) => mapRowToSample(row, headers, idx));
          allDetectedSamples.push(...sheetSamples);
        }
      });

      if (allDetectedCustomers.length === 0 && allDetectedSamples.length === 0) {
        alert("Could not identify valid data in this file. Please ensure headers match English or Chinese keywords.");
        return;
      }

      setPendingData({
        customers: allDetectedCustomers,
        samples: allDetectedSamples,
        sourceFile: file.name
      });
      setPanelMode('preview');
    };
    reader.readAsBinaryString(file);
  };

  const handleParseTextImport = () => {
    if (!importDataText.trim()) return;
    const rows = importDataText.split('\n').map(row => row.split('\t').map(cell => cell.trim()));
    if (rows.length < 2) return;

    const headers = rows[0].map(h => h.toLowerCase());
    const dataRows = rows.slice(1);

    if (activeTab === 'customers') {
      const parsed = dataRows.filter(r => r.length > 1 && r[0]).map((row, idx) => mapRowToCustomer(row, headers, idx));
      setPendingData({ customers: parsed, samples: [] });
    } else {
      const parsed = dataRows.filter(r => r.length > 1 && r[0]).map((row, idx) => mapRowToSample(row, headers, idx));
      setPendingData({ customers: [], samples: parsed });
    }
    setPanelMode('preview');
  };

  const executeImport = () => {
    // 1. Handle Customers
    if (pendingData.customers.length > 0) {
      onImportCustomers(pendingData.customers, importOption === 'replace');
    }
    
    // 2. Handle Samples (Wait for ID mapping if needed)
    if (pendingData.samples.length > 0) {
      // If we are replacing, we might not have the customers state updated yet. 
      // We rely on the name-based mapping in the child/parent logic.
      const mappedSamples = pendingData.samples.map(s => {
        // Try to find in current list or in the pending list
        const foundInExisting = customers.find(c => c.name.toLowerCase() === s.customerName?.toLowerCase());
        const foundInPending = pendingData.customers.find(c => c.name.toLowerCase() === s.customerName?.toLowerCase());
        
        return { 
          ...s, 
          customerId: foundInPending ? foundInPending.id : (foundInExisting ? foundInExisting.id : 'unknown') 
        } as Sample;
      });
      onImportSamples(mappedSamples, importOption === 'replace');
    }

    setPanelMode('review');
    setPendingData({ customers: [], samples: [] });
    setImportDataText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const custHeaders = ["客户", "地区", "展会", "等级", "总结", "更新日期", "跟进状态"];
    const custRows = customers.map(c => [c.name, c.region.join(' | '), c.tags.join(', '), c.rank, c.productSummary, c.lastStatusUpdate, c.followUpStatus]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([custHeaders, ...custRows]), "Customers");
    
    const sampHeaders = ["Customer", "Idx", "Product Name", "Status", "Test Progress", "Quantity", "Date"];
    const sampRows = samples.map(s => [
      s.customerName, s.sampleIndex, s.sampleName, s.status, s.testStatus, s.quantity, s.lastStatusDate
    ]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([sampHeaders, ...sampRows]), "Samples");

    XLSX.writeFile(wb, `Navi_MasterDB_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const filteredReviewData = () => {
    const data = activeTab === 'customers' ? customers : samples;
    if (!reviewSearch) return data;
    const term = reviewSearch.toLowerCase();
    return data.filter((item: any) => 
      (item.name || item.customerName || '').toLowerCase().includes(term) ||
      (item.sampleName || '').toLowerCase().includes(term)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl xl:text-4xl font-bold text-slate-800 dark:text-white">{t('dataManagement')}</h2>
          <p className="text-slate-500 dark:text-slate-400">Master Excel Import & Database Control</p>
        </div>
        <div className="flex gap-3">
           <Button variant="secondary" onClick={handleExportExcel} className="flex items-center gap-2"><FileSpreadsheet size={18} /> Export Excel</Button>
           <Button variant="danger" onClick={() => setIsClearModalOpen(true)} className="flex items-center gap-2"><Trash2 size={18} /> Clear DB</Button>
        </div>
      </div>

      <Card className="p-0 border-l-0 overflow-hidden min-h-[650px] flex flex-col shadow-lg">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 m-4 rounded-xl w-fit shadow-inner">
           <button 
             onClick={() => { setPanelMode('import'); setPendingData({customers:[], samples:[]}); }} 
             className={`px-8 py-2.5 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${panelMode === 'import' || panelMode === 'preview' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Upload size={18} /> Import Wizard
           </button>
           <button 
             onClick={() => setPanelMode('review')} 
             className={`px-8 py-2.5 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${panelMode === 'review' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Database size={18} /> Database View
           </button>
        </div>

        {panelMode !== 'preview' && (
          <div className="flex border-b bg-slate-50 dark:bg-slate-900">
             <button onClick={() => setActiveTab('customers')} className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-all border-b-4 ${activeTab === 'customers' ? 'bg-white text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
               <Users size={20} /> Customers ({customers.length})
             </button>
             <button onClick={() => setActiveTab('samples')} className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-all border-b-4 ${activeTab === 'samples' ? 'bg-white text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
               <FlaskConical size={20} /> Samples ({samples.length})
             </button>
          </div>
        )}

        <div className="p-8 flex-1 flex flex-col">
          {panelMode === 'import' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet size={48} />
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold text-lg text-slate-800 dark:text-white">Upload Excel File</h4>
                    <p className="text-sm text-slate-500">Auto-scans and identifies all tabs</p>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                  <Button variant="secondary" className="mt-2">Choose File</Button>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-end">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Paste Data Rows</label>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Target: {activeTab}</span>
                  </div>
                  <textarea 
                    className="flex-1 min-h-[200px] border rounded-xl p-4 font-mono text-xs dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder={`Paste rows from your Excel tab here...`} 
                    value={importDataText} 
                    onChange={e => setImportDataText(e.target.value)} 
                  />
                  <Button className="py-3" onClick={handleParseTextImport} disabled={!importDataText.trim()}>Parse Text Data</Button>
                </div>
              </div>
            </div>
          )}

          {panelMode === 'preview' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 flex-1 flex flex-col">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg"><CheckCircle2 size={28} /></div>
                    <div>
                       <h3 className="font-extrabold text-blue-900 dark:text-blue-200 text-xl">Import Ready</h3>
                       <p className="text-sm text-blue-700 dark:text-blue-400">File: <span className="font-bold">{pendingData.sourceFile || 'Pasted Content'}</span></p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="text-center bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm border">
                       <div className="text-xl font-black text-blue-600">{pendingData.customers.length}</div>
                       <div className="text-[10px] font-bold uppercase text-slate-400">Found Customers</div>
                    </div>
                    <div className="text-center bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm border">
                       <div className="text-xl font-black text-blue-600">{pendingData.samples.length}</div>
                       <div className="text-[10px] font-bold uppercase text-slate-400">Found Samples</div>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${importOption === 'merge' ? 'border-blue-600 bg-blue-50/30' : 'border-slate-200'}`} onClick={() => setImportOption('merge')}>
                    <Check size={20} className={importOption === 'merge' ? 'text-blue-600' : 'text-slate-300'} />
                    <div><div className="font-bold">Smart Merge</div><p className="text-[10px] text-slate-500">Update existing and add new records.</p></div>
                 </div>
                 <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${importOption === 'replace' ? 'border-red-600 bg-red-50/30' : 'border-slate-200'}`} onClick={() => setImportOption('replace')}>
                    <AlertTriangle size={20} className={importOption === 'replace' ? 'text-red-600' : 'text-slate-300'} />
                    <div><div className="font-bold">Full Replace</div><p className="text-[10px] text-slate-500">Clear database and start with this file.</p></div>
                 </div>
              </div>

              <div className="flex-1 overflow-hidden border rounded-xl flex flex-col bg-white dark:bg-slate-900">
                 <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-bold text-xs uppercase text-slate-500 border-b">
                   Data Preview (Reviewing records from file)
                 </div>
                 <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 font-bold border-b z-10">
                        <tr>
                          <th className="p-3 border-r">Type</th>
                          <th className="p-3 border-r">Company/Name</th>
                          <th className="p-3 border-r">Specs/Rank</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingData.customers.slice(0, 5).map((c, idx) => (
                          <tr key={`c-${idx}`} className="border-b bg-green-50/30 dark:bg-emerald-900/10">
                            <td className="p-3 font-bold text-emerald-600 border-r">CUSTOMER</td>
                            <td className="p-3 font-bold border-r">{c.name}</td>
                            <td className="p-3 border-r">Rank {c.rank}</td>
                            <td className="p-3"><Badge color="green">{c.followUpStatus}</Badge></td>
                          </tr>
                        ))}
                        {pendingData.samples.slice(0, 10).map((s, idx) => (
                          <tr key={`s-${idx}`} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                            <td className="p-3 font-bold text-blue-600 border-r">SAMPLE</td>
                            <td className="p-3 border-r">
                               <div className="font-bold">{s.customerName}</div>
                               <div className="text-[10px] text-slate-500">{s.sampleName}</div>
                            </td>
                            <td className="p-3 border-r">
                               {s.crystalType} | {s.originalSize}
                            </td>
                            <td className="p-3">
                               <Badge color="blue">{s.status}</Badge>
                            </td>
                          </tr>
                        ))}
                        {(pendingData.customers.length === 0 && pendingData.samples.length === 0) && (
                          <tr><td colSpan={4} className="p-10 text-center text-slate-400 italic">No valid data rows found in preview.</td></tr>
                        )}
                      </tbody>
                    </table>
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="secondary" className="flex-1 py-4" onClick={() => setPanelMode('import')}>Cancel</Button>
                <Button className="flex-[2] py-4 text-lg" onClick={executeImport}>Finalize Import</Button>
              </div>
            </div>
          )}

          {panelMode === 'review' && (
            <div className="space-y-4 flex-1 flex flex-col animate-in fade-in">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input className="w-full pl-10 pr-4 py-3 border rounded-xl dark:bg-slate-900 dark:border-slate-700" placeholder={`Search ${activeTab}...`} value={reviewSearch} onChange={e => setReviewSearch(e.target.value)} />
              </div>
              <div className="overflow-auto flex-1 border rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                    <tr className="border-b">
                      {activeTab === 'customers' ? (
                        <><th className="p-4">Company</th><th className="p-4">Rank</th><th className="p-4">Summary</th><th className="p-4 text-right">Status</th></>
                      ) : (
                        <><th className="p-4">Customer</th><th className="p-4">Idx</th><th className="p-4">Sample Name</th><th className="p-4">Status</th><th className="p-4 text-right">Test</th></>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviewData().map((item: any, i: number) => (
                      <tr key={i} className="border-t hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        {activeTab === 'customers' ? (
                          <>
                            <td className="p-4 font-bold">{item.name}</td>
                            <td className="p-4"><RankStars rank={item.rank} /></td>
                            <td className="p-4 text-xs truncate max-w-xs">{item.productSummary}</td>
                            <td className="p-4 text-right"><Badge color="blue">{item.followUpStatus}</Badge></td>
                          </>
                        ) : (
                          <>
                            <td className="p-4 font-bold">{item.customerName}</td>
                            <td className="p-4">#{item.sampleIndex}</td>
                            <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{item.sampleName}</td>
                            <td className="p-4"><Badge color="blue">{item.status}</Badge></td>
                            <td className="p-4 text-right">
                               {item.testStatus === 'Ongoing' ? <Badge color="yellow">Ongoing</Badge> : item.testStatus === 'Terminated' ? <Badge color="red">Terminated</Badge> : <Badge color="green">Finished</Badge>}
                            </td>
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
        <div className="space-y-6">
           <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-4 text-red-600 dark:text-red-400">
              <AlertTriangle size={32} />
              <p className="font-bold">This is irreversible. All data will be wiped instantly.</p>
           </div>
           <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsClearModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => { clearDatabase(); setIsClearModalOpen(false); }}>Yes, Delete Everything</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default DataManagement;
