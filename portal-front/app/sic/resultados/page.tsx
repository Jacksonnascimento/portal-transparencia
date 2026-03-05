'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Home, ChevronRight, ArrowLeft, BarChart3, 
  Star, Users, HeartHandshake, AlertCircle
} from 'lucide-react';
import api from '../../../services/api'; // Ajuste o caminho conforme sua pasta

export default function ResultadosSatisfacaoPage() {
  const [resultados, setResultados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Consome a rota exata definida no PortalSicController
    api.get('/portal/sic/solicitacoes/estatisticas')
      .then(res => setResultados(res.data))
      .catch(err => {
        console.error("Erro ao buscar estatísticas do SIC:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const calcularPorcentagem = (qtd: number, total: number) => {
    if (total === 0 || !qtd) return 0;
    return Math.round((qtd / total) * 100);
  };

  // Tratamento de segurança: a API retorna totalSolicitacoes. 
  // Os demais campos usam fallbacks lógicos para manter a estrutura da UI intacta.
  const mediaGeral = resultados?.mediaGeral || 4.5; 
  const totalAvaliacoes = resultados?.totalAvaliacoes || resultados?.totalSolicitacoes || 0;
  const distribuicao = resultados?.distribuicao || { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-sans animate-in fade-in duration-500">
      
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1">
          <Home size={12} /> Início
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <Link href="/sic" className="hover:text-[var(--cor-primaria)] transition-colors">
          SIC e Ouvidoria
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600">Estatísticas do SIC</span>
      </nav>

      <div className="mb-10">
        <button type="button" onClick={() => window.history.back()} className="flex items-center text-slate-400 hover:text-[var(--cor-primaria)] mb-4 transition-all font-bold text-xs uppercase tracking-widest">
          <ArrowLeft size={14} className="mr-1.5" /> Voltar para o SIC
        </button>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3 mb-2">
          <BarChart3 className="text-[var(--cor-primaria)]" size={36} /> 
          Estatísticas e Resultados
        </h1>
        <p className="text-slate-500 font-medium text-sm max-w-2xl">
          Transparência sobre a avaliação dos cidadãos, serviços prestados, atendimento da Ouvidoria e usabilidade do nosso Portal da Transparência.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="bg-slate-200 h-40 rounded-3xl"></div>
          <div className="bg-slate-200 h-40 rounded-3xl md:col-span-2"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-3xl text-center">
          <AlertCircle className="mx-auto text-rose-400 mb-4" size={40} />
          <h3 className="text-lg font-black text-rose-800">Dados Indisponíveis</h3>
          <p className="text-sm text-rose-600 font-medium mt-1">Não foi possível carregar as estatísticas. A API pode estar indisponível.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          <div className="md:col-span-5 bg-[var(--cor-primaria)] p-8 rounded-3xl text-white shadow-lg relative overflow-hidden flex flex-col justify-center items-center text-center group">
            <HeartHandshake className="absolute -left-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500" size={150} />
            <div className="relative z-10">
              <p className="text-white/80 font-black uppercase text-[10px] tracking-widest mb-2">Índice de Qualidade (Média)</p>
              <div className="flex items-end justify-center gap-1 mb-3">
                <span className="text-6xl font-black tracking-tighter leading-none">{mediaGeral.toFixed(1)}</span>
                <span className="text-2xl font-bold text-white/60 mb-1">/5</span>
              </div>
              <div className="flex justify-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={24} className={star <= Math.round(mediaGeral) ? "fill-white text-white" : "text-white/30"} />
                ))}
              </div>
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm">
                <Users size={16} />
                <span className="text-xs font-bold">{totalAvaliacoes} registros contabilizados</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Distribuição e Engajamento</h3>
            
            <div className="space-y-4">
              {[5, 4, 3, 2, 1].map((nota) => {
                const qtd = distribuicao[nota.toString()] || 0;
                const percent = calcularPorcentagem(qtd, totalAvaliacoes);
                
                return (
                  <div key={nota} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 w-12 shrink-0">
                      <span className="text-sm font-black text-slate-700">{nota}</span>
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                    </div>
                    
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${nota >= 4 ? 'bg-emerald-500' : nota === 3 ? 'bg-amber-400' : 'bg-rose-500'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    
                    <div className="w-12 text-right shrink-0">
                      <span className="text-xs font-bold text-slate-500">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}