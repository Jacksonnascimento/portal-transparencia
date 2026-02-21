'use client';

import { useEffect, useState } from 'react';
import { Save, Upload, Building2, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { configService } from '../../../services/configService';

export default function ConfigPage() {
  const [formData, setFormData] = useState({
    nomeEnte: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    emailContato: '',
    siteOficial: ''
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Carregar dados atuais
  useEffect(() => {
    configService.getConfigs().then(data => setFormData(data));
  }, []);

  // Salvar textos
  const handleSave = async () => {
    setLoading(true);
    try {
      await configService.updateConfigs(formData);
      setMsg('Configurações atualizadas com sucesso!');
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Upload da Logo/Brasão
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLoading(true);
      await configService.uploadBrasao(e.target.files[0]);
      window.location.reload(); // Recarrega para atualizar a logo no site todo
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
        <Building2 className="text-emerald-600" /> Configurações do Portal
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Upload do Brasão */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Brasão Oficial</span>
          <div className="w-40 h-40 bg-slate-50 rounded-full border-4 border-emerald-50 flex items-center justify-center overflow-hidden mb-4">
            <img 
              src={configService.getBrasaoUrl()} 
              alt="Brasão" 
              className="max-w-[80%] max-h-[80%] object-contain"
              onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Sem+Brasão')}
            />
          </div>
          <label className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all flex items-center gap-2">
            <Upload size={14} /> Alterar Brasão
            <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
          </label>
        </div>

        {/* Lado Direito: Formulário de Dados */}
        <div className="md:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
          <InputGroup icon={<Building2 size={16}/>} label="Nome da Prefeitura/Ente" value={formData.nomeEnte} onChange={(v) => setFormData({...formData, nomeEnte: v})} />
          <div className="grid grid-cols-2 gap-4">
            <InputGroup icon={<Globe size={16}/>} label="CNPJ" value={formData.cnpj} onChange={(v) => setFormData({...formData, cnpj: v})} />
            <InputGroup icon={<Phone size={16}/>} label="Telefone" value={formData.telefone} onChange={(v) => setFormData({...formData, telefone: v})} />
          </div>
          <InputGroup icon={<Mail size={16}/>} label="E-mail de Contato" value={formData.emailContato} onChange={(v) => setFormData({...formData, emailContato: v})} />
          <InputGroup icon={<MapPin size={16}/>} label="Endereço Sede" value={formData.endereco} onChange={(v) => setFormData({...formData, endereco: v})} />
          
          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-emerald-100"
          >
            <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          {msg && <p className="text-center text-emerald-600 font-bold text-xs animate-pulse">{msg}</p>}
        </div>
      </div>
    </div>
  );
}

function InputGroup({ icon, label, value, onChange }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-3.5 text-slate-300">{icon}</div>
        <input 
          type="text" 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>
    </div>
  );
}