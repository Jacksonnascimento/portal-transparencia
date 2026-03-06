'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import diariaService, { DiariaRequest, DiariaResponse } from '@/services/diariaService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  corDestaque: string;
  modo: 'create' | 'edit' | 'view';
  dadosIniciais: DiariaResponse | null;
}

export function DiariaFormModal({ isOpen, onClose, onSuccess, corDestaque, modo, dadosIniciais }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<DiariaRequest>({
    exercicio: new Date().getFullYear(),
    nomeFavorecido: '',
    cpfCnpjFavorecido: '',
    cargoFavorecido: '',
    destinoViagem: '',
    motivoViagem: '',
    dataSaida: '',
    dataRetorno: '',
    quantidadeDiarias: 0,
    valorDiarias: 0,
    valorPassagens: 0,
    valorDevolvido: 0,
    numeroProcesso: '',
    portariaConcessao: ''
  });

  // Popula o form quando abre para Editar ou Visualizar
  useEffect(() => {
    if (isOpen) {
      if (dadosIniciais) {
        setFormData({ ...dadosIniciais });
      } else {
        setFormData({
          exercicio: new Date().getFullYear(),
          nomeFavorecido: '',
          cpfCnpjFavorecido: '',
          cargoFavorecido: '',
          destinoViagem: '',
          motivoViagem: '',
          dataSaida: '',
          dataRetorno: '',
          quantidadeDiarias: 0,
          valorDiarias: 0,
          valorPassagens: 0,
          valorDevolvido: 0,
          numeroProcesso: '',
          portariaConcessao: ''
        });
      }
      setError(null);
    }
  }, [isOpen, dadosIniciais]);

  if (!isOpen) return null;

  const isReadOnly = modo === 'view';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (isReadOnly) return;
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setLoading(true);
    setError(null);

    try {
      if (modo === 'edit' && dadosIniciais?.id) {
        await diariaService.atualizar(dadosIniciais.id, formData);
      } else {
        await diariaService.criar(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao processar os dados. Verifique a conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">
              {modo === 'view' ? 'Detalhes da Diária' : modo === 'edit' ? 'Editar Registro' : 'Novo Registro de Diária'}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              {modo === 'view' ? 'Apenas Visualização' : 'Preencha os dados de deslocamento'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center border border-red-100 text-xs font-bold animate-shake">
              <AlertCircle className="mr-2 flex-shrink-0" size={16} /> {error}
            </div>
          )}

          {/* SEÇÃO 01: DADOS ADMINISTRATIVOS */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">01. Dados Administrativos</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block px-1">Exercício</label>
                <input disabled={isReadOnly} required type="number" name="exercicio" value={formData.exercicio} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm font-bold disabled:opacity-60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block px-1">Número do Processo</label>
                <input disabled={isReadOnly} type="text" name="numeroProcesso" value={formData.numeroProcesso} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm disabled:opacity-60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block px-1">Portaria de Concessão</label>
                <input disabled={isReadOnly} type="text" name="portariaConcessao" value={formData.portariaConcessao} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm disabled:opacity-60" />
              </div>
            </div>
          </div>

          {/* SEÇÃO 02: FAVORECIDO */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">02. Informações do Favorecido</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block px-1">Nome Completo</label>
                <input disabled={isReadOnly} required type="text" name="nomeFavorecido" value={formData.nomeFavorecido} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm font-bold disabled:opacity-60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block px-1">CPF ou CNPJ</label>
                <input disabled={isReadOnly} required type="text" name="cpfCnpjFavorecido" value={formData.cpfCnpjFavorecido} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm font-mono disabled:opacity-60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block px-1">Cargo / Função</label>
                <input disabled={isReadOnly} type="text" name="cargoFavorecido" value={formData.cargoFavorecido} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm disabled:opacity-60" />
              </div>
            </div>
          </div>

          {/* SEÇÃO 03: VIAGEM */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">03. Itinerário e Motivo</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block px-1">Destino</label>
                <input disabled={isReadOnly} required type="text" name="destinoViagem" value={formData.destinoViagem} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm disabled:opacity-60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block px-1">Data Saída</label>
                <input disabled={isReadOnly} required type="date" name="dataSaida" value={formData.dataSaida} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm disabled:opacity-60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block px-1">Data Retorno</label>
                <input disabled={isReadOnly} required type="date" name="dataRetorno" value={formData.dataRetorno} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm disabled:opacity-60" />
              </div>
              <div className="md:col-span-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block px-1">Motivo da Viagem</label>
                <textarea disabled={isReadOnly} required name="motivoViagem" value={formData.motivoViagem} onChange={handleChange} rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-black text-sm disabled:opacity-60" />
              </div>
            </div>
          </div>

          {/* SEÇÃO 04: VALORES */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">04. Valores e Quantitativos</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block px-1">Qtd. Diárias</label>
                <input disabled={isReadOnly} type="number" step="0.5" name="quantidadeDiarias" value={formData.quantidadeDiarias} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block px-1">Valor Diárias (R$)</label>
                <input disabled={isReadOnly} type="number" step="0.01" name="valorDiarias" value={formData.valorDiarias} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold disabled:opacity-60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block px-1">Passagens (R$)</label>
                <input disabled={isReadOnly} type="number" step="0.01" name="valorPassagens" value={formData.valorPassagens} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold disabled:opacity-60" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-red-400 uppercase mb-1 block px-1 italic">Devolvido (R$)</label>
                <input disabled={isReadOnly} type="number" step="0.01" name="valorDevolvido" value={formData.valorDevolvido} onChange={handleChange} className="w-full px-3 py-2 bg-red-50/50 border border-red-100 rounded-lg font-bold text-red-700 disabled:opacity-60" />
              </div>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2 text-xs font-bold uppercase text-slate-500 hover:text-slate-800 transition-colors">
            {isReadOnly ? 'Fechar' : 'Cancelar'}
          </button>
          {!isReadOnly && (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              style={{ backgroundColor: corDestaque }}
              className="flex items-center gap-2 px-6 py-2 rounded-xl shadow-sm font-bold text-xs uppercase text-white transition-all hover:brightness-110 disabled:opacity-50"
            >
              <Save size={14} />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}