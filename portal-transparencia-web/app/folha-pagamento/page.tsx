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
  
  // Filtros padrão: Mês e Ano atual
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

      // Busca estatísticas e listagem em paralelo
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
      const queryParams = new URLSearchParams(filters).toString();
      const response = await api.get(`/folha-pagamento/exportar/${type}?${queryParams}`, { responseType: 'blob' });
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
        
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600 text-white rounded-lg"><Landmark size={24} /></div>
             <div>
               <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Folha de Pagamento</h2>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão Financeira e Previdenciária</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleExport('csv')} className="btn-white-icon"><Download size={14} /> CSV</button>
            <button onClick={() => handleExport('pdf')} className="btn-white-icon text-red-600"><FileText size={14} /> PDF Oficial</button>
          </div>
        </header>

        {/* CARDS DE ESTATÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Remuneração Bruta', val: stats?.totalRemuneracaoBruta, icon: <TrendingUp className="text-emerald-500" />, color: 'emerald' },
            { label: 'Descontos Legais', val: stats?.totalDescontosLegais, icon: <TrendingDown className="text-red-500" />, color: 'red' },
            { label: 'Líquido Disponível', val: stats?.totalSalarioLiquido, icon: <Wallet className="text-blue-500" />, color: 'blue' },
            { label: 'Média Salarial', val: stats?.mediaSalarialLiquida, icon: <Users className="text-slate-400" />, color: 'slate' },
          ].map((card, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
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

        {/* FILTROS */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="label-filter">Buscar Servidor</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-300" size={16} />
                <input 
                  type="text" 
                  placeholder="Nome do servidor..." 
                  className="input-base pl-10"
                  value={filters.nomeServidor}
                  onChange={e => setFilters({...filters, nomeServidor: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="label-filter">Competência</label>
              <div className="flex gap-2">
                <select 
                  className="input-base" 
                  value={filters.mes}
                  onChange={e => setFilters({...filters, mes: e.target.value})}
                >
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('pt-BR', {month: 'long'})}</option>
                  ))}
                </select>
                <select 
                  className="input-base"
                  value={filters.exercicio}
                  onChange={e => setFilters({...filters, exercicio: e.target.value})}
                >
                  {[2024, 2025, 2026].map(ano => <option key={ano} value={ano}>{ano}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => {setFilters({nomeServidor: '', exercicio: '2025', mes: '1'}); setPage(0);}} className="text-red-500 font-bold text-[10px] uppercase p-2 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center gap-2">
              <X size={14}/> Limpar
            </button>
          </div>
        </div>

        {/* TABELA */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4">Servidor / Cargo</th>
                <th className="px-6 py-4 text-right">Venc. Bruto</th>
                <th className="px-6 py-4 text-right">Descontos</th>
                <th className="px-6 py-4 text-right">Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={4} className="h-16 px-6"></td></tr>)
              : data?.content?.map((f: any) => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors text-xs group">
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-800 uppercase">{f.nomeServidor}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{f.cargoServidor}</p>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-600">{formatMoney(f.remuneracaoBruta)}</td>
                  <td className="px-6 py-4 text-right font-bold text-red-500">{formatMoney(f.descontosLegais)}</td>
                  <td className="px-6 py-4 text-right font-black text-blue-700 bg-blue-50/30">{formatMoney(f.salarioLiquido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* PAGINAÇÃO (Simples para manter o foco) */}
          <div className="p-4 bg-slate-50 flex justify-between items-center border-t border-slate-100">
             <span className="text-[10px] font-bold text-slate-400 uppercase">Total de {data?.totalElements || 0} registros</span>
             <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} className="p-2 bg-white border rounded-lg"><ChevronLeft size={16}/></button>
                <button onClick={() => setPage(p => p + 1)} className="p-2 bg-white border rounded-lg"><ChevronRight size={16}/></button>
             </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .btn-white-icon { @apply flex items-center px-4 py-2 border border-slate-200 rounded-xl shadow-sm font-bold text-xs uppercase bg-white transition-all hover:bg-slate-50; }
        .label-filter { @apply text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-wider; }
        .input-base { @apply w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium; }
      `}</style>
    </div>
  );
}