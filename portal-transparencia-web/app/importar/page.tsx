'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ImportarReceitas } from '@/components/importar/ImportarReceitas';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText,
  AlertCircle
} from 'lucide-react';

export default function ImportarPage() {
  const [activeTab, setActiveTab] = useState<'receitas' | 'despesas' | 'folha' | 'contratos'>('receitas');

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto relative">
        
        {/* TÍTULO DA CENTRAL DE CARGAS */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Central de Cargas</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Ingestão massiva de dados para o Portal da Transparência.
          </p>
        </div>

        {/* --- NAVEGAÇÃO DE ABAS (TABS) --- */}
        <div className="flex flex-wrap border-b border-slate-200 mb-8 bg-white rounded-t-xl px-2">
          
          {/* Aba Receitas (Ativa) */}
          <button
            onClick={() => setActiveTab('receitas')}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'receitas'
                ? 'border-black text-black'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TrendingUp size={16} />
            Receitas
          </button>

          {/* Aba Despesas */}
          <button
            onClick={() => setActiveTab('despesas')}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'despesas'
                ? 'border-black text-black'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TrendingDown size={16} />
            Despesas
          </button>

          {/* Aba Folha */}
          <button
            onClick={() => setActiveTab('folha')}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'folha'
                ? 'border-black text-black'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users size={16} />
            Pessoal (RH)
          </button>

           {/* Aba Contratos */}
           <button
            onClick={() => setActiveTab('contratos')}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'contratos'
                ? 'border-black text-black'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText size={16} />
            Contratos
          </button>
        </div>

        {/* --- CONTEÚDO DA ABA ATIVA --- */}
        <div className="min-h-[400px]">
          
          {activeTab === 'receitas' && (
            <ImportarReceitas />
          )}

          {activeTab === 'despesas' && (
            <EmptyState 
              title="Módulo de Despesas" 
              desc="A importação de empenhos, liquidações e pagamentos estará disponível na próxima atualização."
              icon={<TrendingDown size={48} className="text-slate-300 mb-4" />}
            />
          )}

          {activeTab === 'folha' && (
            <EmptyState 
              title="Módulo de Pessoal" 
              desc="A importação da folha de pagamento de servidores ativos e inativos está em desenvolvimento."
              icon={<Users size={48} className="text-slate-300 mb-4" />}
            />
          )}

          {activeTab === 'contratos' && (
             <EmptyState 
             title="Licitações e Contratos" 
             desc="Módulo destinado à carga de processos licitatórios e gestão de contratos administrativos."
             icon={<FileText size={48} className="text-slate-300 mb-4" />}
           />
          )}

        </div>
      </main>
    </div>
  );
}

// Componente EmptyState Padronizado (Sem cores fortes, focado no Clean Design)
function EmptyState({ title, desc, icon }: any) {
  return (
    <div className="flex flex-col items-center justify-center p-16 rounded-3xl border-2 border-dashed border-slate-200 bg-white animate-in fade-in zoom-in-95">
      {icon}
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-md text-center text-sm mb-6">
        {desc}
      </p>
      <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
        Em Breve
      </span>
    </div>
  );
}