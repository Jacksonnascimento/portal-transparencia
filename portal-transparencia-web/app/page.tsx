'use client';

import { useEffect, useState } from 'react';
import api from '../services/api';
import Link from 'next/link'; // Importante para a navegação
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  FileUp, 
  RefreshCw, 
  Calendar, 
  Tag,
  Wallet
} from 'lucide-react';

export default function Page() {
  const [receitas, setReceitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const response = await api.get('/receitas');
      const dados = response.data.content || [];
      setReceitas(dados);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      // Pequeno delay para percepção visual do refresh
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // FORMATADOR DE DATA - TRATA ARRAY [2025,1,15] OU STRING "2025-01-15"
  const renderData = (item: any) => {
    const val = item.dataLancamento || item.data_lancamento || item.data;
    if (!val) return "---";
    
    try {
      if (Array.isArray(val)) {
        return `${String(val[2]).padStart(2, '0')}/${String(val[1]).padStart(2, '0')}/${val[0]}`;
      }
      if (typeof val === 'string') {
        const partes = val.split('T')[0].split('-');
        return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : val;
      }
    } catch { return "---"; }
    return "---";
  };

  // BUSCA A CATEGORIA REAL DO BANCO
  const renderCategoria = (item: any) => {
    return item.categoriaEconomica || item.categoria_economica || item.categoria || "Receita";
  };

  const totalReceitas = receitas.reduce((acc, curr) => acc + (curr.valorArrecadado || 0), 0);

  return (
    <div className="flex min-h-screen bg-[#F1F5F9] text-slate-900 font-sans text-sm">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0F172A] text-white hidden lg:flex flex-col sticky top-0 h-screen shadow-2xl">
        <div className="p-5 border-b border-slate-800">
          <h1 className="text-xl font-black tracking-tighter italic text-blue-500">HORIZON <span className="text-white">AJ</span></h1>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button className="flex items-center w-full px-4 py-2 bg-blue-600 rounded-lg text-white font-semibold shadow-lg shadow-blue-900/40">
            <LayoutDashboard size={18} className="mr-3" /> Dashboard
          </button>
          
          <button className="flex items-center w-full px-4 py-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all group">
            <TrendingUp size={18} className="mr-3 group-hover:text-green-400" /> Receitas
          </button>
          
          <button className="flex items-center w-full px-4 py-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all group">
            <TrendingDown size={18} className="mr-3 group-hover:text-red-400" /> Despesas
          </button>

          {/* LINK PARA A PÁGINA DE IMPORTAÇÃO */}
          <Link href="/importar" className="flex items-center w-full px-4 py-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all border-t border-slate-800 pt-4 mt-4 group">
            <FileUp size={18} className="mr-3 group-hover:text-blue-400" /> Importar Dados
          </Link>
        </nav>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 p-6 overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Painel de Controle</h2>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Horizon AJ • Retaguarda</p>
          </div>
          <button 
            onClick={carregarDados} 
            disabled={loading}
            className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:bg-slate-50 hover:border-blue-300 font-bold text-xs uppercase tracking-tighter transition-all active:scale-95"
          >
            <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin text-blue-500' : ''}`} /> 
            {loading ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </header>

        {/* CARDS COM EFEITO HOVER (SALTO) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:border-green-300 group cursor-default">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-green-600">Receita Arrecadada</p>
            <h4 className="text-2xl font-black text-slate-900 tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceitas)}
            </h4>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:border-red-300 group cursor-default">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-red-500">Total de Despesas</p>
            <h4 className="text-2xl font-black text-slate-300 tracking-tight italic">R$ 0,00</h4>
          </div>

          <div className="bg-white p-6 rounded-xl border-l-4 border-l-blue-600 shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl group cursor-default">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-600">Saldo Consolidado</p>
            <h4 className="text-2xl font-black text-blue-600 tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceitas)}
            </h4>
          </div>
        </div>

        {/* TABELA COMPACTA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
             <h3 className="font-bold text-slate-700 text-sm flex items-center">
                <Tag size={16} className="mr-2 text-blue-500" /> Histórico de Lançamentos
             </h3>
             <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
               {receitas.length} Registros
             </span>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-white">
                <th className="px-6 py-4">Origem</th>
                <th className="px-6 py-4 text-center">Classificação</th>
                <th className="px-6 py-4 text-center">Data</th>
                <th className="px-6 py-4 text-right">Valor Bruto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {receitas.map((item, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-colors text-xs group">
                  <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{item.origem || "---"}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded-md uppercase border border-slate-200">
                      {renderCategoria(item)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-semibold text-center">
                     <div className="flex items-center justify-center">
                        <Calendar size={12} className="mr-2 opacity-40 text-blue-500" />
                        {renderData(item)}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900 group-hover:text-green-600 transition-colors">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorArrecadado)}
                  </td>
                </tr>
              ))}
              {receitas.length === 0 && !loading && (
                <tr>
                   <td colSpan={4} className="p-10 text-center text-slate-400 italic font-medium">Nenhum dado encontrado no banco.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}