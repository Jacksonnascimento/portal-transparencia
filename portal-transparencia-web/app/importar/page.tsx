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
  // Estado para controlar qual aba está ativa ('receitas' é o padrão)
  const [activeTab, setActiveTab] = useState<'receitas' | 'despesas' | 'folha' | 'contratos'>('receitas');

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* TÍTULO DA CENTRAL DE CARGAS */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Central de Cargas e Importação</h1>
          <p className="text-slate-500 mt-1">
            Selecione o módulo abaixo para alimentar a base de dados do Portal da Transparência.
          </p>
        </div>

        {/* --- NAVEGAÇÃO DE ABAS (TABS) --- */}
        <div className="flex flex-wrap border-b border-slate-200 mb-8">
          
          {/* Aba Receitas (Ativa) */}
          <button
            onClick={() => setActiveTab('receitas')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'receitas'
                ? 'border-green-500 text-green-700 bg-green-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <TrendingUp size={18} />
            Receitas
          </button>

          {/* Aba Despesas (Futura) */}
          <button
            onClick={() => setActiveTab('despesas')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'despesas'
                ? 'border-red-500 text-red-700 bg-red-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <TrendingDown size={18} />
            Despesas
          </button>

          {/* Aba Folha (Futura) */}
          <button
            onClick={() => setActiveTab('folha')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'folha'
                ? 'border-blue-500 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users size={18} />
            Folha de Pagamento
          </button>

           {/* Aba Contratos (Futura) */}
           <button
            onClick={() => setActiveTab('contratos')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'contratos'
                ? 'border-purple-500 text-purple-700 bg-purple-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FileText size={18} />
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
              desc="A importação de empenhos, liquidações e pagamentos estará disponível na próxima atualização do sistema."
              color="text-red-600"
              bgColor="bg-red-50"
              borderColor="border-red-200"
            />
          )}

          {activeTab === 'folha' && (
            <EmptyState 
              title="Módulo de Pessoal (RH)" 
              desc="A importação da folha de pagamento de servidores ativos e inativos em desenvolvimento."
              color="text-blue-600"
              bgColor="bg-blue-50"
              borderColor="border-blue-200"
            />
          )}

          {activeTab === 'contratos' && (
             <EmptyState 
             title="Licitações e Contratos" 
             desc="Módulo destinado à carga de processos licitatórios e gestão de contratos administrativos."
             color="text-purple-600"
             bgColor="bg-purple-50"
             borderColor="border-purple-200"
           />
          )}

        </div>
      </main>
    </div>
  );
}

// Pequeno componente para mostrar "Em Breve" nas outras abas
function EmptyState({ title, desc, color, bgColor, borderColor }: any) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed ${borderColor} ${bgColor} animate-in fade-in zoom-in-95`}>
      <AlertCircle size={48} className={`mb-4 ${color} opacity-50`} />
      <h3 className={`text-xl font-bold ${color} mb-2`}>{title}</h3>
      <p className="text-slate-500 max-w-md text-center">
        {desc}
      </p>
      <span className="mt-6 px-4 py-2 bg-white rounded-full text-xs font-bold text-slate-400 border border-slate-200 shadow-sm uppercase tracking-wide">
        Em Desenvolvimento
      </span>
    </div>
  );
}