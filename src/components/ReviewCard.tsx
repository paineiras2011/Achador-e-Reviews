import React from 'react';
import { Star, ExternalLink, ArrowRight, Tag } from 'lucide-react';
import { Review } from '../types';

interface ReviewCardProps {
  review: Review;
  onReadReview: (slug: string) => void;
  onAffiliateClick: (review: Review) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onReadReview,
  onAffiliateClick
}) => {
  return (
    <article className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Cover Image Container */}
        <div 
          onClick={() => onReadReview(review.slug)}
          className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden cursor-pointer"
        >
          <img
            src={review.coverImage}
            alt={review.title}
            referrerPolicy="no-referrer"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.src && img.src.includes('.webp') && img.src.includes('mlstatic.com')) {
                img.src = img.src.replace('.webp', '.jpg');
              }
            }}
            className="w-full h-full object-contain p-2 bg-white group-hover:scale-104 transition-transform duration-300"
          />
          {review.discountPercent && (
            <div className="absolute top-3 left-3 bg-[#0B132B] text-[#00E5FF] text-2xs font-bold px-2 py-0.5 rounded font-mono border border-cyan-500/20">
              {review.discountPercent}
            </div>
          )}
          <div className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-xs text-slate-800 text-2xs font-semibold px-2 py-0.5 rounded border border-slate-200">
            {review.partnerStore}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 space-y-2.5">
          {/* Clean Unboxed Metadata (Zero-pill discipline) */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-600">{review.category}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <strong className="font-mono tabular-nums text-slate-800">{review.rating.toFixed(1)}</strong>
            </span>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onReadReview(review.slug)}
            className="font-bold text-base text-slate-900 group-hover:text-cyan-700 transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {review.title}
          </h3>

          {/* Subtitle / Snippet */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {review.subtitle}
          </p>

          {/* Price & Disclaimer */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-0.5">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold font-mono tabular-nums text-slate-950">
                  {review.priceCurrent}
                </span>
                {review.priceOriginal && (
                  <span className="text-xs text-slate-400 line-through font-mono tabular-nums">
                    {review.priceOriginal}
                  </span>
                )}
              </div>
              {review.discountPercent && (
                <span className="text-3xs font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200 font-mono">
                  {review.discountPercent}
                </span>
              )}
            </div>
            <p className="text-3xs text-slate-400 font-medium">
              * Preço sujeito a alteração
            </p>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-4 sm:p-5 pt-0 grid grid-cols-2 gap-2">
        <button
          onClick={() => onReadReview(review.slug)}
          className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <span>Ver Análise</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <a
          href={review.affiliateUrl}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            onAffiliateClick(review);
          }}
          className="w-full py-2 px-3 text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#e05e00] rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs whitespace-nowrap"
        >
          <span>Comprar</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </article>
  );
};
