'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar';
import { 
  Settings, 
  Save, 
  Upload, 
  Building2, 
  Palette, 
  MapPin, 
  Phone, 
  Clock, 
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface Configuracao {
  nomeEntidade: string;
  cnpj: string;
  urlBrasao: string;
  corPrincipal: string;
  endereco: string;
  telefone: string;
  horarioAtendimento: string;
}

export default function ConfiguracoesPage() {
  const [formData, setFormData] = useState<Configuracao>({
    nomeEntidade: '',
    cnpj: '',
    urlBrasao: '',
    corPrincipal: '#0F172A',
    endereco: '',
    telefone: '',
    horarioAtendimento: ''
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
      setFormData(response.data);
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
      
      // Injeta a nova cor imediatamente na variável de ambiente do CSS da página atual
      document.documentElement.style.setProperty('--brand-color', formData.corPrincipal);
      
      // Dispara o evento para a Sidebar capturar e atualizar seu próprio estado
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

    // --- NOVA VALIDAÇÃO DE TAMANHO (Limite de 2MB) ---
    const MAX_SIZE_MB = 2;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`A imagem excede o limite. O tamanho máximo permitido é de ${MAX_SIZE_MB}MB.`);
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
      
      // Atualiza o preview forçando o reload da imagem com um timestamp
      const newBrasaoUrl = `/api/v1/portal/configuracoes/brasao?t=${Date.now()}`;
      setFormData(prev => ({ ...prev, urlBrasao: newBrasaoUrl }));

      // Dispara o evento para a Sidebar capturar e atualizar a imagem
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* --- PAINEL DE IDENTIDADE VISUAL --- */}
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

          {/* --- FORMULÁRIO DE DADOS --- */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
              
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building2 size={14} /> Dados Jurídicos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Nome da Entidade / Município</label>
                    <input 
                      type="text" 
                      required
                      value={formData.nomeEntidade}
                      onChange={e => setFormData({...formData, nomeEntidade: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">CNPJ Oficial</label>
                    <input 
                      type="text" 
                      required
                      value={formData.cnpj}
                      onChange={e => setFormData({...formData, cnpj: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black transition-all"
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
                    <input 
                      type="text" 
                      value={formData.endereco}
                      onChange={e => setFormData({...formData, endereco: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Telefone / Ouvidoria</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 text-slate-400" size={14} />
                        <input 
                          type="text" 
                          value={formData.telefone}
                          onChange={e => setFormData({...formData, telefone: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Horário de Atendimento</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-2.5 text-slate-400" size={14} />
                        <input 
                          type="text" 
                          value={formData.horarioAtendimento}
                          onChange={e => setFormData({...formData, horarioAtendimento: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-black transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex items-center px-8 py-3 bg-black text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
                >
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