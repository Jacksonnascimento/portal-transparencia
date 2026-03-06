'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Home, BarChart3, Clock, CheckCircle, FileText, Star, ThumbsUp, ArrowLeft, Activity, MessageSquare } from 'lucide-react';
import { sicService, SicEstatisticasDTO } from '../../../services/sicService';
import toast, { Toaster } from 'react-hot-toast';

export default function SicResultadosPage() {
  const [estatisticas, setEstatisticas] = useState<SicEstatisticasDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    try {
      const data = await sicService.obterEstatisticas();
      setEstatisticas(data);
    } catch (error) {
      toast.error("Erro ao carregar dados estatísticos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans animate-in fade-in duration-500">
      <Toaster position="top-right" />
      
      {/* BREADCRUMB COMPLETO */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1">
          <Home size={12} /> Início
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <Link href="/sic" className="hover:text-[var(--cor-primaria)] transition-colors">
          SIC e Ouvidoria
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600">Estatísticas</span>
      </nav>

      {/* HEADER E BOTÃO VOLTAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 mb-2">
            Transparência do e-SIC
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Acompanhe publicamente o volume de atendimentos e a satisfação dos cidadãos.
          </p>
        </div>
        <Link 
          href="/sic" 
          className="bg-slate-900 text-white hover:bg-[var(--cor-primaria)] transition-colors px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit shrink-0 shadow-sm"
        >
          <ArrowLeft size={16} /> Voltar para o e-SIC
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 animate-pulse h-36 rounded-3xl"></div>
          ))}
        </div>
      ) : estatisticas ? (
        <>
          {/* LINHA DO TEMPO DE STATUS GERAIS */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--cor-primaria)]"></div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Activity className="text-[var(--cor-primaria)]" size={18} /> Linha do Tempo Geral (Status dos Pedidos)
            </h3>
            
            <div className="relative flex flex-col md:flex-row justify-between w-full gap-8 md:gap-0 px-4 md:px-10">
              {/* Linha conectora de fundo (aparece apenas no desktop) */}
              <div className="hidden md:block absolute top-[28px] left-[10%] w-[80%] h-1 bg-slate-100 z-0"></div>

              {/* Status 1: Recebidas */}
              <div className="relative z-10 flex flex-col items-center text-center bg-white px-2">
                <div className="w-14 h-14 rounded-full bg-blue-50 border-[3px] border-white shadow-sm text-blue-600 flex items-center justify-center mb-3">
                   <FileText size={24} />
                </div>
                <span className="text-3xl font-black tracking-tighter text-slate-800">{estatisticas.totalPedidos || 0}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Total Recebido</span>
              </div>

              {/* Status 2: Em Andamento */}
              <div className="relative z-10 flex flex-col items-center text-center bg-white px-2">
                <div className="w-14 h-14 rounded-full bg-yellow-50 border-[3px] border-white shadow-sm text-yellow-600 flex items-center justify-center mb-3">
                   <BarChart3 size={24} />
                </div>
                <span className="text-3xl font-black tracking-tighter text-slate-800">{estatisticas.pedidosEmAberto || 0}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Em Análise</span>
              </div>

              {/* Status 3: Respondidas */}
              <div className="relative z-10 flex flex-col items-center text-center bg-white px-2">
                <div className="w-14 h-14 rounded-full bg-emerald-50 border-[3px] border-white shadow-sm text-emerald-600 flex items-center justify-center mb-3">
                   <CheckCircle size={24} />
                </div>
                <span className="text-3xl font-black tracking-tighter text-slate-800">{estatisticas.pedidosRespondidos || 0}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Respondidas</span>
              </div>
            </div>
          </div>

          {/* INDICADORES E MÉTRICAS */}
          <div className="mb-10 border-t border-slate-200 pt-10">
            <h2 className="text-xl font-black tracking-tight text-slate-800 mb-6 flex items-center gap-2">
              <Clock className="text-[var(--cor-primaria)]" size={20} /> Desempenho e Prazos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard 
                title="Total de Solicitações" 
                value={estatisticas.totalPedidos || 0} 
                icon={<FileText size={24} />} 
                color="bg-blue-50 text-blue-600 border-blue-200"
              />
              <DashboardCard 
                title="Solicitações Atendidas" 
                value={estatisticas.pedidosRespondidos || 0} 
                icon={<CheckCircle size={24} />} 
                color="bg-emerald-50 text-emerald-600 border-emerald-200"
              />
              <DashboardCard 
                title="Tempo Médio" 
                value={`${estatisticas.tempoMedioRespostaDias || 0} Dias`} 
                icon={<Clock size={24} />} 
                color="bg-purple-50 text-purple-600 border-purple-200"
                subtext="Prazo legal máximo: 20 dias"
              />
              <DashboardCard 
                title="Taxa de Resolução" 
                value={`${estatisticas.totalPedidos > 0 ? Math.round((estatisticas.pedidosRespondidos / estatisticas.totalPedidos) * 100) : 0}%`} 
                icon={<Activity size={24} />} 
                color="bg-indigo-50 text-indigo-600 border-indigo-200"
              />
            </div>
          </div>

          {/* SATISFAÇÃO (PNTP) */}
          <div className="mb-8 border-t border-slate-200 pt-10">
            <h2 className="text-xl font-black tracking-tight text-slate-800 mb-6 flex items-center gap-2">
              <Star className="text-[var(--cor-primaria)]" size={20} /> Satisfação Cidadã (PNTP)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <DashboardCard 
                title="Nota Média de Atendimento" 
                value={`${estatisticas.notaMedia?.toFixed(1) || '0.0'} / 5.0`} 
                icon={<Star size={24} className={estatisticas.notaMedia ? "fill-amber-500 text-amber-500" : ""} />} 
                color="bg-amber-50 text-amber-600 border-amber-200"
                subtext="Baseado nas avaliações de 1 a 5 estrelas."
              />
              <DashboardCard 
                title="Índice de Aprovação" 
                value={`${estatisticas.percentualAprovacao?.toFixed(0) || 0}%`} 
                icon={<ThumbsUp size={24} />} 
                color="bg-teal-50 text-teal-600 border-teal-200"
                subtext="Cidadãos que avaliaram positivamente o serviço."
              />
            </div>

            {/* AVALIAÇÕES RECENTES */}
            {estatisticas.ultimosFeedbacks && estatisticas.ultimosFeedbacks.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-black tracking-widest text-slate-900 uppercase mb-6 flex items-center gap-2">
                  <MessageSquare className="text-[var(--cor-primaria)]" size={18} /> Avaliações Recentes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {estatisticas.ultimosFeedbacks.map((feedback, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between transition-transform hover:-translate-y-1">
                      <div>
                        <div className="flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} size={16} 
                              className={feedback.nota >= star ? "fill-amber-500 text-amber-500" : "text-slate-300"} 
                            />
                          ))}
                        </div>
                        <p className="text-sm text-slate-700 italic mb-4 leading-relaxed">
                          "{feedback.comentario ? feedback.comentario : 'Avaliação registrada sem comentário.'}"
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {new Date(feedback.dataAvaliacao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-slate-50 border border-slate-200 p-10 text-center rounded-3xl mt-10">
          <FileText className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-500 font-bold">Nenhum dado estatístico disponível no momento.</p>
        </div>
      )}
    </div>
  );
}

function DashboardCard({ title, value, icon, color, subtext }: { title: string, value: string | number, icon: React.ReactNode, color: string, subtext?: string }) {
  return (
    <div className={`p-6 rounded-3xl border ${color} flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-1`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{title}</span>
        <div className="opacity-80">{icon}</div>
      </div>
      <div>
        <span className="text-3xl font-black tracking-tighter block">{value}</span>
        {subtext && <span className="text-[10px] font-bold opacity-70 mt-1 block uppercase tracking-widest">{subtext}</span>}
      </div>
    </div>
  );
}