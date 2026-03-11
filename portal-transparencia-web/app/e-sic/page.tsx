"use client";

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import api from "@/services/api";
import { Sidebar } from "@/components/Sidebar";
import { 
  Search, AlertCircle, CheckCircle2, Clock, X, FileText, Send, Loader2, MessageSquare,
  Filter, Download, ChevronLeft, ChevronRight, Lock, Paperclip, ExternalLink, Trash2, Calendar
} from "lucide-react";

interface SicTramite {
  status: string;
  descricao: string;
  dataTramite: string;
}

interface SicSolicitacao {
  id: number;
  protocolo: string;
  nome: string;
  documento: string;
  email: string;
  tipoSolicitacao: string;
  mensagem: string;
  urlAnexoSolicitacao?: string;
  urlAnexoResposta?: string;
  sigilo: boolean; // ADICIONADO: Flag de sigilo para resguardar o solicitante
  status: string;
  dataSolicitacao: string;
  respostaOficial?: string;
  dataResposta?: string;
  tramites?: SicTramite[];
  // Campos de inteligência de prazo vindos do DTO
  diasRestantes: number;
  emAlerta: boolean;
  expirado: boolean;
  descricaoPrazo: string; 
}

interface SicStats {
  totalPedidos: number;
  pedidosRespondidos: number;
  pedidosEmAberto: number;
  pedidosEmAlerta: number;
  pedidosExpirados: number;
}

