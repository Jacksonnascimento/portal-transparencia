'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Search, Building2, User, Phone, Mail, MapPin, Clock, 
  ArrowLeft, ChevronRight, Home, Download, Printer, ExternalLink, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import api from '../../services/api';

// IMPORTAÇÃO DO SERVICE PARA RESOLVER A URL DA FOTO
import { configService } from '../../services/configService';

interface EstruturaOrganizacional {
  id: string;
  nomeOrgao: string;
  sigla: string;
  nomeDirigente: string;
  cargoDirigente: string;
  horarioAtendimento: string;
  enderecoCompleto: string;
  telefoneContato: string;
  emailInstitucional: string;
  linkCurriculo: string;
  urlFotoDirigente: string;
}

export default function EstruturaOrganizacionalPage() {
  const [estruturas, setEstruturas] = useState<EstruturaOrganizacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [filtros, setFiltros] = useState({
    nomeOrgao: '',
    sigla: '',
    nomeDirigente: '',
    cargoDirigente: ''
  });

  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros);

  const buscarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtros.nomeOrgao) params.append('nomeOrgao', filtros.nomeOrgao);
      if (filtros.sigla) params.append('sigla', filtros.sigla);
      if (filtros.nomeDirigente) params.append('nomeDirigente', filtros.nomeDirigente);
      if (filtros.cargoDirigente) params.append('cargoDirigente', filtros.cargoDirigente);

      const response = await api.get(`/portal/estrutura-organizacional?${params.toString()}`);
      setEstruturas(response.data || []);
      setFiltrosAplicados(filtros);

    } catch (err) {
      console.error("Erro na busca de estrutura organizacional:", err);
      setError("Não foi possível conectar à API de Transparência.");
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  const handlePesquisar = () => {
    buscarDados();
  };

  const handleExport = async (formato: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (filtrosAplicados.nomeOrgao) params.append('nomeOrgao', filtrosAplicados.nomeOrgao);
      if (filtrosAplicados.sigla) params.append('sigla', filtrosAplicados.sigla);
      if (filtrosAplicados.nomeDirigente) params.append('nomeDirigente', filtrosAplicados.nomeDirigente);
      if (filtrosAplicados.cargoDirigente) params.append('cargoDirigente', filtrosAplicados.cargoDirigente);

      const response = await api.get(`/portal/estrutura-organizacional/exportar/${formato}?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `estrutura_organizacional_${new Date().getTime()}.${formato}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(`Erro ao exportar ${formato}:`, err);
      alert(`Erro ao gerar o arquivo ${formato.toUpperCase()}. Verifique a disponibilidade do servidor.`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-slate-50 min-h-screen relative font-sans">
      
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1">
          <Home size={12} /> Início
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600">Institucional e Estrutura</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <button onClick={() => window.history.back()} className="flex items-center text-slate-400 hover:text-[var(--cor-primaria)] mb-2 transition-all font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={14} className="mr-1.5" /> Voltar
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <Building2 className="text-[var(--cor-primaria)]" size={32} /> Estrutura Organizacional
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Conheça as secretarias, órgãos, dirigentes e canais de atendimento ao cidadão.</p>
        </div>
        
        <div className="flex gap-2 shrink-0">
          <button onClick={() => handleExport('pdf')} disabled={isExporting} className="bg-white p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-[var(--cor-primaria)] hover:shadow-md transition-all disabled:opacity-50" title="Exportar para PDF">
            <Printer size={18} className={isExporting ? "animate-pulse" : ""} />
          </button>
          <button onClick={() => handleExport('csv')} disabled={isExporting} className="bg-white p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-[var(--cor-primaria)] hover:shadow-md transition-all disabled:opacity-50" title="Exportar para CSV">
            <Download size={18} className={isExporting ? "animate-pulse" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <FilterBox label="Nome do Órgão">
            <input type="text" placeholder="Ex: Secretaria de Saúde..." value={filtros.nomeOrgao} onChange={(e) => setFiltros({...filtros, nomeOrgao: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" />
          </FilterBox>
          <FilterBox label="Sigla">
            <input type="text" placeholder="Ex: SESAU..." value={filtros.sigla} onChange={(e) => setFiltros({...filtros, sigla: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300 uppercase" />
          </FilterBox>
          <FilterBox label="Nome do Dirigente">
            <input type="text" placeholder="Ex: João da Silva..." value={filtros.nomeDirigente} onChange={(e) => setFiltros({...filtros, nomeDirigente: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" />
          </FilterBox>
          <FilterBox label="Cargo do Dirigente">
            <input type="text" placeholder="Ex: Secretário..." value={filtros.cargoDirigente} onChange={(e) => setFiltros({...filtros, cargoDirigente: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" />
          </FilterBox>
          <button onClick={handlePesquisar} className="bg-slate-900 text-white h-[46px] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[var(--cor-primaria)] transition-colors shadow-md flex items-center justify-center gap-2">
            <Search size={16} /> Buscar
          </button>
        </div>
      </div>

      <div className="mb-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">
        {estruturas.length} {estruturas.length === 1 ? 'órgão encontrado' : 'órgãos encontrados'}
      </div>

      {loading ? (
        <div className="py-16 text-center font-bold text-slate-400 animate-pulse text-sm uppercase tracking-widest">
          Carregando organograma...
        </div>
      ) : error ? (
        <div className="py-12 text-center text-rose-500 text-sm font-bold bg-rose-50 rounded-xl border border-rose-100">
          {error}
        </div>
      ) : estruturas.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
          Nenhuma estrutura organizacional encontrada com os filtros aplicados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {estruturas.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
              
              <div className="bg-slate-50 p-5 border-b border-slate-100">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase leading-tight group-hover:text-[var(--cor-primaria)] transition-colors">
                      {item.nomeOrgao}
                    </h3>
                    {item.sigla && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest">
                        {item.sigla}
                      </span>
                    )}
                  </div>
                  <Building2 size={24} className="text-slate-300 shrink-0" />
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col gap-5">
                
                <div className="flex items-center gap-4 bg-[var(--cor-primaria-fundo)]/20 p-3 rounded-xl border border-[var(--cor-primaria-fundo)]/50">
                  <div className="w-20 h-20 rounded-full bg-white border-2 border-slate-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                    {/* AQUI ESTÁ A CORREÇÃO: ENVELOPANDO COM O configService.getBrasaoUrl */}
                    {item.urlFotoDirigente ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={configService.getBrasaoUrl(item.urlFotoDirigente)} 
                        alt={`Foto de ${item.nomeDirigente}`} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.removeAttribute('style'); }}
                      />
                    ) : null}
                    {/* Fallback caso a imagem dê erro ou não exista */}
                    <User size={20} className="text-slate-300" style={{ display: item.urlFotoDirigente ? 'none' : 'block' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-[var(--cor-primaria)] uppercase tracking-widest mb-0.5 truncate">
                      {item.cargoDirigente || 'Dirigente'}
                    </p>
                    <p className="text-xs font-bold text-slate-800 truncate" title={item.nomeDirigente}>
                      {item.nomeDirigente || 'Não informado'}
                    </p>
                    {item.linkCurriculo && (
                      <a 
                        href={item.linkCurriculo} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-slate-500 hover:text-[var(--cor-primaria)] transition-colors"
                      >
                        <ExternalLink size={10} /> Ver Currículo
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mt-auto">
                  <ContactInfo icon={<MapPin size={14} />} label="Endereço" value={item.enderecoCompleto} />
                  <ContactInfo icon={<Clock size={14} />} label="Atendimento" value={item.horarioAtendimento} />
                  <div className="grid grid-cols-2 gap-3">
                    <ContactInfo icon={<Phone size={14} />} label="Telefone" value={item.telefoneContato} />
                    <ContactInfo icon={<Mail size={14} />} label="E-mail" value={item.emailInstitucional} truncate />
                  </div>
                </div>

              </div>
              
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-center">
                 <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                   <ShieldCheck size={12} className="text-emerald-500" /> Informação Oficial
                 </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterBox({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200 flex flex-col focus-within:border-[var(--cor-primaria)] focus-within:ring-1 focus-within:ring-[var(--cor-primaria)] transition-colors">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</span>
      {children}
    </div>
  );
}

function ContactInfo({ icon, label, value, truncate = false }: { icon: React.ReactNode, label: string, value: string, truncate?: boolean }) {
  if (!value) return null;
  
  return (
    <div className="flex gap-2 items-start">
      <div className="text-slate-400 mt-0.5 shrink-0">{icon}</div>
      <div className={`min-w-0 ${truncate ? 'overflow-hidden' : ''}`}>
        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</span>
        <span className={`block text-xs font-semibold text-slate-700 leading-tight ${truncate ? 'truncate' : ''}`} title={value}>
          {value}
        </span>
      </div>
    </div>
  );
}