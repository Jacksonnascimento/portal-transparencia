'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  TrendingUp, Calendar, Search, FileText, AlertCircle, 
  ArrowLeft, Filter, Landmark, Eye, X, Info, Download, Printer 
} from 'lucide-react';
import api from '../../services/api';

interface Receita {
  exercicio: number;
  mes: number;
  dataLancamento: string;
  categoriaEconomica: string;
  origem: string;
  especie: string;
  rubrica: string;
  alinea: string;
  fonteRecursos: string;
  valorPrevistoInicial: number;
  valorPrevistoAtualizado: number;
  valorArrecadado: number;
  historico: string;
}

export default function ReceitasPage() {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [resumo, setResumo] = useState({ totalArrecadado: 0, totalRegistros: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Receita | null>(null);

  const [filtros, setFiltros] = useState({
    exercicio: new Date().getFullYear().toString(),
    origem: '',
    categoria: '',
    fonte: '',
    dataInicio: '',
    dataFim: ''
  });

  const anos = Array.from({ length: 6 }, (_, i) => (new Date().getFullYear() - i).toString());

  const buscarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtros.exercicio) params.append('exercicio', filtros.exercicio);
      if (filtros.origem) params.append('origem', filtros.origem);
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.fonte) params.append('fonte', filtros.fonte);
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim);
      
      params.append('page', '0');
      params.append('size', '100');
      params.append('sort', 'dataLancamento,desc');

      const [resLista, resResumo] = await Promise.all([
        api.get(`/portal/receitas?${params.toString()}`),
        api.get(`/portal/receitas/resumo?${params.toString()}`)
      ]);

      setReceitas(resLista.data.content || []);
      setResumo({
        totalArrecadado: resResumo.data.totalArrecadado || 0,
        totalRegistros: resResumo.data.totalRegistros || 0
      });

    } catch (err) {
      setError("Falha ao carregar dados da API.");
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (date: any) => {
    if (Array.isArray(date)) return `${String(date[2]).padStart(2, '0')}/${String(date[1]).padStart(2, '0')}/${date[0]}`;
    return date ? new Date(date).toLocaleDateString('pt-BR') : '---';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-slate-50 min-h-screen relative font-sans">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <button onClick={() => window.history.back()} className="flex items-center text-slate-400 hover:text-emerald-600 mb-4 transition-all font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={16} className="mr-2" /> Painel Principal
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <Landmark className="text-emerald-600" size={40} /> Receitas
          </h1>
        </div>
      </div>

      {/* CARDS KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 relative overflow-hidden group">
          <TrendingUp className="absolute right-[-20px] bottom-[-20px] opacity-20" size={160} />
          <p className="text-emerald-100 font-bold uppercase text-[10px] tracking-[0.2em] mb-2">Total Arrecadado ({filtros.exercicio})</p>
          <h2 className="text-5xl font-black tracking-tighter">{loading ? "..." : formatMoney(resumo.totalArrecadado)}</h2>
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-2">Lançamentos</p>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">{loading ? "..." : resumo.totalRegistros}</h2>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <FilterBox label="Exercício">
            <select value={filtros.exercicio} onChange={(e) => setFiltros({...filtros, exercicio: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 outline-none">
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </FilterBox>
          <FilterBox label="Origem">
            <input type="text" placeholder="ISS..." value={filtros.origem} onChange={(e) => setFiltros({...filtros, origem: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 outline-none" />
          </FilterBox>
          <FilterBox label="Fonte">
            <input type="text" placeholder="Fonte..." value={filtros.fonte} onChange={(e) => setFiltros({...filtros, fonte: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 outline-none" />
          </FilterBox>
          <FilterBox label="Início">
            <input type="date" value={filtros.dataInicio} onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 outline-none" />
          </FilterBox>
          <FilterBox label="Fim">
            <input type="date" value={filtros.dataFim} onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 outline-none" />
          </FilterBox>
          <button onClick={buscarDados} className="bg-black text-white h-[52px] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg flex items-center justify-center gap-2">
            <Search size={18} /> Filtrar
          </button>
        </div>
      </div>

      {/* GRADE */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase border-b">
                <th className="px-8 py-6">Data</th>
                <th className="px-8 py-6">Origem / Categoria</th>
                <th className="px-8 py-6">Fonte</th>
                <th className="px-8 py-6 text-right">Valor</th>
                <th className="px-8 py-6 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center font-bold text-slate-300 animate-pulse uppercase">Sincronizando...</td></tr>
              ) : receitas.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-all">
                  <td className="px-8 py-6 font-bold text-slate-900 text-sm">{formatDate(item.dataLancamento)}</td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-black text-slate-800 uppercase truncate max-w-[180px]">{item.origem}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{item.categoriaEconomica}</div>
                  </td>
                  <td className="px-8 py-6 text-xs text-slate-500 italic truncate max-w-[150px]">{item.fonteRecursos}</td>
                  <td className="px-8 py-6 text-right font-black text-emerald-600 text-base">{formatMoney(item.valorArrecadado)}</td>
                  <td className="px-8 py-6 text-center">
                    <button onClick={() => { setSelected(item); setIsModalOpen(true); }} className="bg-slate-100 text-slate-500 p-3 rounded-xl hover:bg-black hover:text-white transition-all shadow-sm">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL REDUZIDO E COM ROLAGEM --- */}
      {isModalOpen && selected && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)} // Fecha ao clicar fora
        >
          <div 
            className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()} // Impede o fechamento ao clicar dentro
          >
            {/* Header Modal - Fica Fixo */}
            <div className="bg-emerald-600 p-6 text-white flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter leading-none italic">Ficha da Receita</h2>
                <p className="text-emerald-100 text-[10px] font-bold uppercase mt-1 tracking-widest truncate max-w-[300px]">{selected.origem}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo com Rolagem */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Info Técnica */}
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Espécie" value={selected.especie} />
                <DetailField label="Rubrica" value={selected.rubrica} />
                <DetailField label="Alínea" value={selected.alinea} />
                <DetailField label="Fonte" value={selected.fonteRecursos} />
                <DetailField label="Exercício" value={selected.exercicio} />
                <DetailField label="Data" value={formatDate(selected.dataLancamento)} />
              </div>

              {/* Box de Valores */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Previsto Inicial</span>
                    <span className="text-sm font-bold text-slate-700">{formatMoney(selected.valorPrevistoInicial)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Previsto Atualizado</span>
                    <span className="text-sm font-bold text-slate-700">{formatMoney(selected.valorPrevistoAtualizado)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[9px] font-black text-emerald-600 uppercase">Total Arrecadado</span>
                    <span className="text-xl font-black text-emerald-700">{formatMoney(selected.valorArrecadado)}</span>
                  </div>
                </div>
              </div>

              {/* Histórico */}
              <div className="bg-white p-4 rounded-xl border border-dashed border-slate-200">
                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Histórico</span>
                <p className="text-xs text-slate-600 italic leading-relaxed">"{selected.historico || 'Sem detalhes.'}"</p>
              </div>
            </div>

            {/* Footer Fixo */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center shrink-0">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-full bg-black text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all"
                >
                  Fechar Detalhes
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterBox({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex flex-col group focus-within:border-emerald-500 transition-all">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</span>
      {children}
    </div>
  );
}

function DetailField({ label, value }: { label: string, value: any }) {
  return (
    <div className="border-b border-slate-100 pb-2">
      <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5 tracking-widest">{label}</span>
      <span className="text-xs font-bold text-slate-800 truncate block">{value || '---'}</span>
    </div>
  );
}