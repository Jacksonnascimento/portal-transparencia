'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar'; 
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  AlertCircle,
  Search,
  X
} from 'lucide-react';

// INTERFACE
interface Receita {
  id: number;
  exercicio?: string | number;
  ano?: string | number;
  mes?: string;
  dataLancamento?: string | number[]; 
  data?: string | number[];
  categoriaEconomica?: string;
  categoria?: string;
  origem?: string;
  fonteRecursos?: string;
  fonte?: string;
  valorArrecadado?: number;
  valor?: number;
}

interface PageResponse {
  content: Receita[];
  totalPages: number;
  totalElements: number;
  number: number;
  first: boolean;
  last: boolean;
}

export default function ReceitasPage() {
  const [data, setData] = useState<PageResponse | null>(null);
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]); // Estado para anos dinâmicos
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ESTADOS PARA OS FILTROS
  const [showFilters, setShowFilters] = useState(false);
  const [fExercicio, setFExercicio] = useState('');
  const [fOrigem, setFOrigem] = useState('');
  const [fCategoria, setFCategoria] = useState('');
  const [fFonte, setFFonte] = useState('');

  // 1. Busca os anos disponíveis no banco assim que a página carrega
  useEffect(() => {
    const carregarAnos = async () => {
      try {
        const response = await api.get<number[]>('/receitas/anos');
        setAnosDisponiveis(response.data);
      } catch (err) {
        console.error("Erro ao carregar anos:", err);
      }
    };
    carregarAnos();
  }, []);

  // 2. Função de busca memorizada com filtros
  const fetchReceitas = useCallback(async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      let params = `page=${pageNumber}&size=20&sort=dataLancamento,desc`;
      
      if (fExercicio) params += `&exercicio=${fExercicio}`;
      if (fOrigem) params += `&origem=${encodeURIComponent(fOrigem)}`;
      if (fCategoria) params += `&categoria=${encodeURIComponent(fCategoria)}`;
      if (fFonte) params += `&fonte=${encodeURIComponent(fFonte)}`;

      const response = await api.get(`/receitas?${params}`);
      setData(response.data);
      setPage(pageNumber);
    } catch (err) {
      console.error("Erro fatal:", err);
      setError("Não foi possível carregar a lista de receitas.");
    } finally {
      setLoading(false);
    }
  }, [fExercicio, fOrigem, fCategoria, fFonte]);

  useEffect(() => {
    fetchReceitas(page);
  }, [page, fetchReceitas]);

  const limparFiltros = () => {
    setFExercicio('');
    setFOrigem('');
    setFCategoria('');
    setFFonte('');
    setPage(0);
  };

  // --- FUNÇÕES DE RENDERIZAÇÃO BLINDADAS ---
  const renderData = (item: any) => {
    const val = item.dataLancamento || item.data_lancamento || item.data || item.date;
    if (!val) return "---";
    try {
       if (Array.isArray(val)) {
         return `${String(val[2]).padStart(2, '0')}/${String(val[1]).padStart(2, '0')}/${val[0]}`;
       }
       const date = new Date(val);
       return date.toLocaleDateString('pt-BR');
    } catch { return "---"; }
  };

  const renderExercicio = (item: any) => {
    return item.exercicio || item.ano || item.exercicioFinanceiro || "---";
  };

  const renderDinheiro = (item: any) => {
    const val = item.valorArrecadado ?? item.valor ?? 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const renderCategoria = (item: any) => {
    return item.categoriaEconomica || item.categoria_economica || item.categoria || "---";
  };

  const renderFonte = (item: any) => {
    return item.fonteRecursos || item.fonte_recursos || item.fonte || "---";
  };

  return (
    <div className="flex min-h-screen bg-[#F1F5F9] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Receitas Públicas</h2>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Gestão Fiscal • Detalhamento</p>
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 border rounded-lg shadow-sm font-bold text-xs uppercase tracking-tighter transition-all ${
              showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter size={14} className="mr-2" /> 
            {showFilters ? 'Fechar Filtros' : 'Filtrar Dados'}
          </button>
        </header>

        {/* PAINEL DE FILTROS INTEGRADO */}
        {showFilters && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Exercício</label>
                <select 
                  value={fExercicio} 
                  onChange={(e) => { setFExercicio(e.target.value); setPage(0); }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Todos os anos</option>
                  {/* MAPA DINÂMICO DE ANOS VINDOS DO BACKEND */}
                  {anosDisponiveis.map(ano => (
                    <option key={ano} value={ano}>{ano}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Origem</label>
                <input 
                  type="text" 
                  placeholder="Ex: IPTU..."
                  value={fOrigem}
                  onChange={(e) => { setFOrigem(e.target.value); setPage(0); }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Categoria</label>
                <input 
                  type="text" 
                  placeholder="Ex: Correntes..."
                  value={fCategoria}
                  onChange={(e) => { setFCategoria(e.target.value); setPage(0); }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Fonte</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Tesouro..."
                    value={fFonte}
                    onChange={(e) => { setFFonte(e.target.value); setPage(0); }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button 
                  onClick={limparFiltros}
                  className="p-2 mt-5 text-slate-400 hover:text-red-500 transition-colors"
                  title="Limpar Filtros"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <AlertCircle className="mr-2" size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Exercício</th>
                  <th className="px-6 py-4">Origem</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Fonte</th>
                  <th className="px-6 py-4 text-right">Valor Arrecadado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                   [...Array(5)].map((_, i) => (
                     <tr key={i} className="animate-pulse">
                       <td colSpan={6} className="px-6 py-6 bg-slate-50/20"></td>
                     </tr>
                   ))
                ) : (
                  data?.content.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors text-xs group">
                      <td className="px-6 py-4 text-slate-500 font-semibold flex items-center">
                         <Calendar size={12} className="mr-2 opacity-40 text-blue-500" />
                         {renderData(item)} 
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {renderExercicio(item)}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                        {item.origem || "---"}
                      </td>
                      <td className="px-6 py-4 text-slate-500 truncate max-w-[150px]" title={renderCategoria(item)}>
                        {renderCategoria(item)}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {renderFonte(item)}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 group-hover:text-green-600 transition-colors">
                        {renderDinheiro(item)}
                      </td>
                    </tr>
                  ))
                )}
                
                {!loading && (!data || data.content.length === 0) && !error && (
                   <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                        Nenhum registro encontrado.
                      </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading && data && data.totalElements > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Página {data.number + 1} de {data.totalPages} • Total: {data.totalElements}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={data.first}
                  className="p-2 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} className="text-slate-600" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))}
                  disabled={data.last}
                  className="p-2 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}