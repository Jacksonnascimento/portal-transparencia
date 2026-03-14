'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom'; 
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar'; 
import { 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  X,
  History,
  Trash2,
  AlertTriangle,
  Eye,
  ShieldCheck,
  CheckCircle,
  Lock,
  Search
} from 'lucide-react';

// --- INTERFACES ---
interface LogAuditoria {
  id: number;
  usuarioNome: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  dadosAnteriores?: string; 
  dadosNovos?: string;      
  dataHora: any;
  ipOrigem: string;
}

interface PageResponse {
  content: LogAuditoria[];
  totalPages: number;
  totalElements: number;
  number: number;
  first: boolean;
  last: boolean;
}

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  if (!mounted) return null;
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null; 
  return createPortal(children, modalRoot);
};

// --- RENDERIZADOR DINÂMICO DE JSON ---
const RenderizadorJSON = ({ data }: { data?: string }) => {
  if (!data) return <span className="text-slate-400 italic">Sem detalhes adicionais registrados.</span>;
  if (data === '"[OCULTO POR SEGURANÇA]"' || data === '[OCULTO POR SEGURANÇA]') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg w-max">
        <Lock size={16} className="text-slate-500" />
        <span className="font-bold font-mono text-xs tracking-widest uppercase">Dado Sensível Oculto (LGPD)</span>
      </div>
    );
  }

  try {
    let parsed = JSON.parse(data);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);

    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(parsed).map(([key, value]) => (
            <div key={key} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{key}</span>
              <span className="font-mono text-xs font-bold text-slate-800 break-all">
                {value === null || value === '' ? <span className="text-slate-300 italic">vazio</span> : String(value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return <pre className="text-xs font-mono bg-slate-100 p-4 rounded-lg border border-slate-200 overflow-x-auto text-slate-700">{JSON.stringify(parsed, null, 2)}</pre>;
  } catch (e) {
    return <span className="font-mono text-xs text-slate-700 break-all">{data}</span>;
  }
};

// --- MAPAS DE CONFIGURAÇÃO DINÂMICA ---
const ENTIDADE_PARA_ROTA: Record<string, string> = {
  "RECEITA": "receitas",
  "DESPESA": "despesas",
  "DIVIDA_ATIVA": "divida-ativa",
  "SERVIDOR": "servidores",
  "FOLHA_PAGAMENTO": "folha-pagamento"
};

const ACOES_POR_ENTIDADE: Record<string, { value: string, label: string }[]> = {
  "CONFIGURACAO": [
    { value: "ATUALIZACAO", label: "ATUALIZAÇÃO" },
    { value: "ATUALIZACAO_BRASAO", label: "ATUALIZAÇÃO DE BRASÃO" }
  ],
  "USUARIO": [
    { value: "CRIACAO", label: "CRIAÇÃO" },
    { value: "ATUALIZACAO", label: "ATUALIZAÇÃO" },
    { value: "ALTERACAO_SENHA", label: "ALTERAÇÃO DE SENHA" }
  ],
  "RECEITA": [
    { value: "IMPORTACAO_LOTE_CSV", label: "IMPORTAÇÃO (CSV)" },
    { value: "EXCLUSAO_LOTE", label: "EXCLUSÃO / ROLLBACK" }
  ],
  "DESPESA": [
    { value: "IMPORTACAO_LOTE_CSV", label: "IMPORTAÇÃO (CSV)" },
    { value: "EXCLUSAO_LOTE", label: "EXCLUSÃO / ROLLBACK" }
  ],
  "DIVIDA_ATIVA": [
    { value: "IMPORTACAO_LOTE_CSV", label: "IMPORTAÇÃO (CSV)" },
    { value: "EXCLUSAO_LOTE", label: "EXCLUSÃO / ROLLBACK" }
  ],
  "SERVIDOR": [
    { value: "IMPORTACAO", label: "IMPORTAÇÃO (CSV)" },
    { value: "EXCLUSAO_LOTE", label: "EXCLUSÃO / ROLLBACK" }
  ],
  "FOLHA_PAGAMENTO": [
    { value: "IMPORTACAO", label: "IMPORTAÇÃO (CSV)" },
    { value: "EXCLUSAO_LOTE", label: "EXCLUSÃO / ROLLBACK" }
  ]
};

const TODAS_ACOES = Array.from(
  new Map(
    Object.values(ACOES_POR_ENTIDADE)
      .flat()
      .map(item => [item.label, item]) 
  ).values()
);

export default function AuditoriaPage() {
  const [data, setData] = useState<PageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [filtroAcao, setFiltroAcao] = useState('');
  const [filtroEntidade, setFiltroEntidade] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');

  const [selectedLog, setSelectedLog] = useState<LogAuditoria | null>(null);
  const [logParaReverter, setLogParaReverter] = useState<LogAuditoria | null>(null);

  useEffect(() => {
    if (filtroEntidade) {
      const acoesValidas = ACOES_POR_ENTIDADE[filtroEntidade]?.map(a => a.value) || [];
      if (filtroAcao && !acoesValidas.includes(filtroAcao)) setFiltroAcao('');
    }
  }, [filtroEntidade, filtroAcao]);

  const fetchLogs = useCallback(async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      let url = `/auditoria?page=${pageNumber}&size=20&sort=dataHora,desc`;
      if (filtroAcao) url += `&acao=${filtroAcao}`;
      if (filtroEntidade) url += `&entidade=${filtroEntidade}`;
      if (filtroUsuario) url += `&usuarioNome=${filtroUsuario}`;

      const response = await api.get(url);
      setData(response.data);
      setPage(pageNumber);
    } catch (err) {
      setError("Não foi possível carregar a trilha de auditoria.");
    } finally {
      setLoading(false);
    }
  }, [filtroAcao, filtroEntidade, filtroUsuario]);

  useEffect(() => { fetchLogs(page); }, [page, fetchLogs]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(0);
  };

  const limparFiltros = () => {
    setFiltroAcao('');
    setFiltroEntidade('');
    setFiltroUsuario('');
    fetchLogs(0);
  };

  const formatDate = (val: any) => {
    if (!val) return "---";
    if (Array.isArray(val)) return `${String(val[2]).padStart(2, '0')}/${String(val[1]).padStart(2, '0')}/${val[0]} ${String(val[3]).padStart(2, '0')}:${String(val[4]).padStart(2, '0')}`;
    return new Date(val).toLocaleString('pt-BR');
  };

  const parseDadosExcluidos = (jsonString?: string) => {
    if (!jsonString) return [];
    try {
      let parsed = JSON.parse(jsonString);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  };

  const lotesJaExcluidos = new Set(
    data?.content?.filter((l: LogAuditoria) => l.acao.includes('EXCLUSAO_LOTE')).map((l: LogAuditoria) => l.entidadeId) || []
  );

  const confirmarDesfazer = async () => {
    if (!logParaReverter) return;
    try {
      const rota = ENTIDADE_PARA_ROTA[logParaReverter.entidade];
      
      // AJUSTE: Módulos de RH usam a rota /importacao/id em vez de /lote/id
      const isRH = logParaReverter.entidade === 'SERVIDOR' || logParaReverter.entidade === 'FOLHA_PAGAMENTO';
      const endpoint = isRH ? `/${rota}/importacao/${logParaReverter.entidadeId}` : `/${rota}/lote/${logParaReverter.entidadeId}`;
      
      await api.delete(endpoint);
      
      setLogParaReverter(null);
      fetchLogs(0);
      alert("Lote revogado com sucesso.");
    } catch (err: any) {
      alert("Erro ao processar reversão: Lote não encontrado ou já excluído.");
    }
  };

  const acoesDisponiveis = filtroEntidade ? ACOES_POR_ENTIDADE[filtroEntidade] || [] : TODAS_ACOES;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto relative z-0">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Trilha de Auditoria</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Horizon AJ • Monitoramento de Integridade LRF</p>
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-sm">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Ambiente Monitorado</span>
          </div>
        </header>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-200"><AlertCircle className="mr-2" size={20} /> {error}</div>}

        <form onSubmit={handleFilter} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Filtrar por Entidade</label>
            <select value={filtroEntidade} onChange={(e) => setFiltroEntidade(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
              <option value="">TODAS AS ENTIDADES</option>
              <option value="CONFIGURACAO">CONFIGURAÇÕES</option>
              <option value="USUARIO">USUÁRIOS</option>
              <option value="RECEITA">RECEITAS</option>
              <option value="DESPESA">DESPESAS</option>
              <option value="DIVIDA_ATIVA">DÍVIDA ATIVA</option>
              <option value="SERVIDOR">SERVIDORES</option>
              <option value="FOLHA_PAGAMENTO">FOLHA DE PAGAMENTO</option>
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Filtrar por Ação</label>
            <select value={filtroAcao} onChange={(e) => setFiltroAcao(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
              <option value="">TODAS AS AÇÕES</option>
              {acoesDisponiveis.map(acao => (<option key={acao.label} value={acao.value}>{acao.label}</option>))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Filtrar por Operador</label>
            <input type="text" placeholder="Nome do usuário..." value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={limparFiltros} className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg text-xs uppercase">Limpar</button>
            <button type="submit" className="px-6 py-2 bg-black text-white font-bold rounded-lg text-xs uppercase shadow-md flex items-center gap-2"><Search size={14} /> Aplicar Filtros</button>
          </div>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Data/Hora</th>
                  <th className="px-6 py-4">Operador</th>
                  <th className="px-6 py-4">Ação / Entidade</th>
                  <th className="px-6 py-4">Identificador</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? ([...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-6 bg-slate-50/20"></td></tr>)) : data?.content.length === 0 ? (<tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum registro encontrado</td></tr>) : (
                  data?.content.map((log) => {
                    // AJUSTE: Identificando se é uma ação de importação válida para desfazer
                    const isImportAction = log.acao === "IMPORTACAO_LOTE_CSV" || log.acao === "IMPORTACAO";
                    const isBatchLog = log.entidadeId.includes("LOTE");
                    const canUndo = isImportAction && isBatchLog && !lotesJaExcluidos.has(log.entidadeId);

                    return (
                      <tr key={log.id} onClick={() => setSelectedLog(log)} className="hover:bg-slate-50 transition-colors text-xs group cursor-pointer">
                        <td className="px-6 py-4 text-slate-500 font-mono font-semibold">{formatDate(log.dataHora)}</td>
                        <td className="px-6 py-4 font-bold text-slate-700">{log.usuarioNome}</td>
                        <td className="px-6 py-4 flex flex-col items-start gap-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border w-max ${
                            log.acao.includes("IMPORTACAO") ? "bg-blue-100 text-blue-700 border-blue-200" : 
                            log.acao.includes("EXCLUSAO") ? "bg-red-100 text-red-700 border-red-200" : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>{log.acao}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{log.entidade}</span>
                        </td>
                        <td className={`px-6 py-4 font-bold font-mono text-[11px] ${!log.entidadeId.includes("LOTE") ? "text-slate-300 italic font-normal" : "text-slate-500"}`}>
                          {log.entidadeId}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button className="p-1.5 text-slate-300 hover:text-black rounded transition-all" title="Ver Detalhes"><Eye size={18} /></button>
                            {canUndo && (
                              <button onClick={(e) => { e.stopPropagation(); setLogParaReverter(log); }} className="p-1.5 text-red-300 hover:text-red-600 rounded transition-all" title="Desfazer Importação"><Trash2 size={18} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {!loading && data && data.content.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Página {data.number + 1} de {data.totalPages} • Total: {data.totalElements} logs</span>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setPage(0); }} disabled={data.first} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"><ChevronsLeft size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(0, p - 1)); }} disabled={data.first} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"><ChevronLeft size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(data.totalPages - 1, p + 1)); }} disabled={data.last} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"><ChevronRight size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); setPage(data.totalPages - 1); }} disabled={data.last} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"><ChevronsRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL DE DETALHES --- */}
      {selectedLog && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-start flex-shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
                    <History size={20} className="text-blue-600" /> Detalhamento da Auditoria
                  </h3>
                  <div className="flex items-center gap-2 mt-2 font-bold uppercase text-[10px]">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200">{selectedLog.acao}</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded border border-slate-300">{selectedLog.entidade}</span>
                    <span className="text-slate-500 ml-2">ID / Registro: {selectedLog.entidadeId}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"><X size={24} /></button>
              </div>
              
              <div className="p-8 overflow-y-auto bg-white flex-1">
                {selectedLog.acao.includes("EXCLUSAO_LOTE") && selectedLog.dadosAnteriores ? (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-red-700 uppercase tracking-widest border-l-4 border-red-600 pl-3 italic">Itens Revogados do Sistema</h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-[10px] text-left">
                        <thead className="bg-slate-50 font-bold text-slate-500 uppercase border-b border-slate-200">
                          <tr>
                            <th className="p-3">Exercício / Ano</th>
                            <th className="p-3">Detalhe / Origem</th>
                            <th className="p-3 text-right">Identificação / Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {parseDadosExcluidos(selectedLog.dadosAnteriores).map((item: any, idx: number) => {
                            
                            // Lógica inteligente para exibir os dados baseados na Entidade
                            const isServidor = selectedLog.entidade === 'SERVIDOR';
                            const isFolha = selectedLog.entidade === 'FOLHA_PAGAMENTO';
                            
                            let detalhePrincipal = item.origem || item.nomeDevedor || item.numeroEmpenho;
                            let detalheSecundario = item.razaoSocial || item.tipoDivida || '';
                            let valorExibicao = item.valorArrecadado || item.valorTotalDivida || item.valorEmpenhado || 0;
                            let formatMoney = true;

                            if (isServidor) {
                              detalhePrincipal = item.nome;
                              detalheSecundario = item.cargo;
                              valorExibicao = item.cpf;
                              formatMoney = false;
                            } else if (isFolha) {
                              detalhePrincipal = item.servidor?.nome || item.nomeServidor || 'Servidor';
                              detalheSecundario = `Mês: ${item.mes}`;
                              valorExibicao = item.salarioLiquido;
                            }

                            return (
                              <tr key={idx} className="hover:bg-red-50/30">
                                <td className="p-3">{item.exercicio || item.anoInscricao || (item.dataAdmissao ? new Date(item.dataAdmissao).getFullYear() : '---')}</td>
                                <td className="p-3 font-bold">
                                  {detalhePrincipal || '---'}
                                  <span className="block text-[8px] text-slate-400 font-normal uppercase">
                                    {detalheSecundario}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-black text-red-600">
                                  {formatMoney 
                                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorExibicao)
                                    : valorExibicao
                                  }
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-200 pb-2"><CheckCircle size={14}/> Dados Registrados</h4>
                      <RenderizadorJSON data={selectedLog.dadosNovos} />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-end flex-shrink-0">
                <button onClick={() => setSelectedLog(null)} className="px-6 py-2 bg-black hover:bg-slate-800 text-white font-bold rounded-lg transition-all text-xs uppercase shadow-lg">Fechar Auditoria</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* --- CONFIRMAÇÃO DE EXCLUSÃO --- */}
      {logParaReverter && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border-4 border-slate-900 overflow-hidden animate-in zoom-in-95 duration-200 text-center">
              <div className="bg-slate-900 p-4 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 tracking-widest"><AlertTriangle className="text-yellow-400" size={18} /> Revogação Crítica</div>
              <div className="p-8">
                <p className="text-sm font-bold mb-4 uppercase text-slate-600">Deseja apagar o lote de {logParaReverter.entidade}:</p>
                <div className="bg-red-50 p-4 rounded-xl font-mono font-black text-red-600 text-xl border-2 border-red-200 mb-4">{logParaReverter.entidadeId}</div>
              </div>
              <div className="p-4 bg-slate-50 flex gap-3 border-t border-slate-100">
                <button onClick={() => setLogParaReverter(null)} className="flex-1 px-4 py-2 border-2 border-slate-900 text-slate-900 font-bold rounded-lg text-xs uppercase">Cancelar</button>
                <button onClick={confirmarDesfazer} className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-xs uppercase hover:bg-red-700 transition-all">Sim, Revogar Lote</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}