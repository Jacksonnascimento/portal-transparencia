'use client';

import Link from 'next/link';
import { 
  Home, ChevronRight, Map, Landmark, FileText, 
  HelpCircle, ShieldCheck, Database, Users, Briefcase, 
  TrendingUp, TrendingDown, Clipboard, Search
} from 'lucide-react';

export default function MapaDoSitePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans animate-in fade-in duration-500">
      
      {/* 1. BREADCRUMB */}
      <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1">
          <Home size={12} /> Início
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600">Mapa do Site</span>
      </nav>

      {/* 2. CABEÇALHO (Padrão das páginas internas) */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm mb-10 flex items-center gap-6 relative overflow-hidden">
        <div className="bg-[var(--cor-primaria-fundo)] text-[var(--cor-primaria)] p-5 rounded-3xl shrink-0 z-10">
          <Map size={40} />
        </div>
        <div className="z-10">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-2">
            Mapa do Site
          </h1>
          <p className="text-slate-500 font-medium text-sm max-w-2xl">
            Visão hierárquica e estruturada de todas as páginas, serviços e informações de transparência disponíveis neste portal.
          </p>
        </div>
        <Map className="absolute -right-10 -bottom-10 text-slate-50 opacity-50" size={200} />
      </div>

      {/* 3. CONTEÚDO: ESTRUTURA DO PORTAL EM GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* BLOCO: Institucional e Gestão */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-slate-800">
            <Landmark className="text-[var(--cor-primaria)]" size={24} />
            <h2 className="text-lg font-black tracking-tight">Institucional e Gestão</h2>
          </div>
          <ul className="space-y-4">
            <li>
              <Link href="/" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Página Inicial
              </Link>
            </li>
            <li>
              <Link href="/institucional" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Estrutura Organizacional (Quem é Quem)
              </Link>
            </li>
            <li>
              <Link href="/conselhos" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Conselhos Municipais
              </Link>
            </li>
            <li>
              <Link href="/prestacao-contas" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Prestação de Contas (LRF/RREO)
              </Link>
            </li>
          </ul>
        </div>

        {/* BLOCO: Execução Orçamentária e Financeira */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-slate-800">
            <TrendingUp className="text-[var(--cor-primaria)]" size={24} />
            <h2 className="text-lg font-black tracking-tight">Finanças e Orçamento</h2>
          </div>
          <ul className="space-y-4">
            <li>
              <Link href="/receitas" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Receitas Municipais
              </Link>
            </li>
            <li>
              <Link href="/despesas" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Despesas (Empenhos, Liquidações, Pagamentos)
              </Link>
            </li>
            <li>
              <Link href="/diarias" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Diárias e Passagens
              </Link>
            </li>
            <li>
              <Link href="/convenios" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Convênios e Transferências
              </Link>
            </li>
          </ul>
        </div>

        {/* BLOCO: Compras, Contratos e Obras */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-slate-800">
            <Briefcase className="text-[var(--cor-primaria)]" size={24} />
            <h2 className="text-lg font-black tracking-tight">Compras e Contratos</h2>
          </div>
          <ul className="space-y-4">
            <li>
              <Link href="/licitacoes" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Licitações e Pregões
              </Link>
            </li>
            <li>
              <Link href="/contratos" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Contratos Firmados
              </Link>
            </li>
            <li>
              <Link href="/obras" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Obras Públicas
              </Link>
            </li>
          </ul>
        </div>

        {/* BLOCO: Gestão de Pessoas */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-slate-800">
            <Users className="text-[var(--cor-primaria)]" size={24} />
            <h2 className="text-lg font-black tracking-tight">Gestão de Pessoas</h2>
          </div>
          <ul className="space-y-4">
            <li>
              <Link href="/pessoal" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Quadro de Servidores (Folha de Pagamento)
              </Link>
            </li>
            {/* Espaço para futuras adições como Concursos, Estagiários, etc */}
          </ul>
        </div>

        {/* BLOCO: Participação Cidadã e Serviços */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-slate-800">
            <HelpCircle className="text-[var(--cor-primaria)]" size={24} />
            <h2 className="text-lg font-black tracking-tight">Atendimento ao Cidadão</h2>
          </div>
          <ul className="space-y-4">
            <li>
              <Link href="/sic" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> e-SIC (Pedido de Informação)
              </Link>
            </li>
            <li>
              <Link href="/carta-servicos" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Carta de Serviços
              </Link>
            </li>
            <li>
              <Link href="/faq" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Perguntas Frequentes (FAQ)
              </Link>
            </li>
            <li>
              <Link href="/glossario" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Glossário de Termos Técnicos
              </Link>
            </li>
          </ul>
        </div>

        {/* BLOCO: Tecnologia e Legal */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-slate-800">
            <Database className="text-[var(--cor-primaria)]" size={24} />
            <h2 className="text-lg font-black tracking-tight">Dados e Privacidade</h2>
          </div>
          <ul className="space-y-4">
            <li>
              <Link href="/dados-abertos" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Portal de Dados Abertos (API/CSV)
              </Link>
            </li>
            <li>
              <Link href="/privacidade" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Política de Privacidade (LGPD)
              </Link>
            </li>
            <li>
              <Link href="/termo" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Termo de Uso
              </Link>
            </li>
            <li>
              <a href="https://radardatransparencia.atricon.org.br/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-500 hover:text-[var(--cor-primaria)] hover:translate-x-1 transition-all flex items-center gap-2">
                <ChevronRight size={14} className="opacity-40" /> Radar da Transparência (Atricon)
              </a>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}