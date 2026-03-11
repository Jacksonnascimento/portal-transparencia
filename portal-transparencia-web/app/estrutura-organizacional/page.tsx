'use client';

import { useEffect, useState, useCallback, ChangeEvent } from 'react';
import { createPortal } from 'react-dom'; 
import api from '@/services/api'; 
import { estruturaService, EstruturaOrganizacional, FiltrosEstrutura } from '@/services/estruturaService';
import { Sidebar } from '@/components/Sidebar'; 
import { 
  Filter, AlertCircle, X, Eye, Plus, Edit, Trash2, 
  Building2, User, MapPin, Clock, Phone, Mail, Link as LinkIcon,
  Download, FileText, CheckCircle, Search, Camera, Loader2, Paperclip
} from 'lucide-react';

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  if (!mounted) return null;
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null; 
  return createPortal(children, modalRoot);
};

const getDownloadUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const cleanApiUrl = apiUrl.replace(/\/api\/v1\/?$/, "");
  let caminhoCorrigido = path;
  if (caminhoCorrigido.startsWith("/api/v1/arquivos/")) {
    caminhoCorrigido = caminhoCorrigido.replace("/api/v1/arquivos/", "/api/v1/portal/arquivos/");
  }
  return `${cleanApiUrl}${caminhoCorrigido}`;
};

