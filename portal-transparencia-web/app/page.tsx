'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api'; 
import { Sidebar } from '@/components/Sidebar'; 
import { 
  RefreshCw, Calendar, Tag, AlertCircle, TrendingUp, TrendingDown, 
  Wallet, MessageSquare, Star, Clock, ShieldCheck, ChevronRight, User, Quote
} from 'lucide-react';
import Link from 'next/link';

interface SicFeedback {
  nota: number;
  comentario: string;
  dataAvaliacao: string;
}

interface SicStats {
  totalPedidos: number;
  pedidosRespondidos: number;
  pedidosEmAberto: number;
  pedidosNegados: number;
  pedidosEmAlerta: number;
  pedidosExpirados: number;
  tempoMedioRespostaDias: number;
  notaMedia: number;
  percentualAprovacao: number;
  totalAvaliacoes: number;
  ultimosFeedbacks: SicFeedback[]; // NOVO CAMPO
}

export default function DashboardPage() {
  const [receitas, setReceitas] = useState<any[]>([]);
  const [totalReal, setTotalReal] = useState<number>(0); 
  const [sicStats, setSicStats] = useState<SicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState<number>(anoAtual);
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);

  useEffect(() => {
    api.get<number[]>('/receitas/anos')
      .then(res => {
        const anos = res.data.length > 0 ? res.data : [anoAtual];
        if (!anos.includes(anoAtual)) anos.push(anoAtual);
        setAnosDisponiveis(anos.sort((a, b) => b - a));
      })
      .catch(() => setAnosDisponiveis([anoAtual]));
  }, [anoAtual]);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resLista, resTotal, resSic] = await Promise.all([
        api.get(`/receitas?exercicio=${anoSelecionado}&size=5&sort=dataLancamento,desc`),
        api.get(`/receitas/total?ano=${anoSelecionado}`),
        api.get(`/sic/solicitacoes/estatisticas`)
      ]);

      setReceitas(resLista.data.content || []);
      setTotalReal(resTotal.data || 0);
      setSicStats(resSic.data);
    } catch (err) {
      setError("Erro ao sincronizar indicadores.");
    } finally {
      setLoading(false);
    }
  }, [anoSelecionado]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const renderStars = (nota: number, size = 18) => {
    return (
      <div className="flex text-amber-400 gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={size} 
            fill={star <= Math.round(nota) ? "currentColor" : "none"} 
            className={star <= Math.round(nota) ? "" : "text-slate-200"}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Painel de Controle</h2>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
               <div className="w-1 h-1 bg-slate-300 rounded-full"></div> Horizon AJ • Gestão de Transparência
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm px-3 hover:border-slate-400 transition-all">
               <Calendar size={14} className="text-slate-400 mr-2" />
               <select 
                  value={anoSelecionado}
                  onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                  className="bg-transparent text-[11px] font-black text-slate-600 focus:outline-none cursor-pointer py-2.5 pr-2 uppercase tracking-tight"
               >
                 {anosDisponiveis.map(ano => <option key={ano} value={ano}>Exercício {ano}</option>)}
               </select>
            </div>

            <button 
              onClick={carregarDados} 
              disabled={loading}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all shadow-sm active:scale-95
                ${loading 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-100' 
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900'
                }
              `}
            >
              <RefreshCw size={14} className={`${loading ? 'animate-spin' : 'text-blue-500'}`} />
              {loading ? 'Sincronizando...' : 'Atualizar'}
            </button>
          </div>
        </header>

        {/* --- CARDS FINANCEIROS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Receita Arrecadada
            </p>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{loading ? "..." : formatMoney(totalReal)}</h4>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase">
                <TrendingUp size={12}/> Exercício {anoSelecionado}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Despesas Empenhadas
             </p>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">R$ 0,00</h4>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase">
                <TrendingDown size={12}/> Aguardando Dados
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-blue-600 transition-all hover:shadow-md">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Wallet size={14} className="text-blue-500"/> Disponibilidade
            </p>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{loading ? "..." : formatMoney(totalReal)}</h4>
            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">Recursos Líquidos</p>
          </div>
        </div>

        {/* --- SEÇÃO OPERACIONAL E SATISFAÇÃO --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tighter text-xs">
                        <MessageSquare className="text-blue-500" size={16}/> Eficiência e-SIC
                    </h3>
                    <Link href="/e-sic" className="p-2 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100">
                        <ChevronRight size={16} className="text-slate-400"/>
                    </Link>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pedidos em Alerta</p>
                        <h5 className="text-2xl font-black text-amber-600">{sicStats?.pedidosEmAlerta || 0}</h5>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Prazo Excedido</p>
                        <h5 className="text-2xl font-black text-red-600">{sicStats?.pedidosExpirados || 0}</h5>
                    </div>
                    <div className="col-span-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock size={16} className="text-slate-400"/>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tempo de Resposta</span>
                        </div>
                        <span className="font-black text-slate-800 text-base">{sicStats?.tempoMedioRespostaDias.toFixed(1)} DIAS</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tighter text-xs">
                        <ShieldCheck className="text-emerald-500" size={16}/> Avaliação do Cidadão (PNTP)
                    </h3>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nota Média</p>
                        <div className="flex flex-col items-center md:items-start gap-1">
                            <span className="text-5xl font-black text-slate-900 tracking-tighter">{sicStats?.notaMedia.toFixed(1)}</span>
                            {renderStars(sicStats?.notaMedia || 0)}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aprovação</p>
                            <span className="text-sm font-black text-emerald-600">{sicStats?.percentualAprovacao.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full border border-slate-100">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${sicStats?.percentualAprovacao || 0}%` }}></div>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase text-right tracking-tighter">Base: {sicStats?.totalAvaliacoes} avaliações</p>
                    </div>
                </div>
            </div>
        </div>

        {/* --- NOVO: VOZ DO CIDADÃO (FEEDBACKS RECENTES) --- */}
        <div className="mb-10">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 px-2">
            <Quote size={14} className="text-slate-300"/> Feedbacks Recentes (e-SIC)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {loading ? [...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl border border-slate-200"></div>
            )) : (
              sicStats?.ultimosFeedbacks?.map((fb, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all group">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                        <User size={14} className="text-slate-400 group-hover:text-blue-500"/>
                      </div>
                      {renderStars(fb.nota, 12)}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed italic line-clamp-3">
                      "{fb.comentario || 'Sem comentário.'}"
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span>Cidadão</span>
                    <span>{new Date(fb.dataAvaliacao).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))
            )}
            {!loading && (!sicStats?.ultimosFeedbacks || sicStats.ultimosFeedbacks.length === 0) && (
              <div className="col-span-5 py-10 bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma avaliação detalhada recebida</p>
              </div>
            )}
          </div>
        </div>

        {/* --- MONITORAMENTO DE RECEITAS --- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
          <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <h3 className="font-bold text-slate-800 text-xs uppercase tracking-tighter flex items-center gap-2">
                <Tag size={14} className="text-slate-400"/> Atividade Recente
             </h3>
             <Link href="/receitas" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">Auditoria Completa <ChevronRight size={12}/></Link>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-4">Origem / Fonte de Recurso</th>
                <th className="px-8 py-4 text-center">Data</th>
                <th className="px-8 py-4 text-right">Valor Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? [...Array(3)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={3} className="h-14 bg-slate-50/50"></td></tr>)
              : receitas.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4">
                    <p className="font-bold text-slate-700">{item.origem || "Lançamento Automático"}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate max-w-[400px] uppercase tracking-tighter">{item.fonteRecursos}</p>
                  </td>
                  <td className="px-8 py-4 text-slate-500 font-bold text-center text-[10px]">{new Date(item.dataLancamento).toLocaleDateString('pt-BR')}</td>
                  <td className="px-8 py-4 text-right font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{formatMoney(item.valorArrecadado || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}