'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  TrendingDown, Search, FileText, ArrowLeft, ChevronRight, Home, 
  Download, Printer, Eye, X, CheckCircle2, Clock, User
} from 'lucide-react';
import Link from 'next/link';
import api from '../../services/api';

// --- INTERFACE ATUALIZADA PARA REFLETIR O 'DespesaPublicaDTO' DO BACKEND ---
interface Despesa {
  exercicio: number;
  dataEmpenho: string;
  numeroEmpenho: string;
  orgaoNome: string;
  credorNome: string;
  credorDocumento: string;
  elementoDespesa: string;
  valorEmpenhado: number;
  valorLiquidado: number;
  valorPago: number;
}

export default function DespesasPage() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [resumo, setResumo] = useState({ totalEmpenhado: 0, totalPago: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [anosDisponiveis, setAnosDisponiveis] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Despesa | null>(null);

  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);

  // --- INICIALIZAÇÃO DE ANO CORRENTE ---
  const anoAtual = new Date().getFullYear().toString();

  // --- FILTROS AJUSTADOS PARA OS PARÂMETROS DO BACKEND ---
  const [filtros, setFiltros] = useState({
    ano: anoAtual,
    credor: '',
    numeroEmpenho: '',
    elementoDespesa: ''
  });

  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros);

  // Busca Anos Disponíveis no Endpoint do Backend
  useEffect(() => {
    api.get('/portal/despesas/anos')
       .then(res => {
         if (res.data && res.data.length > 0) {
            setAnosDisponiveis(res.data.map(String));
         } else {
            setAnosDisponiveis([anoAtual]);
         }
       })
       .catch(() => setAnosDisponiveis([anoAtual]));
  }, [anoAtual]);

  const buscarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtros.ano) params.append('ano', filtros.ano);
      if (filtros.credor) params.append('credor', filtros.credor);
      if (filtros.numeroEmpenho) params.append('numeroEmpenho', filtros.numeroEmpenho);
      if (filtros.elementoDespesa) params.append('elementoDespesa', filtros.elementoDespesa);
      
      params.append('page', paginaAtual.toString());
      params.append('size', '50');
      params.append('sort', 'dataEmpenho,desc');

      // O resumo no backend exige apenas o 'ano'
      const anoResumo = filtros.ano || anoAtual;

      const [resLista, resResumo] = await Promise.all([
        api.get(`/portal/despesas?${params.toString()}`),
        api.get(`/portal/despesas/resumo?ano=${anoResumo}`).catch(() => ({ data: { valorEmpenhado: 0, valorPago: 0 } }))
      ]);

      setDespesas(resLista.data.content || []);
      setTotalPaginas(resLista.data.totalPages || 0); 
      
      // O backend retorna 'valorEmpenhado' e 'valorPago' (Mapeamento ajustado)
      setResumo({
        totalEmpenhado: resResumo.data.valorEmpenhado || 0,
        totalPago: resResumo.data.valorPago || 0
      });

      setFiltrosAplicados(filtros);

    } catch (err) {
      console.error("Erro na busca de despesas:", err);
      setError("Não foi possível conectar à API de Transparência.");
    } finally {
      setLoading(false);
    }
  }, [filtros, paginaAtual, anoAtual]); 

  useEffect(() => {
    buscarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaAtual]); 

  const handlePesquisar = () => {
    if (paginaAtual === 0) buscarDados();
    else setPaginaAtual(0); 
  };

  const handleExport = async (formato: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.append('formato', formato); // O backend usa ?formato=pdf
      if (filtrosAplicados.ano) params.append('ano', filtrosAplicados.ano);
      if (filtrosAplicados.credor) params.append('credor', filtrosAplicados.credor);
      if (filtrosAplicados.numeroEmpenho) params.append('numeroEmpenho', filtrosAplicados.numeroEmpenho);
      if (filtrosAplicados.elementoDespesa) params.append('elementoDespesa', filtrosAplicados.elementoDespesa);

      const response = await api.get(`/portal/despesas/exportar?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `despesas_${filtrosAplicados.ano || 'geral'}.${formato}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(`Erro ao gerar o arquivo ${formato.toUpperCase()}. Tente novamente mais tarde.`);
    } finally {
      setIsExporting(false);
    }
  };

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const formatDate = (date: any) => {
    if (!date) return '---';
    if (Array.isArray(date)) return `${String(date[2]).padStart(2, '0')}/${String(date[1]).padStart(2, '0')}/${date[0]}`;
    const parsed = new Date(date);
    return parsed.toLocaleDateString('pt-BR', {timeZone: 'UTC'}); // Forçando UTC pra evitar bugs de fuso
  };

  // Mantido seguro contra undefined
  const mascararDocumento = (doc: string) => {
    if (!doc || doc === '---') return '---';
    const limpo = doc.replace(/\D/g, '');
    if (limpo.length === 11) return `${limpo.substring(0, 3)}.***.***-${limpo.substring(9, 11)}`;
    if (limpo.length === 14) return `${limpo.substring(0, 2)}.***.***/****-${limpo.substring(12, 14)}`;
    return doc; // O backend já pode estar devolvendo mascarado para pessoa física
  };

  const getStatusPagamento = (item: Despesa) => {
    if (item.valorPago >= item.valorEmpenhado && item.valorEmpenhado > 0) return { text: 'Pago', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={12}/> };
    if (item.valorLiquidado > 0) return { text: 'Liquidado', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <Clock size={12}/> };
    return { text: 'Empenhado', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <FileText size={12}/> };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-slate-50 min-h-screen relative font-sans">
      
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1">
          <Home size={12} /> Início
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600">Despesas Públicas</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <button onClick={() => window.history.back()} className="flex items-center text-slate-400 hover:text-[var(--cor-primaria)] mb-2 transition-all font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={14} className="mr-1.5" /> Voltar
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <TrendingDown className="text-[var(--cor-primaria)]" size={32} aria-hidden="true" /> Despesas
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Acompanhe as compras, contratações e pagamentos a fornecedores.</p>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => handleExport('pdf')} disabled={isExporting} className="bg-white p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-black hover:shadow-md transition-all disabled:opacity-50" title="Exportar PDF">
            <Printer size={18} className={isExporting ? "animate-pulse" : ""} />
          </button>
          <button onClick={() => handleExport('csv')} disabled={isExporting} className="bg-white p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-black hover:shadow-md transition-all disabled:opacity-50" title="Exportar CSV">
            <Download size={18} className={isExporting ? "animate-pulse" : ""} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-[var(--cor-primaria)] p-6 rounded-2xl text-white shadow-lg shadow-[var(--cor-primaria-fundo)] relative overflow-hidden group">
          <FileText className="absolute right-[-10px] bottom-[-10px] opacity-20 group-hover:scale-110 transition-transform duration-500" size={120} aria-hidden="true" />
          <p className="text-white/80 font-bold uppercase text-[10px] tracking-widest mb-1">Total Empenhado {filtrosAplicados.ano ? `(Exercício ${filtrosAplicados.ano})` : ''}</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">{loading ? "..." : formatMoney(resumo.totalEmpenhado)}</h2>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <CheckCircle2 className="absolute right-[-10px] bottom-[-10px] opacity-5 text-slate-900 group-hover:scale-110 transition-transform duration-500" size={120} aria-hidden="true" />
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Total Efetivamente Pago</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{loading ? "..." : formatMoney(resumo.totalPago)}</h2>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <FilterBox label="Exercício">
            <select value={filtros.ano} onChange={(e) => setFiltros({...filtros, ano: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none cursor-pointer">
              <option value="">Todos os Anos</option>
              {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </FilterBox>
          <FilterBox label="Nome do Credor">
            <input type="text" placeholder="Ex: Construtora..." value={filtros.credor} onChange={(e) => setFiltros({...filtros, credor: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" />
          </FilterBox>
          <FilterBox label="Nº Empenho">
            <input type="text" placeholder="Ex: 2024/123" value={filtros.numeroEmpenho} onChange={(e) => setFiltros({...filtros, numeroEmpenho: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" />
          </FilterBox>
          <FilterBox label="Elemento de Despesa">
            <input type="text" placeholder="Ex: 3.3.90..." value={filtros.elementoDespesa} onChange={(e) => setFiltros({...filtros, elementoDespesa: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" />
          </FilterBox>
          <button onClick={handlePesquisar} className="bg-slate-900 text-white h-[46px] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[var(--cor-primaria)] transition-colors shadow-md flex items-center justify-center gap-2">
            <Search size={16} /> Buscar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th scope="col" className="px-6 py-4">Empenho / Data</th>
                <th scope="col" className="px-6 py-4">Favorecido (Credor)</th>
                <th scope="col" className="px-6 py-4">Fase Atual</th>
                <th scope="col" className="px-6 py-4 text-right">Valor Empenhado</th>
                <th scope="col" className="px-6 py-4 text-center">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center font-bold text-slate-400 animate-pulse text-sm uppercase tracking-widest">Carregando base de dados...</td></tr>
              ) : despesas.length === 0 ? (
                 <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">Nenhuma despesa encontrada para os filtros selecionados.</td></tr>
              ) : despesas.map((item, i) => {
                const status = getStatusPagamento(item);
                return (
                  // Usando o index como key fallback, já que o DTO do backend não expõe o ID interno (segurança)
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-xs whitespace-nowrap">{item.numeroEmpenho}</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1">{formatDate(item.dataEmpenho)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-black text-slate-800 uppercase truncate max-w-[300px]" title={item.credorNome}>{item.credorNome}</div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">
                        {mascararDocumento(item.credorDocumento)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${status.color}`}>
                        {status.icon} {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-500 text-sm whitespace-nowrap">
                      {formatMoney(item.valorEmpenhado)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => { setSelected(item); setIsModalOpen(true); }} 
                        className="inline-flex items-center justify-center bg-slate-100 text-slate-500 p-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                        title="Detalhes da Despesa"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {!loading && despesas.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Página {paginaAtual + 1} de {totalPaginas || 1}
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

      {/* MODAL MANTIDO COM A MESMA ESTRUTURA E ESTILO VISUAL */}
      {isModalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            
            <div className="bg-[var(--cor-primaria)] p-5 text-white flex justify-between items-center shrink-0">
              <div className="flex gap-3 items-center">
                <div className="bg-white/20 p-2.5 rounded-xl" aria-hidden="true"><FileText size={20}/></div>
                <div>
                  <h2 id="modal-title" className="text-lg font-black uppercase tracking-tight leading-none italic">Ficha da Despesa</h2>
                  <p className="text-white/80 text-[9px] font-bold uppercase mt-1 tracking-widest">Empenho Nº {selected.numeroEmpenho}</p>
                </div>
              </div>
              <button aria-label="Fechar Modal" onClick={() => setIsModalOpen(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors focus:outline-none focus:ring-2 focus:ring-white"><X size={18} /></button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-4 items-center">
                <div className="bg-slate-200 p-3 rounded-full text-slate-500 shrink-0"><User size={24}/></div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Favorecido / Credor</span>
                  <h3 className="text-sm font-bold text-slate-800 uppercase truncate" title={selected.credorNome}>{selected.credorNome}</h3>
                  <p className="text-xs font-mono text-slate-500">{mascararDocumento(selected.credorDocumento)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <DetailField label="Órgão Solicitante" value={selected.orgaoNome} />
                  <DetailField label="Elemento de Despesa" value={selected.elementoDespesa} />
                </div>
                <div className="space-y-4">
                  <DetailField label="Data do Empenho" value={formatDate(selected.dataEmpenho)} />
                  {/* Fonte de Recurso não é retornada na DTO do Backend, exibindo valor padrão transparente */}
                  <DetailField label="Fonte de Recurso" value="---" />
                </div>
              </div>

              <div className="bg-[var(--cor-primaria-fundo)] p-4 rounded-xl border border-[var(--cor-primaria-fundo)]/50">
                <h3 className="text-[10px] font-black text-[var(--cor-primaria)] uppercase tracking-widest border-b border-[var(--cor-primaria)]/20 pb-2 mb-3">Ciclo Financeiro da Despesa</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-600">1. Valor Empenhado (Reserva)</span>
                    <span className="font-black text-slate-800">{formatMoney(selected.valorEmpenhado)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-600">2. Valor Liquidado (Entregue)</span>
                    <span className="font-black text-slate-800">{formatMoney(selected.valorLiquidado)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[var(--cor-primaria)]/20">
                    <span className="text-xs font-black text-emerald-600 uppercase flex items-center gap-1"><CheckCircle2 size={14}/> Total Pago</span>
                    <span className="text-xl font-black text-emerald-600">{formatMoney(selected.valorPago)}</span>
                  </div>
                </div>
                
                <div className="mt-4 bg-white/50 h-2 rounded-full overflow-hidden flex shadow-inner">
                    <div className="bg-amber-400 h-full transition-all" style={{ width: `${selected.valorEmpenhado > 0 ? (selected.valorLiquidado / selected.valorEmpenhado) * 100 : 0}%` }} title="Liquidado"></div>
                    <div className="bg-emerald-500 h-full transition-all -ml-full" style={{ width: `${selected.valorEmpenhado > 0 ? (selected.valorPago / selected.valorEmpenhado) * 100 : 0}%` }} title="Pago"></div>
                </div>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest text-center mt-2">Progresso do Pagamento</p>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-[var(--cor-primaria)] transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterBox({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200 flex flex-col focus-within:border-[var(--cor-primaria)] focus-within:ring-1 focus-within:ring-[var(--cor-primaria)] transition-colors">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</span>
      {children}
    </div>
  );
}

function DetailField({ label, value }: { label: string, value: any }) {
  return (
    <div>
      <span className="text-[8px] font-black text-slate-500 uppercase block tracking-widest mb-0.5">{label}</span>
      <span className="text-xs font-bold text-slate-800 block leading-tight">{value || '---'}</span>
    </div>
  );
}