export default function EstruturaOrganizacionalPage() {
  const [estruturas, setEstruturas] = useState<EstruturaOrganizacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fazendoUpload, setFazendoUpload] = useState(false);

  // Modais
  const [selectedOrgao, setSelectedOrgao] = useState<EstruturaOrganizacional | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosEstrutura>({
    nomeOrgao: '', sigla: '', nomeDirigente: '', cargoDirigente: ''
  });

  const [formData, setFormData] = useState<EstruturaOrganizacional>({
    nomeOrgao: "", sigla: "", nomeDirigente: "", cargoDirigente: "",
    horarioAtendimento: "", enderecoCompleto: "", telefoneContato: "",
    emailInstitucional: "", linkCurriculo: "", urlFotoDirigente: ""
  });

  const fetchEstruturas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await estruturaService.listarTodas(filtros);
      setEstruturas(response);
    } catch (err) {
      setError("Falha ao sincronizar dados com o servidor.");
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => { fetchEstruturas(); }, [fetchEstruturas]);

  const handleFotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataForm = new FormData();
    dataForm.append("file", file);
    setFazendoUpload(true);
    try {
      // ATUALIZADO AQUI: Passando o parâmetro subpasta=dirigentes na URL
      const { data } = await api.post('/portal/arquivos/upload?subpasta=dirigentes', dataForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, urlFotoDirigente: data.url }));
    } catch (err) {
      setError("Erro ao subir imagem.");
    } finally {
      setFazendoUpload(false);
      e.target.value = '';
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === 'edit' && formData.id) {
        await estruturaService.atualizar(formData.id, formData);
      } else {
        await estruturaService.criar(formData);
      }
      setIsFormOpen(false);
      fetchEstruturas();
    } catch (error) {
      setError("Erro ao salvar os dados.");
    } finally {
      setSaving(false);
    }
  };

  const handleExcluir = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja realmente excluir? A foto antiga será removida do disco.")) {
      try {
        await estruturaService.excluir(id);
        fetchEstruturas();
      } catch (error) {
        setError("Erro ao excluir o registro.");
      }
    }
  };

  const openForm = (orgao?: EstruturaOrganizacional, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (orgao) {
      setFormData(orgao);
      setModalMode('edit');
    } else {
      setFormData({ 
        nomeOrgao: "", sigla: "", nomeDirigente: "", cargoDirigente: "", 
        horarioAtendimento: "", enderecoCompleto: "", telefoneContato: "", 
        emailInstitucional: "", linkCurriculo: "", urlFotoDirigente: "" 
      });
      setModalMode('create');
    }
    setIsFormOpen(true);
  };

  const limparFiltros = () => {
    setFiltros({ nomeOrgao: '', sigla: '', nomeDirigente: '', cargoDirigente: '' });
    fetchEstruturas();
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto relative z-0">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Órgãos e Dirigentes</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Horizon AJ • Gestão de Transparência</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => estruturaService.exportarCsv(filtros)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"><Download size={14} /> Exportar (.CSV)</button>
            <button onClick={() => { setExportingPdf(true); estruturaService.exportarPdf(filtros).finally(() => setExportingPdf(false)); }} disabled={exportingPdf} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-red-700 hover:bg-red-50 transition-all shadow-sm">
              <FileText size={14} className="text-red-600" /> {exportingPdf ? 'Gerando...' : 'Exportar (.PDF)'}
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition-all ${showFilters ? 'bg-black text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}><Filter size={14} /> {showFilters ? 'Fechar Filtros' : 'Filtrar Dados'}</button>
            <button onClick={() => openForm()} className="px-6 py-2 bg-black text-white font-bold rounded-xl text-xs uppercase flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg ml-2"><Plus size={16} /> Novo Órgão</button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-200 animate-in shake duration-300">
            <AlertCircle className="mr-2" size={20} /> {error}
          </div>
        )}

        {showFilters && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in slide-in-from-top-2 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Search size={14} className="text-blue-600" /> Parâmetros de Busca
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Órgão / Secretaria</label>
                  <input type="text" placeholder="Ex: Saúde..." value={filtros.nomeOrgao} onChange={(e) => setFiltros({...filtros, nomeOrgao: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Dirigente</label>
                  <input type="text" placeholder="Ex: João..." value={filtros.nomeDirigente} onChange={(e) => setFiltros({...filtros, nomeDirigente: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm" />
                </div>
                <div className="flex gap-2">
                  <button onClick={fetchEstruturas} className="flex-1 bg-slate-900 text-white font-bold py-2 rounded-lg text-xs uppercase hover:bg-black transition-all">Buscar</button>
                  <button onClick={limparFiltros} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"><X size={16}/></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABELA - HEADER PRETO (PADRÃO IMAGENS 1 E 2) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Órgão / Secretaria</th>
                  <th className="px-6 py-4">Dirigente</th>
                  <th className="px-6 py-4">Cargo</th>
                  <th className="px-6 py-4">Telefone</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                   [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-6 bg-slate-50/20"></td></tr>)
                ) : estruturas.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum órgão encontrado.</td></tr>
                ) : estruturas.map((item) => (
                  <tr key={item.id} onClick={() => setSelectedOrgao(item)} className="hover:bg-slate-50 transition-colors text-xs group cursor-pointer">
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {item.nomeOrgao} {item.sigla && <span className="text-slate-400 font-normal ml-1">({item.sigla})</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.urlFotoDirigente ? (
                          <img src={getDownloadUrl(item.urlFotoDirigente)} alt={item.nomeDirigente} className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400"><User size={12} /></div>
                        )}
                        <span className="text-slate-600 font-semibold">{item.nomeDirigente}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{item.cargoDirigente}</td>
                    <td className="px-6 py-4 text-slate-500 font-bold">{item.telefoneContato || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedOrgao(item); }} className="p-1.5 text-slate-300 hover:text-blue-600 transition-all rounded-md" title="Ver Detalhes"><Eye size={18} /></button>
                        <button onClick={(e) => openForm(item, e)} className="p-1.5 text-slate-300 hover:text-emerald-600 transition-all rounded-md" title="Editar"><Edit size={18} /></button>
                        <button onClick={(e) => item.id && handleExcluir(item.id, e)} className="p-1.5 text-slate-300 hover:text-red-600 transition-all rounded-md" title="Excluir"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL DETALHES - CONFORME IMAGE_240EB0.PNG */}
      {selectedOrgao && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-start flex-shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Building2 size={20} className="text-blue-600" /> Detalhamento da Estrutura
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500 font-semibold uppercase">
                      {selectedOrgao.nomeOrgao} {selectedOrgao.sigla && `(${selectedOrgao.sigla})`}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedOrgao(null)} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"><X size={24} /></button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-8 bg-white text-slate-700">
                <div className="flex items-center gap-4 p-5 bg-blue-50/50 border border-blue-100 rounded-xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-5 pointer-events-none"><Building2 size={150} className="-mr-10 -mt-10" /></div>
                  {selectedOrgao.urlFotoDirigente ? (
                    <img src={getDownloadUrl(selectedOrgao.urlFotoDirigente)} alt={selectedOrgao.nomeDirigente} className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-md z-10" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-blue-100 border-4 border-white shadow-sm text-blue-600 flex items-center justify-center z-10"><User size={24} /></div>
                  )}
                  <div className="z-10">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">Dirigente Responsável</span>
                    <h4 className="text-lg font-black text-slate-800 leading-none">{selectedOrgao.nomeDirigente}</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-wide">{selectedOrgao.cargoDirigente}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Contatos Oficiais</h4>
                    <div><span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 tracking-widest"><Phone size={12}/> Telefone</span><p className="font-semibold text-sm">{selectedOrgao.telefoneContato || 'Não informado'}</p></div>
                    <div><span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 tracking-widest"><Mail size={12}/> E-mail Institucional</span><p className="font-semibold text-sm">{selectedOrgao.emailInstitucional || 'Não informado'}</p></div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Localização e Atendimento</h4>
                    <div><span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 tracking-widest"><Clock size={12}/> Horário</span><p className="font-semibold text-sm">{selectedOrgao.horarioAtendimento || 'Não informado'}</p></div>
                    <div><span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 tracking-widest"><MapPin size={12}/> Endereço</span><p className="font-semibold text-sm leading-relaxed">{selectedOrgao.enderecoCompleto || 'Não informado'}</p></div>
                  </div>
                </div>

                {selectedOrgao.linkCurriculo && (
                  <div className="border-t border-slate-100 pt-8">
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-center justify-between shadow-sm">
                      <div>
                        <span className="text-[10px] font-bold text-yellow-600 uppercase block mb-1">Transparência</span>
                        <p className="font-bold text-yellow-900 text-sm">Currículo Profissional do Dirigente</p>
                      </div>
                      <a href={selectedOrgao.linkCurriculo} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-all text-xs uppercase shadow-sm">Abrir Currículo</a>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <CheckCircle size={12} className="text-green-500" /> Auditoria Ativa
                </span>
                <button onClick={() => setSelectedOrgao(null)} className="px-8 py-2 bg-black hover:bg-slate-800 text-white font-bold rounded-lg transition-all text-xs uppercase shadow-lg">Fechar</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL FORMULÁRIO - CONFORME IMAGE_240E78.PNG */}
      {isFormOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Edit size={20} className="text-emerald-600" /> {modalMode === 'edit' ? 'Editar Órgão / Secretaria' : 'Cadastrar Novo Órgão'}
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all"><X size={24} /></button>
              </header>
              
              <form onSubmit={handleSalvar} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-8 overflow-y-auto space-y-6">
                  
                  {/* Bloco de Upload da Foto Oficial */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex items-center gap-6">
                     <div className="relative shrink-0">
                       {formData.urlFotoDirigente ? (
                          <img src={getDownloadUrl(formData.urlFotoDirigente)} alt="Preview" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
                       ) : (
                          <div className="w-20 h-20 rounded-full bg-slate-200 border-4 border-white shadow-sm flex items-center justify-center text-slate-400"><User size={32} /></div>
                       )}
                       {fazendoUpload && <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center"><Loader2 size={24} className="animate-spin text-black" /></div>}
                     </div>
                     <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Foto Oficial do Dirigente</label>
                        <div className="flex items-center gap-3">
                          <label className={`flex items-center gap-2 px-4 py-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-all ${fazendoUpload ? 'opacity-50' : ''}`}>
                            <Camera size={14} /> {fazendoUpload ? "Enviando..." : "Selecionar Foto"}
                            <input type="file" className="hidden" accept="image/*" onChange={handleFotoUpload} />
                          </label>
                          {formData.urlFotoDirigente && (
                            <button type="button" onClick={() => setFormData(p => ({...p, urlFotoDirigente: ""}))} className="text-[10px] font-black text-red-500 uppercase hover:underline">Remover Imagem</button>
                          )}
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Nome do Órgão / Secretaria *</label>
                      <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black font-bold text-slate-800" 
                        value={formData.nomeOrgao} onChange={e => setFormData({...formData, nomeOrgao: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Sigla</label>
                      <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black font-bold text-slate-800 uppercase" 
                        value={formData.sigla} onChange={e => setFormData({...formData, sigla: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Nome do Dirigente *</label>
                      <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black font-bold text-slate-800" 
                        value={formData.nomeDirigente} onChange={e => setFormData({...formData, nomeDirigente: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Cargo do Dirigente *</label>
                      <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black font-bold text-slate-800" 
                        value={formData.cargoDirigente} onChange={e => setFormData({...formData, cargoDirigente: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Horário de Atendimento</label>
                      <input type="text" placeholder="Ex: Seg a Sex, 08h às 14h" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black text-sm" 
                        value={formData.horarioAtendimento} onChange={e => setFormData({...formData, horarioAtendimento: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Telefone de Contato</label>
                      <input type="text" placeholder="(00) 0000-0000" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black text-sm font-bold" 
                        value={formData.telefoneContato} onChange={e => setFormData({...formData, telefoneContato: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">E-mail Institucional</label>
                      <input type="email" placeholder="contato@prefeitura.gov.br" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black text-sm lowercase" 
                        value={formData.emailInstitucional} onChange={e => setFormData({...formData, emailInstitucional: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1 flex items-center gap-1 tracking-widest">
                        <LinkIcon size={12}/> Link do Currículo 
                      </label>
                      <input type="url" placeholder="https://..." className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-black text-sm font-medium" 
                        value={formData.linkCurriculo} onChange={e => setFormData({...formData, linkCurriculo: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Endereço Completo</label>
                      <input type="text" placeholder="Rua, Número, Bairro, CEP..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black text-sm font-medium" 
                        value={formData.enderecoCompleto} onChange={e => setFormData({...formData, enderecoCompleto: e.target.value})} />
                    </div>
                  </div>

                </div>

                <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2.5 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Cancelar</button>
                  <button type="submit" disabled={saving || fazendoUpload} className="flex items-center px-8 py-2.5 bg-black text-white text-[10px] font-black uppercase rounded-xl shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 gap-2">
                    {saving ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>}
                    {saving ? 'Gravando...' : 'Salvar Dados'}
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