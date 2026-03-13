// portal-front/app/divida-ativa/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Search, FileText, AlertCircle, ArrowLeft, 
  Users, ChevronRight, Home, Download, Printer
} from 'lucide-react';
import Link from 'next/link';
import api from '../../services/api';

interface DividaAtiva {
  id: number;
  nomeDevedor: string;
  cpfCnpj: string;
  tipoDivida: string;
  anoInscricao: number;
  valorTotalDivida: number;
}

export default function DividaAtivaPage() {
  const [dividas, setDividas] = useState<DividaAtiva[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // --- NOVOS ESTADOS DE PAGINAÇÃO ---
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);

  // Define o ano corrente dinamicamente
  const anoCorrente = new Date().getFullYear().toString();

  const [filtros, setFiltros] = useState({
    nome: '',
    ano: anoCorrente, // ALTERAÇÃO: Inicia com o ano corrente por padrão
    tipo: ''
  });

  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros);
  const anos = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

  const buscarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtros.nome) params.append('nome', filtros.nome);
      if (filtros.ano) params.append('ano', filtros.ano);
      if (filtros.tipo) params.append('tipoDivida', filtros.tipo); 
      
      // --- APLICAÇÃO DA PAGINAÇÃO DINÂMICA ---
      params.append('page', paginaAtual.toString());
      params.append('size', '100'); 
      params.append('sort', 'anoInscricao,desc');

      const response = await api.get(`/portal/receitas/divida-ativa?${params.toString()}`);

      let dadosRecebidos: DividaAtiva[] = [];
      let total = 0;
      let paginasTotaisApi = 0;

      // Tratamento robusto e flexível da resposta do backend
      if (response.data && Array.isArray(response.data.content)) {
        dadosRecebidos = response.data.content;
        total = response.data.totalElements || dadosRecebidos.length;
        paginasTotaisApi = response.data.totalPages || 0;
      } else if (Array.isArray(response.data)) {
        dadosRecebidos = response.data;
        total = dadosRecebidos.length;
        paginasTotaisApi = Math.ceil(total / 100); 
      }

      setDividas(dadosRecebidos);
      setTotalRegistros(total);
      setTotalPaginas(paginasTotaisApi); // Atualiza o state
      setFiltrosAplicados(filtros);

    } catch (err) {
      console.error("Erro na busca de dívida ativa:", err);
      setError("Não foi possível conectar à API de Transparência.");
    } finally {
      setLoading(false);
    }
  }, [filtros, paginaAtual]); // Inclui paginaAtual nas dependências

  // Dispara a busca quando a página mudar
  useEffect(() => {
    buscarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaAtual]); 

  // Reseta para a página 0 e busca
  const handlePesquisar = () => {
    if (paginaAtual === 0) {
      buscarDados();
    } else {
      setPaginaAtual(0); 
    }
  };

  const handleExport = async (formato: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.append('formato', formato);
      if (filtrosAplicados.nome) params.append('nome', filtrosAplicados.nome);
      if (filtrosAplicados.ano) params.append('ano', filtrosAplicados.ano);
      if (filtrosAplicados.tipo) params.append('tipoDivida', filtrosAplicados.tipo);

      const response = await api.get(`/portal/receitas/divida-ativa/exportar?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `divida_ativa_${filtrosAplicados.ano || 'geral'}.${formato}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(`Erro ao exportar ${formato}:`, err);
      alert(`Erro ao gerar o arquivo ${formato.toUpperCase()}. Verifique se o backend tem a rota de exportação.`);
    } finally {
      setIsExporting(false);
    }
  };

  const formatMoney = (val: number | undefined) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const mascararDocumento = (doc: string) => {
    if (!doc) return '---';
    const limpo = doc.replace(/\D/g, '');
    if (limpo.length === 11) return `${limpo.substring(0, 3)}.***.***-${limpo.substring(9, 11)}`;
    if (limpo.length === 14) return `${limpo.substring(0, 2)}.***.***/****-${limpo.substring(12, 14)}`;
    return '***'; 
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-slate-50 min-h-screen relative font-sans">
      
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">
        <Link href="/" className="hover:text-[var(--cor-primaria)] transition-colors flex items-center gap-1">
          <Home size={12} /> Início
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <Link href="/receitas" className="hover:text-[var(--cor-primaria)] transition-colors">
          Receitas
        </Link>
        <ChevronRight size={12} className="opacity-50" />
        <span className="text-slate-600">Dívida Ativa</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <button onClick={() => window.history.back()} className="flex items-center text-slate-400 hover:text-rose-600 mb-2 transition-all font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={14} className="mr-1.5" /> Voltar para Receitas
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
            <Users className="text-rose-600" size={32} /> Dívida Ativa
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Relação de pessoas físicas e jurídicas inscritas em dívida com o município.</p>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => handleExport('pdf')} disabled={isExporting} className="bg-white p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:shadow-md transition-all disabled:opacity-50">
            <Printer size={18} className={isExporting ? "animate-pulse" : ""} />
          </button>
          <button onClick={() => handleExport('csv')} disabled={isExporting} className="bg-white p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:shadow-md transition-all disabled:opacity-50">
            <Download size={18} className={isExporting ? "animate-pulse" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl mb-8 flex gap-3">
        <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
        <p className="text-xs text-rose-700 font-medium leading-relaxed">
          <strong>Aviso LGPD/CTN:</strong> A divulgação do nome dos devedores não configura violação de sigilo fiscal (Art. 198, § 3º, II, do CTN) e atende ao Princípio da Transparência Pública.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <FilterBox label="Nome do Devedor">
            <input type="text" placeholder="Digite o nome..." value={filtros.nome} onChange={(e) => setFiltros({...filtros, nome: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" />
          </FilterBox>
          <FilterBox label="Ano de Inscrição">
            <select value={filtros.ano} onChange={(e) => setFiltros({...filtros, ano: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none cursor-pointer">
              {/* ALTERAÇÃO: Removida a opção "Todos os anos". Apenas mapeamos os anos disponíveis */}
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </FilterBox>
          <FilterBox label="Tipo de Dívida">
             <input 
               type="text" 
               placeholder="Ex: IPTU, Multa, Taxas..." 
               value={filtros.tipo} 
               onChange={(e) => setFiltros({...filtros, tipo: e.target.value})} 
               className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none placeholder:text-slate-300" 
             />
          </FilterBox>
          <button onClick={handlePesquisar} className="bg-rose-600 text-white h-[46px] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-colors shadow-md flex items-center justify-center gap-2">
            <Search size={16} /> Pesquisar
          </button>
        </div>
      </div>

      <div className="mb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
        {totalRegistros} {totalRegistros === 1 ? 'registro encontrado' : 'registros encontrados'}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th scope="col" className="px-6 py-4">Nome do Devedor</th>
                <th scope="col" className="px-6 py-4">CPF / CNPJ</th>
                <th scope="col" className="px-6 py-4">Tipo / Ano</th>
                <th scope="col" className="px-6 py-4 text-right">Valor Inscrito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="py-16 text-center font-bold text-slate-400 animate-pulse text-sm uppercase tracking-widest">Carregando base de dados...</td></tr>
              ) : error ? (
                <tr><td colSpan={4} className="py-12 text-center text-rose-500 text-sm font-bold">{error}</td></tr>
              ) : dividas.map((item, i) => (
                <tr key={item.id || i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-xs font-black text-slate-800 uppercase truncate max-w-[300px]" title={item.nomeDevedor}>{item.nomeDevedor}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-500 text-xs whitespace-nowrap">
                    {mascararDocumento(item.cpfCnpj)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                      <FileText size={10} /> {item.tipoDivida || 'Diversos'}
                    </span>
                    <div className="text-[10px] text-slate-400 font-bold mt-1">Inscrito em: {item.anoInscricao}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-rose-600 text-sm whitespace-nowrap bg-rose-50/30">
                    {formatMoney(item.valorTotalDivida)}
                  </td>
                </tr>
              ))}
              {!loading && !error && dividas.length === 0 && (
                 <tr><td colSpan={4} className="py-12 text-center text-slate-500 text-sm">Nenhum devedor encontrado no ano selecionado. Verifique os filtros de pesquisa.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- RODAPÉ DE PAGINAÇÃO --- */}
        {!loading && dividas.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Página {paginaAtual + 1} de {totalPaginas || 1}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPaginaAtual(p => Math.max(0, p - 1))}
                disabled={paginaAtual === 0 || loading}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 transition-colors shadow-sm"
              >
                Anterior
              </button>
              <button 
                onClick={() => setPaginaAtual(p => p + 1)}
                disabled={paginaAtual >= totalPaginas - 1 || loading}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 transition-colors shadow-sm"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterBox({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex flex-col focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500 transition-colors">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</span>
      {children}
    </div>
  );
}