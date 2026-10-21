import React from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { Banner } from '../types';

interface AdBannerSlotProps {
  position: 'header' | 'sidebar' | 'in_article';
  banners: Banner[];
  onBannerClick?: (banner: Banner) => void;
}

export const AdBannerSlot: React.FC<AdBannerSlotProps> = ({
  position,
  banners,
  onBannerClick
}) => {
  const activeBanner = banners.find(b => b.position === position && b.active);

  if (!activeBanner) {
    return null;
  }

  const handleClick = () => {
    if (onBannerClick) {
      onBannerClick(activeBanner);
    }
  };

  if (position === 'header') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-4">
        <a
          href={activeBanner.targetUrl}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          onClick={handleClick}
          className="group block relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 transition-all shadow-xs hover:shadow-md"
        >
          <img
            src={activeBanner.imageUrl}
            alt={activeBanner.altText || activeBanner.title}
            referrerPolicy="no-referrer"
            className="w-full h-24 sm:h-32 object-cover object-center group-hover:scale-102 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B132B]/90 via-transparent to-transparent flex items-center p-4 sm:p-6">
            <div className="max-w-md">
              <span className="text-2xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Oferta em Destaque</span>
              </span>
              <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                {activeBanner.title}
              </h4>
            </div>
          </div>
          <div className="absolute top-2 right-2 bg-black/60 text-slate-300 text-3xs uppercase tracking-widest px-1.5 py-0.5 rounded">
            Patrocinado
          </div>
        </a>
      </div>
    );
  }

  if (position === 'sidebar') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between text-2xs text-slate-400 uppercase tracking-wider font-semibold">
          <span>Anúncio / Oferta</span>
          <span className="text-3xs">Patrocinado</span>
        </div>
        <a
          href={activeBanner.targetUrl}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          onClick={handleClick}
          className="group block relative rounded-lg overflow-hidden border border-slate-100 bg-slate-900"
        >
          <img
            src={activeBanner.imageUrl}
            alt={activeBanner.altText || activeBanner.title}
            referrerPolicy="no-referrer"
            className="w-full h-44 object-cover group-hover:scale-103 transition-transform duration-300"
          />
          <div className="p-3 bg-slate-900 text-white">
            <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
              {activeBanner.title}
            </h4>
            <div className="mt-2 flex items-center gap-1 text-2xs text-[#FF6B00] font-semibold">
              <span>Aproveitar Desconto</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </div>
        </a>
      </div>
    );
  }

  // in_article position
  return (
    <div className="my-8">
      <a
        href={activeBanner.targetUrl}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        onClick={handleClick}
        className="group relative block rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm hover:shadow-md transition-all"
      >
        <img
          src={activeBanner.imageUrl}
          alt={activeBanner.altText || activeBanner.title}
          referrerPolicy="no-referrer"
          className="w-full h-32 sm:h-40 object-cover group-hover:scale-102 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B132B]/90 via-[#0B132B]/60 to-transparent flex items-center p-5 sm:p-6">
          <div className="max-w-md space-y-1">
            <span className="text-2xs font-semibold text-cyan-400 uppercase tracking-wider">
              Recomendação Especial
            </span>
            <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
              {activeBanner.title}
            </h4>
            <p className="text-xs text-slate-300 flex items-center gap-1 pt-1">
              <span>Clique para conferir as condições exclusivas na loja parceira</span>
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            </p>
          </div>
        </div>
        <div className="absolute top-2 right-2 bg-black/60 text-slate-400 text-3xs uppercase tracking-widest px-1.5 py-0.5 rounded">
          Publicidade
        </div>
      </a>
    </div>
  );
};
