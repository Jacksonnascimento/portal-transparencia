'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar';
import { 
  Plus, Edit2, Trash2, X, AlertCircle, Loader2, Save,
  CheckCircle, HelpCircle, EyeOff, Eye, ChevronLeft, ChevronRight, Search
} from 'lucide-react';

interface Faq {
  id: number;
  pergunta: string;
  resposta: string;
  ativo: boolean;
  ordem: number;
}

interface PageResponse {
  content: Faq[];
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

export default function FaqPage() {
  const [data, setData] = useState<PageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  
  // Estado para a pesquisa
  const [filtroBusca, setFiltroBusca] = useState('');

  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null);

  const [formData, setFormData] = useState({
    pergunta: '',
    resposta: '',
    ativo: true,
    ordem: 0
  });

  const fetchFaqs = useCallback(async (pageNumber: number, busca = filtroBusca) => {
    setLoading(true);
    setError(null);
    try {
      let url = `/faqs?page=${pageNumber}&size=10&sort=ordem,asc`;
      if (busca) url += `&busca=${busca}`;

      const response = await api.get(url);
      setData(response.data);
      setPage(pageNumber);
    } catch (err) {
      setError("Falha ao carregar as perguntas frequentes.");
    } finally {
      setLoading(false);
    }
  }, [filtroBusca]);

