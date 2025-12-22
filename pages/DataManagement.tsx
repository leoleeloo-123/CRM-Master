import React, { useState, useRef } from 'react';
import { Customer, Sample, Rank, SampleStatus, ProductCategory, Interaction, CrystalType, ProductForm, TestStatus } from '../types';
import { Card, Button, Badge, Modal, RankStars } from '../components/Common';
// Added Trash2, Users, and FlaskConical to the imports
import { Upload, FileSpreadsheet, Search, Database, CheckCircle2, AlertTriangle, Info, Trash2, Users, FlaskConical } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface DataManagementProps {
  onImportCustomers: (newCustomers: Customer[], override?: boolean) => void;
  onImportSamples: (newSamples: Sample[], override?: boolean) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ 
  onImportCustomers, 
  onImportSamples
}) => {
  const { t, customers, samples, clearDatabase, companyName, userName } = useApp();
  const [activeTab, setActiveTab] = useState<'customers' | 'samples'>('customers');
  const [panelMode, setPanelMode] = useState<'import' | 'review' | 'preview'>('import');
  const [importData, setImportData] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [importOption, setImportOption] = useState<'merge' | 'replace'>('merge');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      const tsv = data.map((row: any) => row.join('\t')).join('\n');
      setImportData(tsv);
      handleParseImport(tsv);
    };
    reader.readAsBinaryString(file);
  };

  const handleParseImport = (dataToParse: string = importData) => {
    if (!dataToParse.trim()) return;
    
    const rows = dataToParse.split('\n').map(row => row.split('\t').map(cell => cell.trim()));
    if (rows.length < 2) return;

    const headers = rows[0].map(h => h.toLowerCase());
    const dataRows = rows.slice(1);

    if (activeTab === 'customers') {
      const parsed = dataRows.filter(r => r.length > 1 && r[0]).map((row, idx) => {
        const getVal = (h: string) => {
          const i = headers.findIndex(header => header.includes(h.toLowerCase()));
          return i !== -1 ? row[i] : '';
        };

        const rawRank = getVal('rank') || getVal('importance') || getVal('等级');
        let rank: Rank = 3;
        if (rawRank.includes('1') || rawRank.toLowerCase().includes('high')) rank = 1;
        else if (rawRank.includes('2')) rank = 2;
        else if (rawRank.includes('4')) rank = 4;
        else if (rawRank.includes('5')) rank = 5;

        const regionStr = getVal('region') || getVal('地区');
        const region = regionStr ? regionStr.split(/[|,&]/).map(s => s.trim()) : ['Global'];

        return {
          id: `imp_c_${idx}_${Date.now()}`,
          name: getVal('name') || getVal('customer') || getVal('客户'),
          region: region,
          rank: rank,
          status: 'Active',
          productSummary: getVal('summary') || getVal('总结'),
          lastStatusUpdate: getVal('update') || format(new Date(), 'yyyy-MM-dd'),
          followUpStatus: getVal('status') || getVal('跟进') || 'No Action',
          contacts: [],
          lastContactDate: format(new Date(), 'yyyy-MM-dd'),
          tags: (getVal('tags') || getVal('exhibition') || getVal('展会')).split(',').filter(s => s.trim()),
          interactions: []
        } as Customer;
      });
      setParsedData(parsed);
    } else {
      const parsed = dataRows.filter(r => r.length > 1 && r[0]).map((row, idx) => {
        const getVal = (h: string) => {
          const i = headers.findIndex(header => header.includes(h.toLowerCase()));
          return i !== -1 ? row[i] : '';
        };

        return {
          id: `imp_s_${idx}_${Date.now()}`,
          customerName: getVal('customer') || getVal('客户'),
          sampleIndex: parseInt(getVal('idx') || getVal('序号')) || idx + 1,
          sampleName: getVal('product') || getVal('产品') || getVal('name') || 'Unnamed Sample',
          status: getVal('status') || getVal('状态') || 'Requested',
          testStatus: (getVal('test') || getVal('测试')).toLowerCase().includes('finish') ? 'Finished' : 'Ongoing',
          quantity: getVal('qty') || getVal('quantity') || getVal('数量'),
          lastStatusDate: format(new Date(), 'yyyy-MM-dd'),
          requestDate: getVal('date') || getVal('日期') || format(new Date(), 'yyyy-MM-dd'),
          statusDetails: getVal('details') || getVal('详情')
        } as Partial<Sample>;
      });
      setParsedData(parsed);
    }
    setPanelMode('preview');
  };

  const executeImport = () => {
    if (activeTab === 'customers') {
      onImportCustomers(parsedData, importOption === 'replace');
    } else {
      // For samples, we need to map customerName back to customerId
      const mappedSamples = parsedData.map(s => {
        const found = customers.find(c => c.name.toLowerCase() === s.customerName.toLowerCase());
        return { ...s, customerId: found ? found.id : 'unknown' } as Sample;
      });
      onImportSamples(mappedSamples, importOption === 'replace');
    }
    setPanelMode('review');
    setParsedData([]);
    setImportData('');
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

    XLSX.writeFile(wb, `Navi_Material_DB_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const filteredReviewData = () => {
    const data = activeTab === 'customers' ? customers : samples;
    if (!reviewSearch) return data;
    const term = reviewSearch.toLowerCase();
    return data.filter((item: any) => 
      (item.name || item.customerName || '').toLowerCase().includes(term) ||
      (item.sampleSKU || '').toLowerCase().includes(term) ||
      (item.status || '').toLowerCase().includes(term)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('dataManagement')}</h2>
          <p className="text-slate-500 dark:text-slate-400">Bulk Import / Database Review</p>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" onClick={handleExportExcel} className="flex items-center gap-2"><FileSpreadsheet size={16} /> Export Excel</Button>
           <Button variant="danger" onClick={() => setIsClearModalOpen(true)}><Trash2 size={16} /> Clear DB</Button>
        </div>
      </div>

      <Card className="p-0 border-l-0 overflow-hidden min-h-[600px] flex flex-col">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 m-4 rounded-xl w-fit">
           <button onClick={() => { setPanelMode('import'); setParsedData([]); }} className={`px-6 py-2 text-sm font-bold rounded-lg flex items-center gap-2 ${panelMode === 'import' || panelMode === 'preview' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><Upload size={16} /> Import Tool</button>
           <button onClick={() => setPanelMode('review')} className={`px-6 py-2 text-sm font-bold rounded-lg flex items-center gap-2 ${panelMode === 'review' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><Database size={16} /> Live Database</button>
        </div>

        <div className="flex border-b bg-slate-50 dark:bg-slate-900">
           <button onClick={() => { setActiveTab('customers'); setParsedData([]); }} className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'customers' ? 'bg-white text-blue-600 border-t-4 border-t-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Users size={20} /> Customers ({customers.length})</button>
           <button onClick={() => { setActiveTab('samples'); setParsedData([]); }} className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'samples' ? 'bg-white text-blue-600 border-t-4 border-t-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><FlaskConical size={20} /> Samples ({samples.length})</button>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          {panelMode === 'import' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">Paste tab-separated data or upload an Excel file:</p>
                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-xs">
                  <FileSpreadsheet size={14} /> Upload Excel File
                </Button>
              </div>
              <textarea 
                className="w-full h-64 border rounded-lg p-3 font-mono text-xs dark:bg-slate-900 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder={`Example Headers:\nCompany\tRegion\tRank\tSummary\tExhibitions\tStatus`} 
                value={importData} 
                onChange={e => setImportData(e.target.value)} 
              />
              <Button className="w-full py-4 text-lg" onClick={() => handleParseImport()}>Parse and Review Import</Button>
            </div>
          )}

          {panelMode === 'preview' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-center gap-3 border border-blue-100 dark:border-blue-800">
                 <Info className="text-blue-600" size={20} />
                 <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Previewing {parsedData.length} entries found. Choose how to update the database.</p>
              </div>

              <div className="flex gap-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                 <button onClick={() => setImportOption('merge')} className={`flex-1 p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${importOption === 'merge' ? 'border-blue-600 bg-white dark:bg-slate-700 text-blue-600' : 'border-slate-200 dark:border-slate-600'}`}>
                    <CheckCircle2 size={24} />
                    <span className="font-bold">Merge Data</span>
                    <span className="text-[10px] opacity-60">Update existing and add new</span>
                 </button>
                 <button onClick={() => setImportOption('replace')} className={`flex-1 p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${importOption === 'replace' ? 'border-red-500 bg-white dark:bg-slate-700 text-red-500' : 'border-slate-200 dark:border-slate-600'}`}>
                    <AlertTriangle size={24} />
                    <span className="font-bold">Replace Data</span>
                    <span className="text-[10px] opacity-60">Wipe current and start fresh</span>
                 </button>
              </div>

              <div className="overflow-auto max-h-[400px] border rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 font-bold">
                    <tr>
                      <th className="p-2 border-b">Field 1</th>
                      <th className="p-2 border-b">Field 2</th>
                      <th className="p-2 border-b">Field 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2 truncate">{item.name || item.customerName}</td>
                        <td className="p-2 truncate">{item.rank || item.status}</td>
                        <td className="p-2 truncate text-slate-400">{item.productSummary || item.sampleName}</td>
                      </tr>
                    ))}
                    {parsedData.length > 10 && <tr><td colSpan={3} className="p-2 text-center text-slate-400">... and {parsedData.length - 10} more rows</td></tr>}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setPanelMode('import')}>Back to Edit</Button>
                <Button className="flex-[2]" onClick={executeImport}>Finalize Import</Button>
              </div>
            </div>
          )}

          {panelMode === 'review' && (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                <input className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-700" placeholder={`Search ${activeTab}...`} value={reviewSearch} onChange={e => setReviewSearch(e.target.value)} />
              </div>
              <div className="overflow-auto flex-1 border rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                    <tr className="border-b">
                      {activeTab === 'customers' ? (
                        <><th className="p-3">Company</th><th className="p-3">Rank</th><th className="p-3">Summary</th><th className="p-3">Status</th></>
                      ) : (
                        <><th className="p-3">Customer</th><th className="p-3">Idx</th><th className="p-3">Sample Name</th><th className="p-3">Status</th><th className="p-3">Test</th></>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviewData().map((item: any, i: number) => (
                      <tr key={i} className="border-t hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        {activeTab === 'customers' ? (
                          <>
                            <td className="p-3 font-bold">{item.name}</td>
                            <td className="p-3"><RankStars rank={item.rank} /></td>
                            <td className="p-3 text-xs truncate max-w-xs">{item.productSummary}</td>
                            <td className="p-3"><Badge color="blue">{item.followUpStatus}</Badge></td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 font-bold">{item.customerName}</td>
                            <td className="p-3">#{item.sampleIndex}</td>
                            <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{item.sampleName}</td>
                            <td className="p-3"><Badge color="blue">{item.status}</Badge></td>
                            <td className="p-3">
                               {item.testStatus === 'Ongoing' ? (
                                  <Badge color="yellow">Open</Badge>
                               ) : item.testStatus === 'Terminated' ? (
                                  <Badge color="red">Terminated</Badge>
                               ) : (
                                  <Badge color="green">Done</Badge>
                               )}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {filteredReviewData().length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-400">No records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="Clear Database">
        <div className="space-y-4">
           <p className="text-red-600 font-bold">This is irreversible. All data (customers, samples, and logs) will be wiped.</p>
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