'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Home, ChevronRight, HelpCircle, ChevronDown, Search, ChevronLeft, Loader2 } from 'lucide-react';
import api from '../../services/api'; 

interface FAQ {
  id: number;
  pergunta: string;
  resposta: string;
  ordem: number;
}

interface PageResponse {
  content: FAQ[];
  totalPages: number;
  totalElements: number;
  number: number;
  first: boolean;
  last: boolean;
}

export default function FaqPage() {
  const [data, setData] = useState<PageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [buscaAtiva, setBuscaAtiva] = useState(''); // Estado para disparar a busca apenas no Submit
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);
  const [erro, setErro] = useState(false);

  const fetchFaqs = useCallback(async (pageNumber: number, busca: string) => {
    setLoading(true);
    setErro(false);
    try {
      const response = await api.get('/portal/faqs', {
        params: {
          page: pageNumber,
          size: 10,
          busca: busca || undefined
        }
      });
      setData(response.data);
    } catch (err) {
      console.error("Erro ao carregar FAQ da API:", err);
      setErro(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Dispara a busca inicial e a cada mudança de página ou termo pesquisado
  useEffect(() => {
    fetchFaqs(page, buscaAtiva);
  }, [page, buscaAtiva, fetchFaqs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0); // Reseta a página ao fazer nova busca
    setBuscaAtiva(termoBusca);
  };

  const toggleFaq = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  const faqs = data?.content || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans animate-in fade-in duration-500">
      
      {/* 1. BREADCRUMB */}
      <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1">
          <Home size={12} /> Início
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600">Perguntas Frequentes</span>
      </nav>

      {/* 2. CABEÇALHO COM BUSCA CENTRALIZADO */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm mb-10 relative overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="bg-[var(--cor-primaria-fundo)] text-[var(--cor-primaria)] p-4 rounded-2xl">
              <HelpCircle size={32} aria-hidden="true" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              Perguntas Frequentes
            </h1>
          </div>
          <p className="text-slate-500 font-medium text-sm mb-8 max-w-xl mx-auto">
            Tire suas dúvidas sobre o funcionamento do portal, termos técnicos e como exercer o controle social sobre as contas públicas.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full max-w-lg mx-auto">
            <div className="flex w-full items-center bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-[var(--cor-primaria)] focus-within:ring-1 focus-within:ring-[var(--cor-primaria)] transition-all">
              <Search className="text-slate-400 ml-3 mr-2 shrink-0" size={20} />
              <input 
                type="text" 
                placeholder="Ex: Licitação, Receita..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full bg-transparent py-2 text-slate-900 font-bold text-sm outline-none placeholder:text-slate-400 placeholder:font-medium"
                aria-label="Buscar perguntas"
              />
            </div>
            <button 
              type="submit" 
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl text-sm hover:bg-slate-800 transition-colors shrink-0"
            >
              Buscar
            </button>
          </form>
        </div>
        
        {/* Ícones decorativos de fundo */}
        <HelpCircle className="absolute -right-10 -bottom-10 text-slate-50 opacity-50 pointer-events-none" size={250} aria-hidden="true" />
        <HelpCircle className="absolute -left-10 -top-10 text-slate-50 opacity-50 pointer-events-none" size={150} aria-hidden="true" />
      </div>

      {/* 3. LISTA DE ACORDEÕES (FAQS DA API) */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="animate-spin text-slate-300" size={40} />
            <span className="text-slate-400 font-bold text-sm animate-pulse">Carregando perguntas...</span>
          </div>
        ) : erro ? (
           <div className="text-center py-12 bg-white rounded-3xl border border-rose-200" role="alert">
             <HelpCircle className="mx-auto text-rose-300 mb-4" size={48} />
             <h3 className="text-lg font-black text-rose-800 mb-2">Ops! Tivemos um problema.</h3>
             <p className="text-sm text-rose-500 font-medium">Não foi possível carregar as perguntas no momento. Tente novamente mais tarde.</p>
           </div>
        ) : faqs.length > 0 ? (
          <div className="space-y-4">
            {faqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div 
                  key={faq.id} 
                  className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
                    isOpen ? 'border-[var(--cor-primaria)] shadow-md' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <button 
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <h3 className={`font-black tracking-tight pr-4 text-base md:text-lg ${isOpen ? 'text-[var(--cor-primaria)]' : 'text-slate-800'}`}>
                      {faq.pergunta}
                    </h3>
                    <div className={`p-2 rounded-full transition-transform duration-300 shrink-0 ${isOpen ? 'bg-[var(--cor-primaria-fundo)] text-[var(--cor-primaria)] rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                      <ChevronDown size={20} />
                    </div>
                  </button>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-[1000px] opacity-100 pb-6' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 text-sm md:text-base text-slate-600 font-medium leading-relaxed mt-2 whitespace-pre-line">
                      {faq.resposta}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
            <HelpCircle className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-black text-slate-800 mb-2">Nenhuma pergunta encontrada</h3>
            <p className="text-sm text-slate-500 font-medium">
              {buscaAtiva ? `Não encontramos resultados para "${buscaAtiva}".` : "O banco de dados ainda não possui perguntas cadastradas."}
            </p>
          </div>
        )}

        {/* 4. PAGINAÇÃO */}
        {!loading && data && data.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Página {data.number + 1} de {data.totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))} 
                disabled={data.first} 
                className="flex items-center justify-center p-3 border border-slate-200 rounded-xl bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                aria-label="Página anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))} 
                disabled={data.last} 
                className="flex items-center justify-center p-3 border border-slate-200 rounded-xl bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                aria-label="Próxima página"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}