  useEffect(() => {
    fetchFaqs(page);
  }, [page, fetchFaqs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFaqs(0);
  };

  const limparBusca = () => {
    setFiltroBusca('');
    fetchFaqs(0, '');
  };

  const openCreateModal = () => {
    // LÓGICA DE UX: Pega o total de elementos existentes para sugerir a próxima ordem
    const proximaOrdem = data?.totalElements ? data.totalElements : 0;
    
    setFormData({ pergunta: '', resposta: '', ativo: true, ordem: proximaOrdem });
    setModalMode('create');
  };

  const openEditModal = (faq: Faq) => {
    setSelectedFaq(faq);
    setFormData({ pergunta: faq.pergunta, resposta: faq.resposta, ativo: faq.ativo, ordem: faq.ordem });
    setModalMode('edit');
  };

  const openDeleteModal = (faq: Faq) => {
    setSelectedFaq(faq);
    setModalMode('delete');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedFaq(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (modalMode === 'create') {
        await api.post('/faqs', formData);
      } else if (modalMode === 'edit' && selectedFaq) {
        await api.put(`/faqs/${selectedFaq.id}`, formData);
      }
      closeModal();
      fetchFaqs(page);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao salvar FAQ.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFaq) return;
    setSaving(true);
    try {
      await api.delete(`/faqs/${selectedFaq.id}`);
      closeModal();
      fetchFaqs(page);
    } catch (err) {
      setError("Erro ao excluir o registro.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (faq: Faq) => {
    try {
      await api.put(`/faqs/${faq.id}`, { ...faq, ativo: !faq.ativo });
      fetchFaqs(page);
    } catch (err) {
      setError("Erro ao alterar o status do FAQ.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de FAQ</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Perguntas Frequentes do Portal da Transparência</p>
          </div>
          <button onClick={openCreateModal} className="px-6 py-3 bg-black text-white font-bold rounded-xl text-xs uppercase flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg">
            <Plus size={16} /> Adicionar Pergunta
          </button>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-center border bg-red-50 text-red-700 border-red-200 animate-in fade-in">
            <AlertCircle className="mr-2" size={20} /> {error}
          </div>
        )}

        {/* --- BARRA DE PESQUISA --- */}
        <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[250px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Pesquisar Pergunta ou Resposta</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Ex: Licitação, Contrato, Receita..." 
                value={filtroBusca} 
                onChange={(e) => setFiltroBusca(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-black placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={limparBusca} className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg text-xs uppercase hover:bg-slate-200 transition-colors">Limpar</button>
            <button type="submit" className="px-6 py-2 bg-black text-white font-bold rounded-lg text-xs uppercase hover:bg-slate-800 transition-colors shadow-md">
              Buscar
            </button>
          </div>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 w-16 text-center">Ordem</th>
                  <th className="px-6 py-4 w-24 text-center">Status</th>
                  <th className="px-6 py-4">Pergunta Cadastrada</th>
                  <th className="px-6 py-4 text-center w-32">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={4} className="px-6 py-6 bg-slate-50/20"></td></tr>)
                ) : data?.content.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhuma pergunta encontrada.</td></tr>
                ) : (
                  data?.content.map((faq) => (
                    <tr key={faq.id} className="hover:bg-slate-50 transition-colors text-xs group">
                      <td className="px-6 py-4 font-mono font-bold text-slate-500 text-center">{faq.ordem}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => toggleStatus(faq)}
                          title={faq.ativo ? "Ocultar do Portal Público" : "Exibir no Portal Público"}
                          className={`px-3 py-1 rounded text-[10px] font-black uppercase border transition-all ${
                            faq.ativo ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {faq.ativo ? "Ativo" : "Inativo"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 line-clamp-1">{faq.pergunta}</p>
                        <p className="text-slate-500 text-[10px] mt-1 line-clamp-1 pr-10">{faq.resposta}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openEditModal(faq)} className="p-1.5 text-slate-400 hover:text-black rounded transition-all" title="Editar"><Edit2 size={18} /></button>
                          <button onClick={() => openDeleteModal(faq)} className="p-1.5 text-red-300 hover:text-red-600 rounded transition-all" title="Excluir"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && data && data.content.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Página {data.number + 1} de {data.totalPages} • Total: {data.totalElements} registros
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={data.first} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))} disabled={data.last} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- MODAIS --- */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="bg-slate-50 px-8 py-5 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
                  <HelpCircle size={20} className="text-brand" /> 
                  {modalMode === 'create' ? "Nova Pergunta Frequente" : "Editar Pergunta Frequente"}
                </h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-red-500 transition-colors p-1"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleSave} className="flex flex-col">
                <div className="p-8 space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Ordem de Exibição (0 é o primeiro)</label>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        value={formData.ordem} 
                        onChange={e => setFormData({...formData, ordem: parseInt(e.target.value) || 0})} 
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black font-mono text-center text-lg" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Visibilidade no Portal</label>
                      <div className="flex gap-2 h-[44px]">
                         <button 
                           type="button"
                           onClick={() => setFormData({...formData, ativo: true})}
                           className={`flex-1 rounded-xl border text-xs font-bold uppercase transition-all flex justify-center items-center gap-2 ${formData.ativo ? 'bg-green-100 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                         >
                           <Eye size={14}/> Ativo
                         </button>
                         <button 
                           type="button"
                           onClick={() => setFormData({...formData, ativo: false})}
                           className={`flex-1 rounded-xl border text-xs font-bold uppercase transition-all flex justify-center items-center gap-2 ${!formData.ativo ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                         >
                           <EyeOff size={14}/> Inativo
                         </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">A Pergunta (Ex: O que é Licitação?)</label>
                    <input 
                      type="text" 
                      required 
                      maxLength={255}
                      value={formData.pergunta} 
                      onChange={e => setFormData({...formData, pergunta: e.target.value})} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black font-bold text-slate-800" 
                      placeholder="Digite a pergunta de forma clara..."
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">A Resposta Detalhada (Aceita parágrafos longos)</label>
                    <textarea 
                      required 
                      rows={6}
                      value={formData.resposta} 
                      onChange={e => setFormData({...formData, resposta: e.target.value})} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black text-slate-700 resize-y" 
                      placeholder="Digite a resposta com o embasamento legal necessário..."
                    />
                  </div>

                </div>
                
                <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
                  <button type="button" onClick={closeModal} disabled={saving} className="px-6 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 transition-all disabled:opacity-50">Cancelar</button>
                  <button type="submit" disabled={saving} className="flex items-center px-8 py-2 bg-black text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50">
                    {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                    {modalMode === 'create' ? "Criar Pergunta" : "Salvar Alterações"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {modalMode === 'delete' && selectedFaq && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border-4 border-slate-900 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-slate-900 p-4 text-white font-bold text-xs uppercase flex items-center gap-2 tracking-widest">
                <AlertCircle className="text-red-400" size={18} /> Confirmar Exclusão
              </div>
              <div className="p-8 text-center bg-white">
                <p className="text-sm font-bold mb-4 uppercase text-slate-600">Deseja apagar permanentemente esta pergunta?</p>
                <div className="bg-red-50 p-4 rounded-xl font-bold text-red-700 border-2 border-red-200 mb-4 shadow-inner">
                  "{selectedFaq.pergunta}"
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase leading-tight italic">
                  Isso fará com que ela desapareça do Portal Público instantaneamente. Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="p-4 bg-slate-50 flex gap-3 border-t border-slate-100">
                <button onClick={closeModal} className="flex-1 px-4 py-2 border-2 border-slate-900 text-slate-900 font-bold rounded-lg text-xs uppercase hover:bg-white transition-colors">Cancelar</button>
                <button onClick={handleDelete} disabled={saving} className="flex flex-1 justify-center items-center px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-xs uppercase hover:bg-red-700 shadow-xl transition-all disabled:opacity-50">
                  {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : "Sim, Excluir"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}