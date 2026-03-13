'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar'; 
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  X, 
  TrendingDown, 
  Download, 
  DollarSign,
  Briefcase,
  CheckCircle2,
  Info,
  Clock,
  Building2,
  FileText,
  Calendar,
  Hash,
  Target,
  Gavel,
  Layers,
  Search
} from 'lucide-react';

interface Despesa {
  id: number;
  exercicio: number;
  numeroEmpenho: string;
  numeroProcessoPagamento: string;
  dataEmpenho: string;
  orgaoCodigo: string; // Adicionado
  orgaoNome: string;
  unidadeCodigo: string; // Adicionado
  unidadeNome: string;
  funcao: string;
  subfuncao: string;
  programa: string;
  acaoGoverno: string;
  elementoDespesa: string;
  fonteRecursos: string;
  historicoObjetivo: string;
  modalidadeLicitacao: string;
  valorEmpenhado: number;
  valorLiquidado: number;
  dataLiquidacao: string;
  valorPago: number;
  dataPagamento: string;
  credor?: {
    razaoSocial: string;
    cpfCnpj: string;
  };
}

interface Resumo {
  valorEmpenhado: number;
  valorLiquidado: number;
  valorPago: number;
}

export default function DespesasPage() {
  const [data, setData] = useState<any>(null);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedDespesa, setSelectedDespesa] = useState<Despesa | null>(null);
  
  // Estados dos Filtros
  const [fDataInicio, setFDataInicio] = useState<string>('');
  const [fDataFim, setFDataFim] = useState<string>('');
  const [fCredor, setFCredor] = useState('');
  const [fEmpenho, setFEmpenho] = useState('');
  const [fProcesso, setFProcesso] = useState('');
  const [fAcao, setFAcao] = useState('');
  const [fElemento, setFElemento] = useState('');

  const fetchResumo = useCallback(async () => {
    let anoBase = new Date().getFullYear();
    if (fDataInicio) anoBase = parseInt(fDataInicio.substring(0, 4));
    try {
      const res = await api.get(`/despesas/resumo?ano=${anoBase}`);
      setResumo(res.data);
    } catch (err) { console.error("Erro ao carregar resumo"); }
  }, [fDataInicio]);

  const fetchDespesas = useCallback(async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      let params = `page=${pageNumber}&size=20&sort=dataEmpenho,desc`;
      if (fDataInicio) params += `&dataInicio=${fDataInicio}`;
      if (fDataFim) params += `&dataFim=${fDataFim}`;
      if (fCredor) params += `&credor=${encodeURIComponent(fCredor)}`;
      if (fEmpenho) params += `&numeroEmpenho=${encodeURIComponent(fEmpenho)}`;
      if (fProcesso) params += `&numeroProcesso=${encodeURIComponent(fProcesso)}`;
      if (fAcao) params += `&acaoGoverno=${encodeURIComponent(fAcao)}`;
      if (fElemento) params += `&elementoDespesa=${encodeURIComponent(fElemento)}`;

      const response = await api.get(`/despesas?${params}`);
      setData(response.data);
      setPage(pageNumber);
    } catch (err) {
      setError("Falha ao carregar despesas.");
    } finally { setLoading(false); }
  }, [fDataInicio, fDataFim, fCredor, fEmpenho, fProcesso, fAcao, fElemento]);

  useEffect(() => { 
    fetchDespesas(page); 
    fetchResumo();
  }, [page, fetchDespesas, fetchResumo]);

  const formatMoney = (val?: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const formatDate = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '---';

  const maskDocumento = (val?: string) => {
    if (!val) return "---";
    if (val.length === 11) return `${val.substring(0, 3)}.***.***-${val.substring(9)}`;
    return `${val.substring(0, 2)}.***.***/****-${val.substring(12)}`;
  };

  const handleExportCSV = () => {
    if (!data?.content?.length) return alert("Sem dados para exportar.");
    const headers = ["Exerc.", "Empenho", "Processo", "Data", "Orgao_Cod", "Orgao_Nome", "Unid_Cod", "Unid_Nome", "Credor", "Doc", "Acao", "Elemento", "Empenhado", "Pago"];
    const rows = data.content.map((d: Despesa) => [
      d.exercicio, d.numeroEmpenho, d.numeroProcessoPagamento, d.dataEmpenho, d.orgaoCodigo, `"${d.orgaoNome}"`, d.unidadeCodigo, `"${d.unidadeNome}"`, `"${d.credor?.razaoSocial}"`, d.credor?.cpfCnpj, `"${d.acaoGoverno}"`, d.elementoDespesa, d.valorEmpenhado, d.valorPago
    ]);
    const csvContent = [headers.join(";"), ...rows.map((r: any[]) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Relatorio_Despesas_${new Date().getTime()}.csv`);
    link.click();
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto relative z-0">
        
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-black text-white rounded-lg"><TrendingDown size={24} /></div>
             <div>
               <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Despesas Públicas</h2>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic text-emerald-600">Transparência Ouro • PNTP</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm font-bold text-xs uppercase text-slate-600 hover:text-black transition-all">
              <Download size={14} className="mr-2" /> Exportar Planilha
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center px-4 py-2 border rounded-xl shadow-sm font-bold text-xs uppercase transition-all ${showFilters ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              <Filter size={14} className="mr-2" /> {showFilters ? 'Fechar Filtros' : 'Filtrar Busca'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <CardResumo icon={<DollarSign/>} label="Empenhado" value={resumo?.valorEmpenhado} color="amber" periodo={displayPeriodo(fDataInicio, fDataFim)} />
          <CardResumo icon={<Briefcase/>} label="Liquidado" value={resumo?.valorLiquidado} color="blue" periodo={displayPeriodo(fDataInicio, fDataFim)} />
          <CardResumo icon={<CheckCircle2/>} label="Pago" value={resumo?.valorPago} color="emerald" periodo={displayPeriodo(fDataInicio, fDataFim)} />
        </div>

        {showFilters && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Calendar size={12}/> Data Início</label>
                <input type="date" value={fDataInicio} onChange={(e) => { setFDataInicio(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Calendar size={12}/> Data Fim</label>
                <input type="date" value={fDataFim} onChange={(e) => { setFDataFim(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Favorecido (Nome ou Documento)</label>
                <input type="text" placeholder="Buscar por credor..." value={fCredor} onChange={(e) => { setFCredor(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nº Empenho</label>
                <input type="text" placeholder="Ex: 2025/123" value={fEmpenho} onChange={(e) => { setFEmpenho(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Processo Administrativo</label>
                <input type="text" placeholder="Nº do Processo" value={fProcesso} onChange={(e) => { setFProcesso(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Ação de Governo</label>
                <input type="text" placeholder="Ex: Merenda Escolar" value={fAcao} onChange={(e) => { setFAcao(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div className="flex justify-end">
                <button onClick={() => {setFDataInicio(''); setFDataFim(''); setFCredor(''); setFEmpenho(''); setFProcesso(''); setFAcao(''); setFElemento(''); setPage(0);}} className="px-4 py-2 text-[10px] font-bold text-red-500 uppercase flex items-center gap-1 hover:bg-red-50 rounded-lg transition-colors">
                  <X size={14} /> Limpar Filtros
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Identificação</th>
                  <th className="px-6 py-4">Favorecido / Gestão</th>
                  <th className="px-6 py-4">Ação / Elemento</th>
                  <th className="px-6 py-4 text-right">Valores</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? <tr className="animate-pulse"><td colSpan={4} className="h-32 bg-slate-50/20"></td></tr>
                : data?.content?.map((item: Despesa) => (
                    <tr key={item.id} onClick={() => setSelectedDespesa(item)} className="hover:bg-slate-50 transition-colors text-xs cursor-pointer group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{item.numeroEmpenho}</div>
                        <div className="text-[9px] text-slate-400 flex items-center gap-1 font-bold uppercase"><Hash size={10}/> Proc: {item.numeroProcessoPagamento || '---'}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{formatDate(item.dataEmpenho)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700 group-hover:text-black line-clamp-1">{item.credor?.razaoSocial}</div>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded w-fit font-bold uppercase">
                            Órgão: {item.orgaoNome}
                          </span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded w-fit font-medium uppercase italic">
                            Unid: {item.unidadeNome}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-600 flex items-center gap-1"><Target size={10} className="text-slate-400"/> {item.acaoGoverno}</div>
                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{item.elementoDespesa}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-[10px] text-slate-400">Emp: {formatMoney(item.valorEmpenhado)}</div>
                        <div className="font-black text-emerald-600">Pago: {formatMoney(item.valorPago)}</div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          {!loading && data && data.totalElements > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Página {data.number + 1} de {data.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(0, p - 1)); }} disabled={data.first} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"><ChevronLeft size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(data.totalPages - 1, p + 1)); }} disabled={data.last} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>

        {selectedDespesa && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
            <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-black text-white rounded-2xl shadow-lg"><Search size={24}/></div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Rastreio Completo da Despesa</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      Exercício {selectedDespesa.exercicio} • Empenho {selectedDespesa.numeroEmpenho}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedDespesa(null)} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-full transition-all"><X size={24}/></button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-10">
                
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* GESTÃO ORGANIZACIONAL */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 border-b border-blue-100 pb-2">
                      <Building2 size={16} className="text-blue-600" />
                      <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest">Gestão</h4>
                    </div>
                    <InfoItem label="Órgão" value={`[${selectedDespesa.orgaoCodigo}] ${selectedDespesa.orgaoNome}`} />
                    <InfoItem label="Unidade" value={`[${selectedDespesa.unidadeCodigo}] ${selectedDespesa.unidadeNome}`} />
                    <InfoItem icon={<Gavel size={14}/>} label="Modalidade de Licitação" value={selectedDespesa.modalidadeLicitacao} />
                  </div>
                  
                  {/* CLASSIFICAÇÃO ORÇAMENTÁRIA */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
                      <Target size={16} className="text-emerald-600" />
                      <h4 className="text-xs font-black text-emerald-700 uppercase tracking-widest">Classificação</h4>
                    </div>
                    <InfoItem label="Ação de Governo" value={selectedDespesa.acaoGoverno} />
                    <InfoItem label="Programa" value={selectedDespesa.programa} />
                    <InfoItem label="Função / Subfunção" value={`${selectedDespesa.funcao} / ${selectedDespesa.subfuncao}`} />
                    <InfoItem icon={<FileText size={14}/>} label="Elemento de Despesa" value={selectedDespesa.elementoDespesa} />
                  </div>

                  {/* IDENTIFICAÇÃO FINANCEIRA */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
                      <Hash size={16} className="text-amber-600" />
                      <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest">Identificação</h4>
                    </div>
                    <InfoItem label="Processo de Pagamento" value={selectedDespesa.numeroProcessoPagamento} />
                    <InfoItem label="Fonte de Recursos" value={selectedDespesa.fonteRecursos} />
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                       <span className="text-[10px] font-black text-slate-400 uppercase">Favorecido / Credor</span>
                       <p className="text-xs font-bold text-slate-800 mt-1">{selectedDespesa.credor?.razaoSocial}</p>
                       <p className="text-[10px] font-mono text-slate-500 mt-0.5">{maskDocumento(selectedDespesa.credor?.cpfCnpj)}</p>
                    </div>
                  </div>
                </section>

                {/* HISTÓRICO */}
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative">
                  <div className="absolute -top-3 left-6 px-3 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase">Objetivo da Despesa</div>
                  <p className="text-sm text-slate-600 leading-relaxed italic font-medium">
                    "{selectedDespesa.historicoObjetivo || 'Não há descrição detalhada para este empenho.'}"
                  </p>
                </div>

                {/* TIMELINE FINANCEIRA */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] text-center mb-6">Fluxo Cronológico do Dinheiro</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TimelineStep label="Empenhado" value={selectedDespesa.valorEmpenhado} date={selectedDespesa.dataEmpenho} active color="amber" />
                    <TimelineStep label="Liquidado" value={selectedDespesa.valorLiquidado} date={selectedDespesa.dataLiquidacao} active={!!selectedDespesa.dataLiquidacao} color="blue" />
                    <TimelineStep label="Pago" value={selectedDespesa.valorPago} date={selectedDespesa.dataPagamento} active={!!selectedDespesa.dataPagamento} color="emerald" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Componentes Auxiliares Refinados
function displayPeriodo(ini: string, fim: string) {
  if (ini && fim) return `${new Date(ini).toLocaleDateString('pt-BR')} — ${new Date(fim).toLocaleDateString('pt-BR')}`;
  if (ini) return `A partir de ${new Date(ini).toLocaleDateString('pt-BR')}`;
  return 'Período Geral';
}

function CardResumo({ icon, label, value, color, periodo }: any) {
  const colors: any = { 
    amber: 'bg-amber-50 text-amber-600 border-amber-100', 
    blue: 'bg-blue-50 text-blue-600 border-blue-100', 
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100' 
  };
  return (
    <div className={`bg-white p-6 rounded-3xl border-2 shadow-sm transition-all hover:shadow-md ${colors[color]}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white rounded-xl shadow-sm">{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Total {label}</span>
      </div>
      <h3 className="text-2xl font-black text-slate-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)}</h3>
      <p className="text-[9px] text-slate-400 font-bold uppercase mt-3 tracking-tighter">{periodo}</p>
    </div>
  );
}

function InfoItem({ icon, label, value }: any) {
  return (
    <div className="group">
      <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1.5 transition-colors group-hover:text-slate-600">
        {icon} {label}
      </label>
      <p className="text-xs font-bold text-slate-700 leading-snug border-l-2 border-slate-100 pl-3 group-hover:border-blue-500 transition-all">
        {value || '---'}
      </p>
    </div>
  );
}

function TimelineStep({ label, value, date, active, color }: any) {
  const dotColors: any = { amber: 'bg-amber-500', blue: 'bg-blue-500', emerald: 'bg-emerald-500' };
  const textColors: any = { amber: 'text-amber-700', blue: 'text-blue-700', emerald: 'text-emerald-700' };
  return (
    <div className={`flex flex-col p-5 rounded-3xl border-2 transition-all ${active ? `bg-${color}-50/40 border-${color}-100` : 'bg-slate-50 border-slate-100 opacity-40 scale-95'}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${active ? dotColors[color] : 'bg-slate-300'}`} />
        <span className={`text-[10px] font-black uppercase tracking-widest ${active ? textColors[color] : 'text-slate-400'}`}>{label}</span>
      </div>
      <div className="text-xl font-black text-slate-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)}</div>
      <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-slate-400 uppercase">
        <Calendar size={10}/> {date ? new Date(date).toLocaleDateString('pt-BR') : 'Pendente'}
      </div>
    </div>
  );
}