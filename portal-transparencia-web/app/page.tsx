'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api'; 
import { Sidebar } from '@/components/Sidebar'; 
import { RefreshCw, Calendar, Tag, AlertCircle, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default function DashboardPage() {
  const [receitas, setReceitas] = useState<any[]>([]);
  const [totalReal, setTotalReal] = useState<number>(0); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- CONTROLE DE EXERCÍCIO ---
  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState<number>(anoAtual);
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);

  // Busca anos disponíveis ao carregar a página
  useEffect(() => {
    api.get<number[]>('/receitas/anos')
      .then(res => {
        const anos = res.data.length > 0 ? res.data : [anoAtual];
        if (!anos.includes(anoAtual)) anos.push(anoAtual);
        setAnosDisponiveis(anos.sort((a, b) => b - a));
      })
      .catch(() => setAnosDisponiveis([anoAtual]));
  }, [anoAtual]);

  // Carrega os dados baseado no ano selecionado
  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reqLista = api.get(`/receitas?exercicio=${anoSelecionado}&size=5&sort=dataLancamento,desc`);
      const reqTotal = api.get(`/receitas/total?ano=${anoSelecionado}`);
      const [resLista, resTotal] = await Promise.all([reqLista, reqTotal]);

      setReceitas(resLista.data.content || []);
      setTotalReal(resTotal.data || 0);
    } catch (err) {
      setError("Erro de conexão com o servidor.");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, [anoSelecionado]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  
  const renderData = (item: any) => {
    const val = item.dataLancamento || item.data || item.data_lancamento;
    if (!val) return "---";
    try {
      if (Array.isArray(val)) return `${String(val[2]).padStart(2, '0')}/${String(val[1]).padStart(2, '0')}/${val[0]}`;
      return new Date(val).toLocaleDateString('pt-BR');
    } catch { return "---"; }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Painel de Controle</h2>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Horizon AJ • Visão Geral</p>
          </div>
          
          <div className="flex gap-3">
            {/* SELECT DE EXERCÍCIO DINÂMICO */}
            <div className="hidden md:flex items-center relative bg-white border border-slate-200 rounded-xl shadow-sm px-3 hover:border-black transition-all">
               <Calendar size={14} className="text-slate-400 mr-2" />
               <select 
                  value={anoSelecionado}
                  onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                  disabled={loading}
                  className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer py-2 pr-2"
               >
                 {anosDisponiveis.map(ano => (
                    <option key={ano} value={ano}>Exercício {ano}</option>
                 ))}
               </select>
            </div>

            <button onClick={carregarDados} disabled={loading} className="flex items-center px-4 py-2 bg-black hover:bg-slate-800 text-white rounded-xl shadow-lg font-bold text-xs uppercase transition-all active:scale-95 disabled:opacity-70">
              <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Sincronizando...' : 'Atualizar Dados'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingUp size={64} className="text-green-600" /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Receita Arrecadada</p>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{loading ? "..." : formatMoney(totalReal)}</h4>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Acumulado em {anoSelecionado}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingDown size={64} className="text-red-600" /></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Despesas Empenhadas</p>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">R$ 0,00</h4>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Acumulado em {anoSelecionado}</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={64} className="text-white" /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Saldo em Caixa</p>
            <h4 className="text-3xl font-black text-white tracking-tighter">{loading ? "..." : formatMoney(totalReal)}</h4>
            <p className="text-[10px] text-slate-500 mt-2 font-medium">Disponível para alocação</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><div className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm"><Tag size={14} className="text-slate-600" /></div> Últimos Lançamentos</h3>
             <a href="/receitas" className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wide hover:underline">Ver todos &rarr;</a>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100"><th className="px-8 py-4">Origem / Fonte</th><th className="px-8 py-4 text-center">Categoria</th><th className="px-8 py-4 text-center">Data</th><th className="px-8 py-4 text-right">Valor (R$)</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {loading ? [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={4} className="h-12 bg-slate-50"></td></tr>)
              : receitas.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4"><p className="font-bold text-slate-700">{item.origem || "---"}</p><p className="text-[10px] text-slate-400 truncate max-w-[200px]">{item.fonteRecursos}</p></td>
                  <td className="px-8 py-4 text-center"><span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-bold rounded uppercase border border-slate-200">{item.categoriaEconomica || "Receita"}</span></td>
                  <td className="px-8 py-4 text-slate-500 font-semibold text-center">{renderData(item)}</td>
                  <td className="px-8 py-4 text-right font-bold text-slate-900 group-hover:text-emerald-700">{formatMoney(item.valorArrecadado || 0)}</td>
                </tr>
              ))}
              {!loading && receitas.length === 0 && <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400">Nenhum lançamento encontrado em {anoSelecionado}.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}