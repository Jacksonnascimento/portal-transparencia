'use client';

import { useState } from 'react';
import api from '@/services/api';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  FileType,
  Loader2,
  TrendingUp,
  FileCheck,
  X
} from 'lucide-react';

export function ImportarReceitas() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [inputKey, setInputKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // --- FUNÇÃO PARA LIMPAR TUDO ---
  const handleCancel = () => {
    setFile(null);
    setStatus({ type: null, message: '' });
    setInputKey(prev => prev + 1); // Reseta o input nativo
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setStatus({ type: null, message: '' });
    } else {
      setStatus({ type: 'error', message: 'Apenas arquivos .csv são permitidos.' });
    }
  };

  const handleDownloadModel = () => {
    const header = "exercicio;mes;data_lancamento;categoria_economica;origem;especie;rubrica;alinea;fonte_recursos;valor_previsto_inicial;valor_previsto_atualizado;valor_arrecadado;historico";
    const example = "2025;1;15/01/2025;Receitas Correntes;Impostos;Impostos s/ Patrimonio;IPTU;Principal;1500 - Recursos Ordinarios;1000000,00;1000000,00;1500,50;Recebimento de IPTU lote 01";
    const csvContent = `${header}\n${example}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'layout_receitas_padrao.csv');
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
      await api.post('/receitas/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus({ type: 'success', message: 'Importação processada com sucesso! Os dados já estão disponíveis.' });
      setFile(null); 
    } catch (error: any) {
      setStatus({ type: 'error', message: 'Falha na importação. Verifique se as colunas e o separador (;) estão corretos.' });
    } finally {
      setLoading(false);
      setInputKey(prev => prev + 1);
    }
  };

  const colunasCartilha = [
    { campo: 'exercicio', obr: 'Sim', desc: 'Ano de referência (ex: 2025)' },
    { campo: 'mes', obr: 'Sim', desc: 'Mês numérico (1 a 12)' },
    { campo: 'data_lancamento', obr: 'Sim', desc: 'DD/MM/AAAA' },
    { campo: 'categoria_economica', obr: 'Sim', desc: 'Ex: Receitas Correntes' },
    { campo: 'origem', obr: 'Sim', desc: 'Ex: Impostos, Taxas' },
    { campo: 'especie', obr: 'Não', desc: 'Detalhamento da Origem' },
    { campo: 'rubrica', obr: 'Não', desc: 'Ex: IPTU, ISSQN' },
    { campo: 'alinea', obr: 'Não', desc: 'Ex: Principal, Multas' },
    { campo: 'fonte_recursos', obr: 'Sim', desc: 'Código/Nome da Fonte' },
    { campo: 'valor_previsto_inicial', obr: 'Não', desc: 'Valor LOA (Use vírgula)' },
    { campo: 'valor_previsto_atualizado', obr: 'Não', desc: 'Previsão ajustada' },
    { campo: 'valor_arrecadado', obr: 'Sim', desc: 'Valor real (Use vírgula)' },
    { campo: 'historico', obr: 'Não', desc: 'Descrição detalhada' },
  ];

  return (
    // ADICIONADO 'relative' PARA CONTER O DRAG OVERLAY
    <div 
      className="w-full relative"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      {/* 🟦 OVERLAY DE DRAG CORRIGIDO */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-sm border-4 border-dashed border-slate-400 rounded-2xl pointer-events-none transition-all">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce">
            <UploadCloud size={48} className="text-slate-900" />
            <span className="mt-4 font-black text-slate-900 uppercase text-sm tracking-widest">Solte o arquivo CSV aqui</span>
          </div>
        </div>
      )}

      <div className="mb-8 border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-black text-white rounded-lg">
            <TrendingUp size={24} />
          </div>
          Carga de Receitas Públicas
        </h2>
        <p className="text-slate-500 text-sm mt-1 ml-12">Importação em lote via arquivo CSV padronizado.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA DE AÇÃO */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* PASSO 1 */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-xs uppercase tracking-widest">
              <FileSpreadsheet size={16} className="text-slate-400" /> 1. Obter Layout
            </h3>
            <button 
              onClick={handleDownloadModel}
              className="w-full bg-slate-50 border border-slate-300 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wide"
            >
              <Download size={16} /> Baixar Modelo .CSV
            </button>
          </div>

          {/* PASSO 2 */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-xs uppercase tracking-widest">
              <UploadCloud size={16} className="text-slate-400" /> 2. Upload do Arquivo
            </h3>
            
            <div className={`border-2 border-dashed rounded-xl p-8 text-center relative transition-all group ${file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}>
              <input 
                key={inputKey}
                type="file" 
                accept=".csv" 
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) { setFile(selected); setStatus({ type: null, message: '' }); }
                }} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <FileType size={32} className={`mx-auto mb-3 transition-colors ${file ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <p className="text-xs font-bold text-slate-600 truncate px-2">
                {file ? file.name : "Clique ou arraste o CSV aqui"}
              </p>
            </div>

            {/* AÇÕES DE UPLOAD */}
            {file && (
              <div className="mt-6 animate-in zoom-in-95 space-y-3">
                <div className="p-3 bg-emerald-100/50 rounded-lg flex items-center gap-2 text-emerald-800 font-bold text-xs border border-emerald-200">
                  <FileCheck size={16} /> Arquivo pronto para carga
                </div>
                
                <button 
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full py-3 bg-black hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  {loading ? "Processando..." : "Iniciar Importação"}
                </button>
                
                <button 
                  onClick={handleCancel}
                  className="w-full py-2 text-slate-400 hover:text-red-600 text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1"
                >
                  <X size={12} /> Cancelar seleção
                </button>
              </div>
            )}

            {/* MENSAGENS DE STATUS */}
            {status.message && (
              <div className={`mt-4 p-4 rounded-xl text-xs font-bold flex items-start gap-2 border animate-in slide-in-from-top-2 ${
                status.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {status.type === 'success' ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
                <span className="leading-relaxed">{status.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* DICIONÁRIO DE DADOS */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-slate-400" />
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Regras de Preenchimento</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">SEPARADOR: PONTO E VÍRGULA (;)</span>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white text-[10px] font-black text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 w-1/4">Coluna (Header)</th>
                    <th className="px-4 py-3 text-center w-24">Obrig.</th>
                    <th className="px-6 py-3">Descrição Técnica e Formato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[11px]">
                  {colunasCartilha.map((col, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-2.5 font-mono font-bold text-slate-700 group-hover:text-black">{col.campo}</td>
                      <td className="px-4 py-2.5 text-center">
                        {col.obr === 'Sim' 
                          ? <span className="text-red-600 font-black bg-red-50 px-1.5 py-0.5 rounded text-[9px]">SIM</span> 
                          : <span className="text-slate-300 font-bold text-[9px]">NÃO</span>}
                      </td>
                      <td className="px-6 py-2.5 text-slate-500 font-medium">{col.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}