import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { SiteSettings, Category } from '../types';
import type { InfoPageType } from './InfoPage';

interface FooterProps {
  settings?: SiteSettings;
  categories: Category[];
  onSelectCategory: (categoryName: string) => void;
  onSelectInfoPage?: (page: InfoPageType) => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  categories,
  onSelectCategory,
  onSelectInfoPage
}) => {
  const handleLink = (e: React.MouseEvent, action: () => void) => {
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      action();
    }
  };

  return (
    <footer className="bg-[#0B132B] text-slate-400 border-t border-slate-800 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Apresentação da Plataforma */}
          <div className="space-y-3">
            <div className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Achados</span>
              <span className="text-[#FF6B00]">&amp;</span>
              <span className="text-[#00E5FF]">Reviews</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {settings?.tagline || 'Análises aprofundadas, testes práticos e curadoria inteligente de compras. Encontre os melhores produtos com cupons e preços verificados.'}
            </p>
          </div>

          {/* Categorias Dinâmicas Crawláveis */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase mb-3">
              Categorias em Destaque
            </h4>
            <ul className="space-y-2 text-xs">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`/categoria/${cat.slug}`}
                    onClick={(e) => handleLink(e, () => onSelectCategory(cat.name))}
                    className="hover:text-cyan-400 transition-colors text-left inline-block"
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Garantia, Transparência e Links E-E-A-T */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase mb-3">
              Institucional &amp; Confiabilidade
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Ofertas verificadas nas maiores lojas oficiais</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Preços e estoques sujeitos a alteração pelas lojas parceiras</span>
              </div>
            </div>

            <nav aria-label="Links Institucionais" className="pt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              <a
                href="/sobre"
                onClick={(e) => onSelectInfoPage && handleLink(e, () => onSelectInfoPage('sobre'))}
                className="text-slate-300 hover:text-cyan-400 transition-colors"
              >
                Sobre Nós
              </a>
              <a
                href="/metodologia"
                onClick={(e) => onSelectInfoPage && handleLink(e, () => onSelectInfoPage('metodologia'))}
                className="text-slate-300 hover:text-cyan-400 transition-colors"
              >
                Metodologia
              </a>
              <a
                href="/privacidade"
                onClick={(e) => onSelectInfoPage && handleLink(e, () => onSelectInfoPage('privacidade'))}
                className="text-slate-300 hover:text-cyan-400 transition-colors"
              >
                Privacidade
              </a>
              <a
                href="/termos"
                onClick={(e) => onSelectInfoPage && handleLink(e, () => onSelectInfoPage('termos'))}
                className="text-slate-300 hover:text-cyan-400 transition-colors"
              >
                Termos de Uso
              </a>
            </nav>
          </div>

        </div>

        {/* Aviso de Transparência Legal de Afiliados */}
        <div className="pt-6 border-t border-slate-800 text-xs text-slate-400 leading-relaxed bg-[#070D1E] p-4 rounded-xl">
          <p className="font-semibold text-slate-300 mb-1">
            Transparência e Isenção Editorial:
          </p>
          <p>
            {settings?.affiliateDisclosure ||
              'O Achados & Reviews é um canal editorial independente. Ao comprar através dos links recomendados em nossas análises, podemos receber uma comissão das lojas parceiras sem qualquer custo adicional para você.'}
          </p>
        </div>

        {/* Rodapé Final com Direitos */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} Achados &amp; Reviews. Todos os direitos reservados.</p>
          <p>Desenvolvido para decisões de compra conscientes e econômicas.</p>
        </div>

      </div>
    </footer>
  );
};
