'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom'; 
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar'; 
import { 
  Filter,
  AlertCircle,
  X,
  Eye,
  BookOpen,
  Plus,
  Edit,
  Clock,
  MapPin,
  Info,
  Loader2,
  Save,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// --- INTERFACES ---
interface Servico {
  id?: string;
  nome: string;
  descricao: string;
  setorResponsavel: string;
  requisitos: string;
  etapas: string;
  prazoMaximo: string;
  formaPrestacao: 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO';
  detalhesPrestacao: string;
  canaisManifestacao: string;
  status: 'ATIVO' | 'INATIVO';
}

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  if (!mounted) return null;
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null; 
  return createPortal(children, modalRoot);
};

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modais
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [fBusca, setFBusca] = useState('');
  const [fStatus, setFStatus] = useState('');

  const [formData, setFormData] = useState<Servico>({
    nome: "", descricao: "", setorResponsavel: "", requisitos: "",
    etapas: "", prazoMaximo: "", formaPrestacao: "PRESENCIAL",
    detalhesPrestacao: "", canaisManifestacao: "", status: "ATIVO"
  });

  const fetchServicos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/servicos');
      let filtrados = response.data;
      
      if (fBusca) {
        filtrados = filtrados.filter((s: Servico) => 
          s.nome.toLowerCase().includes(fBusca.toLowerCase()) || 
          s.setorResponsavel.toLowerCase().includes(fBusca.toLowerCase())
        );
      }
      if (fStatus) {
        filtrados = filtrados.filter((s: Servico) => s.status === fStatus);
      }

      setServicos(filtrados);
    } catch (err) {
      setError("Não foi possível carregar os serviços.");
    } finally {
      setLoading(false);
    }
  }, [fBusca, fStatus]);

  useEffect(() => { fetchServicos(); }, [fetchServicos]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === 'edit' && formData.id) {
        await api.put(`/servicos/${formData.id}`, formData);
      } else {
        await api.post("/servicos", formData);
      }
      setIsFormOpen(false);
      fetchServicos();
    } catch (error) {
      setError("Erro ao salvar os dados do serviço.");
    } finally {
      setSaving(false);
    }
  };

  const openForm = (servico?: Servico) => {
    if (servico) {
      setFormData(servico);
      setModalMode('edit');
    } else {
      setFormData({ nome: "", descricao: "", setorResponsavel: "", requisitos: "", etapas: "", prazoMaximo: "", formaPrestacao: "PRESENCIAL", detalhesPrestacao: "", canaisManifestacao: "", status: "ATIVO" });
      setModalMode('create');
    }
    setIsFormOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      
      <main className="flex-1 p-6 overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Carta de Serviços ao Usuário</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Horizon AJ • Gestão de Transparência</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => openForm()}
              className="px-6 py-3 bg-black text-white font-bold rounded-xl text-xs uppercase flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
            >
              <Plus size={16} /> Adicionar Serviço
            </button>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 border rounded-xl shadow-sm font-bold text-xs uppercase transition-all ${
                showFilters ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter size={14} className="mr-2" /> {showFilters ? 'Fechar Filtros' : 'Filtrar'}
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-200 animate-in shake duration-300">
            <AlertCircle className="mr-2" size={20} /> {error}
          </div>
        )}

        {/* FILTROS (Padrão FAQ) */}
        {showFilters && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Pesquisar Nome ou Setor</label>
                <input type="text" placeholder="Ex: Matrícula..." value={fBusca} onChange={(e) => setFBusca(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-xs font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Status de Exibição</label>
                <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-xs font-bold">
                  <option value="">Todos</option>
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>
              <button onClick={() => {setFBusca(''); setFStatus('');}} className="text-[10px] font-bold text-red-500 hover:underline uppercase text-left pb-2">Limpar Tudo</button>
            </div>
          </div>
        )}

        {/* TABELA DE DADOS */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4">Nome do Serviço</th>
                <th className="px-6 py-4">Setor Responsável</th>
                <th className="px-6 py-4">Prazo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                 [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-6 bg-slate-50/20"></td></tr>)
              ) : servicos.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum serviço cadastrado.</td></tr>
              ) : servicos.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors text-xs group">
                  <td className="px-6 py-4 font-bold text-slate-700">{item.nome}</td>
                  <td className="px-6 py-4 text-slate-500 font-semibold">{item.setorResponsavel}</td>
                  <td className="px-6 py-4 text-slate-500">{item.prazoMaximo}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${item.status === 'ATIVO' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setSelectedServico(item)} className="p-1.5 text-slate-300 hover:text-blue-600 transition-all" title="Ver Detalhes"><Eye size={18} /></button>
                      <button onClick={() => openForm(item)} className="p-1.5 text-slate-300 hover:text-black transition-all" title="Editar"><Edit size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL DETALHES (PADRÃO RECEITAS) */}
      {selectedServico && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                    <BookOpen size={20} className="text-blue-600" /> Carta de Serviços
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase mt-1">{selectedServico.nome}</p>
                </div>
                <button onClick={() => setSelectedServico(null)} className="text-slate-400 hover:text-red-500 transition-colors p-1"><X size={24} /></button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><Clock size={12}/> Prazo Máximo</span>
                    <p className="font-bold text-slate-700">{selectedServico.prazoMaximo}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><MapPin size={12}/> Entrega</span>
                    <p className="font-bold text-slate-700 uppercase text-[10px]">{selectedServico.formaPrestacao}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1 mb-1"><Info size={12}/> Responsável</span>
                    <p className="font-bold text-blue-900 leading-tight">{selectedServico.setorResponsavel}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-2">Descrição</h4>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedServico.descricao}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest border-l-4 border-emerald-600 pl-3 mb-2">Requisitos e Documentos</h4>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">{selectedServico.requisitos}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-widest border-l-4 border-emerald-600 pl-3 mb-2">Etapas do Processo</h4>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">{selectedServico.etapas}</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                     <h4 className="text-[10px] font-black text-amber-700 uppercase mb-2">Canais de Manifestação e Detalhes</h4>
                     <p className="text-sm text-amber-900 font-medium whitespace-pre-wrap">{selectedServico.detalhesPrestacao}</p>
                     <p className="text-xs text-amber-800 mt-2 italic">{selectedServico.canaisManifestacao}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-end">
                <button onClick={() => setSelectedServico(null)} className="px-6 py-2 bg-black text-white font-bold rounded-lg text-xs uppercase shadow-lg">Fechar</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL FORMULÁRIO (PADRÃO FAQ) */}
      {isFormOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <header className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  {modalMode === 'edit' ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
                </h2>
                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all"><X size={24} /></button>
              </header>
              
              <form onSubmit={handleSalvar} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-8 overflow-y-auto space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Título do Serviço (Visível ao Cidadão)</label>
                      <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black font-bold text-slate-800" 
                        value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Unidade / Setor Responsável</label>
                      <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black font-bold text-slate-800" 
                        value={formData.setorResponsavel} onChange={e => setFormData({...formData, setorResponsavel: e.target.value})} />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Descrição Breve do Serviço</label>
                      <textarea required rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black text-sm font-medium resize-none"
                        value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} />
                    </div>

                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Requisitos e Documentos (Um por linha)</label>
                      <textarea required rows={5} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black text-xs font-medium"
                        value={formData.requisitos} onChange={e => setFormData({...formData, requisitos: e.target.value})} />
                    </div>

                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Etapas do Processo (Passo a passo)</label>
                      <textarea required rows={5} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black text-xs font-medium"
                        value={formData.etapas} onChange={e => setFormData({...formData, etapas: e.target.value})} />
                    </div>

                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Prazo de Conclusão / Entrega</label>
                      <input required type="text" placeholder="Ex: 15 dias úteis" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" 
                        value={formData.prazoMaximo} onChange={e => setFormData({...formData, prazoMaximo: e.target.value})} />
                    </div>

                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Forma de Prestação</label>
                      <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        value={formData.formaPrestacao} onChange={e => setFormData({...formData, formaPrestacao: e.target.value as any})}>
                        <option value="PRESENCIAL">Presencial</option>
                        <option value="ONLINE">Online</option>
                        <option value="HIBRIDO">Híbrido</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Canais de Manifestação (Links de Ouvidoria / Telefones)</label>
                      <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black font-medium text-xs" 
                        value={formData.canaisManifestacao} onChange={e => setFormData({...formData, canaisManifestacao: e.target.value})} />
                    </div>

                    <div className="col-span-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Status no Portal</label>
                       <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                         value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                         <option value="ATIVO">Ativo (Público)</option>
                         <option value="INATIVO">Inativo (Oculto)</option>
                       </select>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2.5 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Cancelar</button>
                  <button type="submit" disabled={saving} className="flex items-center px-8 py-2.5 bg-black text-white text-[10px] font-black uppercase rounded-xl shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50">
                    {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                    {modalMode === 'edit' ? 'Salvar Alterações' : 'Criar Serviço'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}