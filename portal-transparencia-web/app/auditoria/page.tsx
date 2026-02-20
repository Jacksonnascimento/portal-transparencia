'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom'; 
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar'; 
import { 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  X,
  History,
  Trash2,
  AlertTriangle,
  Eye,
  FileText,
  ShieldCheck,
  CheckCircle,
  Database
} from 'lucide-react';

// --- INTERFACES ---
interface LogAuditoria {
  id: number;
  usuarioNome: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  dadosAnteriores?: string; // Onde guardamos a lista de excluídos
  dadosNovos?: string;      // Onde guardamos o resumo da importação
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

export default function AuditoriaPage() {
  const [data, setData] = useState<PageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedLog, setSelectedLog] = useState<LogAuditoria | null>(null);
  const [loteParaExcluir, setLoteParaExcluir] = useState<string | null>(null);

  const fetchLogs = useCallback(async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/auditoria?page=${pageNumber}&size=20&sort=dataHora,desc`);
      setData(response.data);
      setPage(pageNumber);
    } catch (err) {
      setError("Não foi possível carregar a trilha de auditoria.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(page); }, [page, fetchLogs]);

  const formatDate = (val: any) => {
    if (!val) return "---";
    if (Array.isArray(val)) return `${String(val[2]).padStart(2, '0')}/${String(val[1]).padStart(2, '0')}/${val[0]} ${String(val[3]).padStart(2, '0')}:${String(val[4]).padStart(2, '0')}`;
    return new Date(val).toLocaleString('pt-BR');
  };

  // Identifica lotes desfeitos para esconder o botão na interface
  const lotesJaExcluidos = new Set(
    data?.content.filter(l => l.acao === 'EXCLUSAO_LOTE_RECEITA').map(l => l.entidadeId)
  );

  const confirmarDesfazer = async () => {
    if (!loteParaExcluir) return;
    try {
      await api.delete(`/receitas/lote/${loteParaExcluir}`);
      setLoteParaExcluir(null);
      fetchLogs(0);
      alert("Lote revogado com sucesso.");
    } catch (err: any) {
      alert("Erro ao processar reversão: Lote não encontrado ou já excluído.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-y-auto relative z-0">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Trilha de Auditoria</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Horizon AJ • Monitoramento de Integridade LRF</p>
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Ambiente Monitorado</span>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-200">
            <AlertCircle className="mr-2" size={20} /> {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Data/Hora</th>
                  <th className="px-6 py-4">Operador</th>
                  <th className="px-6 py-4">Ação</th>
                  <th className="px-6 py-4">Identificador de Lote</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-6 bg-slate-50/20"></td></tr>)
                ) : (
                  data?.content.map((log) => (
                    <tr 
                      key={log.id} 
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50 transition-colors text-xs group cursor-pointer"
                    >
                      <td className="px-6 py-4 text-slate-500 font-mono font-semibold">{formatDate(log.dataHora)}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">{log.usuarioNome}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                          log.acao.includes("IMPORTACAO") ? "bg-blue-100 text-blue-700 border-blue-200" : 
                          log.acao.includes("EXCLUSAO") ? "bg-red-100 text-red-700 border-red-200" : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {log.acao}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-500 italic">{log.entidadeId}</td>
                      <td className="px-6 py-4 text-center flex justify-center gap-2">
                        <button className="p-1.5 text-slate-300 hover:text-black rounded transition-all" title="Ver Detalhes">
                          <Eye size={18} />
                        </button>
                        {/* REGRA: Esconde o botão se o lote já estiver na lista de desfeitos */}
                        {log.acao === "IMPORTACAO_LOTE_CSV" && !lotesJaExcluidos.has(log.entidadeId) && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setLoteParaExcluir(log.entidadeId); }}
                            className="p-1.5 text-red-300 hover:text-red-600 rounded transition-all"
                            title="Desfazer Importação"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {!loading && data && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Página {data.number + 1} de {data.totalPages} • Total: {data.totalElements} logs
              </span>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(0, p - 1)); }} disabled={data.first} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"><ChevronLeft size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(data.totalPages - 1, p + 1)); }} disabled={data.last} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL DE DETALHES DA AUDITORIA (PADRÃO RECEITAS) --- */}
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
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200">Ação: {selectedLog.acao}</span>
                    <span className="text-slate-500">Lote: {selectedLog.entidadeId}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto bg-white">
                {/* Caso seja Exclusão, mostra a lista item a item */}
                {selectedLog.acao === "EXCLUSAO_LOTE_RECEITA" && selectedLog.dadosAnteriores ? (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-red-700 uppercase tracking-widest border-l-4 border-red-600 pl-3">Itens Revogados do Sistema</h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-[10px] text-left">
                        <thead className="bg-slate-50 font-bold text-slate-500 uppercase border-b border-slate-200">
                          <tr>
                            <th className="p-3">Exercício</th>
                            <th className="p-3">Data Lanç.</th>
                            <th className="p-3">Origem</th>
                            <th className="p-3 text-right">Valor Arrecadado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {JSON.parse(selectedLog.dadosAnteriores).map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-red-50/30">
                              <td className="p-3">{item.exercicio}</td>
                              <td className="p-3 font-mono">{item.dataLancamento}</td>
                              <td className="p-3 font-bold">{item.origem}</td>
                              <td className="p-3 text-right font-black text-red-600">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorArrecadado)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 border-dashed">
                      <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <CheckCircle size={14}/> Resumo do Log
                      </h4>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                        "{selectedLog.dadosNovos || "Ação de sistema registrada sem detalhes adicionais."}"
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">IP de Origem</span>
                          <span className="font-mono text-xs font-bold">{selectedLog.ipOrigem}</span>
                       </div>
                       <div className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Data do Evento</span>
                          <span className="font-mono text-xs font-bold">{formatDate(selectedLog.dataHora)}</span>
                       </div>
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

      {/* --- MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (PADRÃO HORIZON) --- */}
      {loteParaExcluir && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border-4 border-slate-900 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-slate-900 p-4 text-white font-bold text-xs uppercase flex items-center gap-2 tracking-widest">
                <AlertTriangle className="text-yellow-400" size={18} /> Confirmar Revogação Crítica
              </div>
              <div className="p-8 text-center bg-white">
                <p className="text-sm font-bold mb-4 uppercase text-slate-600">Deseja apagar permanentemente o lote:</p>
                <div className="bg-red-50 p-4 rounded-xl font-mono font-black text-red-600 text-xl border-2 border-red-200 mb-4 shadow-inner">{loteParaExcluir}</div>
                <p className="text-[10px] text-slate-400 font-bold uppercase leading-tight italic">Esta ação não pode ser desfeita e removerá todos os lançamentos financeiros vinculados.</p>
              </div>
              <div className="p-4 bg-slate-50 flex gap-3 border-t border-slate-100">
                <button onClick={() => setLoteParaExcluir(null)} className="flex-1 px-4 py-2 border-2 border-slate-900 text-slate-900 font-bold rounded-lg text-xs uppercase hover:bg-white transition-colors">Cancelar</button>
                <button onClick={confirmarDesfazer} className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-xs uppercase hover:bg-red-700 shadow-xl transition-all active:scale-95">Sim, Revogar Lote</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}