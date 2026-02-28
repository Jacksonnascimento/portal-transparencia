'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, ChevronRight, HelpCircle, ChevronDown, Search } from 'lucide-react';
import api from '../../services/api'; 

interface FAQ {
  id: number;
  pergunta: string;
  resposta: string;
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    api.get('/portal/faqs')
      .then(res => {
        // TRAVA DE SEGURANÇA: Verifica o formato que o Java devolveu
        if (Array.isArray(res.data)) {
          // Se for uma lista direta
          setFaqs(res.data);
        } else if (res.data && Array.isArray(res.data.content)) {
          // Se o Spring Boot estiver retornando paginado (Page<Faq>)
          setFaqs(res.data.content);
        } else {
          // Se vier nulo ou formato desconhecido
          setFaqs([]);
        }
      })
      .catch(err => {
        console.error("Erro ao carregar FAQ da API:", err);
        setErro(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleFaq = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  // TRAVA DE SEGURANÇA 2: Garante que "faqs" é um array antes do .filter()
  const listaFaqs = Array.isArray(faqs) ? faqs : [];
  
  const faqsFiltradas = listaFaqs.filter(faq => 
    (faq.pergunta || '').toLowerCase().includes(busca.toLowerCase()) || 
    (faq.resposta || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans animate-in fade-in duration-500">
      
      {/* 1. BREADCRUMB */}
      <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1">
          <Home size={12} /> Início
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600">Perguntas Frequentes</span>
      </nav>

      {/* 2. CABEÇALHO COM BUSCA */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm mb-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 w-full md:w-2/3">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[var(--cor-primaria-fundo)] text-[var(--cor-primaria)] p-4 rounded-2xl">
              <HelpCircle size={32} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              Perguntas Frequentes
            </h1>
          </div>
          <p className="text-slate-500 font-medium text-sm mb-8 max-w-xl">
            Tire suas dúvidas sobre o funcionamento do portal, termos técnicos e como exercer o controle social sobre as contas públicas.
          </p>

          <div className="flex items-center bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-[var(--cor-primaria)] focus-within:ring-1 focus-within:ring-[var(--cor-primaria)] transition-all max-w-md">
            <Search className="text-slate-400 ml-3 mr-2 shrink-0" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por palavra-chave..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-transparent py-2 text-slate-900 font-bold text-sm outline-none placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>
        </div>
        
        <HelpCircle className="absolute -right-10 -bottom-10 text-slate-50 opacity-50" size={250} />
      </div>

      {/* 3. LISTA DE ACORDEÕES (FAQS DA API) */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-slate-200 h-20 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : erro ? (
           <div className="text-center py-12 bg-white rounded-3xl border border-rose-200">
             <HelpCircle className="mx-auto text-rose-300 mb-4" size={48} />
             <h3 className="text-lg font-black text-rose-800 mb-2">Ops! Tivemos um problema.</h3>
             <p className="text-sm text-rose-500 font-medium">Não foi possível carregar as perguntas no momento. Tente novamente mais tarde.</p>
           </div>
        ) : faqsFiltradas.length > 0 ? (
          <div className="space-y-4">
            {faqsFiltradas.map((faq) => {
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
                  >
                    <h3 className={`font-black tracking-tight pr-4 ${isOpen ? 'text-[var(--cor-primaria)]' : 'text-slate-800'}`}>
                      {faq.pergunta}
                    </h3>
                    <div className={`p-2 rounded-full transition-transform duration-300 ${isOpen ? 'bg-[var(--cor-primaria-fundo)] text-[var(--cor-primaria)] rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                      <ChevronDown size={20} />
                    </div>
                  </button>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="p-6 pt-0 text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 mt-2">
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
              {busca ? `Não encontramos resultados para "${busca}".` : "O banco de dados ainda não possui perguntas cadastradas."}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}