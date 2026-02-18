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
  FileCheck
} from 'lucide-react';

export function ImportarReceitas() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [inputKey, setInputKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // --- FUNÇÃO PARA LIMPAR TUDO (USADA NO CANCELAR E APÓS SUCESSO) ---
  const handleCancel = () => {
    setFile(null);
    setStatus({ type: null, message: '' });
    setInputKey(prev => prev + 1); // Isso "reseta" o input de arquivo no navegador
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
    link.setAttribute('download', 'layout_receitas.csv');
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
      setStatus({ type: 'success', message: 'Importação concluída com sucesso!' });
      setFile(null); 
    } catch (error: any) {
      setStatus({ type: 'error', message: 'Erro ao processar o arquivo CSV. Verifique o layout.' });
    } finally {
      setLoading(false);
      setInputKey(prev => prev + 1);
    }
  };

  const colunasCartilha = [
    { campo: 'exercicio', obr: 'Sim', desc: 'Ano de referência (ex: 2025)' },
    { campo: 'mes', obr: 'Sim', desc: 'Mês (1 a 12)' },
    { campo: 'data_lancamento', obr: 'Sim', desc: 'Formato DD/MM/AAAA' },
    { campo: 'categoria_economica', obr: 'Sim', desc: 'Ex: Receitas Correntes' },
    { campo: 'origem', obr: 'Sim', desc: 'Ex: Impostos, Taxas' },
    { campo: 'especie', obr: 'Não', desc: 'Detalhamento da Origem' },
    { campo: 'rubrica', obr: 'Não', desc: 'Ex: IPTU, ISSQN' },
    { campo: 'alinea', obr: 'Não', desc: 'Ex: Principal, Multas' },
    { campo: 'fonte_recursos', obr: 'Sim', desc: 'Código e Nome da Fonte' },
    { campo: 'valor_previsto_inicial', obr: 'Não', desc: 'Valor fixado na LOA' },
    { campo: 'valor_previsto_atualizado', obr: 'Não', desc: 'Previsão ajustada' },
    { campo: 'valor_arrecadado', obr: 'Sim', desc: 'Valor recebido (Use vírgula)' },
    { campo: 'historico', obr: 'Não', desc: 'Descrição do lançamento' },
  ];

  return (
    <div 
      className="w-full"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      {/* 🟦 OVERLAY DE DRAG (O aviso visual de "Solte aqui") */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-600/10 backdrop-blur-sm border-4 border-dashed border-blue-400 rounded-2xl pointer-events-none">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center">
            <UploadCloud size={48} className="text-blue-600 animate-bounce" />
            <span className="mt-2 font-bold text-blue-700 uppercase text-xs tracking-widest">Solte o arquivo aqui</span>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="text-green-600" /> Carga de Receitas Públicas
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA DE AÇÃO */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="font-bold text-slate-600 flex items-center gap-2 mb-4 text-xs uppercase tracking-widest">
              <FileSpreadsheet size={18} /> 1. Preparar Arquivo
            </h3>
            <button 
              onClick={handleDownloadModel}
              className="w-full bg-white border-2 border-blue-200 text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Download size={16} /> Baixar Modelo .CSV
            </button>
          </div>

          <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-md">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-xs uppercase tracking-widest">
              <UploadCloud size={18} /> 2. Selecionar CSV
            </h3>
            
            <div className={`border-2 border-dashed rounded-xl p-10 text-center relative transition-all ${file ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'}`}>
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
              <FileType size={40} className={`mx-auto mb-2 ${file ? 'text-blue-600' : 'text-slate-300'}`} />
              <p className="text-xs font-bold text-slate-500 truncate px-2">
                {file ? file.name : "Arraste ou clique para selecionar"}
              </p>
            </div>

            {/* CARD DE CONFIRMAÇÃO COM BOTÃO AZUL */}
            {file && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl animate-in zoom-in-95">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-4">
                  <FileCheck size={16} /> Arquivo detectado com sucesso
                </div>
                
                <button 
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
                  {loading ? "Processando..." : "Iniciar Importação"}
                </button>
                
                <button 
                  onClick={handleCancel}
                  className="w-full mt-2 py-2 text-slate-400 hover:text-red-500 text-[10px] font-bold uppercase transition-colors"
                >
                  Cancelar e trocar arquivo
                </button>
              </div>
            )}

            {status.message && (
              <div className={`mt-4 p-4 rounded-xl text-xs font-bold flex items-center gap-2 border-2 ${
                status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                {status.message}
              </div>
            )}
          </div>
        </div>

        {/* DICIONÁRIO (13 CAMPOS) */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Info size={18} className="text-slate-400" />
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Dicionário de Dados</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Coluna</th>
                    <th className="px-4 py-4 text-center">Obrig.</th>
                    <th className="px-6 py-4">Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {colunasCartilha.map((col, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-mono font-bold text-slate-700">{col.campo}</td>
                      <td className="px-4 py-3 text-center">
                        {col.obr === 'Sim' ? <span className="text-red-500 font-black">SIM</span> : <span className="text-slate-300 font-bold uppercase">OPC</span>}
                      </td>
                      <td className="px-6 py-3 text-slate-500 italic">{col.desc}</td>
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