// app/sic/resultados/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Home, BarChart3, Clock, CheckCircle, FileText, Star, ThumbsUp } from 'lucide-react';
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
      
      {/* ... [BREADCRUMB E HEADER MANTIDOS IGUAIS] ... */}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-100 animate-pulse h-32 rounded-3xl"></div>
          ))}
        </div>
      ) : estatisticas ? (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-black tracking-tight text-slate-800 mb-6">Volume e Desempenho</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard 
                title="Total de Solicitações" 
                value={estatisticas.totalSolicitacoes} 
                icon={<FileText size={24} />} 
                color="bg-blue-50 text-blue-600 border-blue-200"
              />
              <DashboardCard 
                title="Solicitações Atendidas" 
                value={estatisticas.respondidas} 
                icon={<CheckCircle size={24} />} 
                color="bg-emerald-50 text-emerald-600 border-emerald-200"
              />
              <DashboardCard 
                title="Em Andamento" 
                value={estatisticas.abertas} 
                icon={<BarChart3 size={24} />} 
                color="bg-yellow-50 text-yellow-600 border-yellow-200"
              />
              <DashboardCard 
                title="Tempo Médio" 
                value={`${estatisticas.tempoMedioRespostaDias} Dias`} 
                icon={<Clock size={24} />} 
                color="bg-purple-50 text-purple-600 border-purple-200"
                subtext="Prazo legal máximo: 20 dias"
              />
            </div>
          </div>

          <div className="mb-8 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-black tracking-tight text-slate-800 mb-6">Satisfação Cidadã (PNTP)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DashboardCard 
                title="Nota Média de Atendimento" 
                value={`${estatisticas.notaMedia?.toFixed(1) || 'N/A'} / 5.0`} 
                icon={<Star size={24} className={estatisticas.notaMedia ? "fill-current" : ""} />} 
                color="bg-amber-50 text-amber-600 border-amber-200"
              />
              <DashboardCard 
                title="Índice de Aprovação" 
                value={`${estatisticas.percentualAprovacao || 0}%`} 
                icon={<ThumbsUp size={24} />} 
                color="bg-teal-50 text-teal-600 border-teal-200"
                subtext="Cidadãos que avaliaram positivamente o serviço."
              />
            </div>
          </div>
        </>
      ) : (
        <div className="bg-slate-50 border border-slate-200 p-10 text-center rounded-3xl">
          <p className="text-slate-500 font-bold">Nenhum dado estatístico disponível no momento.</p>
        </div>
      )}

      {/* ... [RODAPÉ MANTIDO IGUAL] ... */}
    </div>
  );
}

function DashboardCard({ title, value, icon, color, subtext }: { title: string, value: string | number, icon: React.ReactNode, color: string, subtext?: string }) {
  return (
    <div className={`p-6 rounded-3xl border ${color} flex flex-col justify-between shadow-sm`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{title}</span>
        <div className="opacity-80">{icon}</div>
      </div>
      <div>
        <span className="text-3xl font-black tracking-tighter block">{value}</span>
        {subtext && <span className="text-xs font-medium opacity-80 mt-1 block">{subtext}</span>}
      </div>
    </div>
  );
}