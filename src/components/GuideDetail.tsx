import React, { useEffect, useState } from 'react';
import { ComparisonGuide, ComparisonProductItem } from '../types';
import { 
  ArrowLeft, 
  ExternalLink, 
  Check, 
  X, 
  Star, 
  ShieldCheck, 
  HelpCircle, 
  Info, 
  ChevronRight, 
  Share2, 
  Sparkles, 
  Layers, 
  Award,
  ShoppingCart,
  FileText,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { StoreService } from '../services/store';

interface GuideDetailProps {
  guide: ComparisonGuide;
  onBack: () => void;
  onSelectReview?: (slug: string) => void;
}

export const GuideDetail: React.FC<GuideDetailProps> = ({ guide, onBack, onSelectReview }) => {
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (guide.id) {
      StoreService.incrementGuideViews(guide.id);
    }
  }, [guide.id]);

  const handleAffiliateClick = (product: ComparisonProductItem) => {
    StoreService.recordAffiliateClick(product.id || guide.id, product.partnerStore, product.title);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  // Structured Data Schema for Search Engines (ItemList + Article)
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    "name": guide.title,
    "description": guide.subtitle || guide.introContent.slice(0, 160),
    "datePublished": guide.createdAt,
    "dateModified": guide.updatedAt || guide.createdAt,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": guide.products.map((p, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": p.title,
        "description": p.summary,
        "image": p.imageUrl
      }))
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Schema.org JSON-LD Script Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Breadcrumb & Navigation Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-16 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar aos Comparativos</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copiedShare ? 'Link Copiado!' : 'Compartilhar'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              Guia & Comparativo Oficial
            </span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {guide.category}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto">
              <Calendar className="w-3.5 h-3.5" />
              Atualizado em {new Date(guide.updatedAt || guide.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            {guide.title}
          </h1>

          {guide.subtitle && (
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal mb-6">
              {guide.subtitle}
            </p>
          )}

          {/* Affiliate Disclosure Notice */}
          <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="font-bold">Aviso de transparência editorial:</span> As recomendações deste comparativo baseiam-se em especificações técnicas oficiais e critérios objetivos de desempenho. Os botões de compra utilizam links de afiliados oficiais das lojas parceiras (como Mercado Livre e Amazon), o que nos permite manter o portal no ar sem qualquer custo adicional para você.
            </p>
          </div>
        </header>

        {/* Introduction Section */}
        {guide.introContent && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-10 shadow-sm leading-relaxed text-slate-700 text-base space-y-4">
            {guide.introContent.split('\n\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </section>
        )}

        {/* Quick Comparison Table / Podium (Pódio dos Campeões) */}
        {guide.products && guide.products.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-12">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Award className="w-6 h-6 text-amber-400" />
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Tabela Comparativa Rápida</h2>
                  <p className="text-xs text-slate-300">Visão geral dos modelos selecionados e seus destaques</p>
                </div>
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold bg-white/10 px-3 py-1 rounded-full">
                {guide.products.length} Modelos Verificados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">Pos.</th>
                    <th className="py-3 px-4 min-w-[200px]">Produto</th>
                    <th className="py-3 px-4 min-w-[140px]">Destaque / Categoria</th>
                    <th className="py-3 px-4 min-w-[120px]">Melhor Preço</th>
                    <th className="py-3 px-4 min-w-[150px] text-right">Onde Comprar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {guide.products.map((prod, index) => (
                    <tr key={prod.id || index} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-4 text-center font-extrabold text-slate-400">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${
                          index === 0 ? 'bg-amber-100 text-amber-800 font-bold border border-amber-300' :
                          index === 1 ? 'bg-slate-200 text-slate-700 font-bold' :
                          index === 2 ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-600'
                        }`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.imageUrl}
                            alt={prod.title}
                            className="w-12 h-12 rounded-lg object-contain bg-white border border-slate-200 p-1 shrink-0"
                            loading="lazy"
                          />
                          <div>
                            <div className="font-bold text-slate-900 line-clamp-1">{prod.title}</div>
                            <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold mt-0.5">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{prod.rating.toFixed(1)}</span>
                              <span className="text-slate-400 font-normal">| {prod.partnerStore}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-md text-xs font-bold">
                          {prod.badge || (index === 0 ? 'Melhor Escolha' : 'Custo-Benefício')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-black text-slate-900 text-base">{prod.price}</div>
                        {prod.originalPrice && (
                          <div className="text-xs text-slate-400 line-through">{prod.originalPrice}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {prod.reviewSlug && onSelectReview && (
                            <button
                              onClick={() => onSelectReview(prod.reviewSlug!)}
                              title="Ler análise aprofundada individual"
                              className="px-2.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Análise
                            </button>
                          )}
                          <a
                            href={prod.affiliateUrl}
                            target="_blank"
                            rel="sponsored nofollow"
                            onClick={() => handleAffiliateClick(prod)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs hover:shadow transition-all cursor-pointer whitespace-nowrap"
                          >
                            <span>Ver Oferta</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Detailed Individual Product Breakdown Cards */}
        <section className="mb-14 space-y-10">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Análise Detalhada dos Modelos Selecionados
            </h2>
            <span className="text-xs text-slate-500 font-medium">Ordem de Recomendação</span>
          </div>

          {guide.products.map((prod, index) => (
            <article
              key={prod.id || index}
              id={`produto-${index + 1}`}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden hover:border-slate-300 transition-all"
            >
              {/* Product Card Header */}
              <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-slate-900 text-white text-xs font-black rounded-lg">
                      #{index + 1} no Ranking
                    </span>
                    {prod.badge && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300/80 text-xs font-extrabold rounded-lg flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                        {prod.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/50">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{prod.rating.toFixed(1)} / 5.0</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Product Image */}
                  <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 aspect-square flex items-center justify-center">
                    <img
                      src={prod.imageUrl}
                      alt={prod.title}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  {/* Summary & Price Info */}
                  <div className="md:col-span-8 flex flex-col justify-between h-full">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug mb-3">
                        {prod.title}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed mb-6">
                        {prod.summary}
                      </p>
                    </div>

                    {/* Price and CTA Box */}
                    <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-slate-500 font-medium">Preço verificado no {prod.partnerStore}:</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900">
                            {prod.price}
                          </span>
                          {prod.originalPrice && (
                            <span className="text-sm text-slate-400 line-through">
                              {prod.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5">
                        {/* Bi-directional Link to Full Single Review */}
                        {prod.reviewSlug && onSelectReview && (
                          <button
                            onClick={() => onSelectReview(prod.reviewSlug!)}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-slate-600" />
                            <span>Ler Análise Individual</span>
                          </button>
                        )}

                        {/* Direct Affiliate Buy CTA */}
                        <a
                          href={prod.affiliateUrl}
                          target="_blank"
                          rel="sponsored nofollow"
                          onClick={() => handleAffiliateClick(prod)}
                          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Comprar no {prod.partnerStore}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Specs & Pros/Cons */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* Specifications Grid */}
                {prod.keySpecs && prod.keySpecs.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Especificações Chave
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {prod.keySpecs.map((spec, sIdx) => (
                        <div key={sIdx} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                          <div className="text-[11px] font-bold text-slate-500 mb-0.5">{spec.label}</div>
                          <div className="text-xs font-bold text-slate-900 line-clamp-2">{spec.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pros and Cons Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pros */}
                  {prod.pros && prod.pros.length > 0 && (
                    <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-2.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Pontos Fortes</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {prod.pros.map((pro, pIdx) => (
                          <li key={pIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cons */}
                  {prod.cons && prod.cons.length > 0 && (
                    <div className="bg-rose-50/40 rounded-2xl border border-rose-100 p-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-2.5">
                        <X className="w-4 h-4 text-rose-600" />
                        <span>Pontos a Considerar</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {prod.cons.map((con, cIdx) => (
                          <li key={cIdx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Buying Guide Tips Section */}
        {guide.buyingTipsContent && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 mb-12 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-emerald-700">
              <ShieldCheck className="w-6 h-6" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Guia Prático: Como Escolher o Melhor para Você
              </h2>
            </div>
            <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-3">
              {guide.buyingTipsContent.split('\n\n').map((block, idx) => (
                <div key={idx}>
                  {block.startsWith('###') ? (
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-4 mb-2">
                      {block.replace(/^###\s*/, '')}
                    </h3>
                  ) : block.startsWith('1.') || block.startsWith('2.') || block.startsWith('3.') || block.startsWith('4.') ? (
                    <p className="pl-2 border-l-2 border-emerald-500 font-medium my-2">{block}</p>
                  ) : (
                    <p>{block}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ Accordion Section with Rich Snippets */}
        {guide.faqs && guide.faqs.length > 0 && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 mb-12 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Perguntas Frequentes sobre Este Comparativo
              </h2>
            </div>
            <div className="space-y-4">
              {guide.faqs.map((faq, fIdx) => (
                <details
                  key={fIdx}
                  className="group bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 open:bg-emerald-50/30 open:border-emerald-200/60 transition-colors"
                >
                  <summary className="font-bold text-slate-900 cursor-pointer list-none flex items-center justify-between gap-4 text-sm sm:text-base">
                    <span>{faq.question}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform shrink-0" />
                  </summary>
                  <p className="mt-3 text-slate-600 text-sm leading-relaxed border-t border-slate-200/50 pt-3">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Back & Exploration Footer */}
        <div className="text-center pt-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar e Explorar Mais Análises</span>
          </button>
        </div>
      </div>
    </div>
  );
};
