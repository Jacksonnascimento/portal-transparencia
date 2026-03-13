'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ImportarReceitas } from '@/components/importar/ImportarReceitas';
import { ImportarDespesas } from '@/components/importar/ImportarDespesas';
import { ImportarDividaAtiva } from '@/components/importar/ImportarDividaAtiva';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText,
  Scale
} from 'lucide-react';

export default function ImportarPage() {
  const [activeTab, setActiveTab] = useState<'receitas' | 'divida' | 'despesas' | 'folha' | 'contratos'>('receitas');

  const tabClass = (tabName: string) => `flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
    activeTab === tabName ? 'border-black text-black' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
  }`;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto relative">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Central de Cargas</h1>
          <p className="text-slate-500 mt-1 font-medium">Ingestão massiva de dados para o Portal da Transparência.</p>
        </div>

        <div className="flex flex-wrap border-b border-slate-200 mb-8 bg-white rounded-t-xl px-2">
          <button onClick={() => setActiveTab('receitas')} className={tabClass('receitas')}>
            <TrendingUp size={16} /> Receitas
          </button>
          
          <button onClick={() => setActiveTab('divida')} className={tabClass('divida')}>
            <Scale size={16} /> Dívida Ativa
          </button>

          <button onClick={() => setActiveTab('despesas')} className={tabClass('despesas')}>
            <TrendingDown size={16} /> Despesas
          </button>

          <button onClick={() => setActiveTab('folha')} className={tabClass('folha')}>
            <Users size={16} /> Pessoal (RH)
          </button>

           <button onClick={() => setActiveTab('contratos')} className={tabClass('contratos')}>
            <FileText size={16} /> Contratos
          </button>
        </div>

        <div className="min-h-[400px]">
          {activeTab === 'receitas' && <ImportarReceitas />}
          {activeTab === 'divida' && <ImportarDividaAtiva />}
          
          {/* ATUALIZADO: Agora renderiza o componente real de importação de despesas */}
          {activeTab === 'despesas' && <ImportarDespesas />}
          
          {/* Módulos ainda não implementados permanecem com EmptyState */}
          {activeTab === 'folha' && <EmptyState title="Módulo de Pessoal" desc="A importação da folha de pagamento está em desenvolvimento." icon={<Users size={48} className="text-slate-300 mb-4" />} />}
          {activeTab === 'contratos' && <EmptyState title="Licitações e Contratos" desc="Módulo destinado à carga de processos licitatórios." icon={<FileText size={48} className="text-slate-300 mb-4" />} />}
        </div>
      </main>
    </div>
  );
}

function EmptyState({ title, desc, icon }: any) {
  return (
    <div className="flex flex-col items-center justify-center p-16 rounded-3xl border-2 border-dashed border-slate-200 bg-white animate-in fade-in zoom-in-95">
      {icon}
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-md text-center text-sm mb-6">{desc}</p>
      <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Em Breve</span>
    </div>
  );
}