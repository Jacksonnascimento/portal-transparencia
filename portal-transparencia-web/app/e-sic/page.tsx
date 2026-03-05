"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import { Sidebar } from "@/components/Sidebar";
import { 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  X,
  FileText,
  Send,
  Loader2,
  MessageSquare
} from "lucide-react";

interface SicSolicitacao {
  id: number;
  protocolo: string;
  nome: string;
  documento: string;
  email: string;
  tipoSolicitacao: string;
  mensagem: string;
  status: string;
  dataSolicitacao: string;
  respostaOficial?: string;
  dataResposta?: string;
}

export default function GestaoEsicPage() {
  const [solicitacoes, setSolicitacoes] = useState<SicSolicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  
  // Estados de Feedback (Padrão do sistema)
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados do Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SicSolicitacao | null>(null);
  const [novoStatus, setNovoStatus] = useState("RESPONDIDO");
  const [resposta, setResposta] = useState("");
  const [processando, setProcessando] = useState(false);

  const carregarSolicitacoes = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/sic/solicitacoes");
      setSolicitacoes(data.content || []); 
    } catch (err) {
      setError("Falha ao carregar as solicitações do e-SIC.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    carregarSolicitacoes(); 
  }, [carregarSolicitacoes]);

  const abrirModal = (solicitacao: SicSolicitacao) => {
    setSelectedRequest(solicitacao);
    setNovoStatus(solicitacao.status === "RECEBIDO" ? "EM_ANALISE" : solicitacao.status);
    setResposta(solicitacao.respostaOficial || "");
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setSelectedRequest(null);
    setResposta("");
  };

  const tramitarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setProcessando(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put(`/sic/solicitacoes/${selectedRequest.id}/tramitar`, {
        status: novoStatus,
        resposta: resposta,
        urlAnexo: null 
      });

      setSolicitacoes(prev => prev.map(req => 
        req.id === selectedRequest.id 
          ? { ...req, status: novoStatus, respostaOficial: resposta, dataResposta: new Date().toISOString() } 
          : req
      ));
      
      setSuccess(`Protocolo ${selectedRequest.protocolo} tramitado com sucesso!`);
      setTimeout(() => setSuccess(null), 4000);
      fecharModal();
    } catch (err) {
      setError("Erro ao tramitar a solicitação. Verifique os dados e tente novamente.");
      setTimeout(() => setError(null), 4000);
    } finally {
      setProcessando(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "RECEBIDO":
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-md uppercase flex items-center gap-1 w-fit"><Clock size={12}/> Recebido</span>;
      case "EM_ANALISE":
        return <span className="px-2 py-1 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-md uppercase flex items-center gap-1 w-fit"><AlertCircle size={12}/> Em Análise</span>;
      case "RESPONDIDO":
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md uppercase flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> Respondido</span>;
      case "NEGADO":
        return <span className="px-2 py-1 bg-red-100 text-red-800 font-bold text-[10px] rounded-md uppercase flex items-center gap-1 w-fit"><X size={12}/> Negado</span>;
      default:
        return <span className="px-2 py-1 bg-slate-200 text-slate-800 font-bold text-[10px] rounded-md uppercase w-fit">{status}</span>;
    }
  };

  const solicitacoesFiltradas = solicitacoes.filter(req => 
    req.protocolo.toLowerCase().includes(busca.toLowerCase()) || 
    req.nome.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading && solicitacoes.length === 0) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-slate-400" size={40} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-y-auto relative">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <MessageSquare size={24} className="text-slate-400" /> Gestão do e-SIC
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Serviço de Informações ao Cidadão (LAI)
            </p>
          </div>
        </header>

        {(error || success) && (
          <div className={`mb-6 p-4 rounded-xl flex items-center border animate-in fade-in duration-300 ${
            error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            {error ? <AlertCircle className="mr-2" size={20} /> : <CheckCircle2 className="mr-2" size={20} />}
            {error || success}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por protocolo ou nome do cidadão..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Protocolo</th>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Cidadão</th>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Tipo</th>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Status</th>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px]">Data</th>
                  <th className="px-6 py-4 font-bold tracking-wide uppercase text-[10px] text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {solicitacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
                      Nenhuma solicitação encontrada.
                    </td>
                  </tr>
                ) : (
                  solicitacoesFiltradas.map((req) => (
                    <tr 
                      key={req.id} 
                      onClick={() => abrirModal(req)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900">{req.protocolo}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{req.nome}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{req.documento}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700 text-xs uppercase">{req.tipoSolicitacao}</td>
                      <td className="px-6 py-4">{renderStatusBadge(req.status)}</td>
                      <td className="px-6 py-4 font-medium text-slate-600 text-xs">
                        {new Date(req.dataSolicitacao).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); abrirModal(req); }}
                          className="text-[10px] font-bold text-black border border-slate-200 uppercase tracking-wider hover:bg-black hover:text-white transition-all px-3 py-1.5 rounded-lg"
                        >
                          Avaliar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL DE TRAMITAÇÃO */}
        {modalOpen && selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#F8FAFC] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              
              <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Tramitar Solicitação</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    Protocolo: {selectedRequest.protocolo}
                  </p>
                </div>
                <button onClick={fecharModal} className="text-slate-400 hover:text-black transition-colors p-2 rounded-lg hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Dados do Cidadão</span>
                    <p className="font-bold text-slate-900">{selectedRequest.nome}</p>
                    <p className="text-sm text-slate-600 mt-1">{selectedRequest.email}</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Natureza do Pedido</span>
                    <p className="font-bold text-slate-900 uppercase">{selectedRequest.tipoSolicitacao}</p>
                    <div className="mt-2">{renderStatusBadge(selectedRequest.status)}</div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block flex items-center gap-1">
                    <FileText size={14}/> Mensagem Original do Cidadão
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">
                    {selectedRequest.mensagem}
                  </p>
                </div>

                <form onSubmit={tramitarPedido} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-black text-slate-900 uppercase tracking-tight border-b border-slate-100 pb-3 mb-4">Decisão do Órgão</h3>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Definir Novo Status</label>
                    <select 
                      value={novoStatus}
                      onChange={(e) => setNovoStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-black outline-none transition-all"
                    >
                      <option value="EM_ANALISE">Em Análise (Movimentar interno)</option>
                      <option value="PRORROGADO">Prorrogar Prazo Legal (+10 dias)</option>
                      <option value="RESPONDIDO">Responder e Concluir Pedido</option>
                      <option value="NEGADO">Negar (Exige fundamentação legal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                      Redação Oficial da Resposta
                    </label>
                    <textarea 
                      rows={6}
                      required={(novoStatus === 'RESPONDIDO' || novoStatus === 'NEGADO')}
                      value={resposta}
                      onChange={(e) => setResposta(e.target.value)}
                      placeholder="Redija aqui a resposta técnica ou fundamentação legal da recusa..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-black outline-none resize-y transition-all"
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                    <button 
                      type="button" 
                      onClick={fecharModal}
                      className="px-6 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={processando}
                      className="bg-black text-white font-bold py-2.5 px-8 rounded-xl shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 text-xs uppercase"
                    >
                      {processando ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                      {processando ? 'Processando...' : 'Salvar Resposta'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}