'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar'; 
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  AlertCircle, 
  X, 
  TrendingDown, 
  Download, 
  DollarSign,
  Briefcase,
  CheckCircle2,
  Info,
  Clock,
  Building2,
  FileText
} from 'lucide-react';

interface Despesa {
  id: number;
  exercicio: number;
  numeroEmpenho: string;
  dataEmpenho: string;
  orgaoNome: string;
  unidadeNome: string;
  funcao: string;
  subfuncao: string;
  programa: string;
  elementoDespesa: string;
  fonteRecursos: string;
  historicoObjetivo: string;
  modalidadeLicitacao: string;
  valorEmpenhado: number;
  valorLiquidado: number;
  dataLiquidacao: string;
  valorPago: number;
  dataPagamento: string;
  credor?: {
    razaoSocial: string;
    cpfCnpj: string;
  };
}

interface Resumo {
  valorEmpenhado: number;
  valorLiquidado: number;
  valorPago: number;
}

export default function DespesasPage() {
  const [data, setData] = useState<any>(null);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [anos, setAnos] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Estados dos Filtros e Modal
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDespesa, setSelectedDespesa] = useState<Despesa | null>(null);
  
  const [fAno, setFAno] = useState<string>('');
  const [fCredor, setFCredor] = useState('');
  const [fEmpenho, setFEmpenho] = useState('');
  const [fElemento, setFElemento] = useState('');

  useEffect(() => {
    api.get('/despesas/anos').then(res => {
      setAnos(res.data);
      if (res.data.length > 0 && !fAno) setFAno(res.data[0].toString());
    }).catch(() => console.error("Erro ao carregar anos"));
  }, []);

  const fetchResumo = useCallback(async () => {
    if (!fAno) return;
    try {
      const res = await api.get(`/despesas/resumo?ano=${fAno}`);
      setResumo(res.data);
    } catch (err) { console.error("Erro ao carregar resumo"); }
  }, [fAno]);

  const fetchDespesas = useCallback(async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      let params = `page=${pageNumber}&size=20&sort=dataEmpenho,desc`;
      if (fAno) params += `&ano=${fAno}`;
      if (fCredor) params += `&credor=${encodeURIComponent(fCredor)}`;
      if (fEmpenho) params += `&numeroEmpenho=${encodeURIComponent(fEmpenho)}`;
      if (fElemento) params += `&elementoDespesa=${encodeURIComponent(fElemento)}`;

      const response = await api.get(`/despesas?${params}`);
      setData(response.data);
      setPage(pageNumber);
    } catch (err) {
      setError("Falha ao carregar despesas. Verifique a conexão.");
    } finally { setLoading(false); }
  }, [fAno, fCredor, fEmpenho, fElemento]);

  useEffect(() => { 
    fetchDespesas(page); 
    fetchResumo();
  }, [page, fetchDespesas, fetchResumo]);

  const formatMoney = (val?: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const formatDate = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '---';

  const maskDocumento = (val?: string) => {
    if (!val) return "---";
    if (val.length === 11) return `${val.substring(0, 3)}.***.***-${val.substring(9)}`;
    return `${val.substring(0, 2)}.***.***/****-${val.substring(12)}`;
  };

  const handleExportCSV = () => {
    if (!data?.content?.length) return alert("Sem dados para exportar.");
    const headers = ["Empenho", "Data", "Credor", "Documento", "Elemento", "Empenhado", "Liquidado", "Pago"];
    const rows = data.content.map((d: Despesa) => [
      d.numeroEmpenho, d.dataEmpenho, `"${d.credor?.razaoSocial}"`, d.credor?.cpfCnpj, d.elementoDespesa, d.valorEmpenhado, d.valorLiquidado, d.valorPago
    ]);
    const csvContent = [headers.join(";"), ...rows.map((r: any[]) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Export_Despesas_${fAno}_${new Date().getTime()}.csv`);
    link.click();
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto relative z-0">
        
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-black text-white rounded-lg"><TrendingDown size={24} /></div>
             <div>
               <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Despesas Públicas</h2>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">Gestão de Empenhos e Pagamentos</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm font-bold text-xs uppercase text-slate-600 hover:text-black transition-all">
              <Download size={14} className="mr-2" /> Exportar CSV
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center px-4 py-2 border rounded-xl shadow-sm font-bold text-xs uppercase transition-all ${showFilters ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              <Filter size={14} className="mr-2" /> {showFilters ? 'Ocultar Filtros' : 'Filtrar'}
            </button>
          </div>
        </header>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <CardResumo icon={<DollarSign/>} label="Empenhado" value={resumo?.valorEmpenhado} color="amber" ano={fAno} />
          <CardResumo icon={<Briefcase/>} label="Liquidado" value={resumo?.valorLiquidado} color="blue" ano={fAno} />
          <CardResumo icon={<CheckCircle2/>} label="Pago" value={resumo?.valorPago} color="emerald" ano={fAno} />
        </div>

        {/* FILTROS */}
        {showFilters && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Exercício</label>
                <select value={fAno} onChange={(e) => { setFAno(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                  <option value="">Todos</option>
                  {anos.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Favorecido (Nome/CNPJ)</label>
                <input type="text" placeholder="Buscar credor..." value={fCredor} onChange={(e) => { setFCredor(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nº Empenho</label>
                <input type="text" placeholder="Ex: 2025/001" value={fEmpenho} onChange={(e) => { setFEmpenho(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div className="flex justify-end">
                <button onClick={() => {setFAno(''); setFCredor(''); setFEmpenho(''); setPage(0);}} className="px-4 py-2 text-[10px] font-bold text-red-500 uppercase flex items-center gap-1 hover:bg-red-50 rounded-lg">
                  <X size={14} /> Limpar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TABELA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Empenho</th>
                  <th className="px-6 py-4">Favorecido</th>
                  <th className="px-6 py-4 text-right">Empenhado</th>
                  <th className="px-6 py-4 text-right">Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? <tr className="animate-pulse"><td colSpan={4} className="h-32 bg-slate-50/20"></td></tr>
                : data?.content?.map((item: Despesa) => (
                    <tr key={item.id} onClick={() => setSelectedDespesa(item)} className="hover:bg-slate-50 transition-colors text-xs cursor-pointer group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{item.numeroEmpenho}</div>
                        <div className="text-[10px] text-slate-400">{formatDate(item.dataEmpenho)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700 group-hover:text-black">{item.credor?.razaoSocial}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{maskDocumento(item.credor?.cpfCnpj)}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-600">{formatMoney(item.valorEmpenhado)}</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">{formatMoney(item.valorPago)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {/* Paginação omitida para brevidade, mas deve ser mantida como no seu código anterior */}
        </div>

        {/* MODAL DE RASTREIO (Selo Ouro) */}
        {selectedDespesa && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Rastreio da Despesa</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Empenho: {selectedDespesa.numeroEmpenho}</p>
                </div>
                <button onClick={() => setSelectedDespesa(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-8">
                <section className="grid grid-cols-2 gap-6">
                  <InfoItem icon={<Building2 size={14}/>} label="Órgão / Unidade" value={`${selectedDespesa.orgaoNome} - ${selectedDespesa.unidadeNome}`} />
                  <InfoItem icon={<FileText size={14}/>} label="Elemento de Despesa" value={selectedDespesa.elementoDespesa} />
                  <InfoItem icon={<Clock size={14}/>} label="Programa / Função" value={`${selectedDespesa.programa} (${selectedDespesa.funcao})`} />
                  <InfoItem icon={<DollarSign size={14}/>} label="Fonte de Recursos" value={selectedDespesa.fonteRecursos} />
                </section>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Histórico / Objetivo</label>
                  <p className="text-sm text-slate-600 leading-relaxed italic">"{selectedDespesa.historicoObjetivo || 'Sem descrição detalhada.'}"</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Fluxo Financeiro</h4>
                  <TimelineStep label="Empenhado" value={selectedDespesa.valorEmpenhado} date={selectedDespesa.dataEmpenho} active color="amber" />
                  <TimelineStep label="Liquidado" value={selectedDespesa.valorLiquidado} date={selectedDespesa.dataLiquidacao} active={!!selectedDespesa.dataLiquidacao} color="blue" />
                  <TimelineStep label="Pago" value={selectedDespesa.valorPago} date={selectedDespesa.dataPagamento} active={!!selectedDespesa.dataPagamento} color="emerald" />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Sub-componentes para limpeza de código
function CardResumo({ icon, label, value, color, ano }: any) {
  const colors: any = { amber: 'bg-amber-50 text-amber-600', blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600' };
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total {label} ({ano || '---'})</span>
      </div>
      <h3 className="text-2xl font-black text-slate-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)}</h3>
    </div>
  );
}

function InfoItem({ icon, label, value }: any) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">{icon} {label}</label>
      <p className="text-xs font-bold text-slate-700 line-clamp-2">{value || '---'}</p>
    </div>
  );
}

function TimelineStep({ label, value, date, active, color }: any) {
  const dotColors: any = { amber: 'bg-amber-500', blue: 'bg-blue-500', emerald: 'bg-emerald-500' };
  const textColors: any = { amber: 'text-amber-700', blue: 'text-blue-700', emerald: 'text-emerald-700' };
  
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${active ? `bg-${color}-50/30 border-${color}-100` : 'bg-slate-50 border-slate-100 opacity-50'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full ${active ? dotColors[color] : 'bg-slate-300'}`} />
        <span className={`text-xs font-black uppercase ${active ? textColors[color] : 'text-slate-400'}`}>{label}</span>
      </div>
      <div className="text-right">
        <div className="text-sm font-black text-slate-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)}</div>
        <div className="text-[10px] font-bold text-slate-400">{date ? new Date(date).toLocaleDateString('pt-BR') : 'Pendente'}</div>
      </div>
    </div>
  );
}