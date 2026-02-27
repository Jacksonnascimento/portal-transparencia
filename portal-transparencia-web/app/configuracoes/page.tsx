'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar';
import { 
  Settings, Save, Upload, Building2, Palette, MapPin, Phone, Clock, FileText,
  AlertCircle, CheckCircle, Loader2, Globe, ExternalLink, Facebook, Instagram
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
}

// --- COMPONENTE CUSTOMIZADO: Logo Oficial do X (Antigo Twitter) ---
const XLogo = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// --- FUNÇÃO DE MÁSCARA: CNPJ (XX.XXX.XXX/XXXX-XX) ---
const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '') // Remove tudo o que não é dígito
    .replace(/^(\d{2})(\d)/, '$1.$2') // Coloca ponto entre o segundo e o terceiro dígitos
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3') // Coloca ponto entre o quinto e o sexto dígitos
    .replace(/\.(\d{3})(\d)/, '.$1/$2') // Coloca uma barra entre o oitavo e o nono dígitos
    .replace(/(\d{4})(\d)/, '$1-$2') // Coloca um hífen depois do bloco de quatro dígitos
    .substring(0, 18); // Limita o tamanho máximo
};

export default function ConfiguracoesPage() {
  const [formData, setFormData] = useState<Configuracao>({
    nomeEntidade: '',
    cnpj: '',
    urlBrasao: '',
    corPrincipal: '#0F172A',
    endereco: '',
    telefone: '',
    horarioAtendimento: '',
    siteOficial: '',
    diarioOficial: '',
    portalContribuinte: '',
    facebook: '',
    instagram: '',
    twitter: ''
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
        twitter: data.twitter || ''
      });
    } catch (err) {
      setError("Falha ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

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
      
      <main className="flex-1 p-6 overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Identidade do Portal</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Personalização e Informações Institucionais</p>
          </div>
        </header>

        {(error || success) && (
          <div className={`mb-6 p-4 rounded-xl flex items-center border animate-in fade-in duration-300 ${
            error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            {error ? <AlertCircle className="mr-2" size={20} /> : <CheckCircle className="mr-2" size={20} />}
            {error || success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
          
          {/* PAINEL ESQUERDO: Identidade Visual */}
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
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PAINEL DIREITO: Formulário de Dados */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
              
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
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" 
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Telefone / Ouvidoria</label>
                      <Phone className="absolute left-3 top-[26px] text-slate-400" size={14} />
                      <input type="text" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" />
                    </div>
                    <div className="relative">
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Horário de Atendimento</label>
                      <Clock className="absolute left-3 top-[26px] text-slate-400" size={14} />
                      <input type="text" value={formData.horarioAtendimento} onChange={e => setFormData({...formData, horarioAtendimento: e.target.value})} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black" />
                    </div>
                  </div>
                </div>
              </section>

              {/* SEÇÃO: LINKS OFICIAIS */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-t pt-8">
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

              {/* SEÇÃO: REDES SOCIAIS */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-t pt-8">
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

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button type="submit" disabled={saving} className="flex items-center px-8 py-3 bg-black text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50">
                  {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}