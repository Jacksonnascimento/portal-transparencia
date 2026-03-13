'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api'; 
import { Sidebar } from '@/components/Sidebar'; 
import { 
  RefreshCw, Calendar, Tag, AlertCircle, TrendingUp, TrendingDown, 
  Wallet, MessageSquare, Star, Clock, ShieldCheck, ChevronRight, User, Quote,
  ShoppingCart
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
  ultimosFeedbacks: SicFeedback[];
}

interface DespesaResumo {
  valorEmpenhado: number;
  valorLiquidado: number;
  valorPago: number;
}

export default function DashboardPage() {
  const [receitas, setReceitas] = useState<any[]>([]);
  const [despesasRecentes, setDespesasRecentes] = useState<any[]>([]);
  const [totalReal, setTotalReal] = useState<number>(0); 
  const [despesaResumo, setDespesaResumo] = useState<DespesaResumo | null>(null);
  const [sicStats, setSicStats] = useState<SicStats | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState<string>(anoAtual.toString());
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
      const queryReceitasList = anoSelecionado ? `?exercicio=${anoSelecionado}&size=5&sort=dataLancamento,desc` : `?size=5&sort=dataLancamento,desc`;
      const queryReceitasTotal = anoSelecionado ? `?ano=${anoSelecionado}` : ``;
      const queryDespesasList = anoSelecionado ? `?ano=${anoSelecionado}&size=5&sort=dataEmpenho,desc` : `?size=5&sort=dataEmpenho,desc`;
      const queryDespesasResumo = anoSelecionado ? `?ano=${anoSelecionado}` : ``;

      // SOLUÇÃO: allSettled não aborta se uma API falhar (Ex: se o /resumo der 500)
      const results = await Promise.allSettled([
        api.get(`/receitas${queryReceitasList}`),
        api.get(`/receitas/total${queryReceitasTotal}`),
        api.get(`/despesas${queryDespesasList}`),
        api.get(`/despesas/resumo${queryDespesasResumo}`),
        api.get(`/sic/solicitacoes/estatisticas`)
      ]);

      // Verificando e setando cada resultado individualmente com segurança
      if (results[0].status === 'fulfilled') setReceitas(results[0].value.data?.content || []);
      else setReceitas([]);

      if (results[1].status === 'fulfilled') setTotalReal(results[1].value.data || 0);
      else setTotalReal(0);

      if (results[2].status === 'fulfilled') setDespesasRecentes(results[2].value.data?.content || []);
      else setDespesasRecentes([]);

      if (results[3].status === 'fulfilled') setDespesaResumo(results[3].value.data);
      else setDespesaResumo(null);

      if (results[4].status === 'fulfilled') setSicStats(results[4].value.data);
      else setSicStats(null);

    } catch (err) {
      setError("Erro grave ao renderizar dashboard.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [anoSelecionado]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const formatDate = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '---';

  const renderStars = (nota: number, size = 18) => {
    const validNota = isNaN(nota) ? 0 : nota;
    return (
      <div className="flex text-amber-400 gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={size} 
            fill={star <= Math.round(validNota) ? "currentColor" : "none"} 
            className={star <= Math.round(validNota) ? "" : "text-slate-200"}
          />
        ))}
      </div>
    );
  };

  const percentual = Number(sicStats?.percentualAprovacao || 0);
  const larguraBarra = Math.min(Math.max(percentual, 0), 100);
  const corTextoAprovacao = percentual >= 70 ? 'text-emerald-600' : percentual >= 50 ? 'text-amber-500' : 'text-red-500';
  const corFundoAprovacao = percentual >= 70 ? 'bg-emerald-500' : percentual >= 50 ? 'bg-amber-400' : 'bg-red-500';

  const disponibilidade = totalReal - (despesaResumo?.valorPago || 0);
  const corDisponibilidade = disponibilidade >= 0 ? 'text-slate-900' : 'text-red-600';

  const textoExercicioAtual = anoSelecionado ? `Exercício ${anoSelecionado}` : 'Todos os Exercícios';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* HEADER */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Painel de Controle</h2>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
               <span className="w-1 h-1 bg-slate-300 rounded-full"></span> Horizon AJ • Gestão de Transparência
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm px-3 hover:border-slate-400 transition-all">
               <Calendar size={14} className="text-slate-400 mr-2" />
               <select 
                 value={anoSelecionado}
                 onChange={(e) => setAnoSelecionado(e.target.value)}
                 className="bg-transparent text-[11px] font-black text-slate-600 focus:outline-none cursor-pointer py-2.5 pr-2 uppercase tracking-tight"
               >
                 <option value="">Todos os Exercícios</option>
                 {anosDisponiveis.map(ano => <option key={ano} value={ano.toString()}>Exercício {ano}</option>)}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Receita Arrecadada
            </p>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{loading ? "..." : formatMoney(totalReal)}</h4>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] uppercase">
                <span className="text-emerald-600 font-bold flex items-center gap-1"><TrendingUp size={12}/> {textoExercicioAtual}</span>
                <Link href="/receitas" className="text-slate-400 hover:text-blue-600 font-black tracking-widest">Ver Detalhes</Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Despesas Empenhadas
             </p>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">
              {loading ? "..." : formatMoney(despesaResumo?.valorEmpenhado || 0)}
            </h4>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] uppercase">
                <span className="text-red-500 font-bold flex items-center gap-1"><TrendingDown size={12}/> {textoExercicioAtual}</span>
                <Link href="/despesas" className="text-slate-400 hover:text-blue-600 font-black tracking-widest">Ver Detalhes</Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-blue-600 transition-all hover:shadow-md flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2"><Wallet size={14} className="text-blue-500"/> Disponibilidade Atual</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px]">LÍQUIDO</span>
              </p>
              <h4 className={`text-3xl font-black tracking-tighter ${corDisponibilidade}`}>
                {loading ? "..." : formatMoney(disponibilidade)}
              </h4>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
               *Cálculo: Arrecadado - Pago
            </div>
          </div>
        </div>

        {/* --- SEÇÃO OPERACIONAL E SATISFAÇÃO --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                        <span className="font-black text-slate-800 text-base">{Number(sicStats?.tempoMedioRespostaDias || 0).toFixed(1)} DIAS</span>
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
                            <span className="text-5xl font-black text-slate-900 tracking-tighter">{Number(sicStats?.notaMedia || 0).toFixed(1)}</span>
                            {renderStars(sicStats?.notaMedia || 0)}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aprovação</p>
                            <span className={`text-sm font-black ${corTextoAprovacao}`}>
                                {percentual.toFixed(1)}%
                            </span>
                        </div>
                        
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${corFundoAprovacao}`} 
                                style={{ width: `${larguraBarra}%` }}
                            ></div>
                        </div>
                        
                        <p className="text-[9px] text-slate-400 font-bold uppercase text-right tracking-tighter">
                            Base: {sicStats?.totalAvaliacoes || 0} avaliações
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* --- VOZ DO CIDADÃO (FEEDBACKS RECENTES) --- */}
        <div className="mb-8">
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

        {/* --- MONITORAMENTO FINANCEIRO (LADO A LADO - AGORA NO FUNDO DA PÁGINA) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* RECEITAS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold text-slate-800 text-xs uppercase tracking-tighter flex items-center gap-2">
                  <Tag size={14} className="text-slate-400"/> Receitas Recentes
               </h3>
               <Link href="/receitas" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">Ver Todas <ChevronRight size={12}/></Link>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-3">Fonte</th>
                    <th className="px-4 py-3 text-center">Data</th>
                    <th className="px-6 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={3} className="h-12 bg-slate-50/50"></td></tr>)
                  : receitas.length === 0 ? <tr><td colSpan={3} className="text-center py-6 text-slate-400 text-xs italic">Nenhuma receita encontrada.</td></tr>
                  : receitas.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-3">
                        <p className="text-[10px] text-slate-500 font-bold truncate max-w-[200px] uppercase tracking-tighter" title={item.fonteRecursos}>{item.fonteRecursos}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-medium text-center text-[10px]">{formatDate(item.dataLancamento)}</td>
                      <td className="px-6 py-3 text-right font-black text-slate-800 group-hover:text-emerald-600 transition-colors">{formatMoney(item.valorArrecadado || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DESPESAS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-bold text-slate-800 text-xs uppercase tracking-tighter flex items-center gap-2">
                  <ShoppingCart size={14} className="text-slate-400"/> Despesas Recentes
               </h3>
               <Link href="/despesas" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">Ver Todas <ChevronRight size={12}/></Link>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-3">Credor</th>
                    <th className="px-4 py-3 text-center">Data</th>
                    <th className="px-6 py-3 text-right">Empenhado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={3} className="h-12 bg-slate-50/50"></td></tr>)
                  : despesasRecentes.length === 0 ? <tr><td colSpan={3} className="text-center py-6 text-slate-400 text-xs italic">Nenhuma despesa encontrada.</td></tr>
                  : despesasRecentes.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-3">
                        <p className="text-[10px] font-bold text-slate-600 truncate max-w-[200px] uppercase">{item.credor?.razaoSocial || 'Não informado'}</p>
                        <p className="text-[9px] text-slate-400 tracking-widest">{item.numeroEmpenho}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-medium text-center text-[10px]">{formatDate(item.dataEmpenho)}</td>
                      <td className="px-6 py-3 text-right font-black text-slate-800 group-hover:text-red-500 transition-colors">{formatMoney(item.valorEmpenhado || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}