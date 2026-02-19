'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom'; 
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar'; 
import { 
  ChevronLeft, 
  ChevronRight,
  Filter,
  AlertCircle,
  X,
  Eye,
  FileText,
  TrendingUp,
  Target,
  CheckCircle,
  Download
} from 'lucide-react';

// --- INTERFACES ---
interface Receita {
  id: number;
  exercicio: number;
  mes: number;
  dataLancamento: string | number[]; 
  categoriaEconomica: string;
  origem: string;
  especie?: string;
  rubrica?: string;
  alinea?: string;
  fonteRecursos: string;
  valorPrevistoInicial?: number;
  valorPrevistoAtualizado?: number;
  valorArrecadado: number;
  historico?: string;
}

interface PageResponse {
  content: Receita[];
  totalPages: number;
  totalElements: number;
  number: number;
  first: boolean;
  last: boolean;
}

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null; 

  return createPortal(children, modalRoot);
};

export default function ReceitasPage() {
  const [data, setData] = useState<PageResponse | null>(null);
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [selectedReceita, setSelectedReceita] = useState<Receita | null>(null);

  // Estados dos Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [fExercicio, setFExercicio] = useState('');
  const [fOrigem, setFOrigem] = useState('');
  const [fCategoria, setFCategoria] = useState('');
  const [fFonte, setFFonte] = useState('');
  
  // Datas Contábeis
  const [fDataInicio, setFDataInicio] = useState('');
  const [fDataFim, setFDataFim] = useState('');
  
  // Datas de Importação (Auditoria)
  const [fDataImpInicio, setFDataImpInicio] = useState('');
  const [fDataImpFim, setFDataImpFim] = useState('');

  useEffect(() => {
    api.get<number[]>('/receitas/anos')
      .then(res => setAnosDisponiveis(res.data))
      .catch(err => console.error("Erro ao buscar anos:", err));
  }, []);

  const fetchReceitas = useCallback(async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      let params = `page=${pageNumber}&size=20&sort=dataLancamento,desc`;
      if (fExercicio) params += `&exercicio=${fExercicio}`;
      if (fOrigem) params += `&origem=${encodeURIComponent(fOrigem)}`;
      if (fCategoria) params += `&categoria=${encodeURIComponent(fCategoria)}`;
      if (fFonte) params += `&fonte=${encodeURIComponent(fFonte)}`;
      if (fDataInicio) params += `&dataInicio=${fDataInicio}`;
      if (fDataFim) params += `&dataFim=${fDataFim}`;
      if (fDataImpInicio) params += `&dataImportacaoInicio=${fDataImpInicio}`;
      if (fDataImpFim) params += `&dataImportacaoFim=${fDataImpFim}`;

      const response = await api.get(`/receitas?${params}`);
      setData(response.data);
      setPage(pageNumber);
    } catch (err) {
      setError("Não foi possível carregar as receitas. Verifique a ligação.");
    } finally {
      setLoading(false);
    }
  }, [fExercicio, fOrigem, fCategoria, fFonte, fDataInicio, fDataFim, fDataImpInicio, fDataImpFim]);

  useEffect(() => {
    fetchReceitas(page);
  }, [page, fetchReceitas]);

  const formatMoney = (val?: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (val: any) => {
    if (!val) return "---";
    if (Array.isArray(val)) return `${String(val[2]).padStart(2, '0')}/${String(val[1]).padStart(2, '0')}/${val[0]}`;
    return new Date(val).toLocaleDateString('pt-BR');
  };

  const calcularPorcentagem = (arrecadado: number, previsto?: number) => {
    if (!previsto || previsto === 0) return 0;
    return Math.min(100, (arrecadado / previsto) * 100);
  };

  const handleExportCSV = () => {
    if (!data || data.content.length === 0) {
      alert("Não há dados na tabela para exportar.");
      return;
    }

    const headers = [
      "ID", "Exercicio", "Mes", "Data Lancamento", "Categoria Economica", 
      "Origem", "Fonte de Recursos", "Valor Previsto Atualizado", "Valor Arrecadado", "Historico"
    ];

    const rows = data.content.map(r => [
      r.id,
      r.exercicio,
      r.mes,
      formatDate(r.dataLancamento),
      r.categoriaEconomica,
      r.origem,
      r.fonteRecursos,
      r.valorPrevistoAtualizado || 0,
      r.valorArrecadado,
      `"${r.historico || ''}"`
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";"))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Receitas_Exportacao_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const limparFiltros = () => {
    setFExercicio(''); setFOrigem(''); setFCategoria(''); setFFonte(''); 
    setFDataInicio(''); setFDataFim(''); setFDataImpInicio(''); setFDataImpFim(''); 
    setPage(0);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-y-auto relative z-0">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Receitas Públicas</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Horizon AJ • Módulo de Conferência</p>
          </div>
          <div className="flex gap-2">
            
            <button 
              onClick={handleExportCSV}
              className="flex items-center px-4 py-2 border border-slate-200 rounded-xl shadow-sm font-bold text-xs uppercase bg-white text-slate-700 hover:text-black hover:bg-slate-50 transition-all"
            >
              <Download size={14} className="mr-2" /> Exportar (.CSV)
            </button>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 border rounded-xl shadow-sm font-bold text-xs uppercase transition-all ${
                showFilters ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter size={14} className="mr-2" /> {showFilters ? 'Fechar Filtros' : 'Filtrar Dados'}
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-200 animate-in shake duration-300">
            <AlertCircle className="mr-2" size={20} /> {error}
          </div>
        )}

        {/* --- FILTROS (Com divisões claras) --- */}
        {showFilters && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2 space-y-6">
            
            {/* Bloco 1: Filtros de Classificação e Contabilidade */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Target size={14} className="text-blue-600" /> Parâmetros Contábeis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Exercício</label>
                  <select 
                    value={fExercicio} onChange={(e) => { setFExercicio(e.target.value); setPage(0); }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm font-medium"
                  >
                    <option value="">Todos</option>
                    {anosDisponiveis.map(ano => <option key={ano} value={ano}>{ano}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Data Lançamento (De)</label>
                  <input type="date" value={fDataInicio} onChange={(e) => { setFDataInicio(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm text-slate-600" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Data Lançamento (Até)</label>
                  <input type="date" value={fDataFim} onChange={(e) => { setFDataFim(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm text-slate-600" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Origem</label>
                  <input type="text" placeholder="Ex: Impostos..." value={fOrigem} onChange={(e) => { setFOrigem(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Categoria</label>
                  <input type="text" placeholder="Ex: Correntes..." value={fCategoria} onChange={(e) => { setFCategoria(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm" />
                </div>
              </div>
            </div>

            {/* Bloco 2: Filtros de Auditoria */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
                <FileText size={14} className="text-emerald-600" /> Auditoria de Importação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Importado (De)</label>
                  <input type="date" value={fDataImpInicio} onChange={(e) => { setFDataImpInicio(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-600 text-sm text-emerald-800" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Importado (Até)</label>
                  <input type="date" value={fDataImpFim} onChange={(e) => { setFDataImpFim(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg focus:outline-none focus:border-emerald-600 text-sm text-emerald-800" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Fonte de Recursos</label>
                  <input type="text" placeholder="Ex: Tesouro..." value={fFonte} onChange={(e) => { setFFonte(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm" />
                </div>
                <div className="flex justify-end">
                  <button onClick={limparFiltros} className="px-4 py-2 mt-5 text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg uppercase transition-all flex items-center gap-2" title="Limpar Filtros">
                    <X size={14} /> Limpar Tudo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TABELA DE DADOS (READ-ONLY) --- */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Data Lançamento</th>
                  <th className="px-6 py-4">Origem</th>
                  <th className="px-6 py-4">Fonte de Recurso</th>
                  <th className="px-6 py-4 text-right">Valor Arrecadado</th>
                  <th className="px-6 py-4 text-center">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                   [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-6 bg-slate-50/20"></td></tr>)
                ) : (
                  data?.content.map((item) => (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedReceita(item)} 
                      className="hover:bg-slate-50 transition-colors text-xs group cursor-pointer"
                    >
                      <td className="px-6 py-4 text-slate-500 font-semibold">{formatDate(item.dataLancamento)}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">{item.origem}</td>
                      <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]">{item.fonteRecursos}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">{formatMoney(item.valorArrecadado)}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedReceita(item); }} 
                          className="p-1.5 text-slate-300 hover:text-black hover:bg-slate-100 rounded transition-all" 
                          title="Visualizar Detalhes"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* PAGINAÇÃO */}
          {!loading && data && data.totalElements > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Página {data.number + 1} de {data.totalPages} • Total: {data.totalElements} registos
              </span>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(0, p - 1)); }} disabled={data.first} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"><ChevronLeft size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(data.totalPages - 1, p + 1)); }} disabled={data.last} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL DE DETALHES (VIA PORTAL) --- */}
      {selectedReceita && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-start flex-shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" /> Detalhamento da Receita
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-black uppercase tracking-wide border border-blue-200">
                      ID: {selectedReceita.id}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold uppercase">
                       Exercício {selectedReceita.exercicio} • Mês {selectedReceita.mes}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedReceita(null)} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-8 bg-white text-slate-700">
                
                {/* BLOCO DE VALORES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-2"><Target size={12} /> Previsão Inicial</span>
                    <div className="text-lg font-bold text-slate-600">{formatMoney(selectedReceita.valorPrevistoInicial)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-2"><Target size={12} /> Previsão Atualizada</span>
                    <div className="text-lg font-bold text-slate-700">{formatMoney(selectedReceita.valorPrevistoAtualizado)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                    <span className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1 mb-2"><TrendingUp size={12} /> Valor Arrecadado</span>
                    <div className="text-2xl font-black text-green-700">{formatMoney(selectedReceita.valorArrecadado)}</div>
                  </div>
                </div>

                {/* BARRA DE PROGRESSO */}
                {selectedReceita.valorPrevistoAtualizado && selectedReceita.valorPrevistoAtualizado > 0 && (
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase">
                      <span>Execução da Receita</span>
                      <span>{calcularPorcentagem(selectedReceita.valorArrecadado, selectedReceita.valorPrevistoAtualizado).toFixed(1)}% Realizado</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${calcularPorcentagem(selectedReceita.valorArrecadado, selectedReceita.valorPrevistoAtualizado)}%` }}></div></div>
                  </div>
                )}

                {/* INFORMAÇÕES TÉCNICAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Dados de Classificação</h4>
                    <div><span className="text-[10px] font-bold text-slate-400 uppercase block">Categoria Econômica</span><p className="font-semibold text-sm">{selectedReceita.categoriaEconomica}</p></div>
                    <div><span className="text-[10px] font-bold text-slate-400 uppercase block">Origem</span><p className="font-semibold text-sm">{selectedReceita.origem}</p></div>
                    {selectedReceita.especie && <div><span className="text-[10px] font-bold text-slate-400 uppercase block">Espécie</span><p className="font-semibold text-sm">{selectedReceita.especie}</p></div>}
                    {selectedReceita.rubrica && <div><span className="text-[10px] font-bold text-slate-400 uppercase block">Rubrica</span><p className="font-semibold text-sm">{selectedReceita.rubrica}</p></div>}
                    {selectedReceita.alinea && <div><span className="text-[10px] font-bold text-slate-400 uppercase block">Alínea</span><p className="font-semibold text-sm">{selectedReceita.alinea}</p></div>}
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Fonte de Recurso</h4>
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                      <span className="text-[10px] font-bold text-yellow-600 uppercase block mb-1">Destinação</span>
                      <p className="font-bold text-yellow-900 leading-tight text-sm">{selectedReceita.fonteRecursos}</p>
                    </div>
                    <div className="mt-4">
                       <span className="text-[10px] font-bold text-slate-400 uppercase block">Data do Lançamento</span>
                       <p className="font-mono font-bold text-slate-700">{formatDate(selectedReceita.dataLancamento)}</p>
                    </div>
                  </div>
                </div>

                {/* HISTÓRICO */}
                <div className="border-t border-slate-100 pt-8">
                   <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-4">Histórico / Descrição</h4>
                   <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 italic leading-relaxed text-sm">
                     {selectedReceita.historico || "Sem histórico detalhado informado na origem."}
                   </div>
                </div>
              </div>

              {/* RODAPÉ DO MODAL */}
              <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <CheckCircle size={12} className="text-green-500" /> Registo conferido do Contábil
                </span>
                <button onClick={() => setSelectedReceita(null)} className="px-6 py-2 bg-black hover:bg-slate-800 text-white font-bold rounded-lg transition-all text-xs uppercase shadow-lg">Fechar Detalhes</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}