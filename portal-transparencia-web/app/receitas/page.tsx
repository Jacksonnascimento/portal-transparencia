'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar'; 
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  AlertCircle,
  X,
  Eye,
  FileText,
  TrendingUp,
  Target,
  Pencil,
  Trash2,
  Save,
  CheckCircle,
  Loader2
} from 'lucide-react';

// --- INTERFACES ---
interface Receita {
  id: number;
  exercicio: number;
  mes: number;
  dataLancamento: string | number[]; 
  categoriaEconomica: string;
  origem: string;
  especie?: string;
  rubrica?: string;
  alinea?: string;
  fonteRecursos: string;
  valorPrevistoInicial?: number;
  valorPrevistoAtualizado?: number;
  valorArrecadado: number;
  historico?: string;
}

interface PageResponse {
  content: Receita[];
  totalPages: number;
  totalElements: number;
  number: number;
  first: boolean;
  last: boolean;
}

export default function ReceitasPage() {
  const [data, setData] = useState<PageResponse | null>(null);
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedReceita, setSelectedReceita] = useState<Receita | null>(null);
  const [editReceita, setEditReceita] = useState<Receita | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [fExercicio, setFExercicio] = useState('');
  const [fOrigem, setFOrigem] = useState('');
  const [fCategoria, setFCategoria] = useState('');
  const [fFonte, setFFonte] = useState('');

  useEffect(() => {
    api.get<number[]>('/receitas/anos')
      .then(res => setAnosDisponiveis(res.data))
      .catch(err => console.error("Erro ao buscar anos:", err));
  }, []);

  const fetchReceitas = useCallback(async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      let params = `page=${pageNumber}&size=20&sort=dataLancamento,desc`;
      if (fExercicio) params += `&exercicio=${fExercicio}`;
      if (fOrigem) params += `&origem=${encodeURIComponent(fOrigem)}`;
      if (fCategoria) params += `&categoria=${encodeURIComponent(fCategoria)}`;
      if (fFonte) params += `&fonte=${encodeURIComponent(fFonte)}`;

      const response = await api.get(`/receitas?${params}`);
      setData(response.data);
      setPage(pageNumber);
    } catch (err) {
      setError("Não foi possível carregar as receitas.");
    } finally {
      setLoading(false);
    }
  }, [fExercicio, fOrigem, fCategoria, fFonte]);

  useEffect(() => {
    fetchReceitas(page);
  }, [page, fetchReceitas]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("⚠️ EXCLUSÃO DE DADOS: Tem certeza que deseja excluir esta receita? Esta ação será registrada no log de auditoria.")) return;
    
    setActionLoading(true);
    try {
      await api.delete(`/receitas/${id}`);
      setSuccessMsg("Lançamento removido com sucesso!");
      fetchReceitas(page);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError("Erro ao excluir o registro. Verifique as permissões.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReceita) return;

    setActionLoading(true);
    try {
      await api.put(`/receitas/${editReceita.id}`, editReceita);
      setSuccessMsg("Dados atualizados com sucesso!");
      setEditReceita(null);
      fetchReceitas(page);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError("Erro ao salvar as alterações.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatMoney = (val?: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (val: any) => {
    if (!val) return "---";
    if (Array.isArray(val)) return `${String(val[2]).padStart(2, '0')}/${String(val[1]).padStart(2, '0')}/${val[0]}`;
    return new Date(val).toLocaleDateString('pt-BR');
  };

  const calcularPorcentagem = (arrecadado: number, previsto?: number) => {
    if (!previsto || previsto === 0) return 0;
    return Math.min(100, (arrecadado / previsto) * 100);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto relative">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Receitas Públicas</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Horizon AJ • Módulo de Retaguarda</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 border rounded-lg shadow-sm font-bold text-xs uppercase transition-all ${
                showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter size={14} className="mr-2" /> {showFilters ? 'Fechar' : 'Filtros'}
            </button>
          </div>
        </header>

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center border border-emerald-200 animate-in fade-in slide-in-from-top-4">
            <CheckCircle className="mr-2" size={20} /> {successMsg}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-200 animate-in shake duration-300">
            <AlertCircle className="mr-2" size={20} /> {error}
          </div>
        )}

        {/* --- FILTROS --- */}
        {showFilters && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Exercício</label>
                <select 
                  value={fExercicio} onChange={(e) => { setFExercicio(e.target.value); setPage(0); }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="">Todos os anos</option>
                  {anosDisponiveis.map(ano => <option key={ano} value={ano}>{ano}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Origem</label>
                <input type="text" placeholder="Ex: Impostos..." value={fOrigem} onChange={(e) => { setFOrigem(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Categoria</label>
                <input type="text" placeholder="Ex: Correntes..." value={fCategoria} onChange={(e) => { setFCategoria(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Fonte</label>
                  <input type="text" placeholder="Ex: Tesouro..." value={fFonte} onChange={(e) => { setFFonte(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm" />
                </div>
                <button onClick={() => { setFExercicio(''); setFOrigem(''); setFCategoria(''); setFFonte(''); setPage(0); }} className="p-2 mt-5 text-slate-400 hover:text-red-500 rounded" title="Limpar">
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- TABELA --- */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Origem</th>
                  <th className="px-6 py-4">Fonte</th>
                  <th className="px-6 py-4 text-right">Arrecadado</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                   [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-6 bg-slate-50/20"></td></tr>)
                ) : (
                  data?.content.map((item) => (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedReceita(item)} // Clique na linha
                      className="hover:bg-blue-50/40 transition-colors text-xs group cursor-pointer"
                    >
                      <td className="px-6 py-4 text-slate-500 font-semibold">{formatDate(item.dataLancamento)}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">{item.origem}</td>
                      <td className="px-6 py-4 text-slate-500 truncate max-w-[150px]">{item.fonteRecursos}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">{formatMoney(item.valorArrecadado)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedReceita(item); }} 
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded" 
                            title="Ver Detalhes"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditReceita(item); }} 
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" 
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" 
                            title="Excluir"
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
          
          {/* PAGINAÇÃO */}
          {!loading && data && data.totalElements > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Página {data.number + 1} de {data.totalPages} • Total: {data.totalElements}
              </span>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(0, p - 1)); }} disabled={data.first} className="p-2 border border-slate-200 rounded bg-white disabled:opacity-50"><ChevronLeft size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(data.totalPages - 1, p + 1)); }} disabled={data.last} className="p-2 border border-slate-200 rounded bg-white disabled:opacity-50"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>

        {/* --- MODAL DE EDIÇÃO --- */}
        {editReceita && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
              <form onSubmit={handleUpdate}>
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Pencil size={20} className="text-emerald-600" /> Alterar Registro de Receita
                  </h3>
                  <button type="button" onClick={() => setEditReceita(null)} className="text-slate-400 hover:text-red-500"><X size={24} /></button>
                </div>
                <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Exercício</label>
                    <input type="number" value={editReceita.exercicio} onChange={e => setEditReceita({...editReceita, exercicio: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Mês</label>
                    <input type="number" min="1" max="12" value={editReceita.mes} onChange={e => setEditReceita({...editReceita, mes: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase text-emerald-600">Arrecadado (R$)</label>
                    <input type="number" step="0.01" value={editReceita.valorArrecadado} onChange={e => setEditReceita({...editReceita, valorArrecadado: Number(e.target.value)})} className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-bold text-emerald-700" />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Origem</label>
                    <input type="text" value={editReceita.origem} onChange={e => setEditReceita({...editReceita, origem: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Fonte de Recursos</label>
                    <input type="text" value={editReceita.fonteRecursos} onChange={e => setEditReceita({...editReceita, fonteRecursos: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Histórico Detalhado</label>
                    <textarea rows={3} value={editReceita.historico} onChange={e => setEditReceita({...editReceita, historico: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm italic" />
                  </div>
                </div>
                <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditReceita(null)} className="px-6 py-2 text-xs font-bold text-slate-400 uppercase">Descartar</button>
                  <button type="submit" disabled={actionLoading} className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 text-xs uppercase transition-all">
                    {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar Registro
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL DE DETALHES --- */}
        {selectedReceita && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
              <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" /> Detalhamento da Receita
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide font-semibold">
                    Lançamento de {formatDate(selectedReceita.dataLancamento)} • Exercício {selectedReceita.exercicio}
                  </p>
                </div>
                <button onClick={() => setSelectedReceita(null)} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto space-y-8 bg-white text-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-2"><Target size={12} /> Previsão Inicial</span>
                    <div className="text-lg font-bold text-slate-600">{formatMoney(selectedReceita.valorPrevistoInicial)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-2"><Target size={12} /> Previsão Atualizada</span>
                    <div className="text-lg font-bold text-slate-700">{formatMoney(selectedReceita.valorPrevistoAtualizado)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                    <span className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1 mb-2"><TrendingUp size={12} /> Valor Arrecadado</span>
                    <div className="text-2xl font-black text-green-700">{formatMoney(selectedReceita.valorArrecadado)}</div>
                  </div>
                </div>
                {selectedReceita.valorPrevistoAtualizado && selectedReceita.valorPrevistoAtualizado > 0 && (
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase">
                      <span>Execução da Receita</span>
                      <span>{calcularPorcentagem(selectedReceita.valorArrecadado, selectedReceita.valorPrevistoAtualizado).toFixed(1)}% Realizado</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${calcularPorcentagem(selectedReceita.valorArrecadado, selectedReceita.valorPrevistoAtualizado)}%` }}></div></div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Classificação</h4>
                    <div><span className="text-[10px] font-bold text-slate-400 uppercase block">Categoria</span><p className="font-semibold">{selectedReceita.categoriaEconomica}</p></div>
                    <div><span className="text-[10px] font-bold text-slate-400 uppercase block">Origem</span><p className="font-semibold">{selectedReceita.origem}</p></div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Recurso</h4>
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                      <span className="text-[10px] font-bold text-yellow-600 uppercase block mb-1">Fonte</span>
                      <p className="font-bold text-yellow-900 leading-tight">{selectedReceita.fonteRecursos}</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-8">
                   <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-4">Histórico Detalhado</h4>
                   <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 italic leading-relaxed text-sm">
                     {selectedReceita.historico || "Sem histórico detalhado."}
                   </div>
                </div>
              </div>
              <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-end">
                <button onClick={() => setSelectedReceita(null)} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg transition-all text-xs uppercase hover:bg-blue-700 shadow-lg">Fechar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}