import React from 'react';
import { ComparisonGuide } from '../types';
import { Layers, ArrowRight, CheckCircle2, Star, Sparkles } from 'lucide-react';

interface GuideCardProps {
  guide: ComparisonGuide;
  onSelect: (slug: string) => void;
}

export const GuideCard: React.FC<GuideCardProps> = ({ guide, onSelect }) => {
  const topProduct = guide.products?.[0];
  const productCount = guide.products?.length || 0;

  return (
    <article 
      onClick={() => onSelect(guide.slug)}
      className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer h-full transform hover:-translate-y-1"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <img
          src={guide.coverImage || topProduct?.imageUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80'}
          alt={guide.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            const img = e.currentTarget;
            if (topProduct?.imageUrl && img.src !== topProduct.imageUrl) {
              img.src = topProduct.imageUrl;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent pointer-events-none" />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-3 py-1 bg-emerald-600/95 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Guia Comparativo
          </span>
          {guide.featured && (
            <span className="px-2.5 py-1 bg-amber-500/95 text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Destaque
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 text-white flex items-center justify-between text-xs font-medium">
          <span className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-slate-200">
            {guide.category}
          </span>
          <span className="bg-emerald-500/90 text-white font-semibold px-2.5 py-1 rounded-md shadow-sm">
            {productCount} {productCount === 1 ? 'Produto analisado' : 'Modelos comparados'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug mb-2">
            {guide.title}
          </h3>
          <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed mb-4">
            {guide.subtitle || guide.introContent}
          </p>

          {/* Quick Product Preview Pills */}
          {guide.products && guide.products.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                No pódio deste comparativo:
              </div>
              <ul className="text-xs text-slate-700 space-y-1">
                {guide.products.slice(0, 3).map((prod, idx) => (
                  <li key={prod.id || idx} className="flex items-center justify-between truncate">
                    <span className="truncate pr-2 font-medium">
                      <span className="font-bold text-slate-400 mr-1.5">#{idx + 1}</span>
                      {prod.title}
                    </span>
                    <span className="font-bold text-emerald-700 whitespace-nowrap text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded">
                      {prod.price}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center text-xs text-slate-500">
            <span>Atualizado em {new Date(guide.updatedAt || guide.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all">
            Ver Comparativo
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </article>
  );
};
