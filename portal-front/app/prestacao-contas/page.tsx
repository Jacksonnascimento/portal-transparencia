'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  FileBarChart, Search, ArrowLeft, ChevronRight, Home, 
  Eye, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import api from '../../services/api';

// Tipagem baseada no PrestacaoContasResponseDTO
interface PrestacaoContas {
  id: string;
  tipoRelatorio: 'RREO' | 'RGF' | 'BALANCO_GERAL';
  exercicio: number;
  periodo?: number;
  tipoPeriodo: 'BIMESTRE' | 'QUADRIMESTRE' | 'SEMESTRE' | 'ANUAL';
  dataPublicacao: string;
  arquivoPdfUrl: string;
  arquivoNome: string;
}

export default function PrestacaoContasPublicaPage() {
  const [documentos, setDocumentos] = useState<PrestacaoContas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalElementos, setTotalElementos] = useState(0);

  const anoAtual = new Date().getFullYear().toString();
  const anosDisponiveis = Array.from({ length: 6 }, (_, i) => (parseInt(anoAtual) - i).toString());

  const [filtros, setFiltros] = useState({
    exercicio: anoAtual, 
    tipoRelatorio: '', 
    tipoPeriodo: '',
    termoBusca: ''
  });

  const buscarDados = useCallback(async (pagina = paginaAtual) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtros.exercicio) params.append('exercicio', filtros.exercicio);
      if (filtros.tipoRelatorio) params.append('tipoRelatorio', filtros.tipoRelatorio);
      if (filtros.tipoPeriodo) params.append('tipoPeriodo', filtros.tipoPeriodo);
      if (filtros.termoBusca) params.append('termoBusca', filtros.termoBusca);
      
      params.append('page', pagina.toString());
      params.append('size', '20');
      params.append('sort', 'dataPublicacao,desc'); // Ordenação padrão: mais recentes primeiro

      const response = await api.get(`/portal/prestacao-contas?${params.toString()}`);

      setDocumentos(response.data.content || []);
      setTotalPaginas(response.data.totalPages || 0); 
      setTotalElementos(response.data.totalElements || 0);

    } catch (err) {
      console.error("Erro na busca de prestação de contas:", err);
      setError("Não foi possível conectar à base de dados no momento.");
    } finally {
      setLoading(false);
    }
  }, [filtros, paginaAtual]); 

  useEffect(() => {
    buscarDados(paginaAtual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaAtual]); 

  const handlePesquisar = () => {
    if (paginaAtual === 0) buscarDados(0);
    else setPaginaAtual(0); 
  };

  const limparFiltros = () => {
    setFiltros({ exercicio: anoAtual, tipoRelatorio: '', tipoPeriodo: '', termoBusca: '' });
    setPaginaAtual(0);
  };

  // Funções Auxiliares de Formatação e UX
  const formatDate = (date: any) => {
    if (!date) return '---';
    if (Array.isArray(date)) return `${String(date[2]).padStart(2, '0')}/${String(date[1]).padStart(2, '0')}/${date[0]}`;
    return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const formatPeriodoFiscal = (item: PrestacaoContas) => {
    if (item.tipoPeriodo === 'ANUAL') return `Exercício ${item.exercicio}`;
    return `${item.periodo}º ${item.tipoPeriodo.substring(0, 3)} / ${item.exercicio}`; // Ex: 1º BIM / 2024
  };

  const getEstiloRelatorio = (tipo: string) => {
    switch (tipo) {
      case 'RREO': return { nome: 'RREO', desc: 'Resumido de Execução Orçamentária', cor: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'RGF': return { nome: 'RGF', desc: 'Relatório de Gestão Fiscal', cor: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'BALANCO_GERAL': return { nome: 'Balanço Geral', desc: 'Demonstrações Contábeis Anuais', cor: 'text-amber-700 bg-amber-50 border-amber-200' };
      default: return { nome: tipo, desc: '', cor: 'text-slate-700 bg-slate-50 border-slate-200' };
    }
  };

  const handleAbrirDocumento = (url: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const urlCompleta = url.startsWith('http') ? url : `${baseUrl}${url}`;
    window.open(urlCompleta, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-slate-50 min-h-screen relative font-sans">
      
      {/* Navegação Secundária */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1">
          <Home size={12} /> Início
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600">Prestação de Contas</span>
      </nav>

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <button onClick={() => window.history.back()} className="flex items-center text-slate-400 hover:text-[var(--cor-primaria)] mb-2 transition-all font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={14} className="mr-1.5" /> Voltar
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <FileBarChart className="text-[var(--cor-primaria)]" size={32} aria-hidden="true" /> Relatórios Fiscais
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1 max-w-2xl">
            Acesso aos Relatórios Resumidos de Execução Orçamentária (RREO), Relatórios de Gestão Fiscal (RGF) e Balanço Geral, em conformidade com a LRF.
          </p>
        </div>
      </div>

      {/* Área de Filtros Padrão Portal */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-end">
          
          <FilterBox label="Exercício (Ano)">
            <select value={filtros.exercicio} onChange={(e) => setFiltros({...filtros, exercicio: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none cursor-pointer">
              {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </FilterBox>

          <FilterBox label="Tipo de Relatório">
            <select value={filtros.tipoRelatorio} onChange={(e) => setFiltros({...filtros, tipoRelatorio: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none cursor-pointer">
              <option value="">Todos (RREO, RGF...)</option>
              <option value="RREO">RREO</option>
              <option value="RGF">RGF</option>
              <option value="BALANCO_GERAL">Balanço Geral</option>
            </select>
          </FilterBox>

          <FilterBox label="Período">
            <select 
              value={filtros.tipoPeriodo} 
              onChange={(e) => setFiltros({...filtros, tipoPeriodo: e.target.value})} 
              disabled={filtros.tipoRelatorio === 'BALANCO_GERAL'}
              className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="">Todos</option>
              <option value="BIMESTRE">Bimestral</option>
              <option value="QUADRIMESTRE">Quadrimestral</option>
              <option value="SEMESTRE">Semestral</option>
              <option value="ANUAL">Anual</option>
            </select>
          </FilterBox>

          <FilterBox label="Buscar Arquivo">
            <input 
              type="text" 
              placeholder="Ex: RGF_2024..." 
              value={filtros.termoBusca} 
              onChange={(e) => setFiltros({...filtros, termoBusca: e.target.value})} 
              className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" 
            />
          </FilterBox>

          <div className="flex gap-2">
            <button onClick={handlePesquisar} className="flex-1 bg-slate-900 text-white h-[46px] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[var(--cor-primaria)] transition-colors shadow-md flex items-center justify-center gap-2">
              <Search size={16} /> Buscar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
           <AlertCircle size={20} />
           <p className="font-bold text-sm">{error}</p>
        </div>
      )}

      {/* Tabela de Resultados */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th scope="col" className="px-6 py-4">Documento / Tipo</th>
                <th scope="col" className="px-6 py-4">Período de Referência</th>
                <th scope="col" className="px-6 py-4">Publicação</th>
                <th scope="col" className="px-6 py-4 text-center">Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center font-bold text-slate-400 animate-pulse text-sm uppercase tracking-widest">
                    Localizando documentos...
                  </td>
                </tr>
              ) : documentos.length === 0 ? (
                 <tr>
                   <td colSpan={4} className="py-16 text-center">
                     <FileBarChart className="mx-auto text-slate-300 mb-3" size={40} />
                     <p className="text-slate-500 font-medium text-sm">Nenhum relatório localizado para este filtro.</p>
                     <button onClick={limparFiltros} className="text-[var(--cor-primaria)] font-bold text-xs uppercase tracking-widest mt-2 hover:underline">
                       Limpar Filtros
                     </button>
                   </td>
                 </tr>
              ) : documentos.map((item) => {
                const badge = getEstiloRelatorio(item.tipoRelatorio);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 px-2 py-1 rounded text-[10px] font-black tracking-widest border shrink-0 ${badge.cor}`}>
                          {badge.nome}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 break-all line-clamp-2" title={item.arquivoNome}>
                            {item.arquivoNome}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">{badge.desc}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-slate-700 uppercase">
                        {formatPeriodoFiscal(item)}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        Ciclo Contábil
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-600">
                        {formatDate(item.dataPublicacao)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => handleAbrirDocumento(item.arquivoPdfUrl)}
                          className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-xl hover:bg-[var(--cor-primaria)] hover:text-white transition-all font-bold text-xs uppercase tracking-widest focus:ring-2 focus:ring-offset-2 focus:ring-[var(--cor-primaria)]"
                          title="Visualizar e Baixar Documento"
                        >
                          <Eye size={14} /> Abrir PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Rodapé e Paginação */}
        {!loading && documentos.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 gap-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Mostrando página {paginaAtual + 1} de {totalPaginas || 1} <span className="lowercase mx-1">({totalElementos} registros)</span>
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPaginaAtual(p => Math.max(0, p - 1))}
                disabled={paginaAtual === 0 || loading}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 transition-colors shadow-sm"
              >
                Anterior
              </button>
              <button 
                onClick={() => setPaginaAtual(p => p + 1)}
                disabled={paginaAtual >= totalPaginas - 1 || loading}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 transition-colors shadow-sm"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// Componente Wrapper para os filtros, garantindo harmonia visual com o resto do Portal
function FilterBox({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex flex-col focus-within:border-[var(--cor-primaria)] focus-within:ring-1 focus-within:ring-[var(--cor-primaria)] transition-colors h-[46px] justify-center">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</span>
      {children}
    </div>
  );
}