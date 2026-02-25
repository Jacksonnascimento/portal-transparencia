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
      console.error("Erro na busca de receitas:", err);
      setError("Não foi possível conectar à API de Transparência.");
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
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <button onClick={() => window.history.back()} className="flex items-center text-slate-400 hover:text-[var(--cor-primaria)] mb-4 transition-all font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={16} className="mr-2" /> Painel Principal
          </button>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <Landmark className="text-[var(--cor-primaria)]" size={48} /> Receitas
          </h1>
          <p className="text-slate-500 font-medium text-lg mt-1">Transparência da Arrecadação Municipal</p>
        </div>
        <div className="flex gap-3">
            <button className="bg-white p-4 rounded-2xl border border-slate-200 text-slate-400 hover:text-black hover:shadow-xl transition-all"><Printer size={22} /></button>
            <button className="bg-white p-4 rounded-2xl border border-slate-200 text-slate-400 hover:text-black hover:shadow-xl transition-all"><Download size={22} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-[var(--cor-primaria)] p-10 rounded-[3rem] text-white shadow-2xl shadow-[var(--cor-primaria-fundo)] relative overflow-hidden group">
          <TrendingUp className="absolute right-[-20px] bottom-[-20px] opacity-20 group-hover:scale-110 transition-transform duration-700" size={200} />
          <p className="text-white/80 font-bold uppercase text-xs tracking-[0.2em] mb-3">Total Arrecadado ({filtros.exercicio})</p>
          <h2 className="text-6xl font-black tracking-tighter">{loading ? "..." : formatMoney(resumo.totalArrecadado)}</h2>
        </div>
        
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <FileText className="absolute right-[-20px] bottom-[-20px] opacity-5 text-slate-900 group-hover:scale-110 transition-transform duration-700" size={200} />
          <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em] mb-3">Lançamentos no Período</p>
          <h2 className="text-6xl font-black text-slate-900 tracking-tighter">{loading ? "..." : resumo.totalRegistros}</h2>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
          <FilterBox label="Exercício">
            <select value={filtros.exercicio} onChange={(e) => setFiltros({...filtros, exercicio: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 outline-none cursor-pointer">
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </FilterBox>
          <FilterBox label="Origem">
            <input type="text" placeholder="Ex: IPTU..." value={filtros.origem} onChange={(e) => setFiltros({...filtros, origem: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 outline-none placeholder:text-slate-300" />
          </FilterBox>
          <FilterBox label="Fonte de Recurso">
            <input type="text" placeholder="Ex: Próprios..." value={filtros.fonte} onChange={(e) => setFiltros({...filtros, fonte: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 outline-none placeholder:text-slate-300" />
          </FilterBox>
          <FilterBox label="Data Início">
            <input type="date" value={filtros.dataInicio} onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 outline-none" />
          </FilterBox>
          <FilterBox label="Data Fim">
            <input type="date" value={filtros.dataFim} onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})} className="w-full bg-transparent font-bold text-slate-800 outline-none" />
          </FilterBox>
          <button onClick={buscarDados} className="bg-black text-white h-[64px] rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-[var(--cor-primaria-hover)] transition-all shadow-lg flex items-center justify-center gap-3">
            <Search size={20} /> Filtrar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                <th className="px-10 py-8">Data Lançamento</th>
                <th className="px-10 py-8">Origem / Categoria</th>
                <th className="px-10 py-8">Fonte de Recurso</th>
                <th className="px-10 py-8 text-right">Valor Arrecadado</th>
                <th className="px-10 py-8 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="py-32 text-center font-bold text-slate-300 animate-pulse text-xl uppercase tracking-widest">Sincronizando Base de Dados...</td></tr>
              ) : receitas.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-all group cursor-default">
                  <td className="px-10 py-8 font-bold text-slate-900 text-sm">{formatDate(item.dataLancamento)}</td>
                  <td className="px-10 py-8">
                    <div className="text-sm font-black text-slate-800 uppercase truncate max-w-[220px]" title={item.origem}>{item.origem}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{item.categoriaEconomica}</div>
                  </td>
                  <td className="px-10 py-8 text-xs font-semibold text-slate-500 italic max-w-[200px] truncate" title={item.fonteRecursos}>
                    {item.fonteRecursos}
                  </td>
                  <td className="px-10 py-8 text-right font-black text-[var(--cor-primaria)] text-lg tracking-tighter">
                    {formatMoney(item.valorArrecadado)}
                  </td>
                  <td className="px-10 py-8 text-center">
                    <button onClick={() => { setSelected(item); setIsModalOpen(true); }} className="bg-slate-100 text-slate-500 p-4 rounded-2xl hover:bg-black hover:text-white transition-all shadow-sm">
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            
            <div className="bg-[var(--cor-primaria)] p-6 text-white flex justify-between items-center shrink-0">
              <div className="flex gap-4 items-center">
                <div className="bg-white/20 p-3 rounded-2xl"><Landmark size={24}/></div>
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter leading-none italic">Ficha Técnica da Receita</h2>
                    <p className="text-white/80 text-[10px] font-bold uppercase mt-1 tracking-[0.2em] truncate max-w-[250px]">{selected.origem}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/40 transition-all focus:outline-none"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Espécie" value={selected.especie} />
                <DetailField label="Rubrica" value={selected.rubrica} />
                <DetailField label="Alínea" value={selected.alinea} />
                <DetailField label="Fonte" value={selected.fonteRecursos} />
                <DetailField label="Exercício" value={selected.exercicio} />
                <DetailField label="Data" value={formatDate(selected.dataLancamento)} />
              </div>

              <div className="bg-[var(--cor-primaria-fundo)] p-5 rounded-3xl border border-[var(--cor-primaria-fundo)]">
                <div className="flex items-center gap-2 mb-4 justify-center">
                    <TrendingUp size={14} className="text-[var(--cor-primaria)]" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Análise de Planejamento</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Previsto Inicial</span>
                    <span className="text-sm font-bold text-slate-800">{formatMoney(selected.valorPrevistoInicial)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Previsto Atualizado</span>
                    <span className="text-sm font-bold text-slate-800">{formatMoney(selected.valorPrevistoAtualizado)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[9px] font-black text-[var(--cor-primaria)] uppercase">Total Arrecadado</span>
                    <span className="text-xl font-black text-[var(--cor-primaria)]">{formatMoney(selected.valorArrecadado)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-[1.5rem] border border-dashed border-slate-200">
                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1 flex items-center gap-1">
                    <Info size={12}/> Histórico do Lançamento
                </span>
                <p className="text-xs text-slate-600 font-medium italic leading-relaxed">"{selected.historico || 'Não há informações detalhadas para este registro.'}"</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center shrink-0">
                <button onClick={() => setIsModalOpen(false)} className="w-full bg-black text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[var(--cor-primaria-hover)] transition-all">
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
    <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 flex flex-col focus-within:border-[var(--cor-primaria)] focus-within:ring-1 focus-within:ring-[var(--cor-primaria)] transition-all">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
      {children}
    </div>
  );
}

function DetailField({ label, value }: { label: string, value: any }) {
  return (
    <div className="border-b border-slate-100 pb-2">
      <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest mb-1 text-slate-400">{label}</span>
      <span className="text-xs font-bold text-slate-800 truncate block">{value || '---'}</span>
    </div>
  );
}