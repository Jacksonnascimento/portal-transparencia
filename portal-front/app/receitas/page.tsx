'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  TrendingUp, Calendar, Search, FileText, AlertCircle, 
  ArrowLeft, Filter, Landmark, Eye, X, Info, Download, Printer,
  ChevronRight, Home, Users
} from 'lucide-react';
import Link from 'next/link';
import api from '../../services/api';

interface Receita {
  exercicio: number;
  mes: number;
  dataLancamento: string;
  codigoNatureza: string;
  categoriaEconomica: string;
  origem: string;
  especie: string;
  rubrica: string;
  alinea: string;
  fonteRecursos: string;
  valorPrevistoInicial: number;
  valorPrevistoAtualizado: number;
  valorArrecadado: number;
  historico: string;
}

export default function ReceitasPage() {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [resumo, setResumo] = useState({ totalArrecadado: 0, totalRegistros: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Receita | null>(null);

  // --- NOVOS ESTADOS DE PAGINAÇÃO ---
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);

  const [filtros, setFiltros] = useState({
    exercicio: '', 
    mes: '',
    codigoNatureza: '',
    origem: '',
    categoria: '',
    fonte: '',
    dataInicio: '',
    dataFim: ''
  });

  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros);

  const anos = Array.from({ length: 6 }, (_, i) => (new Date().getFullYear() - i).toString());
  const meses = [
    { num: '1', nome: 'Janeiro' }, { num: '2', nome: 'Fevereiro' }, { num: '3', nome: 'Março' },
    { num: '4', nome: 'Abril' }, { num: '5', nome: 'Maio' }, { num: '6', nome: 'Junho' },
    { num: '7', nome: 'Julho' }, { num: '8', nome: 'Agosto' }, { num: '9', nome: 'Setembro' },
    { num: '10', nome: 'Outubro' }, { num: '11', nome: 'Novembro' }, { num: '12', nome: 'Dezembro' }
  ];

  const buscarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtros.exercicio) params.append('exercicio', filtros.exercicio);
      if (filtros.mes) params.append('mes', filtros.mes);
      if (filtros.codigoNatureza) params.append('codigoNatureza', filtros.codigoNatureza);
      if (filtros.origem) params.append('origem', filtros.origem);
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.fonte) params.append('fonte', filtros.fonte);
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim);
      
      // --- APLICAÇÃO DA PAGINAÇÃO DINÂMICA ---
      params.append('page', paginaAtual.toString());
      params.append('size', '100');
      params.append('sort', 'dataLancamento,desc');

      const [resLista, resResumo] = await Promise.all([
        api.get(`/portal/receitas?${params.toString()}`),
        api.get(`/portal/receitas/resumo?${params.toString()}`)
      ]);

      setReceitas(resLista.data.content || []);
      setTotalPaginas(resLista.data.totalPages || 0); // Define o total de páginas retornado
      
      setResumo({
        totalArrecadado: resResumo.data.totalArrecadado || 0,
        totalRegistros: resResumo.data.totalRegistros || 0
      });

      setFiltrosAplicados(filtros);

    } catch (err) {
      console.error("Erro na busca de receitas:", err);
      setError("Não foi possível conectar à API de Transparência.");
    } finally {
      setLoading(false);
    }
  }, [filtros, paginaAtual]); // Inclui paginaAtual nas dependências

  // Dispara a busca quando a página muda (ou no carregamento inicial)
  useEffect(() => {
    buscarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaAtual]); 

  // Handler inteligente para a pesquisa (reseta para a página 0)
  const handlePesquisar = () => {
    if (paginaAtual === 0) {
      buscarDados();
    } else {
      setPaginaAtual(0); // Mudar para 0 engatilha o useEffect automaticamente
    }
  };

  const handleExport = async (formato: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.append('formato', formato);
      
      if (filtrosAplicados.exercicio) params.append('exercicio', filtrosAplicados.exercicio);
      if (filtrosAplicados.mes) params.append('mes', filtrosAplicados.mes);
      if (filtrosAplicados.codigoNatureza) params.append('codigoNatureza', filtrosAplicados.codigoNatureza);
      if (filtrosAplicados.origem) params.append('origem', filtrosAplicados.origem);
      if (filtrosAplicados.categoria) params.append('categoria', filtrosAplicados.categoria);
      if (filtrosAplicados.fonte) params.append('fonte', filtrosAplicados.fonte);
      if (filtrosAplicados.dataInicio) params.append('dataInicio', filtrosAplicados.dataInicio);
      if (filtrosAplicados.dataFim) params.append('dataFim', filtrosAplicados.dataFim);

      const response = await api.get(`/portal/receitas/exportar?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receitas_${filtrosAplicados.exercicio || 'export'}.${formato}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(`Erro ao exportar ${formato}:`, err);
      alert(`Erro ao gerar o arquivo ${formato.toUpperCase()}. Verifique se o backend está rodando.`);
    } finally {
      setIsExporting(false);
    }
  };

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const formatDate = (date: any) => {
    if (Array.isArray(date)) return `${String(date[2]).padStart(2, '0')}/${String(date[1]).padStart(2, '0')}/${date[0]}`;
    return date ? new Date(date).toLocaleDateString('pt-BR') : '---';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-slate-50 min-h-screen relative font-sans">
      
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1">
          <Home size={12} /> Início
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600" aria-current="page">Receitas Municipais</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <button onClick={() => window.history.back()} className="flex items-center text-slate-400 hover:text-[var(--cor-primaria)] mb-2 transition-all font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={14} className="mr-1.5" /> Voltar
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <Landmark className="text-[var(--cor-primaria)]" size={32} aria-hidden="true" /> Receitas
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Transparência da Arrecadação e Previsão Orçamentária</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/divida-ativa" className="bg-rose-50 text-rose-600 border border-rose-200 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2">
            <Users size={16} /> Dívida Ativa
          </Link>
          
          <div className="flex gap-2">
            <button onClick={() => handleExport('pdf')} disabled={isExporting} className="bg-white p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-black hover:shadow-md transition-all disabled:opacity-50" title="Exportar PDF">
              <Printer size={18} className={isExporting ? "animate-pulse" : ""} />
            </button>
            <button onClick={() => handleExport('csv')} disabled={isExporting} className="bg-white p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-black hover:shadow-md transition-all disabled:opacity-50" title="Exportar CSV">
              <Download size={18} className={isExporting ? "animate-pulse" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-[var(--cor-primaria)] p-6 rounded-2xl text-white shadow-lg shadow-[var(--cor-primaria-fundo)] relative overflow-hidden group">
          <TrendingUp className="absolute right-[-10px] bottom-[-10px] opacity-20 group-hover:scale-110 transition-transform duration-500" size={120} aria-hidden="true" />
          <p className="text-white/80 font-bold uppercase text-[10px] tracking-widest mb-1">Total Arrecadado {filtrosAplicados.exercicio ? `(${filtrosAplicados.exercicio})` : '(Geral)'}</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">{loading ? "..." : formatMoney(resumo.totalArrecadado)}</h2>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <FileText className="absolute right-[-10px] bottom-[-10px] opacity-5 text-slate-900 group-hover:scale-110 transition-transform duration-500" size={120} aria-hidden="true" />
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Lançamentos no Período</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">{loading ? "..." : resumo.totalRegistros}</h2>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-3 items-end">
          <FilterBox label="Exercício">
            <select value={filtros.exercicio} onChange={(e) => setFiltros({...filtros, exercicio: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none cursor-pointer">
              <option value="">Todos os anos</option>
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </FilterBox>
          <FilterBox label="Mês">
            <select value={filtros.mes} onChange={(e) => setFiltros({...filtros, mes: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none cursor-pointer">
              <option value="">Todos</option>
              {meses.map(m => <option key={m.num} value={m.num}>{m.nome}</option>)}
            </select>
          </FilterBox>
          <FilterBox label="Cód. Natureza">
            <input type="text" placeholder="Ex: 1.1.1..." value={filtros.codigoNatureza} onChange={(e) => setFiltros({...filtros, codigoNatureza: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" />
          </FilterBox>
          <FilterBox label="Origem">
            <input type="text" placeholder="Ex: IPTU..." value={filtros.origem} onChange={(e) => setFiltros({...filtros, origem: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" />
          </FilterBox>
          <FilterBox label="Fonte">
            <input type="text" placeholder="Ex: Próprios..." value={filtros.fonte} onChange={(e) => setFiltros({...filtros, fonte: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" />
          </FilterBox>
          <FilterBox label="Data Início">
            <input type="date" value={filtros.dataInicio} onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none" />
          </FilterBox>
          <FilterBox label="Data Fim">
            <input type="date" value={filtros.dataFim} onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none" />
          </FilterBox>
          <button onClick={handlePesquisar} className="bg-slate-900 text-white h-[46px] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[var(--cor-primaria)] transition-colors shadow-md flex items-center justify-center gap-2">
            <Search size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th scope="col" className="px-6 py-4">Data / Cód. Natureza</th>
                <th scope="col" className="px-6 py-4">Origem / Espécie</th>
                <th scope="col" className="px-6 py-4 text-right">Previsão Atualizada</th>
                <th scope="col" className="px-6 py-4 text-right">Valor Arrecadado</th>
                <th scope="col" className="px-6 py-4 text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center font-bold text-slate-400 animate-pulse text-sm uppercase tracking-widest">Carregando base de dados...</td></tr>
              ) : receitas.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                     <div className="font-bold text-slate-900 text-xs whitespace-nowrap">{formatDate(item.dataLancamento)}</div>
                     <div className="text-[10px] font-mono text-slate-500 mt-1" title="Código da Natureza">{item.codigoNatureza || '---'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-black text-slate-800 uppercase truncate max-w-[250px]" title={item.origem}>{item.origem}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wide mt-0.5 truncate max-w-[250px]" title={item.especie || item.categoriaEconomica}>
                      {item.especie || item.categoriaEconomica}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-500 text-sm whitespace-nowrap">
                    {formatMoney(item.valorPrevistoAtualizado)}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-[var(--cor-primaria)] text-sm whitespace-nowrap bg-[var(--cor-primaria-fundo)]/30">
                    {formatMoney(item.valorArrecadado)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => { setSelected(item); setIsModalOpen(true); }} 
                      className="inline-flex items-center justify-center bg-slate-100 text-slate-500 p-2.5 rounded-xl hover:bg-slate-900 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && receitas.length === 0 && (
                 <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">Nenhuma receita encontrada para os filtros aplicados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* --- RODAPÉ DE PAGINAÇÃO --- */}
        {!loading && receitas.length > 0 && (
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

      {isModalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[var(--cor-primaria)] p-5 text-white flex justify-between items-center shrink-0">
              <div className="flex gap-3 items-center">
                <div className="bg-white/20 p-2.5 rounded-xl" aria-hidden="true"><Landmark size={20}/></div>
                <div>
                    <h2 id="modal-title" className="text-lg font-black uppercase tracking-tight leading-none italic">Ficha Técnica</h2>
                    <p className="text-white/80 text-[9px] font-bold uppercase mt-1 tracking-widest truncate max-w-[220px]">{selected.origem}</p>
                </div>
              </div>
              <button aria-label="Fechar Modal" onClick={() => setIsModalOpen(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors focus:outline-none focus:ring-2 focus:ring-white"><X size={18} /></button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <DetailField label="Cód. Natureza" value={selected.codigoNatureza} />
                <DetailField label="Categoria Econômica" value={selected.categoriaEconomica} />
                <DetailField label="Espécie" value={selected.especie} />
                <DetailField label="Rubrica" value={selected.rubrica} />
                <DetailField label="Alínea" value={selected.alinea} />
                <DetailField label="Fonte" value={selected.fonteRecursos} />
                <DetailField label="Exercício" value={selected.exercicio} />
              </div>

              <div className="bg-[var(--cor-primaria-fundo)] p-4 rounded-xl border border-[var(--cor-primaria-fundo)]">
                <div className="flex items-center gap-1.5 mb-3 justify-center">
                    <TrendingUp size={12} className="text-[var(--cor-primaria)]" aria-hidden="true" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Análise de Planejamento</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center border-b border-white/40 pb-1.5">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Previsto Inicial</span>
                    <span className="text-xs font-bold text-slate-800">{formatMoney(selected.valorPrevistoInicial)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/40 pb-1.5">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Previsto Atualizado</span>
                    <span className="text-xs font-bold text-slate-800">{formatMoney(selected.valorPrevistoAtualizado)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] font-black text-[var(--cor-primaria)] uppercase">Total Arrecadado</span>
                    <span className="text-lg font-black text-[var(--cor-primaria)]">{formatMoney(selected.valorArrecadado)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                <span className="text-[9px] font-black text-slate-500 uppercase block mb-1.5 flex items-center gap-1">
                    <Info size={12} aria-hidden="true"/> Histórico do Lançamento
                </span>
                <p className="text-xs text-slate-600 font-medium italic leading-relaxed">"{selected.historico || 'Não há informações detalhadas.'}"</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center shrink-0">
                <button aria-label="Fechar Detalhes da Receita" onClick={() => setIsModalOpen(false)} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-[var(--cor-primaria)] transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
                  Fechar Detalhes
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
    <div className="border-b border-slate-100 pb-1.5">
      <span className="text-[8px] font-black text-slate-500 uppercase block tracking-widest mb-0.5">{label}</span>
      <span className="text-xs font-bold text-slate-800 truncate block">{value || '---'}</span>
    </div>
  );
}