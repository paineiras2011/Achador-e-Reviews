import React, { useState } from 'react';
import { 
  Star, 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft, 
  Share2, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Tag, 
  Award, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { Review, Banner } from '../types';
import { AdBannerSlot } from './AdBannerSlot';
import { cleanOtherStores } from '../utils/storeHelpers';

interface ReviewDetailProps {
  review: Review;
  relatedReviews: Review[];
  banners: Banner[];
  onBack: () => void;
  onReadReview: (slug: string) => void;
  onAffiliateClick: (review: Review, storeName?: string) => void;
}

export const ReviewDetail: React.FC<ReviewDetailProps> = ({
  review,
  relatedReviews,
  banners,
  onBack,
  onReadReview,
  onAffiliateClick
}) => {
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]); // Open first FAQ by default
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleToggleFaq = (index: number) => {
    if (openFaqIndices.includes(index)) {
      setOpenFaqIndices(openFaqIndices.filter(i => i !== index));
    } else {
      setOpenFaqIndices([...openFaqIndices, index]);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: review.title,
        text: review.subtitle,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Breadcrumb & Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6 text-xs text-slate-500">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-600 hover:text-cyan-600 font-semibold transition-colors py-1 px-2.5 bg-white border border-slate-200 rounded-lg shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Catálogo</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 py-1 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            >
              {shareSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartilhar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Article Header Container */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-8 shadow-xs">
          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 mb-3">
            <span className="font-semibold text-cyan-600">{review.category}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Atualizado em {formatDate(review.updatedAt || review.createdAt)}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>5 min de leitura</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Preço e Disponibilidade Checados</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            {review.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6">
            {review.subtitle}
          </p>

          {/* MAIN BUY / CONVERSION BOX (High Conversion Hero Block) */}
          <div className="bg-gradient-to-br from-[#0B132B] to-[#1C2541] text-white rounded-xl p-5 sm:p-7 border border-slate-800 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Product Thumbnail */}
              <div className="md:col-span-4 lg:col-span-3">
                <div className="aspect-4/3 rounded-lg overflow-hidden bg-white border border-slate-700 flex items-center justify-center p-2">
                  <img
                    src={review.coverImage}
                    alt={review.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/src/assets/images/hero_tech_showcase_1792355762010.jpg';
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Price & Coupon */}
              <div className="md:col-span-8 lg:col-span-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{review.rating.toFixed(1)} / 5.0</span>
                  </div>
                  <span className="text-xs text-slate-400">Excelente Avaliação</span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-white">
                    {review.priceCurrent}
                  </span>
                  {review.priceOriginal && (
                    <span className="text-base text-slate-400 line-through font-mono tabular-nums">
                      {review.priceOriginal}
                    </span>
                  )}
                  {review.discountPercent && (
                    <span className="text-xs font-bold font-mono text-[#00E5FF] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                      {review.discountPercent}
                    </span>
                  )}
                </div>
                <p className="text-2xs text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>* Preço sujeito a alteração pela loja parceira sem aviso prévio</span>
                </p>
              </div>

              {/* Main Affiliate CTA Button */}
              <div className="md:col-span-12 lg:col-span-4 space-y-2.5">
                <a
                  href={review.affiliateUrl}
                  target="_blank"
                  rel="sponsored nofollow noopener noreferrer"
                  onClick={() => onAffiliateClick(review, review.partnerStore)}
                  className="w-full py-3.5 px-6 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-sm sm:text-base rounded-xl transition-all shadow-lg hover:shadow-orange-500/30 flex items-center justify-center gap-2 text-center"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Ver Oferta na {review.partnerStore}</span>
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>

                <p className="text-3xs text-center text-slate-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  <span>Link oficial e seguro com garantia do vendedor</span>
                </p>

                {/* Additional Partner Stores (Garante que nunca mostre a mesma loja com preços divergentes) */}
                {(() => {
                  const validOtherStores = cleanOtherStores(review.otherStores, review.partnerStore, review.affiliateUrl);
                  if (validOtherStores.length === 0) return null;
                  return (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-3xs text-slate-400 uppercase tracking-wider">
                        <span>Comparar em outras lojas:</span>
                        <span>* Preços sujeitos a alteração</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {validOtherStores.map((store, idx) => (
                          <a
                            key={idx}
                            href={store.url}
                            target="_blank"
                            rel="sponsored nofollow noopener noreferrer"
                            onClick={() => onAffiliateClick(review, store.storeName)}
                            className="py-1.5 px-2.5 bg-slate-800/90 hover:bg-slate-700 text-xs text-slate-200 rounded-md flex items-center justify-between border border-slate-700 transition-colors"
                          >
                            <span className="font-medium truncate">{store.storeName}</span>
                            <span className="font-mono text-cyan-300 font-semibold shrink-0">{store.price}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        </div>

        {/* Content Layout: 2 Columns (Main Article & Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Article Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* PROS & CONS BOX (Visual Grid) */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span>Prós e Contras: Veredito Rápido</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pros */}
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pontos Positivos</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {review.pros.map((pro, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-amber-600" />
                    <span>Pontos de Atenção</span>
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {review.cons.map((con, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* TECHNICAL SPECIFICATIONS TABLE */}
            {review.specifications && review.specifications.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h2 className="text-lg font-bold text-slate-900 mb-4">
                  Ficha Técnica &amp; Especificações
                </h2>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {review.specifications.map((spec, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-3 p-3.5 hover:bg-slate-50 transition-colors">
                      <span className="font-semibold text-slate-700 sm:col-span-1">{spec.label}</span>
                      <span className="text-slate-600 sm:col-span-2 font-mono sm:font-sans">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* In-Article Monetization Banner Slot */}
            <AdBannerSlot position="in_article" banners={banners} />

            {/* FULL ARTICLE BODY */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Análise Completa e Testes Práticos
              </h2>
              
              <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed space-y-4">
                {review.content.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('### ')) {
                    return (
                      <h3 key={idx} className="text-base sm:text-lg font-bold text-slate-900 pt-3">
                        {paragraph.replace('### ', '')}
                      </h3>
                    );
                  }
                  return (
                    <p key={idx} className="leading-relaxed">
                      {paragraph.trim()}
                    </p>
                  );
                })}
              </div>
            </section>

            {/* FINAL VERDICT & SCORE BREAKDOWN */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-[#FF6B00]" />
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Veredito Final: Vale a Pena Comprar?
                </h2>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80 mb-6 font-medium">
                {review.verdict}
              </p>

              {/* Score Criterion Breakdown */}
              {review.scoreBreakdown && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-6">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-3xs uppercase tracking-wider text-slate-400 block mb-1">Custo-Benefício</span>
                    <span className="text-lg font-bold font-mono text-slate-900">{review.scoreBreakdown.costBenefit} / 5</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-3xs uppercase tracking-wider text-slate-400 block mb-1">Desempenho</span>
                    <span className="text-lg font-bold font-mono text-slate-900">{review.scoreBreakdown.performance} / 5</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-3xs uppercase tracking-wider text-slate-400 block mb-1">Construção</span>
                    <span className="text-lg font-bold font-mono text-slate-900">{review.scoreBreakdown.buildQuality} / 5</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-3xs uppercase tracking-wider text-slate-400 block mb-1">Usabilidade</span>
                    <span className="text-lg font-bold font-mono text-slate-900">{review.scoreBreakdown.usability} / 5</span>
                  </div>
                </div>
              )}

              {/* Bottom CTA Reminder */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500">Melhor oferta encontrada hoje:</div>
                  <div className="text-2xl font-bold font-mono text-slate-900">{review.priceCurrent}</div>
                </div>

                <a
                  href={review.affiliateUrl}
                  target="_blank"
                  rel="sponsored nofollow noopener noreferrer"
                  onClick={() => onAffiliateClick(review, review.partnerStore)}
                  className="w-full sm:w-auto py-3 px-6 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Garantir Preço na {review.partnerStore}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </section>

            {/* FREQUENTLY ASKED QUESTIONS (FAQ with Schema markup) */}
            {review.faqs && review.faqs.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                  Perguntas Frequentes sobre o Produto (FAQ)
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                  Dúvidas comuns levantadas por compradores antes de fechar o pedido:
                </p>

                <div className="space-y-3">
                  {review.faqs.map((faq, idx) => {
                    const isOpen = openFaqIndices.includes(idx);
                    return (
                      <div
                        key={idx}
                        className="border border-slate-200 rounded-xl overflow-hidden transition-colors"
                      >
                        <button
                          onClick={() => handleToggleFaq(idx)}
                          className="w-full p-4 text-left font-semibold text-xs sm:text-sm text-slate-800 hover:text-cyan-600 transition-colors flex items-center justify-between gap-4 bg-slate-50/50"
                        >
                          <span>{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="p-4 bg-white text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Sticky Purchase Widget Mini */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Resumo da Oferta
              </h3>
              
              <div className="flex items-center gap-3">
                <img
                  src={review.coverImage}
                  alt={review.title}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                />
                <div className="space-y-1 overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{review.title}</h4>
                  <div className="text-sm font-bold font-mono text-slate-950">{review.priceCurrent}</div>
                  <div className="text-3xs text-slate-400 font-medium">* Preço sujeito a alteração</div>
                  <div className="text-3xs text-emerald-600 font-medium">Estoque verificado</div>
                </div>
              </div>

              <a
                href={review.affiliateUrl}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                onClick={() => onAffiliateClick(review, review.partnerStore)}
                className="w-full py-2.5 px-4 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <span>Ir para a Loja Oficial</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Sidebar Monetization Banner Slot */}
            <AdBannerSlot position="sidebar" banners={banners} />

            {/* Related Products / Competitor Alternatives */}
            {relatedReviews.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Outros Achados Recomendados
                </h3>
                
                <div className="space-y-3">
                  {relatedReviews.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onReadReview(rel.slug)}
                      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                    >
                      <img
                        src={rel.coverImage}
                        alt={rel.title}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-md object-cover border border-slate-200 shrink-0"
                      />
                      <div className="overflow-hidden space-y-0.5">
                        <h5 className="text-xs font-semibold text-slate-800 group-hover:text-cyan-600 transition-colors line-clamp-2 leading-snug">
                          {rel.title}
                        </h5>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-slate-900">{rel.priceCurrent}</span>
                          <span className="flex items-center text-3xs text-amber-500 font-mono">
                            ★ {rel.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
