'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Home, ChevronRight, Clipboard, ChevronDown, Search, 
  Clock, FileText, ListChecks, MapPin, AlertCircle, MessageSquare, Info,
  Building
} from 'lucide-react';
import api from '../../services/api';

// Interface ajustada EXATAMENTE para espelhar a ServicoEntity do Java
// Isso garante o cumprimento integral do Art. 7º da Lei 13.460/2017 (Exigência do PNTP)
interface Servico {
  id: string; // ✅ CORRIGIDO: O Java envia um UUID (String), não number
  nome: string;
  descricao: string;
  setorResponsavel: string;   // ✅ NOVO: Exigência do Controle Interno
  requisitos: string;
  etapas: string;
  prazoMaximo: string;        // ✅ CORRIGIDO: O Java envia 'prazoMaximo', não 'prazo'
  formaPrestacao: string;
  detalhesPrestacao: string;  // ✅ NOVO: Detalhamento da forma de prestação
  canaisManifestacao: string; // ✅ NOVO: Exigência vital do PNTP (locais para manifestação)
}

export default function CartaServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  // O estado do Acordeão precisa aceitar string por causa do UUID
  const [openId, setOpenId] = useState<string | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    api.get('/portal/servicos')
      .then(res => {
        if (Array.isArray(res.data)) {
          setServicos(res.data);
        } else if (res.data && Array.isArray(res.data.content)) {
          setServicos(res.data.content);
        } else {
          setServicos([]);
        }
      })
      .catch(err => {
        console.error("Erro ao carregar Carta de Serviços:", err);
        setErro(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleServico = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const listaServicos = Array.isArray(servicos) ? servicos : [];
  
  const servicosFiltrados = listaServicos.filter(servico => 
    (servico.nome || '').toLowerCase().includes(busca.toLowerCase()) || 
    (servico.descricao || '').toLowerCase().includes(busca.toLowerCase()) ||
    (servico.setorResponsavel || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans animate-in fade-in duration-500">
      
      {/* 1. BREADCRUMB */}
      <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1">
          <Home size={12} /> Início
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600">Carta de Serviços</span>
      </nav>

      {/* 2. CABEÇALHO CENTRALIZADO */}
      <div className="bg-white p-10 md:p-14 rounded-[3rem] border border-slate-200 shadow-sm mb-10 relative overflow-hidden flex flex-col items-center text-center">
        
        {/* Ícone de fundo (Marca de água) */}
        <Clipboard className="absolute -left-10 -bottom-10 text-slate-50 opacity-50" size={300} />
        <Clipboard className="absolute -right-10 -top-10 text-slate-50 opacity-50" size={200} />

        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
          <div className="bg-[var(--cor-primaria-fundo)] text-[var(--cor-primaria)] p-5 rounded-3xl mb-6">
            <Clipboard size={40} />
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">
            Carta de Serviços
          </h1>
          
          <p className="text-slate-500 font-medium text-sm md:text-base mb-10 max-w-2xl leading-relaxed">
            Consulte a lista de serviços oferecidos pela administração municipal. Saiba os prazos, etapas, formas de acesso e os documentos necessários para cada solicitação.
          </p>

          {/* BARRA DE BUSCA CENTRALIZADA */}
          <div className="flex items-center bg-slate-50 p-2 md:p-3 rounded-3xl border border-slate-200 focus-within:border-[var(--cor-primaria)] focus-within:ring-2 focus-within:ring-[var(--cor-primaria-fundo)] transition-all w-full max-w-3xl shadow-inner">
            <Search className="text-slate-400 ml-4 mr-3 shrink-0" size={24} />
            <input 
              type="text" 
              placeholder="Qual serviço ou setor procura? (Ex: Alvará, Tributação)..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-transparent py-3 text-slate-900 font-bold text-base outline-none placeholder:text-slate-400"
            />
            <div className="bg-slate-200 text-slate-600 px-5 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hidden md:block shrink-0">
              {servicosFiltrados.length} encontrados
            </div>
          </div>
        </div>
      </div>

      {/* 3. LISTA DE SERVIÇOS (Acordeão) */}
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-slate-200 h-24 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : erro ? (
           <div className="text-center py-12 bg-white rounded-3xl border border-rose-200 shadow-sm">
             <AlertCircle className="mx-auto text-rose-300 mb-4" size={48} />
             <h3 className="text-lg font-black text-rose-800 mb-2">Ops! Tivemos um problema.</h3>
             <p className="text-sm text-rose-500 font-medium">Não foi possível carregar a Carta de Serviços no momento. Tente novamente mais tarde.</p>
           </div>
        ) : servicosFiltrados.length > 0 ? (
          <div className="space-y-4">
            {servicosFiltrados.map((servico) => {
              const isOpen = openId === servico.id;
              return (
                <div 
                  key={servico.id} 
                  className={`bg-white border rounded-3xl overflow-hidden transition-all duration-300 ${
                    isOpen ? 'border-[var(--cor-primaria)] shadow-md' : 'border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  {/* BOTÃO DO ACORDEÃO */}
                  <button 
                    onClick={() => toggleServico(servico.id)}
                    className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none group"
                  >
                    <div>
                      <h3 className={`text-xl font-black tracking-tight mb-2 ${isOpen ? 'text-[var(--cor-primaria)]' : 'text-slate-800 group-hover:text-[var(--cor-primaria)]'}`}>
                        {servico.nome}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium line-clamp-1 pr-4">
                        {servico.descricao}
                      </p>
                    </div>
                    <div className={`p-3 rounded-2xl shrink-0 transition-transform duration-300 ${isOpen ? 'bg-[var(--cor-primaria-fundo)] text-[var(--cor-primaria)] rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                      <ChevronDown size={24} />
                    </div>
                  </button>
                  
                  {/* CONTEÚDO EXPANDIDO */}
                  <div 
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="p-6 md:p-8 pt-0 border-t border-slate-100">
                      
                      <div className="bg-slate-50 p-6 rounded-2xl mb-6 mt-4">
                        <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-widest mb-2">
                          <Info size={16} className="text-[var(--cor-primaria)]" /> O que é o serviço?
                        </h4>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                          {servico.descricao}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* ✅ ADICIONADO: Setor Responsável */}
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-widest mb-3">
                            <Building size={16} className="text-slate-400" /> Setor Responsável
                          </h4>
                          <div className="text-sm text-slate-600 font-medium leading-relaxed bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                            {servico.setorResponsavel || "Setor não especificado."}
                          </div>
                        </div>

                        {/* ✅ CORRIGIDO: Agora aponta para prazoMaximo (como vem do Backend) */}
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-widest mb-3">
                            <Clock size={16} className="text-slate-400" /> Prazo Máximo
                          </h4>
                          <div className="text-sm text-slate-600 font-medium leading-relaxed bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                            {servico.prazoMaximo || "Prazo não estabelecido."}
                          </div>
                        </div>

                        {/* ✅ ADICIONADO: Forma e Detalhes da Prestação combinados */}
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-widest mb-3">
                            <MapPin size={16} className="text-slate-400" /> Forma de Prestação
                          </h4>
                          <div className="text-sm text-slate-600 font-medium leading-relaxed bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                            <span className="font-bold text-slate-800 block mb-1">{servico.formaPrestacao || "Presencial / Online"}</span>
                            <span className="text-xs">{servico.detalhesPrestacao || "Não há detalhes adicionais."}</span>
                          </div>
                        </div>

                        {/* ✅ ADICIONADO: Exigência vital do PNTP (Canais de manifestação) */}
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-widest mb-3">
                            <MessageSquare size={16} className="text-slate-400" /> Canais de Dúvidas
                          </h4>
                          <div className="text-sm text-slate-600 font-medium leading-relaxed bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                            {servico.canaisManifestacao || "Através da Ouvidoria Municipal."}
                          </div>
                        </div>

                        {/* Requisitos e Documentos */}
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-widest mb-3">
                            <FileText size={16} className="text-slate-400" /> Requisitos / Documentos
                          </h4>
                          <div className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap pl-6 border-l-2 border-slate-200">
                            {servico.requisitos || "Nenhum requisito especificado."}
                          </div>
                        </div>

                        {/* Etapas do Processo */}
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-widest mb-3">
                            <ListChecks size={16} className="text-slate-400" /> Principais Etapas
                          </h4>
                          <div className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap pl-6 border-l-2 border-slate-200">
                            {servico.etapas || "Etapas não especificadas."}
                          </div>
                        </div>

                      </div>

                      {/* Manifestação / Ouvidoria - Rodapé do card */}
                      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-rose-50 text-rose-500 p-3 rounded-full shrink-0">
                            <AlertCircle size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Avaliação e Reclamações</p>
                            <p className="text-xs text-slate-500 font-medium">Teve problemas com o serviço? Aceda à Ouvidoria.</p>
                          </div>
                        </div>
                        <Link href="/sic" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors w-full md:w-auto text-center">
                          Aceder à Ouvidoria
                        </Link>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-sm mt-8">
            <Clipboard className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-black text-slate-800 mb-2">Nenhum serviço encontrado</h3>
            <p className="text-sm text-slate-500 font-medium">
              {busca ? `Não encontrámos resultados para "${busca}".` : "A base de dados de serviços ainda está vazia."}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}