'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Search, FileText, AlertCircle, ArrowLeft, 
  ChevronRight, Home, Download, Printer, Plane, Eye, X, Calendar, MapPin
} from 'lucide-react';
import Link from 'next/link';
import api from '../../services/api';


// Interface baseada no DiariaPassagemDTO.Response
interface DiariaPassagem {
  id: number;
  exercicio: number;
  orgaoId: number;
  nomeFavorecido: string;
  cargoFavorecido: string;
  cpfCnpjFavorecido: string;
  destinoViagem: string;
  motivoViagem: string;
  dataSaida: string;
  dataRetorno: string;
  quantidadeDiarias: number;
  valorDiarias: number;
  valorPassagens: number;
  valorDevolvido: number;
  valorTotal: number;
  numeroProcesso: string;
  portariaConcessao: string;
}

export default function DiariasPage() {
  const [diarias, setDiarias] = useState<DiariaPassagem[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<DiariaPassagem | null>(null);

  // --- ESTADOS DE PAGINAÇÃO ---
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);

  // Filtros mapeados conforme o Controller
  const [filtros, setFiltros] = useState({
    exercicio: '',
    nomeFavorecido: '',
    destinoViagem: '',
    numeroProcesso: ''
  });

  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros);

  // Busca os anos disponíveis ao carregar a página
  useEffect(() => {
    api.get('/portal/diarias/anos')
      .then(res => setAnosDisponiveis(res.data))
      .catch(err => console.error("Erro ao carregar anos:", err));
  }, []);

  const buscarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtros.exercicio) params.append('exercicio', filtros.exercicio);
      if (filtros.nomeFavorecido) params.append('nomeFavorecido', filtros.nomeFavorecido);
      if (filtros.destinoViagem) params.append('destinoViagem', filtros.destinoViagem);
      if (filtros.numeroProcesso) params.append('numeroProcesso', filtros.numeroProcesso);
      
      // Paginação Dinâmica
      params.append('page', paginaAtual.toString());
      params.append('size', '100'); 
      params.append('sort', 'dataSaida,desc');

      const response = await api.get(`/portal/diarias?${params.toString()}`);

      let dadosRecebidos: DiariaPassagem[] = [];
      let total = 0;
      let paginasTotaisApi = 0;

      if (response.data && Array.isArray(response.data.content)) {
        dadosRecebidos = response.data.content;
        total = response.data.totalElements || dadosRecebidos.length;
        paginasTotaisApi = response.data.totalPages || 0;
      } else if (Array.isArray(response.data)) {
        dadosRecebidos = response.data;
        total = dadosRecebidos.length;
        paginasTotaisApi = Math.ceil(total / 100); 
      }

      setDiarias(dadosRecebidos);
      setTotalRegistros(total);
      setTotalPaginas(paginasTotaisApi);
      setFiltrosAplicados(filtros);

    } catch (err) {
      console.error("Erro na busca de diárias:", err);
      setError("Não foi possível conectar à API de Transparência.");
    } finally {
      setLoading(false);
    }
  }, [filtros, paginaAtual]); 

  // Efeito principal que reage a mudanças na página
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
      if (filtrosAplicados.exercicio) params.append('exercicio', filtrosAplicados.exercicio);
      if (filtrosAplicados.nomeFavorecido) params.append('nomeFavorecido', filtrosAplicados.nomeFavorecido);
      if (filtrosAplicados.destinoViagem) params.append('destinoViagem', filtrosAplicados.destinoViagem);
      if (filtrosAplicados.numeroProcesso) params.append('numeroProcesso', filtrosAplicados.numeroProcesso);

      const response = await api.get(`/portal/diarias/exportar/${formato}?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `diarias_passagens_${filtrosAplicados.exercicio || 'geral'}.${formato}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(`Erro ao exportar ${formato}:`, err);
      alert(`Erro ao gerar o arquivo ${formato.toUpperCase()}. Verifique a disponibilidade do servidor.`);
    } finally {
      setIsExporting(false);
    }
  };

  const formatMoney = (val: number | undefined) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const formatDate = (date: string | undefined) => {
    if (!date) return '---';
    // Tratando array [ano, mes, dia] ou string YYYY-MM-DD
    if (Array.isArray(date)) return `${String(date[2]).padStart(2, '0')}/${String(date[1]).padStart(2, '0')}/${date[0]}`;
    return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const mascararDocumento = (doc: string) => {
    if (!doc) return '---';
    const limpo = doc.replace(/\D/g, '');
    if (limpo.length === 11) return `${limpo.substring(0, 3)}.***.***-${limpo.substring(9, 11)}`;
    if (limpo.length === 14) return `${limpo.substring(0, 2)}.***.***/****-${limpo.substring(12, 14)}`;
    return '***'; 
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-slate-50 min-h-screen relative font-sans">
      
      {/* Navegação Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1">
          <Home size={12} /> Início
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600">Diárias e Passagens</span>
      </nav>

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <button onClick={() => window.history.back()} className="flex items-center text-slate-400 hover:text-[var(--cor-primaria)] mb-2 transition-all font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={14} className="mr-1.5" /> Voltar
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <Plane className="text-[var(--cor-primaria)]" size={32} /> Diárias e Passagens
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Transparência nos custos com deslocamento de servidores públicos.</p>
        </div>
        
        {/* Ações de Exportação */}
        <div className="flex gap-2">
          <button onClick={() => handleExport('pdf')} disabled={isExporting} className="bg-white p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-[var(--cor-primaria)] hover:shadow-md transition-all disabled:opacity-50">
            <Printer size={18} className={isExporting ? "animate-pulse" : ""} />
          </button>
          <button onClick={() => handleExport('csv')} disabled={isExporting} className="bg-white p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-[var(--cor-primaria)] hover:shadow-md transition-all disabled:opacity-50">
            <Download size={18} className={isExporting ? "animate-pulse" : ""} />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <FilterBox label="Exercício">
            <select value={filtros.exercicio} onChange={(e) => setFiltros({...filtros, exercicio: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none cursor-pointer">
              <option value="">Todos os anos</option>
              {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </FilterBox>
          <FilterBox label="Favorecido (Nome)">
            <input type="text" placeholder="Nome do servidor..." value={filtros.nomeFavorecido} onChange={(e) => setFiltros({...filtros, nomeFavorecido: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" />
          </FilterBox>
          <FilterBox label="Destino">
            <input type="text" placeholder="Ex: Brasília..." value={filtros.destinoViagem} onChange={(e) => setFiltros({...filtros, destinoViagem: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" />
          </FilterBox>
          <FilterBox label="Nº Processo">
            <input type="text" placeholder="Ex: 123/2024" value={filtros.numeroProcesso} onChange={(e) => setFiltros({...filtros, numeroProcesso: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" />
          </FilterBox>
          <button onClick={handlePesquisar} className="bg-slate-900 text-white h-[46px] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[var(--cor-primaria)] transition-colors shadow-md flex items-center justify-center gap-2">
            <Search size={16} /> Buscar
          </button>
        </div>
      </div>

      <div className="mb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
        {totalRegistros} {totalRegistros === 1 ? 'registro encontrado' : 'registros encontrados'}
      </div>

      {/* Tabela de Listagem */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th scope="col" className="px-6 py-4">Período / Destino</th>
                <th scope="col" className="px-6 py-4">Favorecido / Cargo</th>
                <th scope="col" className="px-6 py-4">Processo</th>
                <th scope="col" className="px-6 py-4 text-right">Valor Total</th>
                <th scope="col" className="px-6 py-4 text-center">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center font-bold text-slate-400 animate-pulse text-sm uppercase tracking-widest">Carregando base de dados...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="py-12 text-center text-rose-500 text-sm font-bold">{error}</td></tr>
              ) : diarias.map((item, i) => (
                <tr key={item.id || i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-xs font-black text-slate-800 uppercase flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" /> 
                      {formatDate(item.dataSaida)} a {formatDate(item.dataRetorno)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin size={10} className="text-[var(--cor-primaria)]" /> {item.destinoViagem}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-black text-slate-800 uppercase truncate max-w-[250px]" title={item.nomeFavorecido}>{item.nomeFavorecido}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">
                      {item.cargoFavorecido || '---'} • {mascararDocumento(item.cpfCnpjFavorecido)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                      <FileText size={10} /> {item.numeroProcesso || '---'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-[var(--cor-primaria)] text-sm whitespace-nowrap bg-[var(--cor-primaria-fundo)]/20">
                    {formatMoney(item.valorTotal)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => { setSelected(item); setIsModalOpen(true); }} 
                      className="inline-flex items-center justify-center bg-slate-100 text-slate-500 p-2.5 rounded-xl hover:bg-[var(--cor-primaria)] hover:text-white transition-colors focus:outline-none"
                      title="Ver Ficha Técnica"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !error && diarias.length === 0 && (
                 <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">Nenhum registro de diária ou passagem encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- RODAPÉ DE PAGINAÇÃO PADRÃO PNTP --- */}
        {!loading && diarias.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Página {paginaAtual + 1} de {totalPaginas || 1}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPaginaAtual(p => Math.max(0, p - 1))}
                disabled={paginaAtual === 0 || loading}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm"
              >
                Anterior
              </button>
              <button 
                onClick={() => setPaginaAtual(p => p + 1)}
                disabled={paginaAtual >= totalPaginas - 1 || loading}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL DA FICHA TÉCNICA --- */}
      {isModalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            
            {/* Header Modal */}
            <div className="bg-[var(--cor-primaria)] p-5 text-white flex justify-between items-center shrink-0">
              <div className="flex gap-3 items-center">
                <div className="bg-white/20 p-2.5 rounded-xl"><Plane size={20}/></div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight leading-none italic">Ficha da Viagem</h2>
                  <p className="text-white/80 text-[9px] font-bold uppercase mt-1 tracking-widest">{selected.nomeFavorecido}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-colors"><X size={18} /></button>
            </div>

            {/* Content Modal */}
            <div className="p-5 overflow-y-auto space-y-6">
              
              {/* Bloco Viagem */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3 flex items-center gap-1">
                   <MapPin size={12}/> Dados do Deslocamento
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <DetailField label="Destino" value={selected.destinoViagem} />
                  <DetailField label="Período" value={`${formatDate(selected.dataSaida)} até ${formatDate(selected.dataRetorno)}`} />
                  <DetailField label="Motivo da Viagem" value={selected.motivoViagem} className="col-span-2" />
                </div>
              </div>

              {/* Bloco Favorecido e Processo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">O Favorecido</h3>
                  <DetailField label="Cargo / Vínculo" value={selected.cargoFavorecido} />
                  <DetailField label="CPF / CNPJ" value={mascararDocumento(selected.cpfCnpjFavorecido)} />
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Ato Concessório</h3>
                  <DetailField label="Processo" value={selected.numeroProcesso} />
                  <DetailField label="Portaria / Decisão" value={selected.portariaConcessao} />
                </div>
              </div>

              {/* Bloco Financeiro */}
              <div className="bg-[var(--cor-primaria-fundo)]/30 p-4 rounded-xl border border-[var(--cor-primaria-fundo)]">
                <h3 className="text-[10px] font-black text-[var(--cor-primaria)] uppercase tracking-widest border-b border-[var(--cor-primaria)]/20 pb-2 mb-3 flex items-center gap-1">
                   <FileText size={12}/> Composição do Valor
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600">Qtd. de Diárias concedidas:</span>
                    <span className="font-bold text-slate-800">{selected.quantidadeDiarias || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600">Subtotal Diárias (+):</span>
                    <span className="font-bold text-slate-800">{formatMoney(selected.valorDiarias)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600">Subtotal Passagens (+):</span>
                    <span className="font-bold text-slate-800">{formatMoney(selected.valorPassagens)}</span>
                  </div>
                  {selected.valorDevolvido > 0 && (
                    <div className="flex justify-between items-center text-xs text-rose-600">
                      <span className="font-bold">Valores Restituídos (-):</span>
                      <span className="font-bold">{formatMoney(selected.valorDevolvido)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-[var(--cor-primaria)]/20">
                    <span className="text-[11px] font-black text-[var(--cor-primaria)] uppercase">Custo Total Pago</span>
                    <span className="text-xl font-black text-[var(--cor-primaria)]">{formatMoney(selected.valorTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-[var(--cor-primaria)] transition-colors">
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente auxiliar de Layout
function FilterBox({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200 flex flex-col focus-within:border-[var(--cor-primaria)] focus-within:ring-1 focus-within:ring-[var(--cor-primaria)] transition-colors">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</span>
      {children}
    </div>
  );
}

function DetailField({ label, value, className = "" }: { label: string, value: any, className?: string }) {
  return (
    <div className={`mb-2 ${className}`}>
      <span className="text-[8px] font-black text-slate-500 uppercase block tracking-widest mb-0.5">{label}</span>
      <span className="text-xs font-bold text-slate-800 block leading-tight">{value || '---'}</span>
    </div>
  );
}