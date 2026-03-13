"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar'; 
import { Search, Plus, FileText, Trash2, Eye, RefreshCw, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { prestacaoContasService, PrestacaoContas, FiltrosPrestacaoContas } from '@/services/prestacaoContasService';
import PrestacaoContasFormModal from '@/components/prestacao-contas/PrestacaoContasFormModal';

export default function PrestacaoContasPage() {
  const [data, setData] = useState<any>(null); // Mantemos any para capturar a paginação do Spring
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estado dos Filtros
  const [filtros, setFiltros] = useState<FiltrosPrestacaoContas>({
    page: 0,
    size: 20,
    termoBusca: '',
    tipoRelatorio: '',
    exercicio: undefined,
  });

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const paramsLimpos = Object.fromEntries(
        Object.entries(filtros).filter(([_, v]) => v !== '' && v !== undefined && v !== null && !Number.isNaN(v))
      );
      
      const response = await prestacaoContasService.listar(paramsLimpos);
      setData(response); 
    } catch (error) {
      console.error("Erro ao carregar prestações de contas", error);
      alert("Falha ao carregar os dados. Verifique a conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleExcluir = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Atenção: Tem certeza que deseja excluir permanentemente este documento contábil? Esta ação será registrada na auditoria.")) {
      try {
        await prestacaoContasService.excluir(id);
        carregarDados();
      } catch (error) {
        console.error("Erro ao excluir", error);
        alert("Falha ao excluir o documento.");
      }
    }
  };

  const handleVisualizarPdf = (url: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const urlCompleta = url.startsWith('http') ? url : `${baseUrl}${url}`;
    window.open(urlCompleta, '_blank');
  };

  // --- FUNÇÃO CORRIGIDA (EVITA BUILD ERROR E BLOQUEIA ANOS NEGATIVOS) ---
  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let processedValue: any = value;
    
    // Blindagem de Exercício Negativo
    if (name === 'exercicio' && value !== '') {
      processedValue = Math.max(0, parseInt(value));
    }

    setFiltros(prev => ({ 
      ...prev, 
      [name]: processedValue,
      page: 0 // Reseta paginação ao filtrar
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      page: 0,
      size: 20,
      termoBusca: '',
      tipoRelatorio: '',
      exercicio: undefined,
    });
  };

  const setPage = (newPage: number) => {
    setFiltros(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-y-auto relative z-0">
        
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-black text-white rounded-lg"><FileText size={24} /></div>
             <div>
               <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Prestação de Contas</h2>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic text-emerald-600 font-mono">
                 Documentos Fiscais • Selo Ouro PNTP
               </p>
             </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="flex items-center px-4 py-2 bg-emerald-700 hover:bg-emerald-800 border border-transparent rounded-xl shadow-sm font-bold text-xs uppercase text-white transition-all"
            >
              <Plus size={14} className="mr-2" /> Nova Publicação
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`flex items-center px-4 py-2 border rounded-xl shadow-sm font-bold text-xs uppercase transition-all ${showFilters ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              <Filter size={14} className="mr-2" /> {showFilters ? 'Fechar Filtros' : 'Filtrar Buscas'}
            </button>
          </div>
        </header>

        {showFilters && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <Search size={12}/> Buscar Arquivo (Nome)
                </label>
                <input
                  type="text"
                  name="termoBusca"
                  value={filtros.termoBusca}
                  onChange={handleFiltroChange}
                  placeholder="Ex: RREO_2024.pdf"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tipo de Relatório</label>
                <select
                  name="tipoRelatorio"
                  value={filtros.tipoRelatorio}
                  onChange={handleFiltroChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
                >
                  <option value="">Todos os Documentos</option>
                  <option value="RREO">RREO</option>
                  <option value="RGF">RGF</option>
                  <option value="BALANCO_GERAL">Balanço Geral</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Exercício</label>
                <input
                  type="number"
                  name="exercicio"
                  value={filtros.exercicio || ''}
                  onChange={handleFiltroChange}
                  min="2000" // <-- BLOQUEIA UI NEGATIVA
                  placeholder="Ano"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex justify-end col-span-1 md:col-span-4 gap-2 mt-2">
                <button 
                  onClick={carregarDados}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Atualizar
                </button>
                <button 
                  onClick={limparFiltros} 
                  className="px-4 py-2 text-[10px] font-bold text-red-500 uppercase flex items-center gap-1 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={14} /> Limpar Todos os Filtros
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Tipo de Documento</th>
                  <th className="px-6 py-4">Período Fiscal</th>
                  <th className="px-6 py-4">Data de Publicação</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading && (!data?.content || data.content.length === 0) ? (
                  <tr className="animate-pulse">
                    <td colSpan={4} className="h-32 bg-slate-50/20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Carregando acervo contábil...
                    </td>
                  </tr>
                ) : !data?.content || data.content.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="h-32 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Nenhum documento localizado no filtro atual.
                    </td>
                  </tr>
                ) : (
                  data.content.map((item: PrestacaoContas) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50 transition-colors text-xs cursor-pointer group"
                      onClick={() => handleVisualizarPdf(item.arquivoPdfUrl)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 uppercase">
                          {item.tipoRelatorio.replace('_', ' ')}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                          Arquivo: {item.arquivoNome}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700 uppercase">
                          {item.tipoPeriodo === 'ANUAL' 
                            ? `Exercicio ${item.exercicio}` 
                            : `${item.periodo}º ${item.tipoPeriodo.substring(0,3)} • ${item.exercicio}`}
                        </div>
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded w-fit font-bold uppercase border border-slate-200 inline-block mt-1">
                          {item.tipoPeriodo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-600 flex items-center gap-1 uppercase">
                           {new Date(item.dataPublicacao).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVisualizarPdf(item.arquivoPdfUrl);
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-100 transition-colors"
                            title="Visualizar Documento"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => handleExcluir(e, item.id)}
                            className="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                            title="Remover Publicação"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {!loading && data && data.totalElements > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                Página {data.number + 1} de {data.totalPages} • {data.totalElements} registros
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setPage(Math.max(0, data.number - 1)); }} 
                  disabled={data.first} 
                  className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setPage(Math.min(data.totalPages - 1, data.number + 1)); }} 
                  disabled={data.last} 
                  className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <PrestacaoContasFormModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            carregarDados();
          }} 
        />
      )}
    </div>
  );
}