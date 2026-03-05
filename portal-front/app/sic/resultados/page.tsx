'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Home, BarChart3, Clock, CheckCircle, FileText } from 'lucide-react';
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
      
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1">
          <Home size={12} /> Início
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <Link href="/sic" className="hover:text-[var(--cor-primaria)] transition-colors">
          SIC e Ouvidoria
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600">Relatório Estatístico</span>
      </nav>

      <div className="mb-10 border-b border-slate-200 pb-8">
        <div className="flex items-center gap-3 text-[var(--cor-primaria)] mb-2">
          <BarChart3 size={32} />
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">
            Painel de Desempenho do SIC
          </h1>
        </div>
        <p className="text-slate-500 font-medium max-w-3xl">
          Acompanhe os indicadores de atendimento do Serviço de Informação ao Cidadão. 
          Nossa meta é garantir o cumprimento dos prazos exigidos pela Lei de Acesso à Informação (LAI).
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 animate-pulse h-32 rounded-3xl"></div>
          ))}
        </div>
      ) : estatisticas ? (
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
            title="Tempo Médio (Dias)" 
            value={estatisticas.tempoMedioRespostaDias} 
            icon={<Clock size={24} />} 
            color="bg-purple-50 text-purple-600 border-purple-200"
            subtext="Prazo legal: 20 dias"
          />

        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 p-10 text-center rounded-3xl">
          <p className="text-slate-500 font-bold">Nenhum dado estatístico disponível no momento.</p>
        </div>
      )}

      <div className="mt-12 bg-slate-900 text-white p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-black tracking-tight">Ficou com alguma dúvida?</h3>
          <p className="text-slate-400 text-sm">Acesse o portal do e-SIC e registre sua manifestação ou pedido de informação.</p>
        </div>
        <Link href="/sic" className="bg-white text-slate-900 font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl hover:bg-[var(--cor-primaria)] hover:text-white transition-colors whitespace-nowrap">
          Acessar o e-SIC
        </Link>
      </div>
    </div>
  );
}

function DashboardCard({ title, value, icon, color, subtext }: { title: string, value: number, icon: React.ReactNode, color: string, subtext?: string }) {
  return (
    <div className={`p-6 rounded-3xl border ${color} flex flex-col justify-between shadow-sm`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{title}</span>
        <div className="opacity-80">{icon}</div>
      </div>
      <div>
        <span className="text-4xl font-black tracking-tighter block">{value}</span>
        {subtext && <span className="text-xs font-medium opacity-80 mt-1 block">{subtext}</span>}
      </div>
    </div>
  );
}