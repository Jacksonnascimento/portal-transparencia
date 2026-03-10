'use client';

import { useState } from 'react';
import Link from 'next/link';

// LISTA 100% SEGURA: Ícones verificados da Lucide-React
import { 
  TrendingUp, TrendingDown, Users, PlaneTakeoff, 
  FileSignature, ScrollText, Landmark, Info, 
  Search, ChevronRight, Home, Building2, Database, 
  HelpCircle, BookOpen, Wrench, Briefcase, Shield, Clipboard, FileText, MessageSquare
} from 'lucide-react';

export default function HomePage() {
  const [buscaTermo, setBuscaTermo] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (buscaTermo.trim()) {
      console.log('Buscando por:', buscaTermo);
      alert(`Buscando no portal inteiro por: ${buscaTermo}`);
    }
  };

  return (
    <div className="w-full flex flex-col font-sans">
      
      {/* 1. SEÇÃO HERO & BARRA DE BUSCA GLOBAL (Critério 1.4 PNTP) */}
      <section className="bg-slate-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[var(--cor-primaria)] via-slate-900 to-slate-900"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-6">
            O que você procura hoje?
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-medium mb-10 max-w-2xl mx-auto">
            Utilize a barra abaixo para pesquisar por despesas, licitações, servidores, credores ou qualquer outra informação pública do município.
          </p>
          
          <form onSubmit={handleSearch} className="flex items-center bg-white p-2 rounded-[2rem] shadow-2xl focus-within:ring-4 focus-within:ring-[var(--cor-primaria-fundo)] transition-all">
            <Search className="text-slate-400 ml-4 mr-2" size={24} />
            <input 
              type="text" 
              placeholder="Ex: Merenda Escolar, Pagamento de Servidor..."
              value={buscaTermo}
              onChange={(e) => setBuscaTermo(e.target.value)}
              className="w-full bg-transparent py-4 text-slate-900 font-bold text-base md:text-lg outline-none placeholder:text-slate-400"
            />
            <button type="submit" className="bg-[var(--cor-primaria)] hover:bg-[var(--cor-primaria-hover)] text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm transition-all whitespace-nowrap">
              Pesquisar
            </button>
          </form>
        </div>
      </section>

      {/* 2. MÓDULOS OBRIGATÓRIOS PNTP (Grid com 16 Cards 4x4) */}
      <section className="max-w-7xl mx-auto px-4 -mt-10 relative z-20 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <MenuCard href="/receitas" icon={<TrendingUp size={32} />} title="Receitas" desc="Arrecadação municipal" />
          <MenuCard href="/despesas" icon={<TrendingDown size={32} />} title="Despesas" desc="Empenhos e pagamentos" />
          <MenuCard href="/licitacoes" icon={<FileSignature size={32} />} title="Licitações" desc="Processos e contratos" />
          <MenuCard href="/contratos" icon={<FileText size={32} />} title="Contratos" desc="Instrumentos firmados" />
          
          <MenuCard href="/pessoal" icon={<Users size={32} />} title="Servidores" desc="Folha de pagamento (RH)" />
          <MenuCard href="/diarias" icon={<PlaneTakeoff size={32} />} title="Diárias" desc="Viagens e concessões" />
          <MenuCard href="/obras" icon={<Wrench size={32} />} title="Obras Públicas" desc="Acompanhamento local" />
          <MenuCard href="/prestacao-contas" icon={<ScrollText size={32} />} title="Contas" desc="Relatórios RREO e RGF" />
          
          <MenuCard href="/convenios" icon={<Briefcase size={32} />} title="Convênios" desc="Repasses e transferências" />
          <MenuCard href="/carta-servicos" icon={<Clipboard size={32} />} title="Serviços" desc="Catálogo de atendimento" />
          <MenuCard href="/conselhos" icon={<Shield size={32} />} title="Conselhos" desc="Atas e resoluções" />
          <MenuCard href="/sic" icon={<HelpCircle size={32} />} title="e-SIC" desc="Acesso à informação" />

          {/* NOVOS CARDS + PERGUNTAS FREQUENTES */}
          <MenuCard href="/saude" icon={<Info size={32} />} title="Saúde" desc="Listas de espera e farmácia" />
          <MenuCard href="/educacao" icon={<BookOpen size={32} />} title="Educação" desc="Vagas em creches e escolas" />
          <MenuCard href="/emendas" icon={<Landmark size={32} />} title="Emendas" desc="Emendas parlamentares e PIX" />
          <MenuCard href="/faq" icon={<MessageSquare size={32} />} title="FAQ" desc="Perguntas Frequentes" />

        </div>
      </section>

      {/* 3. SEÇÃO INSTITUCIONAL E RADAR */}
      <section className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <Link href="/institucional" className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-[var(--cor-primaria)] shadow-sm hover:shadow-md transition-all group flex items-start gap-6">
              <div className="bg-slate-50 text-slate-600 group-hover:bg-[var(--cor-primaria-fundo)] group-hover:text-[var(--cor-primaria)] p-5 rounded-2xl transition-colors shrink-0">
                <Building2 size={36} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-[var(--cor-primaria)] transition-colors">
                  Institucional e Estrutura
                </h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4">
                  Acesse o organograma da gestão, competências, endereços de atendimento e o contato dos responsáveis por cada secretaria.
                </p>
                <div className="flex items-center gap-2 text-[var(--cor-primaria)] font-bold text-xs uppercase tracking-widest">
                  Conheça a Gestão <ChevronRight size={14} />
                </div>
              </div>
            </Link>

            <a 
              href="https://radardatransparencia.atricon.org.br/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl border border-slate-700 hover:border-blue-500 shadow-sm hover:shadow-lg transition-all group flex items-start gap-6 relative overflow-hidden"
            >
              <div className="bg-white/10 text-blue-400 p-5 rounded-2xl shrink-0 z-10">
                <Search size={36} />
              </div>
              <div className="z-10">
                <h3 className="text-xl font-black text-white tracking-tight mb-2">
                  Radar da Transparência Pública
                </h3>
                <p className="text-sm text-slate-300 font-medium leading-relaxed mb-4">
                  Consulte o índice oficial de transparência deste portal avaliado pelo Tribunal de Contas e compare os resultados no sistema da Atricon.
                </p>
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest">
                  Acessar Sistema Nacional <ChevronRight size={14} />
                </div>
              </div>
              <Search className="absolute -right-6 -bottom-6 text-white opacity-5" size={150} />
            </a>

          </div>
        </div>
      </section>

      {/* 4. DADOS ABERTOS E INFORMAÇÕES ADICIONAIS (Critério 15.4 PNTP) */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8 bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm">
          <div className="flex items-center gap-6">
            <div className="bg-indigo-50 text-indigo-600 p-5 rounded-3xl shrink-0">
              <Database size={36} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">
                Portal de Dados Abertos
              </h3>
              <p className="text-sm text-slate-500 font-medium max-w-lg">
                As informações deste portal estão disponíveis em formatos estruturados e legíveis por máquina (CSV, JSON e API), conforme a Lei de Acesso à Informação.
              </p>
            </div>
          </div>
          <Link href="/dados-abertos" className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-3 rounded-xl font-bold text-sm transition-colors whitespace-nowrap">
            Acessar API e Downloads
          </Link>
        </div>
      </section>

      {/* 5. SELOS E ATUALIZAÇÃO */}
      <section className="pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border border-emerald-100">
          <Info size={14} /> Dados Financeiros Atualizados em Tempo Real
        </div>
      </section>

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