'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar'; 
import { ChevronLeft, ChevronRight, Filter, AlertCircle, X, Scale, Download } from 'lucide-react';

interface Divida {
  id: number;
  nomeDevedor: string;
  cpfCnpj: string;
  valorTotalDivida: number;
  anoInscricao: number;
  tipoDivida: string;
}

export default function DividaAtivaPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [fNome, setFNome] = useState('');
  const [fAno, setFAno] = useState('');
  const [fTipoDivida, setFTipoDivida] = useState(''); // NOVO ESTADO: Tipo de Dívida

  const fetchDividas = useCallback(async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      let params = `page=${pageNumber}&size=20&sort=anoInscricao,desc`;
      if (fNome) params += `&nome=${encodeURIComponent(fNome)}`;
      if (fAno) params += `&ano=${fAno}`;
      if (fTipoDivida) params += `&tipoDivida=${encodeURIComponent(fTipoDivida)}`; // NOVA QUERY

      const response = await api.get(`/divida-ativa?${params}`);
      setData(response.data);
      setPage(pageNumber);
    } catch (err) {
      setError("Não foi possível carregar os registros. Verifique a conexão.");
    } finally {
      setLoading(false);
    }
  }, [fNome, fAno, fTipoDivida]);

  useEffect(() => { fetchDividas(page); }, [page, fetchDividas]);

  const formatMoney = (val?: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // --- FUNÇÃO DE MÁSCARA (LGPD) ---
  const maskDocumento = (val?: string) => {
    if (!val) return "---";
    const clean = val.replace(/\D/g, '');
    
    // Máscara simplificada: preserva início e fim, oculta o meio (Ex: 123.***.***-00)
    if (clean.length === 11) {
      return `${clean.substring(0, 3)}.***.***-${clean.substring(9)}`;
    } else if (clean.length === 14) {
      return `${clean.substring(0, 2)}.***.***/****-${clean.substring(12)}`;
    }
    return val;
  };

  const handleExportCSV = () => {
    if (!data || !data.content || data.content.length === 0) return alert("Não há dados para exportar.");
    const headers = ["ID", "Ano Inscricao", "Nome Devedor", "CPF/CNPJ", "Tipo Divida", "Valor Total"];
    const rows = data.content.map((r: Divida) => [
      r.id, 
      r.anoInscricao, 
      `"${r.nomeDevedor}"`, 
      maskDocumento(r.cpfCnpj), // Exporta mascarado também para segurança
      r.tipoDivida || '', 
      r.valorTotalDivida
    ]);
    const csvContent = [headers.join(";"), ...rows.map((row: any[]) => row.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Divida_Ativa_Admin_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto relative z-0">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-black text-white rounded-lg"><Scale size={24} /></div>
             <div>
               <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão da Dívida Ativa</h2>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Dados Mascarados (Privacidade LGPD)</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="flex items-center px-4 py-2 border border-slate-200 rounded-xl shadow-sm font-bold text-xs uppercase bg-white text-slate-700 hover:text-black hover:bg-slate-50 transition-all">
              <Download size={14} className="mr-2" /> Exportar Tela (.CSV)
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center px-4 py-2 border rounded-xl shadow-sm font-bold text-xs uppercase transition-all ${showFilters ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              <Filter size={14} className="mr-2" /> {showFilters ? 'Fechar Filtros' : 'Filtrar Dados'}
            </button>
          </div>
        </header>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-200"><AlertCircle className="mr-2" size={20} /> {error}</div>}

        {showFilters && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2">
            {/* Grid ajustado para 5 colunas para caber o novo filtro */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Ano</label>
                <input type="number" placeholder="Ex: 2025" value={fAno} onChange={(e) => { setFAno(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nome do Devedor</label>
                <input type="text" placeholder="Buscar por nome..." value={fNome} onChange={(e) => { setFNome(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tipo de Dívida</label>
                <input type="text" placeholder="Ex: IPTU, ISS..." value={fTipoDivida} onChange={(e) => { setFTipoDivida(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm" />
              </div>
              <div className="flex justify-end">
                {/* Limpa todos os 3 filtros e reseta a página */}
                <button onClick={() => {setFAno(''); setFNome(''); setFTipoDivida(''); setPage(0);}} className="px-4 py-2 mt-5 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-lg uppercase flex items-center gap-2">
                  <X size={14} /> Limpar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Ano</th>
                  <th className="px-6 py-4">Nome do Devedor</th>
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-6 bg-slate-50/20"></td></tr>)
                : data?.content?.length > 0 ? data.content.map((item: Divida) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors text-xs group">
                      <td className="px-6 py-4 font-bold text-slate-500">{item.anoInscricao}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{item.nomeDevedor}</td>
                      <td className="px-6 py-4 font-mono text-slate-600">{maskDocumento(item.cpfCnpj)}</td>
                      <td className="px-6 py-4 text-slate-500">{item.tipoDivida || '---'}</td>
                      <td className="px-6 py-4 text-right font-black text-red-600">{formatMoney(item.valorTotalDivida)}</td>
                    </tr>
                  )) 
                : (<tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">Nenhum registro de Dívida Ativa encontrado.</td></tr>)}
              </tbody>
            </table>
          </div>
          
          {!loading && data && data.totalElements > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Página {data.number + 1} de {data.totalPages} • Total: {data.totalElements}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={data.first} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))} disabled={data.last} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}