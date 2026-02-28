'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, ChevronRight, FileText, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function TermoPage() {
  const [conteudo, setConteudo] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    // Busca na rota global de configurações, onde o Java guarda o texto
    api.get('/portal/configuracoes')
      .then(res => {
        // Pega especificamente o campo termosUso que vem do Java
        const texto = res.data?.termosUso;
        setConteudo(texto ? texto : '');
      })
      .catch(err => {
        console.error("Erro ao carregar Termo de Uso:", err);
        setErro(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-sans animate-in fade-in duration-500">
      
      {/* 1. BREADCRUMB */}
      <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1">
          <Home size={12} /> Início
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600">Termo de Uso</span>
      </nav>

      {/* 2. CABEÇALHO */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm mb-8 flex items-center gap-6 relative overflow-hidden">
        <div className="bg-slate-100 text-slate-600 p-5 rounded-3xl shrink-0 z-10">
          <FileText size={40} />
        </div>
        <div className="z-10">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-2">
            Termo de Uso
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Regras e condições de utilização das informações do Portal da Transparência.
          </p>
        </div>
        <FileText className="absolute -right-10 -bottom-10 text-slate-50 opacity-50" size={200} />
      </div>

      {/* 3. CONTEÚDO DO DOCUMENTO */}
      <div className="bg-white p-8 md:p-14 rounded-[3rem] border border-slate-200 shadow-sm min-h-[50vh]">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            <div className="h-4 bg-slate-200 rounded w-4/5"></div>
            <div className="h-4 bg-slate-200 rounded w-full mt-8"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          </div>
        ) : erro ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <AlertCircle className="text-rose-400 mb-4" size={48} />
            <h3 className="text-lg font-black text-slate-800 mb-2">Documento Indisponível</h3>
            <p className="text-sm text-slate-500 font-medium">Não foi possível carregar o Termo de Uso. Tente novamente mais tarde.</p>
          </div>
        ) : (
          <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed whitespace-pre-wrap text-sm md:text-base">
            {conteudo || "Nenhum texto de Termo de Uso cadastrado no sistema."}
          </div>
        )}
      </div>

    </div>
  );
}