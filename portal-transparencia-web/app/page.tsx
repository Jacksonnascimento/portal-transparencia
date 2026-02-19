'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api'; 
import { Sidebar } from '@/components/Sidebar'; 
import { 
  RefreshCw, 
  Calendar, 
  Tag,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react';

export default function DashboardPage() {
  const [receitas, setReceitas] = useState<any[]>([]);
  const [totalReal, setTotalReal] = useState<number>(0); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ano dinâmico
  const anoAtual = new Date().getFullYear();

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      // Busca os últimos 5 lançamentos para a tabela
      const reqLista = api.get('/receitas?size=5&sort=dataLancamento,desc');
      // Busca o total arrecadado no ano
      const reqTotal = api.get(`/receitas/total?ano=${anoAtual}`);

      const [resLista, resTotal] = await Promise.all([reqLista, reqTotal]);

      setReceitas(resLista.data.content || []);
      setTotalReal(resTotal.data || 0);

    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro de conexão com o servidor.");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // --- FORMATADORES ---
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

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
    // CORREÇÃO 1: Background padronizado com as outras telas (#F8FAFC)
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* CABEÇALHO */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Painel de Controle</h2>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Horizon AJ • Visão Geral</p>
          </div>
          
          <div className="flex gap-3">
            {/* Indicador de Ano */}
            <div className="hidden md:flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm text-slate-600">
               <Calendar size={14} className="mr-2 text-slate-400" />
               Exercício {anoAtual}
            </div>

            {/* CORREÇÃO 2: Botão Preto (Padrão do Sistema) */}
            <button 
              onClick={carregarDados} 
              disabled={loading}
              className="flex items-center px-4 py-2 bg-black hover:bg-slate-800 text-white rounded-xl shadow-lg font-bold text-xs uppercase tracking-wide transition-all active:scale-95 disabled:opacity-70"
            >
              <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> 
              {loading ? 'Sincronizando...' : 'Atualizar Dados'}
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 animate-in fade-in">
            <AlertCircle className="mr-2" size={20} />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {/* CARDS DE RESUMO (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* CARD 1: RECEITA (VERDE) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp size={64} className="text-green-600" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Receita Arrecadada
            </p>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">
              {loading ? "..." : formatMoney(totalReal)}
            </h4>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Acumulado em {anoAtual}</p>
          </div>

          {/* CARD 2: DESPESA (VERMELHO) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingDown size={64} className="text-red-600" />
            </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Despesas Empenhadas
            </p>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">R$ 0,00</h4>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Acumulado em {anoAtual}</p>
          </div>

          {/* CARD 3: SALDO (AZUL) */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet size={64} className="text-white" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Saldo em Caixa
            </p>
            <h4 className="text-3xl font-black text-white tracking-tighter">
               {loading ? "..." : formatMoney(totalReal)}
            </h4>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">Disponível para alocação</p>
          </div>
        </div>

        {/* TABELA DE ÚLTIMOS LANÇAMENTOS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <div className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm">
                  <Tag size={14} className="text-slate-600" />
                </div>
                Últimos Lançamentos Registrados
             </h3>
             <a href="/receitas" className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wide hover:underline">
               Ver todos &rarr;
             </a>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-4">Origem / Fonte</th>
                <th className="px-8 py-4 text-center">Categoria</th>
                <th className="px-8 py-4 text-center">Data</th>
                <th className="px-8 py-4 text-right">Valor (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                 [...Array(5)].map((_, i) => (
                   <tr key={i} className="animate-pulse"><td colSpan={4} className="h-12 bg-slate-50"></td></tr>
                 ))
              ) : (
                receitas.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors text-xs group cursor-default">
                    <td className="px-8 py-4">
                      <p className="font-bold text-slate-700">{item.origem || "---"}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{item.fonteRecursos}</p>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-bold rounded uppercase border border-slate-200">
                        {renderCategoria(item)}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-slate-500 font-semibold text-center">
                       {renderData(item)}
                    </td>
                    <td className="px-8 py-4 text-right font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {formatMoney(item.valorArrecadado || 0)}
                    </td>
                  </tr>
                ))
              )}
              {!loading && receitas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400">
                    Nenhum lançamento encontrado neste exercício.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}