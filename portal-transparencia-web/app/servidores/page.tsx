'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar'; 
import { 
  ChevronLeft, ChevronRight, Filter, AlertCircle, X, 
  Users, Download, FileText, Search, Briefcase, MapPin 
} from 'lucide-react';

interface Servidor {
  id: number;
  nome: string;
  cpf: string;
  matricula: string;
  cargo: string;
  lotacao: string;
  tipoVinculo: string;
  dataAdmissao: string;
}

export default function ServidoresPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    nome: '',
    cargo: '',
    lotacao: ''
  });

  const fetchServidores = useCallback(async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      let params = `page=${pageNumber}&size=20&sort=nome,asc`;
      if (filters.nome) params += `&nome=${encodeURIComponent(filters.nome)}`;
      if (filters.cargo) params += `&cargo=${encodeURIComponent(filters.cargo)}`;
      if (filters.lotacao) params += `&lotacao=${encodeURIComponent(filters.lotacao)}`;

      const response = await api.get(`/servidores?${params}`);
      setData(response.data);
      setPage(pageNumber);
    } catch (err) {
      setError("Erro ao carregar a base de servidores.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchServidores(page); }, [page, fetchServidores]);

  const handleExport = async (type: 'pdf' | 'csv') => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/servidores/exportar/${type}?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_servidores_${new Date().getTime()}.${type}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Erro ao gerar arquivo de exportação.");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-900 text-white rounded-lg"><Users size={24} /></div>
             <div>
               <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Servidores</h2>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                 {data?.totalElements || 0} Servidores Registrados
               </p>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleExport('csv')} className="flex items-center px-4 py-2 border border-slate-200 rounded-xl shadow-sm font-bold text-xs uppercase bg-white text-slate-600 hover:text-black hover:bg-slate-50 transition-all">
              <Download size={14} className="mr-2" /> CSV
            </button>
            <button onClick={() => handleExport('pdf')} className="flex items-center px-4 py-2 border border-slate-200 rounded-xl shadow-sm font-bold text-xs uppercase bg-white text-slate-600 hover:text-red-600 hover:bg-slate-50 transition-all">
              <FileText size={14} className="mr-2" /> PDF Institucional
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center px-4 py-2 border rounded-xl shadow-sm font-bold text-xs uppercase transition-all ${showFilters ? 'bg-black text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              <Filter size={14} className="mr-2" /> Filtros
            </button>
          </div>
        </header>

        {showFilters && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Nome do Servidor</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    placeholder="Buscar por nome..." 
                    value={filters.nome} 
                    onChange={(e) => { setFilters({...filters, nome: e.target.value}); setPage(0); }} 
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Cargo</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    placeholder="Filtrar cargo..." 
                    value={filters.cargo} 
                    onChange={(e) => { setFilters({...filters, cargo: e.target.value}); setPage(0); }} 
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Lotação</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    placeholder="Filtrar lotação..." 
                    value={filters.lotacao} 
                    onChange={(e) => { setFilters({...filters, lotacao: e.target.value}); setPage(0); }} 
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm" 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4">Matrícula</th>
                  <th className="px-6 py-4">Servidor</th>
                  <th className="px-6 py-4">Cargo / Lotação</th>
                  <th className="px-6 py-4">Vínculo</th>
                  <th className="px-6 py-4 text-center">Admissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? [...Array(6)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-7 bg-slate-50/20"></td></tr>)
                : data?.content?.length > 0 ? data.content.map((s: Servidor) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors text-xs group">
                      <td className="px-6 py-4 font-mono text-slate-400">{s.matricula}</td>
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-800 uppercase tracking-tight">{s.nome}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{s.cpf}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-600">{s.cargo}</p>
                        <p className="text-[10px] text-slate-400">{s.lotacao}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[9px] font-black uppercase tracking-tighter border border-slate-200">
                          {s.tipoVinculo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-500">
                        {new Date(s.dataAdmissao).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  )) 
                : (<tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">Nenhum servidor encontrado com os filtros aplicados.</td></tr>)}
              </tbody>
            </table>
          </div>
          
          {!loading && data && data.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Página {data.number + 1} de {data.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={data.first} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50 transition-colors"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))} disabled={data.last} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50 transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}