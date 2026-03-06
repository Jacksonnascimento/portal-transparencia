'use client';

import { useEffect, useState, useCallback } from 'react';
import diariaService, { DiariaResponse } from '@/services/diariaService';
import api from '@/services/api';
import { Sidebar } from '@/components/Sidebar'; 
import { DiariaFormModal } from '@/components/diarias/DiariaFormModal';
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  AlertCircle, 
  X, 
  Plane, 
  Download, 
  FileText,
  Plus, 
  Eye, 
  Edit, 
  Trash2 
} from 'lucide-react';
import { format } from 'date-fns';

export default function DiariasPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [fNome, setFNome] = useState('');
  const [fAno, setFAno] = useState('');
  
  // Estados para o Modal Multiuso
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modoModal, setModoModal] = useState<'create' | 'edit' | 'view'>('create');
  const [diariaSelecionada, setDiariaSelecionada] = useState<DiariaResponse | null>(null);

  const [corDestaque, setCorDestaque] = useState('#000000');
  
  useEffect(() => {
    api.get('/portal/configuracoes').then(res => {
      if (res.data?.corPrincipal) setCorDestaque(res.data.corPrincipal);
    }).catch(() => null);
  }, []);

  const fetchDiarias = useCallback(async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await diariaService.listar({
        page: pageNumber,
        size: 20,
        exercicio: fAno,
        nomeFavorecido: fNome
      });
      setData(response);
      setPage(pageNumber);
    } catch (err) {
      setError("Não foi possível carregar os registros de diárias.");
    } finally {
      setLoading(false);
    }
  }, [fNome, fAno]);

  useEffect(() => { fetchDiarias(page); }, [page, fetchDiarias]);

  // Handlers de Ações
  const handleNovo = () => {
    setModoModal('create');
    setDiariaSelecionada(null);
    setIsModalOpen(true);
  };

  const handleVisualizar = (diaria: DiariaResponse) => {
    setModoModal('view');
    setDiariaSelecionada(diaria);
    setIsModalOpen(true);
  };

  const handleEditar = (diaria: DiariaResponse) => {
    setModoModal('edit');
    setDiariaSelecionada(diaria);
    setIsModalOpen(true);
  };

  const handleExcluir = async (id: number) => {
    if (confirm("Deseja realmente inativar este registro? Esta ação será registrada no log de auditoria.")) {
      try {
        await diariaService.excluir(id);
        fetchDiarias(page);
      } catch (err) {
        alert("Erro ao excluir o registro.");
      }
    }
  };

  const formatMoney = (val?: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const maskDocumento = (val?: string) => {
    if (!val) return "---";
    const clean = val.replace(/\D/g, '');
    if (clean.length === 11) return `${clean.substring(0, 3)}.***.***-${clean.substring(9)}`;
    if (clean.length === 14) return `${clean.substring(0, 2)}.***.***/****-${clean.substring(12)}`;
    return val;
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans text-sm">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto relative z-0">
        
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 text-white rounded-lg shadow-inner" style={{ backgroundColor: corDestaque }}>
               <Plane size={24} />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Diárias e Passagens</h2>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Controle de Deslocamentos e Concessões</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleNovo}
              className="flex items-center px-4 py-2 rounded-xl shadow-sm font-bold text-xs uppercase text-white transition-all hover:brightness-110 active:scale-95"
              style={{ backgroundColor: corDestaque }}
            >
              <Plus size={14} className="mr-2" strokeWidth={3} /> Novo Registro
            </button>
            <div className="h-10 w-[1px] bg-slate-200 mx-1"></div>
            <button onClick={() => diariaService.exportarPdf({ exercicio: fAno, nomeFavorecido: fNome })} className="flex items-center px-4 py-2 border border-slate-200 rounded-xl shadow-sm font-bold text-xs uppercase bg-white text-slate-700 hover:text-red-600 hover:bg-slate-50 transition-all">
              <FileText size={14} className="mr-2" /> PDF
            </button>
            <button onClick={() => diariaService.exportarCsv({ exercicio: fAno, nomeFavorecido: fNome })} className="flex items-center px-4 py-2 border border-slate-200 rounded-xl shadow-sm font-bold text-xs uppercase bg-white text-slate-700 hover:text-green-600 hover:bg-slate-50 transition-all">
              <Download size={14} className="mr-2" /> CSV
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center px-4 py-2 border rounded-xl shadow-sm font-bold text-xs uppercase transition-all ${showFilters ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              <Filter size={14} className="mr-2" /> {showFilters ? 'Fechar' : 'Filtrar'}
            </button>
          </div>
        </header>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-200"><AlertCircle className="mr-2" size={20} /> {error}</div>}

        {showFilters && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block px-1">Ano Exercício</label>
                <input type="number" placeholder="Ex: 2025" value={fAno} onChange={(e) => { setFAno(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block px-1">Nome do Favorecido ou Destino</label>
                <input type="text" placeholder="Buscar por nome, destino ou processo..." value={fNome} onChange={(e) => { setFNome(e.target.value); setPage(0); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm transition-all" />
              </div>
              <div className="flex justify-end">
                <button onClick={() => {setFAno(''); setFNome(''); setPage(0);}} className="px-4 py-2 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-lg uppercase flex items-center gap-2 transition-all">
                  <X size={14} /> Limpar Filtros
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
                  <th className="px-6 py-4">Exercício</th>
                  <th className="px-6 py-4">Favorecido / Documento</th>
                  <th className="px-6 py-4">Destino / Período</th>
                  <th className="px-6 py-4">Processo</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {loading ? [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-6 bg-slate-50/20"></td></tr>)
                : data?.content?.length > 0 ? data.content.map((item: DiariaResponse) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors text-xs group">
                      <td className="px-6 py-4 font-bold text-slate-400">{item.exercicio}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 uppercase leading-tight">{item.nomeFavorecido}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tighter">{maskDocumento(item.cpfCnpjFavorecido)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-600">{item.destinoViagem}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {format(new Date(item.dataSaida), 'dd/MM/yyyy')} — {format(new Date(item.dataRetorno), 'dd/MM/yyyy')}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{item.numeroProcesso || '---'}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">{formatMoney(item.valorTotal)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleVisualizar(item)} className="p-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-all" title="Ver Detalhes"><Eye size={14} /></button>
                          <button onClick={() => handleEditar(item)} className="p-1.5 hover:bg-amber-50 hover:text-amber-600 rounded-md transition-all" title="Editar"><Edit size={14} /></button>
                          <button onClick={() => handleExcluir(item.id)} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md transition-all" title="Excluir"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )) 
                : (<tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium italic">Nenhum registro de diária encontrado para os filtros selecionados.</td></tr>)}
              </tbody>
            </table>
          </div>
          
          {!loading && data && data.totalElements > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider italic">
                Página {data.number + 1} de {data.totalPages} • Total: {data.totalElements} registros
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={data.first} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50 shadow-sm transition-all"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))} disabled={data.last} className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 hover:bg-slate-50 shadow-sm transition-all"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>

        <DiariaFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => fetchDiarias(page)} 
          corDestaque={corDestaque}
          modo={modoModal}
          dadosIniciais={diariaSelecionada}
        />
      </main>
    </div>
  );
}