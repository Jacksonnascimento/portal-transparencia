'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api'; 
import { Sidebar } from '@/components/Sidebar'; 
import { 
  RefreshCw, 
  Calendar, 
  Tag,
  AlertCircle,
  Filter
} from 'lucide-react';

export default function DashboardPage() {
  const [receitas, setReceitas] = useState<any[]>([]);
  const [totalReal, setTotalReal] = useState<number>(0); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Pega o ano atual do sistema (ex: 2025, 2026...)
  const anoAtual = new Date().getFullYear();

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      // Busca lista (últimos 10)
      const reqLista = api.get('/receitas?size=10&sort=dataLancamento,desc');
      
      // 2. Busca o Total passando o ano dinamicamente
      const reqTotal = api.get(`/receitas/total?ano=${anoAtual}`);

      const [resLista, resTotal] = await Promise.all([reqLista, reqTotal]);

      setReceitas(resLista.data.content || []);
      setTotalReal(resTotal.data || 0);

    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao conectar com o servidor.");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // --- FORMATADORES ---
  const renderData = (item: any) => {
    const val = item.dataLancamento || item.data || item.data_lancamento;
    if (!val) return "---";
    try {
      if (Array.isArray(val)) return `${String(val[2]).padStart(2, '0')}/${String(val[1]).padStart(2, '0')}/${val[0]}`;
      const date = new Date(val);
      return date.toLocaleDateString('pt-BR');
    } catch { return "---"; }
  };

  const renderCategoria = (item: any) => {
    return item.categoriaEconomica || item.categoria_economica || item.categoria || "Receita";
  };

  return (
    <div className="flex min-h-screen bg-[#F1F5F9] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        
        {/* CABEÇALHO */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Painel de Controle</h2>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Horizon AJ • Retaguarda</p>
          </div>
          
          <div className="flex gap-2">
            {/* Indicador visual do Ano (Poderia virar um Select no futuro) */}
            <div className="hidden md:flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
               <Calendar size={14} className="mr-2" />
               Exercício: {anoAtual}
            </div>

            <button 
              onClick={carregarDados} 
              disabled={loading}
              className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:bg-slate-50 hover:border-blue-300 font-bold text-xs uppercase tracking-tighter transition-all active:scale-95"
            >
              <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin text-blue-500' : ''}`} /> 
              {loading ? 'Sincronizando...' : 'Atualizar'}
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <AlertCircle className="mr-2" size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* CARD 1: RECEITA */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:border-green-300 group cursor-default">
            {/* MUDANÇA AQUI: Mostrando o ano explicitamente */}
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-green-600 flex justify-between">
              <span>Receita Arrecadada</span>
              <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded text-[9px]">{anoAtual}</span>
            </p>
            <h4 className="text-2xl font-black text-slate-900 tracking-tight">
              {loading ? "..." : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReal)}
            </h4>
          </div>

          {/* CARD 2: DESPESA */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:border-red-300 group cursor-default">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-red-500 flex justify-between">
              <span>Total de Despesas</span>
              <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[9px]">{anoAtual}</span>
            </p>
            <h4 className="text-2xl font-black text-slate-300 tracking-tight italic">R$ 0,00</h4>
          </div>

          {/* CARD 3: SALDO */}
          <div className="bg-white p-6 rounded-xl border-l-4 border-l-blue-600 shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group cursor-default">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-600">Saldo Consolidado</p>
            <h4 className="text-2xl font-black text-blue-600 tracking-tight">
               {loading ? "..." : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReal)}
            </h4>
          </div>
        </div>

        {/* TABELA DE ÚLTIMOS LANÇAMENTOS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
             <h3 className="font-bold text-slate-700 text-sm flex items-center">
                <Tag size={16} className="mr-2 text-blue-500" /> Últimos Lançamentos
             </h3>
             <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
               Recentes
             </span>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4">Origem</th>
                <th className="px-6 py-4 text-center">Classificação</th>
                <th className="px-6 py-4 text-center">Data</th>
                <th className="px-6 py-4 text-right">Valor Bruto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                 [...Array(3)].map((_, i) => (
                   <tr key={i} className="animate-pulse"><td colSpan={4} className="h-10 bg-slate-50"></td></tr>
                 ))
              ) : (
                receitas.map((item, i) => (
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors text-xs group">
                    <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{item.origem || "---"}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded-md uppercase border border-slate-200">
                        {renderCategoria(item)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-semibold text-center">
                        <div className="flex items-center justify-center">
                           <Calendar size={12} className="mr-2 opacity-40 text-blue-500" />
                           {renderData(item)}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 group-hover:text-green-600 transition-colors">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorArrecadado || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}