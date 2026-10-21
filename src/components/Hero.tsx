import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Star, ExternalLink, Tag, ChevronLeft, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';
import { Review } from '../types';

interface HeroProps {
  featuredReview?: Review | null;
  featuredReviews?: Review[];
  reviews?: Review[];
  onReadReview: (slug: string) => void;
  onAffiliateClick: (review: Review) => void;
}

export const Hero: React.FC<HeroProps> = ({
  featuredReview,
  featuredReviews,
  reviews,
  onReadReview,
  onAffiliateClick
}) => {
  // Aggregate items to display in carousel
  const items: Review[] = React.useMemo(() => {
    if (featuredReviews && featuredReviews.length > 0) return featuredReviews;
    if (reviews && reviews.length > 0) {
      const feats = reviews.filter(r => r.featured);
      return feats.length > 0 ? feats : reviews.slice(0, 5);
    }
    if (featuredReview) return [featuredReview];
    return [];
  }, [featuredReviews, reviews, featuredReview]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotation every 5.5 seconds unless user hovers
  useEffect(() => {
    if (items.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setDirection('next');
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length, isPaused]);

  if (items.length === 0) return null;

  const current = items[currentIndex] || items[0];

  const handlePrev = () => {
    setDirection('prev');
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setDirection('next');
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  return (
    <section 
      aria-label="Carrossel de Avaliações em Destaque"
      className="relative overflow-hidden bg-[#0B132B] text-white py-10 md:py-14 border-b border-slate-800 transition-colors select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Carousel Header Controls */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Carrossel de Avaliações em Destaque</span>
            </span>
            <span className="hidden sm:inline-block text-xs text-slate-400">
              Produtos testados e aprovados pela redação
            </span>
          </div>

          {items.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                aria-label={isPaused ? "Retomar rotação automática" : "Pausar rotação automática"}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
                title={isPaused ? "Retomar reprodução" : "Pausar rotação automática"}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>

              <span className="text-xs font-mono text-slate-400 px-2 tabular-nums">
                <span className="text-white font-bold">{currentIndex + 1}</span> / {items.length}
              </span>

              <button
                type="button"
                onClick={handlePrev}
                aria-label="Produto anterior"
                className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Próximo produto"
                className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Slide Content */}
        <div key={current.id} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center transition-all duration-300 ease-in-out">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-cyan-400">
              <span className="uppercase tracking-wider font-semibold text-cyan-300">{current.category}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span className="font-mono tabular-nums font-bold text-amber-300">{current.rating.toFixed(1)}</span>
                <span className="text-slate-400 font-normal">/ 5.0</span>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-300">Loja parceira: <strong className="text-white">{current.partnerStore}</strong></span>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {current.title}
            </h1>

            {/* Subtitle / Description */}
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed line-clamp-3">
              {current.subtitle}
            </p>

            {/* Price & Offer Highlight */}
            <div className="pt-2 space-y-1">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white">
                  {current.priceCurrent}
                </span>
                {current.priceOriginal && (
                  <span className="text-sm text-slate-400 line-through font-mono tabular-nums">
                    {current.priceOriginal}
                  </span>
                )}
                {current.discountPercent && (
                  <span className="text-xs font-bold text-[#00E5FF] bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-500/40 font-mono">
                    {current.discountPercent}
                  </span>
                )}
              </div>
              <p className="text-2xs text-slate-400 font-medium flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>* Preço sujeito a alteração pela loja parceira</span>
              </p>
            </div>

            {/* Actions */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onReadReview(current.slug)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-2 border border-slate-700"
              >
                <span>Ler Análise Completa</span>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              </button>

              <a
                href={current.affiliateUrl}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                onClick={() => onAffiliateClick(current)}
                className="px-6 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-lg hover:shadow-orange-500/20 flex items-center gap-2 whitespace-nowrap"
              >
                <span>Ver na {current.partnerStore}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

          </div>

          {/* Right Media Column */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 group">
              <img
                src={current.coverImage}
                alt={current.title}
                referrerPolicy="no-referrer"
                className="w-full h-64 sm:h-80 lg:h-88 object-cover transform group-hover:scale-103 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-transparent to-transparent opacity-80" />
              
              <div className="absolute top-3 right-3">
                <span className="bg-[#FF6B00] text-white text-3xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md">
                  ★ Escolha do Editor
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300">
                <span className="bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-md border border-slate-700/60 font-medium">
                  {current.partnerStore}
                </span>
                <span className="text-cyan-400 font-mono text-2xs bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                  {current.priceCurrent}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Thumbnails / Indicators Carousel Bar */}
        {items.length > 1 && (
          <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {items.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setDirection(idx > currentIndex ? 'next' : 'prev');
                    setCurrentIndex(idx);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-8 bg-cyan-400 ring-2 ring-cyan-400/30'
                      : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`Ir para produto ${idx + 1}: ${item.title}`}
                  title={item.title}
                />
              ))}
            </div>

            {/* Quick mini-cards */}
            <div className="hidden md:flex items-center gap-3">
              {items.map((item, idx) => (
                <button
                  key={`thumb-${item.id}`}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                    idx === currentIndex
                      ? 'bg-slate-800/90 border-cyan-500/50 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <img
                    src={item.coverImage}
                    alt=""
                    className="w-7 h-7 rounded object-cover"
                  />
                  <div className="max-w-[130px]">
                    <p className="text-2xs font-semibold truncate leading-tight">{item.title}</p>
                    <p className="text-3xs text-cyan-400 font-mono">{item.priceCurrent}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
