'use client';

import { useState } from 'react';
import api from '../../services/api';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import { 
  FileUp, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Info,
  FileSpreadsheet
} from 'lucide-react';

export default function ImportarPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Função para baixar o modelo CSV no padrão Horizon AJ
  const downloadModeloCSV = () => {
    const cabecalho = "Exercicio;Mes;Categoria;Origem;Fonte;Data;Valor";
    const linhaExemplo = "2025;2;Receitas Correntes;IPTU;Tesouro;30/01/2025;4.500,00";
    const csvContent = `${cabecalho}\n${linhaExemplo}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "modelo_importacao_horizon.csv");
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Modelo baixado com sucesso!");
  };

  const handleFileChange = (e: React.ChangeEvent<INPUTElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        toast.error("Por favor, selecione apenas arquivos .csv");
        e.target.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecione um arquivo primeiro!");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file); 

    try {
      await api.post('/receitas/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success("Importação concluída com sucesso!");
      setFile(null);
    } catch (error: any) {
      console.error(error);
      toast.error("Erro na importação. Verifique o arquivo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F1F5F9] text-slate-900 font-sans text-sm">
      <Toaster position="top-right" />
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0F172A] text-white hidden lg:flex flex-col sticky top-0 h-screen shadow-2xl">
        <div className="p-5 border-b border-slate-800">
          <h1 className="text-xl font-black tracking-tighter italic text-blue-500">HORIZON <span className="text-white">AJ</span></h1>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link href="/" className="flex items-center w-full px-4 py-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all group">
            <LayoutDashboard size={18} className="mr-3 group-hover:text-blue-400" /> Dashboard
          </Link>
          <button className="flex items-center w-full px-4 py-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all group">
            <TrendingUp size={18} className="mr-3 group-hover:text-green-400" /> Receitas
          </button>
          <button className="flex items-center w-full px-4 py-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all group">
            <TrendingDown size={18} className="mr-3 group-hover:text-red-400" /> Despesas
          </button>
          <div className="flex items-center w-full px-4 py-2 bg-blue-600 rounded-lg text-white font-semibold shadow-lg shadow-blue-900/40 border-t border-slate-800 pt-4 mt-4">
            <FileUp size={18} className="mr-3" /> Importar Dados
          </div>
        </nav>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <Link href="/" className="inline-flex items-center text-slate-500 hover:text-blue-600 font-bold mb-8 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Voltar ao Painel
          </Link>

          {/* CARD DE UPLOAD */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200 mb-8 transition-all hover:shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black">
                <FileUp size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Upload de Receitas</h2>
              <p className="text-slate-500 mt-2 font-medium">Selecione o arquivo CSV conforme o padrão estabelecido.</p>
            </div>

            <div className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all ${file ? 'border-green-400 bg-green-50/50' : 'border-slate-200 bg-slate-50 hover:border-blue-400'}`}>
              <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              {file ? (
                <div className="flex flex-col items-center animate-in zoom-in duration-300">
                  <CheckCircle2 className="text-green-500 mb-2" size={40} />
                  <span className="font-bold text-slate-800 text-base tracking-tight">{file.name}</span>
                </div>
              ) : (
                <div className="text-slate-400 flex flex-col items-center italic">
                  <FileSpreadsheet size={32} className="mb-2 opacity-50 text-blue-500" />
                  <span className="font-bold uppercase tracking-widest text-xs">Clique para selecionar o CSV</span>
                </div>
              )}
            </div>

            <button 
              onClick={handleUpload} 
              disabled={!file || uploading} 
              className="w-full mt-8 py-4 bg-[#0F172A] text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {uploading ? <><Loader2 className="mr-2 animate-spin" /> Processando...</> : 'Enviar para o Sistema'}
            </button>
          </div>

          {/* INFORMATIVO DE PADRÃO */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                <Info size={18} />
              </div>
              <h3 className="font-black text-slate-800 uppercase tracking-tighter text-base">Padrão de Importação (Cartilha Horizon AJ)</h3>
            </div>
            
            <div className="p-8 lg:p-10">
              <p className="text-slate-500 mb-10 text-sm leading-relaxed">
                Para que a importação ocorra sem erros, o arquivo CSV deve utilizar <strong>ponto e vírgula (;)</strong> como separador e conter as seguintes colunas exatamente nesta ordem:
              </p>

              {/* GRID DE CARDS DOS CAMPOS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                  { title: "EXERCICIO", desc: "Ano (ex: 2025)" },
                  { title: "MES", desc: "Mês (1 a 12)" },
                  { title: "CATEGORIA", desc: "Texto (ex: Receitas Correntes)" },
                  { title: "ORIGEM", desc: "Texto (ex: IPTU)" },
                  { title: "FONTE", desc: "Texto (ex: Tesouro)" },
                  { title: "DATA", desc: "DD/MM/AAAA" },
                  { title: "VALOR", desc: "Numérico (ex: 4.500,00)" }
                ].map((item, i) => (
                  <div key={i} className="bg-[#F8FAFC] p-6 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <p className="text-blue-600 font-black text-xs mb-1 uppercase">{item.title}</p>
                    <p className="text-slate-400 text-xs font-semibold tracking-tight">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* RODAPÉ DO INFORMATIVO */}
              <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-slate-400 text-xs font-bold">
                  <FileSpreadsheet size={18} className="text-slate-300" />
                  <span className="italic whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px] md:max-w-none">
                    Exemplo de linha: 2025;2;Receitas Correntes;IPTU;Tesouro;30/01/2025;4.500,00
                  </span>
                </div>
                <button 
                  onClick={downloadModeloCSV}
                  className="text-blue-600 font-black text-xs uppercase tracking-tighter hover:text-blue-700 transition-colors"
                >
                  BAIXAR MODELO .CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}