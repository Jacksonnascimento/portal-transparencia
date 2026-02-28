'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar';

import { 
  Save, Upload, Building2, Palette, MapPin, Phone, Clock, FileText,
  AlertCircle, CheckCircle, Loader2, Globe, ExternalLink, Facebook, Instagram, 
  Mail, Link, ShieldCheck, Scale, Undo2, Shield
} from 'lucide-react';

interface Configuracao {
  nomeEntidade: string;
  cnpj: string;
  urlBrasao: string;
  corPrincipal: string;
  endereco: string;
  telefone: string;
  horarioAtendimento: string;
  siteOficial: string;
  diarioOficial: string;
  portalContribuinte: string;
  facebook: string;
  instagram: string;
  twitter: string;
  emailEntidade: string;
  linkOuvidoria: string;
  telefoneOuvidoria: string;
  emailOuvidoria: string;
  politicaPrivacidade: string;
  termosUso: string;
}

const XLogo = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const formatCNPJ = (value: string) => {
  return value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').substring(0, 18);
};

const formatTelefone = (value: string) => {
  if (!value) return "";
  const cleaned = value.replace(/\D/g, ''); 
  if (cleaned.length <= 10) {
    return cleaned.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '');
  } else {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3').replace(/-$/, '');
  }
};

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<'identidade' | 'juridico'>('identidade');
  const [formData, setFormData] = useState<Configuracao>({
    nomeEntidade: '', cnpj: '', urlBrasao: '', corPrincipal: '#0F172A',
    endereco: '', telefone: '', horarioAtendimento: '', siteOficial: '',
    diarioOficial: '', portalContribuinte: '', facebook: '', instagram: '',
    twitter: '', emailEntidade: '', linkOuvidoria: '', telefoneOuvidoria: '',
    emailOuvidoria: '', politicaPrivacidade: '', termosUso: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/configuracoes');
      const data = response.data;
      setFormData({
        ...data,
        siteOficial: data.siteOficial || '',
        diarioOficial: data.diarioOficial || '',
        portalContribuinte: data.portalContribuinte || '',
        facebook: data.facebook || '',
        instagram: data.instagram || '',
        twitter: data.twitter || '',
        emailEntidade: data.emailEntidade || '',
        linkOuvidoria: data.linkOuvidoria || '',
        telefoneOuvidoria: data.telefoneOuvidoria || '',
        emailOuvidoria: data.emailOuvidoria || '',
        politicaPrivacidade: data.politicaPrivacidade || '',
        termosUso: data.termosUso || ''
      });
    } catch (err) {
      setError("Falha ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.put('/configuracoes', formData);
      document.documentElement.style.setProperty('--brand-color', formData.corPrincipal);
      window.dispatchEvent(new Event('horizon:configUpdated'));
      setSuccess("Configurações salvas com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Erro ao salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE_MB = 2;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`A imagem excede o limite de ${MAX_SIZE_MB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return; 
    }

    const uploadData = new FormData();
    uploadData.append('file', file);

    setUploading(true);
    setError(null);
    try {
      await api.post('/configuracoes/brasao', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newBrasaoUrl = `/api/v1/portal/configuracoes/brasao?t=${Date.now()}`;
      setFormData(prev => ({ ...prev, urlBrasao: newBrasaoUrl }));
      window.dispatchEvent(new Event('horizon:configUpdated'));
      setSuccess("Brasão atualizado!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Erro ao fazer upload da imagem.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
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
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão do Portal</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Configurações de Identidade e Conformidade LGPD</p>
          </div>
        </header>

        {/* NAVEGAÇÃO POR ABAS */}
        <div className="flex gap-1 mb-8 bg-slate-200/50 p-1 rounded-2xl w-fit border border-slate-200 shadow-inner">
          <button 
            type="button"
            onClick={() => setActiveTab('identidade')}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'identidade' ? 'bg-white text-black shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Building2 size={14} /> Dados e Identidade
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('juridico')}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'juridico' ? 'bg-white text-black shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Scale size={14} /> Jurídico / LGPD
          </button>
        </div>

        {(error || success) && (
          <div className={`mb-6 p-4 rounded-xl flex items-center border animate-in fade-in duration-300 ${
            error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            {error ? <AlertCircle className="mr-2" size={20} /> : <CheckCircle className="mr-2" size={20} />}
            {error || success}
          </div>
        )}

        <form onSubmit={handleSave} className="pb-32">
          
          {/* ABA 1: IDENTIDADE */}
          {activeTab === 'identidade' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-left-4 duration-300">
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Palette size={14} /> Identidade Visual
                  </h3>
                  
                  <div className="flex flex-col items-center">
                    <div className="relative group w-40 h-40 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden mb-4">
                      {formData.urlBrasao ? (
                        <img 
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${formData.urlBrasao}`} 
                          alt="Brasão" 
                          className="w-full h-full object-contain p-4"
                        />
                      ) : (
                        <Building2 size={40} className="text-slate-300" />
                      )}
                      
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold"
                      >
                        {uploading ? <Loader2 className="animate-spin" /> : <Upload size={20} className="mb-1" />}
                        Alterar Brasão
                      </button>
                      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
                    </div>
                    <p className="text-[10px] text-slate-400 text-center uppercase font-bold">Resolução sugerida: 512x512px (PNG)</p>
                  </div>

                  <div className="mt-8">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Cor Principal do Portal</label>
                    <div className="flex gap-3 items-center">
                      <input 
                        type="color" 
                        value={formData.corPrincipal}
                        onChange={(e) => setFormData({...formData, corPrincipal: e.target.value})}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                      />
                      <input 
                        type="text" 
                        value={formData.corPrincipal}
                        onChange={(e) => setFormData({...formData, corPrincipal: e.target.value})}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:border-black uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Building2 size={14} /> Dados Jurídicos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Nome da Entidade / Município</label>
                        <input type="text" required value={formData.nomeEntidade} onChange={e => setFormData({...formData, nomeEntidade: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">CNPJ Oficial</label>
                        <input 
                          type="text" 
                          required 
                          value={formData.cnpj} 
                          onChange={e => setFormData({...formData, cnpj: formatCNPJ(e.target.value)})} 
                          placeholder="00.000.000/0000-00"
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black font-mono font-medium" 
                        />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <MapPin size={14} /> Localização e Contato
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Endereço Completo (Sede)</label>
                        <input type="text" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Telefone Principal</label>
                          <Phone className="absolute left-3 top-[26px] text-slate-400" size={14} />
                          <input type="text" placeholder="(00) 0000-0000" value={formData.telefone} onChange={e => setFormData({...formData, telefone: formatTelefone(e.target.value)})} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" />
                        </div>
                        <div className="relative">
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">E-mail Oficial</label>
                          <Mail className="absolute left-3 top-[26px] text-slate-400" size={14} />
                          <input type="email" value={formData.emailEntidade} onChange={e => setFormData({...formData, emailEntidade: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" placeholder="contato@municipio.gov.br" />
                        </div>
                        <div className="relative">
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Horário de Atendimento</label>
                          <Clock className="absolute left-3 top-[26px] text-slate-400" size={14} />
                          <input type="text" value={formData.horarioAtendimento} onChange={e => setFormData({...formData, horarioAtendimento: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-t border-slate-100 pt-8">
                      <AlertCircle size={14} /> Ouvidoria e Acesso à Informação (e-SIC)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Link do e-SIC / Ouvidoria</label>
                        <Link className="absolute left-3 top-[26px] text-slate-400" size={14} />
                        <input type="url" placeholder="https://" value={formData.linkOuvidoria} onChange={e => setFormData({...formData, linkOuvidoria: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" />
                      </div>
                      <div className="relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Telefone da Ouvidoria</label>
                        <Phone className="absolute left-3 top-[26px] text-slate-400" size={14} />
                        <input type="text" placeholder="(00) 0000-0000" value={formData.telefoneOuvidoria} onChange={e => setFormData({...formData, telefoneOuvidoria: formatTelefone(e.target.value)})} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" />
                      </div>
                      <div className="relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">E-mail da Ouvidoria</label>
                        <Mail className="absolute left-3 top-[26px] text-slate-400" size={14} />
                        <input type="email" placeholder="ouvidoria@" value={formData.emailOuvidoria} onChange={e => setFormData({...formData, emailOuvidoria: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-t border-slate-100 pt-8">
                      <Globe size={14} /> Links Oficiais e Serviços
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Site Institucional</label>
                          <Globe className="absolute left-3 top-[26px] text-slate-400" size={14} />
                          <input type="url" placeholder="https://" value={formData.siteOficial} onChange={e => setFormData({...formData, siteOficial: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" />
                        </div>
                        <div className="relative">
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Diário Oficial</label>
                          <FileText className="absolute left-3 top-[26px] text-slate-400" size={14} />
                          <input type="url" placeholder="https://" value={formData.diarioOficial} onChange={e => setFormData({...formData, diarioOficial: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" />
                        </div>
                        <div className="relative md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Portal do Contribuinte (Serviços)</label>
                          <ExternalLink className="absolute left-3 top-[26px] text-slate-400" size={14} />
                          <input type="url" placeholder="https://" value={formData.portalContribuinte} onChange={e => setFormData({...formData, portalContribuinte: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-t border-slate-100 pt-8">
                      <Globe size={14} /> Redes Sociais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Facebook</label>
                        <Facebook className="absolute left-3 top-[26px] text-blue-600" size={14} />
                        <input type="url" placeholder="Link do Perfil/Página" value={formData.facebook} onChange={e => setFormData({...formData, facebook: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" />
                      </div>
                      <div className="relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Instagram</label>
                        <Instagram className="absolute left-3 top-[26px] text-pink-600" size={14} />
                        <input type="url" placeholder="Link do Perfil" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" />
                      </div>
                      <div className="relative">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">X (Twitter)</label>
                        <XLogo className="absolute left-3 top-[26px] text-slate-900" size={14} />
                        <input type="url" placeholder="Link do Perfil" value={formData.twitter} onChange={e => setFormData({...formData, twitter: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          ) : (
            /* ABA 2: JURÍDICO (COM TEXTAREA NATIVO) */
            <div className="animate-in slide-in-from-right-4 duration-300">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-12">
                <section>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Shield size={24} /></div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">Política de Privacidade</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Adequação à LGPD (Aceita marcação HTML)</p>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group">
                    <textarea 
                      value={formData.politicaPrivacidade}
                      onChange={(e) => setFormData({...formData, politicaPrivacidade: e.target.value})}
                      placeholder="<p>Cole aqui o texto da Política de Privacidade...</p>"
                      className="w-full min-h-[350px] p-6 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-black focus:ring-inset text-slate-700 resize-y font-mono text-xs leading-relaxed"
                    />
                  </div>
                </section>

                <section className="pt-10 border-t border-slate-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Scale size={24} /></div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">Termos de Uso</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Responsabilidades do Usuário (Aceita marcação HTML)</p>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group">
                    <textarea 
                      value={formData.termosUso}
                      onChange={(e) => setFormData({...formData, termosUso: e.target.value})}
                      placeholder="<p>Cole aqui os Termos de Uso do portal...</p>"
                      className="w-full min-h-[350px] p-6 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-black focus:ring-inset text-slate-700 resize-y font-mono text-xs leading-relaxed"
                    />
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* BARRA FIXA PARA SALVAR DE QUALQUER ABA */}
          <div className="fixed bottom-0 right-0 left-64 bg-white/90 backdrop-blur-xl p-5 border-t border-slate-200 flex justify-end gap-3 z-50">
            <button 
              type="button" 
              onClick={fetchConfig} 
              disabled={saving || loading}
              className="px-6 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 hover:text-black transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Undo2 size={16} /> Cancelar Alterações
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="flex items-center px-8 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
              Salvar Configurações
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}