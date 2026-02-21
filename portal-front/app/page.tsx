import { Search, TrendingUp, Users, FileText } from 'lucide-react';
import api from '../services/api';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Transparência ao seu alcance.
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Consulte como o dinheiro público está sendo investido no seu município de forma clara e rápida.
        </p>
        
        <div className="mt-10 max-w-xl mx-auto relative">
          <input 
            type="text" 
            placeholder="O que você procura? (Ex: Salários, Obras, Receitas)"
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-black outline-none transition-all"
          />
          <Search className="absolute left-4 top-4 text-slate-400" size={24} />
        </div>
      </section>

      {/* Atalhos Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <QuickLinkCard 
          icon={<TrendingUp size={28} className="text-emerald-600" />}
          title="Receitas"
          description="Acompanhe a arrecadação do município em tempo real."
          href="/receitas"
        />
        <QuickLinkCard 
          icon={<FileText size={28} className="text-blue-600" />}
          title="Despesas"
          description="Veja onde e como o orçamento está sendo gasto."
          href="/despesas"
        />
        <QuickLinkCard 
          icon={<Users size={28} className="text-purple-600" />}
          title="Pessoal"
          description="Consulta de folha de pagamento e servidores."
          href="/pessoal"
        />
      </div>
    </div>
  );
}

// Componente auxiliar para os cards
function QuickLinkCard({ icon, title, description, href }: any) {
  return (
    <a href={href} className="group p-8 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
      <div className="mb-4 p-3 bg-slate-50 w-fit rounded-2xl group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100">
        {icon}
      </div>
      <h3 className="font-bold text-xl mb-2 text-slate-900">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </a>
  );
}