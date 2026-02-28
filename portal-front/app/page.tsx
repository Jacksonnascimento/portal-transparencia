'use client';

import Link from 'next/link';
import { 
  TrendingUp, TrendingDown, Users, PlaneTakeoff, 
  FileSignature, ScrollText, Landmark, Info, 
  Search, ChevronRight, Home, Building2, Database, 
  HelpCircle, BookOpen, Wrench, Briefcase, Shield, Clipboard
} from 'lucide-react';
import { useState } from 'react';

export default function HomePage() {
  const [buscaGeral, setBuscaGeral] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`A busca global pela palavra "${buscaGeral}" será conectada à API em breve!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-slate-50 min-h-screen relative font-sans">
      
      {/* 1. BREADCRUMB */}
      <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1">
          <Home size={12} /> Início
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600">Painel Principal</span>
      </nav>

      {/* 2. CABEÇALHO E BUSCA GLOBAL */}
      <div className="mb-12 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <Landmark className="absolute -right-10 -bottom-10 text-slate-50 opacity-50" size={250} />
        <div className="relative z-10 w-full md:w-1/2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Transparência Pública</h1>
          <p className="text-slate-500 font-medium text-sm mb-6">
            Acompanhe a aplicação dos recursos e as ações da administração municipal.
          </p>
          <form onSubmit={handleSearch} className="flex items-center bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-[var(--cor-primaria)] focus-within:ring-1 focus-within:ring-[var(--cor-primaria)] transition-all w-full max-w-md">
            <Search className="text-slate-400 ml-3 mr-2 shrink-0" size={20} />
            <input 
              type="text" placeholder="Ex: Licitação de Obras, Salários..." value={buscaGeral} onChange={(e) => setBuscaGeral(e.target.value)}
              className="w-full bg-transparent py-2 text-slate-900 font-bold text-sm outline-none placeholder:text-slate-400 placeholder:font-medium"
            />
            <button type="submit" className="bg-black text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[var(--cor-primaria)] transition-colors shrink-0">Buscar</button>
          </form>
        </div>
      </div>

      {/* 3. GRADE DE INFORMAÇÕES (12 Módulos PNTP Diamante) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MenuCard href="/receitas" icon={<TrendingUp size={32} />} title="Receitas" desc="Arrecadação municipal" />
        <MenuCard href="/despesas" icon={<TrendingDown size={32} />} title="Despesas" desc="Empenhos e pagamentos" />
        <MenuCard href="/licitacoes" icon={<FileSignature size={32} />} title="Licitações" desc="Processos e contratos" />
        <MenuCard href="/pessoal" icon={<Users size={32} />} title="Servidores" desc="Folha de pagamento (RH)" />
        
        {/* Usando ícones seguros e clássicos do Lucide */}
        <MenuCard href="/obras" icon={<Wrench size={32} />} title="Obras Públicas" desc="Acompanhamento e medições" />
        <MenuCard href="/convenios" icon={<Briefcase size={32} />} title="Convênios" desc="Repasses e transferências" />
        <MenuCard href="/diarias" icon={<PlaneTakeoff size={32} />} title="Diárias e Viagens" desc="Concessões e passagens" />
        <MenuCard href="/prestacao-contas" icon={<ScrollText size={32} />} title="Prestação de Contas" desc="RREO, RGF e Balanços" />
        
        <MenuCard href="/carta-servicos" icon={<Clipboard size={32} />} title="Carta de Serviços" desc="Atendimento ao usuário" />
        <MenuCard href="/conselhos" icon={<Shield size={32} />} title="Conselhos Municipais" desc="Atas e resoluções" />
        <MenuCard href="/institucional" icon={<Building2 size={32} />} title="Institucional" desc="Estrutura e contatos" />
        <MenuCard href="/dados-abertos" icon={<Database size={32} />} title="Dados Abertos" desc="Catálogo e consumo API" />
      </div>

      {/* 4. ÁREA DE PARTICIPAÇÃO E APOIO AO CIDADÃO */}
      <div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3 mb-2">
              <Info className="text-[var(--cor-primaria)]" size={28} /> e-SIC e Participação
            </h2>
            <p className="text-slate-500 font-medium text-sm">
              Não encontrou o que procurava? Solicite a informação diretamente através do nosso Sistema Eletrônico (Lei 12.527/11).
            </p>
          </div>
          <Link href="/sic" className="bg-[var(--cor-primaria)] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-[var(--cor-primaria-fundo)] whitespace-nowrap">
            Acessar o e-SIC
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/faq" className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-[var(--cor-primaria)] shadow-sm hover:shadow-md transition-all group flex items-center gap-5">
            <div className="bg-slate-50 text-slate-400 p-4 rounded-2xl group-hover:bg-[var(--cor-primaria)] group-hover:text-white transition-colors"><HelpCircle size={24} /></div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1 group-hover:text-[var(--cor-primaria)] transition-colors">Perguntas Frequentes</h3>
              <p className="text-xs text-slate-500 font-medium">Dúvidas comuns sobre o uso do portal</p>
            </div>
          </Link>

          <Link href="/glossario" className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:border-[var(--cor-primaria)] shadow-sm hover:shadow-md transition-all group flex items-center gap-5">
            <div className="bg-slate-50 text-slate-400 p-4 rounded-2xl group-hover:bg-[var(--cor-primaria)] group-hover:text-white transition-colors"><BookOpen size={24} /></div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1 group-hover:text-[var(--cor-primaria)] transition-colors">Glossário de Termos</h3>
              <p className="text-xs text-slate-500 font-medium">Dicionário da linguagem orçamentária</p>
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
}

function MenuCard({ title, desc, icon, href }: { title: string, desc: string, icon: React.ReactNode, href: string }) {
  return (
    <Link href={href} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:border-[var(--cor-primaria)] hover:shadow-lg transition-all group flex flex-col h-full cursor-pointer relative overflow-hidden">
      <div className="text-slate-300 group-hover:text-[var(--cor-primaria)] transition-colors mb-6 group-hover:scale-110 duration-300 origin-left">{icon}</div>
      <div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">{title}</h3>
        <p className="text-sm text-slate-500 font-medium">{desc}</p>
      </div>
    </Link>
  );
}