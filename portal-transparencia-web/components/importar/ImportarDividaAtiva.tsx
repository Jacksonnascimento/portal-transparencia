'use client';

import { useState } from 'react';
import api from '@/services/api';
import { 
  UploadCloud, FileSpreadsheet, Download, CheckCircle, AlertTriangle, 
  Info, FileType, Loader2, Scale, FileCheck, X
} from 'lucide-react';

export function ImportarDividaAtiva() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [inputKey, setInputKey] = useState(0);

  const handleDownloadModel = () => {
    // Ordem exata que o Backend espera: Nome, CPF/CNPJ, Valor, Ano, Tipo
    const header = "nome_devedor;cpf_cnpj;valor_total_divida;ano_inscricao;tipo_divida";
    const example = "Empresa Alfa de Tecnologia;12.345.678/0001-99;45000,50;2025;ISSQN";
    const csvContent = `${header}\n${example}`;
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'layout_divida_ativa.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus({ type: null, message: '' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/divida-ativa/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus({ type: 'success', message: 'Dívida Ativa processada com sucesso!' });
      setFile(null); 
    } catch (error: any) {
      setStatus({ type: 'error', message: 'Falha na importação. Verifique o padrão de 5 colunas e o separador (;).' });
    } finally {
      setLoading(false);
      setInputKey(prev => prev + 1);
    }
  };

  const colunas = [
    { campo: 'nome_devedor', obr: 'Sim', desc: 'Nome ou Razão Social do inscrito' },
    { campo: 'cpf_cnpj', obr: 'Não', desc: 'Documento (será mascarado no portal público)' },
    { campo: 'valor_total_divida', obr: 'Sim', desc: 'Valor total em Reais (use vírgula)' },
    { campo: 'ano_inscricao', obr: 'Sim', desc: 'Ano de referência (ex: 2025)' },
    { campo: 'tipo_divida', obr: 'Não', desc: 'Ex: IPTU, ISS, Multa Administrativa' },
  ];

  return (
    <div className="w-full relative">
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-black text-white rounded-lg"><Scale size={24} /></div>
          Carga de Dívida Ativa
        </h2>
        <p className="text-slate-500 text-sm mt-1 ml-12">Relação de inscritos e valores devidos ao município.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-xs uppercase tracking-widest">
              <FileSpreadsheet size={16} className="text-slate-400" /> 1. Obter Layout
            </h3>
            <button onClick={handleDownloadModel} className="w-full bg-slate-50 border border-slate-300 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wide">
              <Download size={16} /> Baixar Modelo .CSV
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-xs uppercase tracking-widest">
              <UploadCloud size={16} className="text-slate-400" /> 2. Upload do Ficheiro
            </h3>
            <div className={`border-2 border-dashed rounded-xl p-8 text-center relative transition-all group ${file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}>
              <input key={inputKey} type="file" accept=".csv" onChange={(e) => { const sel = e.target.files?.[0]; if (sel) { setFile(sel); setStatus({ type: null, message: '' }); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <FileType size={32} className={`mx-auto mb-3 transition-colors ${file ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <p className="text-xs font-bold text-slate-600 truncate px-2">{file ? file.name : "Clique ou arraste o CSV aqui"}</p>
            </div>

            {file && (
              <div className="mt-6 space-y-3">
                <button onClick={handleUpload} disabled={loading} className="w-full py-3 bg-black hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />} {loading ? "Processando..." : "Iniciar Importação"}
                </button>
                <button onClick={() => {setFile(null); setInputKey(p=>p+1); setStatus({type:null, message:''})}} className="w-full py-2 text-slate-400 hover:text-red-600 text-[10px] font-bold uppercase flex items-center justify-center gap-1">
                  <X size={12} /> Cancelar seleção
                </button>
              </div>
            )}

            {status.message && (
              <div className={`mt-4 p-4 rounded-xl text-xs font-bold flex items-start gap-2 border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {status.type === 'success' ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
                <span className="leading-relaxed">{status.message}</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2"><Info size={18} className="text-slate-400" /><h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Regras de Preenchimento</h3></div>
              <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">SEPARADOR: PONTO E VÍRGULA (;)</span>
            </div>
            <table className="w-full text-left text-[11px]">
              <thead className="bg-white text-[10px] font-black text-slate-500 uppercase border-b border-slate-200">
                <tr><th className="px-6 py-3">Coluna (Header)</th><th className="px-4 py-3 text-center">Obrig.</th><th className="px-6 py-3">Descrição Técnica e Formato</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {colunas.map((col, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 group">
                    <td className="px-6 py-2.5 font-mono font-bold text-slate-700">{col.campo}</td>
                    <td className="px-4 py-2.5 text-center">{col.obr === 'Sim' ? <span className="text-red-600 font-black bg-red-50 px-1.5 py-0.5 rounded text-[9px]">SIM</span> : <span className="text-slate-300 font-bold text-[9px]">NÃO</span>}</td>
                    <td className="px-6 py-2.5 text-slate-500 font-medium">{col.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}