export default function GestaoEsicPage() {
  const [solicitacoes, setSolicitacoes] = useState<SicSolicitacao[]>([]);
  const [stats, setStats] = useState<SicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("PENDENTES"); 
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SicSolicitacao | null>(null);
  const [novoStatus, setNovoStatus] = useState("RESPONDIDO");
  const [resposta, setResposta] = useState("");
  const [processando, setProcessando] = useState(false);
  const [arquivosUrls, setArquivosUrls] = useState<string[]>([]);
  const [fazendoUpload, setFazendoUpload] = useState(false);

  // Auxiliar para download com vacina para rotas antigas
  const getDownloadUrl = (path?: string) => {
    if (!path) return "#";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const cleanApiUrl = apiUrl.replace(/\/api\/v1\/?$/, "");
    let caminhoCorrigido = path;
    if (caminhoCorrigido.startsWith("/api/v1/arquivos/")) {
      caminhoCorrigido = caminhoCorrigido.replace("/api/v1/arquivos/", "/api/v1/portal/arquivos/");
    }
    return `${cleanApiUrl}${caminhoCorrigido}`;
  };

  const extrairNomeDoArquivo = (url: string) => url.split('/').pop() || "Documento";

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Busca estatísticas para os Cards do Topo
      const statsRes = await api.get('/portal/sic/solicitacoes/estatisticas');
      setStats(statsRes.data);

      // 2. Busca lista paginada com filtros
      let url = `/sic/solicitacoes?page=${page}&size=10&statusFiltro=${statusFiltro}`;
      if (busca) url += `&busca=${busca}`;
      if (dataInicio) url += `&dataInicio=${dataInicio}`;
      if (dataFim) url += `&dataFim=${dataFim}`;

      const { data } = await api.get(url);
      setSolicitacoes(data.content || []); 
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError("Falha ao sincronizar dados com o servidor.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFiltro, dataInicio, dataFim, busca]); 

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const exportarRelatorio = async (tipo: 'pdf' | 'csv') => {
    try {
      let url = `/sic/solicitacoes/exportar?tipo=${tipo}&statusFiltro=${statusFiltro}`;
      if (busca) url += `&busca=${busca}`;
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: tipo === 'pdf' ? 'application/pdf' : 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Relatorio_eSIC_${new Date().toISOString().split('T')[0]}.${tipo}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(`Erro ao exportar arquivo ${tipo.toUpperCase()}.`);
    }
  };

  const abrirModal = (solicitacao: SicSolicitacao) => {
    setSelectedRequest(solicitacao);
    setNovoStatus(solicitacao.status === "RECEBIDO" ? "EM_ANALISE" : solicitacao.status);
    setResposta(solicitacao.respostaOficial || "");
    if (solicitacao.urlAnexoResposta) {
      setArquivosUrls(solicitacao.urlAnexoResposta.split(',').filter(u => u.trim() !== ""));
    } else {
      setArquivosUrls([]);
    }
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setSelectedRequest(null);
    setResposta("");
    setArquivosUrls([]);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setFazendoUpload(true);
    try {
      // ATUALIZADO AQUI: Passando o parâmetro subpasta=sic na URL
      const { data } = await api.post('/portal/arquivos/upload?subpasta=sic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setArquivosUrls(prev => [...prev, data.url]);
      setSuccess("Documento anexado com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Erro ao subir arquivo.");
    } finally {
      setFazendoUpload(false);
      e.target.value = '';
    }
  };

  const tramitarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setProcessando(true);
    try {
      await api.put(`/sic/solicitacoes/${selectedRequest.id}/tramitar`, {
        status: novoStatus,
        resposta: resposta,
        urlAnexo: arquivosUrls.length > 0 ? arquivosUrls.join(',') : null 
      });
      setSuccess("Trâmite realizado com sucesso!");
      fecharModal();
      carregarDados(); 
    } catch (err) {
      setError("Erro ao salvar trâmite.");
    } finally {
      setProcessando(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "RECEBIDO": return <span className="px-2 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-md uppercase flex items-center gap-1 w-fit"><Clock size={12}/> Recebido</span>;
      case "EM_ANALISE": return <span className="px-2 py-1 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-md uppercase flex items-center gap-1 w-fit"><AlertCircle size={12}/> Em Análise</span>;
      case "PRORROGADO": return <span className="px-2 py-1 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-md uppercase flex items-center gap-1 w-fit"><Calendar size={12}/> Prorrogado</span>;
      case "RESPONDIDO": return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md uppercase flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> Respondido</span>;
      case "NEGADO": return <span className="px-2 py-1 bg-red-100 text-red-800 font-bold text-[10px] rounded-md uppercase flex items-center gap-1 w-fit"><X size={12}/> Negado</span>;
      default: return <span className="px-2 py-1 bg-slate-200 text-slate-800 font-bold text-[10px] rounded-md uppercase w-fit">{status}</span>;
    }
  };

  const isConcluido = selectedRequest?.status === "RESPONDIDO" || selectedRequest?.status === "NEGADO";

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto relative">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <MessageSquare size={24} className="text-slate-400" /> Gestão do e-SIC
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Painel de Monitoramento LAI</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportarRelatorio('csv')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"><Download size={14} /> CSV</button>
            <button onClick={() => exportarRelatorio('pdf')} className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-900 rounded-xl text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-sm"><FileText size={14} /> PDF</button>
          </div>
        </header>

        {/* CARDS DE GESTÃO ESTRATÉGICA */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div 
              onClick={() => setStatusFiltro("PENDENTES")}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-400 transition-all"
            >
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total em Aberto</p>
                <h3 className="text-2xl font-black text-slate-800">{stats?.pedidosEmAberto || 0}</h3>
            </div>
            
            <div 
              onClick={() => setStatusFiltro("ALERTAS")}
              className={`bg-white p-5 rounded-2xl border shadow-sm border-l-4 transition-all cursor-pointer hover:shadow-md ${statusFiltro === 'ALERTAS' ? 'border-amber-500 bg-amber-50/30' : 'border-amber-200 border-l-amber-500'}`}
            >
                <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Atenção ao Prazo</p>
                    <AlertCircle size={14} className="text-amber-500"/>
                </div>
                <h3 className="text-2xl font-black text-slate-800">{stats?.pedidosEmAlerta || 0}</h3>
                <p className="text-[9px] text-amber-700 font-bold mt-1 uppercase">Vencendo em breve</p>
            </div>

            <div 
              onClick={() => setStatusFiltro("EXPIRADOS")}
              className={`bg-white p-5 rounded-2xl border shadow-sm border-l-4 transition-all cursor-pointer hover:shadow-md ${statusFiltro === 'EXPIRADOS' ? 'border-red-500 bg-red-50/30' : 'border-red-200 border-l-red-500'}`}
            >
                <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Prazo Excedido</p>
                    <X size={14} className="text-red-500"/>
                </div>
                <h3 className="text-2xl font-black text-slate-800">{stats?.pedidosExpirados || 0}</h3>
                <p className="text-[9px] text-red-700 font-bold mt-1 uppercase">Fora do limite legal</p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Finalizados</p>
                <h3 className="text-2xl font-black text-white">{stats?.pedidosRespondidos || 0}</h3>
            </div>
        </div>

        {(error || success) && (
          <div className={`mb-6 p-4 rounded-xl flex items-center border animate-in fade-in ${error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {error ? <AlertCircle className="mr-2" size={20} /> : <CheckCircle2 className="mr-2" size={20} />}
            {error || success}
          </div>
        )}

        {/* FILTROS DINÂMICOS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end animate-in slide-in-from-bottom-2">
          <div className="flex-1 min-w-[250px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Buscar Protocolo ou Cidadão</label>
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 text-slate-400" size={16} />
              <input type="text" placeholder="Ex: SIC-2026-123456..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black transition-all" />
            </div>
          </div>
          <div className="w-[220px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block flex items-center gap-1"><Filter size={12}/> Filtro de Situação</label>
            <select value={statusFiltro} onChange={(e) => { setStatusFiltro(e.target.value); setPage(0); }} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-black cursor-pointer">
              <option value="PENDENTES">Abertos / Pendentes</option>
              <option value="ALERTAS">⚠️ Prazos em Alerta</option>
              <option value="EXPIRADOS">🚨 Prazo Legal Excedido</option>
              <option value="TODOS">Todos os Registros</option>
              <option value="RESPONDIDO">Status: Respondidos</option>
              <option value="NEGADO">Status: Negados</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Início</label>
            <input type="date" value={dataInicio} onChange={(e) => { setDataInicio(e.target.value); setPage(0); }} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black transition-all"/>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Fim</label>
            <input type="date" value={dataFim} onChange={(e) => { setDataFim(e.target.value); setPage(0); }} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black transition-all"/>
          </div>
        </div>

        {/* TABELA DE GESTÃO */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Protocolo</th>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Cidadão / Tipo</th>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Situação do Prazo</th>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Status</th>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px] text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" size={24} /></td></tr>
                ) : solicitacoes.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-xs">Nenhuma solicitação pendente nesta categoria.</td></tr>
                ) : (
                  solicitacoes.map((req) => (
                    <tr key={req.id} onClick={() => abrirModal(req)} className={`hover:bg-slate-50 transition-colors cursor-pointer ${req.expirado ? 'bg-red-50/50' : req.emAlerta ? 'bg-amber-50/50' : ''}`}>
                      <td className="px-6 py-4 font-bold text-slate-900">{req.protocolo}</td>
                      <td className="px-6 py-4">
                        {/* REGRA APLICADA NA TABELA: Protege nome se sigilo for verdadeiro */}
                        <p className="font-bold text-slate-900">
                          {req.sigilo ? (
                            <span className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md w-fit">
                              <Lock size={12} /> Dados em Sigilo
                            </span>
                          ) : req.nome}
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase mt-1">{req.tipoSolicitacao}</p>
                      </td>
                      <td className="px-6 py-4">
                        {req.status === 'RESPONDIDO' || req.status === 'NEGADO' ? (
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Finalizado</span>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${req.expirado || req.descricaoPrazo === 'VENCE HOJE' ? 'bg-red-500 animate-pulse' : req.emAlerta ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                <span className={`text-xs font-black uppercase ${req.expirado || req.descricaoPrazo === 'VENCE HOJE' ? 'text-red-600' : req.emAlerta ? 'text-amber-600' : 'text-slate-600'}`}>
                                    {req.descricaoPrazo}
                                </span>
                            </div>
                        )}
                      </td>
                      <td className="px-6 py-4">{renderStatusBadge(req.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-[10px] font-bold text-black border border-slate-200 uppercase tracking-wider hover:bg-black hover:text-white transition-all px-3 py-1.5 rounded-lg">
                          Tramitar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* PAGINAÇÃO */}
          {!loading && solicitacoes.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Mostrando {solicitacoes.length} de {totalElements} registros</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="flex items-center gap-1 hover:text-black disabled:opacity-30 transition-colors"><ChevronLeft size={16} /> Anterior</button>
                <span className="bg-white px-3 py-1 rounded-md border border-slate-200 text-black shadow-sm">Página {page + 1} de {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="flex items-center gap-1 hover:text-black disabled:opacity-30 transition-colors">Próxima <ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL DE TRAMITAÇÃO */}
        {modalOpen && selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-[#F8FAFC] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
              
              <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                <div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">{isConcluido ? "Visualizar Protocolo" : "Tramitar e-SIC"}</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Ref: {selectedRequest.protocolo}</p>
                </div>
                <button onClick={fecharModal} className="text-slate-400 hover:text-black p-2 rounded-lg hover:bg-slate-100"><X size={20} /></button>
              </div>

              <div className="p-6 overflow-y-auto">
                {/* Alerta de Conclusão */}
                {isConcluido && (
                  <div className="mb-6 p-4 bg-slate-100 border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-slate-600 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Lock size={20} className="text-slate-400"/>
                      <div>
                        <p className="font-bold text-sm">Este protocolo está encerrado.</p>
                        <p className="text-xs mt-0.5">As informações abaixo são apenas para consulta histórica.</p>
                      </div>
                    </div>
                    {selectedRequest.urlAnexoResposta && (
                      <div className="flex flex-col gap-2 items-end">
                        {selectedRequest.urlAnexoResposta.split(',').map((url, idx) => (
                          <a key={idx} href={getDownloadUrl(url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                            <Download size={14}/> {extrairNomeDoArquivo(url)}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Dados do Solicitante</span>
                    {/* REGRA APLICADA NO MODAL: Ocultar dados pessoais caso optado por sigilo */}
                    {selectedRequest.sigilo ? (
                      <div className="flex items-start gap-3 mt-3 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <Lock size={16} className="mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-amber-800">Identidade em Sigilo</p>
                          <p className="text-[10px] text-amber-700 mt-1 font-semibold leading-tight">
                            A LAI resguarda os dados pessoais deste requerente. Responda tecnicamente sem citar nomes.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-bold text-slate-900">{selectedRequest.nome}</p>
                        <p className="text-sm text-slate-600 mt-1">{selectedRequest.email}</p>
                      </>
                    )}
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Classificação</span>
                    <p className="font-bold text-slate-900 uppercase">{selectedRequest.tipoSolicitacao}</p>
                    <div className="mt-2">{renderStatusBadge(selectedRequest.status)}</div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 mb-6">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><FileText size={14}/> Conteúdo da Solicitação</span>
                    {selectedRequest.urlAnexoSolicitacao && (
                       <div className="flex gap-2 flex-wrap justify-end">
                         {selectedRequest.urlAnexoSolicitacao.split(',').map((url, idx) => (
                           <a key={idx} href={getDownloadUrl(url)} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold flex items-center gap-1 hover:bg-blue-100 transition-colors">
                             <ExternalLink size={12}/> Anexo {idx + 1}
                           </a>
                         ))}
                       </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-wrap">
                    {selectedRequest.mensagem}
                  </p>
                </div>

                {/* Histórico de Trâmites */}
                {selectedRequest.tramites && selectedRequest.tramites.length > 0 && (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 mb-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5 block flex items-center gap-1">
                      <Clock size={14}/> Linha do Tempo
                    </span>
                    <div className="relative border-l-2 border-slate-100 ml-2 space-y-6">
                      {selectedRequest.tramites.map((tramite, index) => (
                        <div key={index} className="pl-6 relative">
                          <div className="absolute w-3 h-3 bg-slate-800 rounded-full -left-[7px] top-1.5 border-2 border-white ring-4 ring-slate-50"></div>
                          <div className="flex items-center gap-3 mb-1">
                            {renderStatusBadge(tramite.status)}
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                              {new Date(tramite.dataTramite).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                            {tramite.descricao}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formulário de Resposta */}
                {!isConcluido && (
                  <form onSubmit={tramitarPedido} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-black text-slate-900 uppercase tracking-tight border-b border-slate-100 pb-3 mb-4">Ação Administrativa</h3>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Atualizar Status</label>
                      <select value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-black transition-all">
                        <option value="EM_ANALISE">Em Análise (Movimentação Interna)</option>
                        <option value="PRORROGADO">Prorrogar Prazo Legal (+10 dias)</option>
                        <option value="RESPONDIDO">Responder e Concluir Protocolo</option>
                        <option value="NEGADO">Negar Acesso (Exige fundamentação)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Parecer / Resposta Oficial</label>
                      <textarea rows={4} required={(novoStatus === 'RESPONDIDO' || novoStatus === 'NEGADO')} value={resposta} onChange={(e) => setResposta(e.target.value)} placeholder="Digite aqui a resposta técnica que o cidadão receberá..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-black resize-y transition-all mb-2" />
                      
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-slate-600">Documentos Anexos ({arquivosUrls.length})</span>
                          <label className={`flex items-center gap-2 px-4 py-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-all ${fazendoUpload ? 'opacity-50 pointer-events-none' : ''}`}>
                            {fazendoUpload ? <Loader2 className="animate-spin" size={14}/> : <Paperclip size={14} />}
                            {fazendoUpload ? "Enviando..." : "Anexar Arquivo"}
                            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.jpg,.png" />
                          </label>
                        </div>
                        
                        {arquivosUrls.length > 0 && (
                          <div className="flex flex-col gap-2">
                            {arquivosUrls.map((url, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 animate-in slide-in-from-left-2">
                                <a href={getDownloadUrl(url)} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 hover:underline truncate max-w-[80%] flex items-center gap-2">
                                  <FileText size={12} className="text-slate-400 shrink-0"/> {extrairNomeDoArquivo(url)}
                                </a>
                                <button type="button" onClick={() => setArquivosUrls(prev => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                                  <Trash2 size={14}/>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                      <button type="button" onClick={fecharModal} className="px-6 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 transition-all">Cancelar</button>
                      <button type="submit" disabled={processando || fazendoUpload} className="bg-black text-white font-bold py-2.5 px-8 rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 text-xs uppercase">
                        {processando ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                        {processando ? 'Processando...' : 'Salvar Trâmite'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}