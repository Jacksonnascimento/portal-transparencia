'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar';
import { 
  ChevronLeft, ChevronRight, Filter, AlertCircle, X, 
  Wallet, TrendingUp, TrendingDown, Users, Download, 
  FileText, Search, Calendar, Landmark 
} from 'lucide-react';

interface Stats {
  totalRemuneracaoBruta: number;
  totalVerbasIndenizatorias: number;
  totalDescontosLegais: number;
  totalSalarioLiquido: number;
  quantidadeServidoresPagos: number;
  mediaSalarialLiquida: number;
}

export default function FolhaPagamentoPage() {
  const [data, setData] = useState<any>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(true);
  
  const date = new Date();
  const [filters, setFilters] = useState({
    nomeServidor: '',
    exercicio: date.getFullYear().toString(),
    mes: (date.getMonth() + 1).toString()
  });

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const fetchDados = useCallback(async () => {
    setLoading(true);
    setLoadingStats(true);
    setError(null);
    
    try {
      const queryParams = `exercicio=${filters.exercicio}&mes=${filters.mes}`;
      const searchParams = filters.nomeServidor ? `&nomeServidor=${encodeURIComponent(filters.nomeServidor)}` : '';

      const [resStats, resList] = await Promise.all([
        api.get(`/folha-pagamento/estatisticas?${queryParams}`),
        api.get(`/folha-pagamento?${queryParams}${searchParams}&page=${page}&size=15`)
      ]);

      setStats(resStats.data);
      setData(resList.data);
    } catch (err) {
      setError("Erro ao carregar dados da folha de pagamento.");
    } finally {
      setLoading(false);
      setLoadingStats(false);
    }
  }, [filters.exercicio, filters.mes, filters.nomeServidor, page]);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  const handleExport = async (type: 'pdf' | 'csv') => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/folha-pagamento/exportar/${type}?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `folha_${filters.mes}_${filters.exercicio}.${type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { alert("Erro na exportação."); }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        
        {/* HEADER */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-900 text-white rounded-lg"><Landmark size={24} /></div>
             <div>
               <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Folha de Pagamento</h2>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                 Gestão Financeira e Previdenciária
               </p>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleExport('csv')} className="flex items-center px-4 py-2 border border-slate-200 rounded-xl shadow-sm font-bold text-xs uppercase bg-white text-slate-600 hover:text-black hover:bg-slate-50 transition-all">
              <Download size={14} className="mr-2" /> CSV
            </button>
            <button onClick={() => handleExport('pdf')} className="flex items-center px-4 py-2 border border-slate-200 rounded-xl shadow-sm font-bold text-xs uppercase bg-white text-slate-600 hover:text-red-600 hover:bg-slate-50 transition-all">
              <FileText size={14} className="mr-2" /> PDF Oficial
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center px-4 py-2 border rounded-xl shadow-sm font-bold text-xs uppercase transition-all ${showFilters ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              <Filter size={14} className="mr-2" /> Filtros
            </button>
          </div>
        </header>

        {/* CARDS DE ESTATÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Remuneração Bruta', val: stats?.totalRemuneracaoBruta, icon: <TrendingUp className="text-emerald-500" /> },
            { label: 'Descontos Legais', val: stats?.totalDescontosLegais, icon: <TrendingDown className="text-red-500" /> },
            { label: 'Líquido Disponível', val: stats?.totalSalarioLiquido, icon: <Wallet className="text-blue-500" /> },
            { label: 'Média Salarial', val: stats?.mediaSalarialLiquida, icon: <Users className="text-slate-400" /> },
          ].map((card, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{card.label}</span>
                {card.icon}
              </div>
              <h4 className="text-xl font-black text-slate-900 tracking-tighter">
                {loadingStats ? "..." : formatMoney(card.val || 0)}
              </h4>
            </div>
          ))}
        </div>

        {/* FILTROS REESTRUTURADOS */}
        {showFilters && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-widest">Buscar Servidor</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    placeholder="Nome do servidor..." 
                    value={filters.nomeServidor}
                    onChange={e => { setFilters({...filters, nomeServidor: e.target.value}); setPage(0); }}
                    className="w-full h-[42px] pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-widest">Competência</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <select 
                      className="w-full h-[42px] pl-8 pr-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm appearance-none cursor-pointer"
                      value={filters.mes}
                      onChange={e => { setFilters({...filters, mes: e.target.value}); setPage(0); }}
                    >
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('pt-BR', {month: 'short'}).toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <select 
                    className="w-24 h-[42px] px-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm cursor-pointer"
                    value={filters.exercicio}
                    onChange={e => { setFilters({...filters, exercicio: e.target.value}); setPage(0); }}
                  >
                    {[2024, 2025, 2026].map(ano => <option key={ano} value={ano}>{ano}</option>)}
                  </select>
                </div>
              </div>

              {/* BOTÃO LIMPAR PADRONIZADO E ALINHADO */}
              <div>
                <button 
                  onClick={() => { setFilters({nomeServidor: '', exercicio: '2026', mes: '3'}); setPage(0); }} 
                  className="w-full h-[42px] flex items-center justify-center gap-2 px-4 border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                >
                  <X size={14} /> Limpar Filtros
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TABELA */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Servidor / Cargo</th>
                  <th className="px-6 py-4 text-right">Venc. Bruto</th>
                  <th className="px-6 py-4 text-right">Descontos</th>
                  <th className="px-6 py-4 text-right">Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={4} className="h-16 px-6 bg-slate-50/20"></td></tr>)
                : data?.content?.length > 0 ? data.content.map((f: any) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors text-xs group">
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-800 uppercase tracking-tight">{f.nomeServidor}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{f.cargoServidor}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-600">{formatMoney(f.remuneracaoBruta)}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-500">{formatMoney(f.descontosLegais)}</td>
                    <td className="px-6 py-4 text-right font-black text-blue-700 bg-blue-50/30 group-hover:bg-blue-100/50 transition-colors">
                      {formatMoney(f.salarioLiquido)}
                    </td>
                  </tr>
                ))
                : (<tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-medium">Nenhum registro de folha encontrado.</td></tr>)}
              </tbody>
            </table>
          </div>
          
          {!loading && data && data.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Página {data.number + 1} de {data.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={data.first} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50 transition-colors"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))} disabled={data.last} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50 transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}