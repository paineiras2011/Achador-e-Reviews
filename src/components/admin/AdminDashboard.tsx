import React, { useState } from 'react';
import { 
  FileText, 
  MousePointerClick, 
  Eye, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Settings, 
  Image as ImageIcon, 
  ArrowLeft,
  LogOut,
  TrendingUp,
  Clock,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  ShoppingBag,
  Award,
  BookOpen,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  X
} from 'lucide-react';
import { Review, Category, Banner, SiteSettings, AffiliateClick, ComparisonGuide, PostKit } from '../../types';
import { BannerManager } from './BannerManager';
import { CategoryManager } from './CategoryManager';
import { SiteSettingsManager } from './SiteSettingsManager';
import { buildClientPostKit, sanitizePostKit } from '../../utils/postKitHelpers';

interface AdminDashboardProps {
  adminEmail: string;
  reviews: Review[];
  guides: ComparisonGuide[];
  categories: Category[];
  banners: Banner[];
  settings: SiteSettings;
  stats: {
    totalReviews: number;
    totalGuides?: number;
    totalCategories: number;
    totalBanners: number;
    totalViews: number;
    totalClicks: number;
    recentClicks: AffiliateClick[];
  };
  onOpenCreateReview: () => void;
  onEditReview: (review: Review) => void;
  onSaveReview?: (review: Review) => Promise<void>;
  onDeleteReview: (id: string) => void;
  onViewReview: (slug: string) => void;
  onOpenCreateGuide: () => void;
  onEditGuide: (guide: ComparisonGuide) => void;
  onSaveGuide?: (guide: ComparisonGuide) => Promise<void>;
  onDeleteGuide: (id: string) => void;
  onViewGuide: (slug: string) => void;
  onSaveCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onSaveBanner: (banner: Banner) => void;
  onSaveSettings: (settings: SiteSettings) => void;
  onLogout: () => void;
  onExitToSite: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminEmail,
  reviews,
  guides = [],
  categories,
  banners,
  settings,
  stats,
  onOpenCreateReview,
  onEditReview,
  onSaveReview,
  onDeleteReview,
  onViewReview,
  onOpenCreateGuide,
  onEditGuide,
  onSaveGuide,
  onDeleteGuide,
  onViewGuide,
  onSaveCategory,
  onDeleteCategory,
  onSaveBanner,
  onSaveSettings,
  onLogout,
  onExitToSite
}) => {
  const [activeTab, setActiveTab] = useState<'reviews' | 'guides' | 'categories' | 'banners' | 'settings' | 'clicks'>('reviews');
  const [searchTerm, setSearchTerm] = useState('');
  const [guideSearchTerm, setGuideSearchTerm] = useState('');
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [guideToDelete, setGuideToDelete] = useState<ComparisonGuide | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [regeneratingReviewId, setRegeneratingReviewId] = useState<string | null>(null);
  const [postKitModalTarget, setPostKitModalTarget] = useState<{
    type: 'review' | 'guide';
    item: Review | ComparisonGuide;
    kit: PostKit;
  } | null>(null);
  const [isRegeneratingKit, setIsRegeneratingKit] = useState(false);
  const [copiedKitField, setCopiedKitField] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleCopyKitText = async (field: string, text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKitField(field);
      setTimeout(() => setCopiedKitField(prev => (prev === field ? null : prev)), 2000);
    } catch {
      // Ignora erro de clipboard
    }
  };

  const handleOpenReviewPostKit = async (review: Review) => {
    const existingKit = sanitizePostKit(review.postKit);
    const initialKit = existingKit || buildClientPostKit({
      title: review.title,
      slug: review.slug,
      priceCurrent: review.priceCurrent,
      priceOriginal: review.priceOriginal,
      partnerStore: review.partnerStore,
      affiliateUrl: review.affiliateUrl,
      category: review.category,
      rating: review.rating,
      pros: review.pros,
      verdict: review.verdict,
      type: 'review'
    });
    setCopiedKitField(null);
    setPostKitModalTarget({ type: 'review', item: review, kit: initialKit });

    // Se ainda não tinha salvo no Firestore, persiste automaticamente
    if (!existingKit && onSaveReview) {
      try {
        await onSaveReview({ ...review, postKit: initialKit, updatedAt: new Date().toISOString() });
      } catch {
        // Ignora erro silencioso de backfill
      }
    }
  };

  const handleOpenGuidePostKit = async (guide: ComparisonGuide) => {
    const existingKit = sanitizePostKit(guide.postKit);
    const pros = (guide.products || []).flatMap(p => p.pros || []).filter(Boolean).slice(0, 3);
    const initialKit = existingKit || buildClientPostKit({
      title: guide.title,
      slug: guide.slug,
      category: guide.category,
      pros,
      verdict: guide.subtitle,
      type: 'guide'
    });
    setCopiedKitField(null);
    setPostKitModalTarget({ type: 'guide', item: guide, kit: initialKit });

    if (!existingKit && onSaveGuide) {
      try {
        await onSaveGuide({ ...guide, postKit: initialKit, updatedAt: new Date().toISOString() });
      } catch {
        // Ignora erro silencioso de backfill
      }
    }
  };

  const handleRegeneratePostKitInModal = async () => {
    if (!postKitModalTarget) return;
    setIsRegeneratingKit(true);

    const isReview = postKitModalTarget.type === 'review';
    const item = postKitModalTarget.item;
    let freshKit: PostKit | undefined;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);
      const payload = isReview
        ? {
            title: (item as Review).title,
            slug: (item as Review).slug,
            priceCurrent: (item as Review).priceCurrent,
            priceOriginal: (item as Review).priceOriginal || '',
            partnerStore: (item as Review).partnerStore,
            affiliateUrl: (item as Review).affiliateUrl,
            category: (item as Review).category,
            rating: (item as Review).rating,
            pros: (item as Review).pros,
            cons: (item as Review).cons,
            verdict: (item as Review).verdict,
            type: 'review'
          }
        : {
            title: (item as ComparisonGuide).title,
            slug: (item as ComparisonGuide).slug,
            category: (item as ComparisonGuide).category,
            pros: ((item as ComparisonGuide).products || []).flatMap(p => p.pros || []).filter(Boolean).slice(0, 3),
            verdict: (item as ComparisonGuide).subtitle,
            type: 'guide'
          };

      const res = await fetch('/api/generate-post-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          freshKit = sanitizePostKit(json.data);
        }
      }
    } catch {
      // Usa fallback determinístico abaixo
    }

    if (!freshKit) {
      freshKit = isReview
        ? buildClientPostKit({
            title: (item as Review).title,
            slug: (item as Review).slug,
            priceCurrent: (item as Review).priceCurrent,
            priceOriginal: (item as Review).priceOriginal,
            partnerStore: (item as Review).partnerStore,
            affiliateUrl: (item as Review).affiliateUrl,
            category: (item as Review).category,
            rating: (item as Review).rating,
            pros: (item as Review).pros,
            verdict: (item as Review).verdict,
            type: 'review'
          })
        : buildClientPostKit({
            title: (item as ComparisonGuide).title,
            slug: (item as ComparisonGuide).slug,
            category: (item as ComparisonGuide).category,
            pros: ((item as ComparisonGuide).products || []).flatMap(p => p.pros || []).filter(Boolean).slice(0, 3),
            verdict: (item as ComparisonGuide).subtitle,
            type: 'guide'
          });
    }

    setPostKitModalTarget(prev => (prev ? { ...prev, kit: freshKit! } : null));

    try {
      if (isReview && onSaveReview) {
        await onSaveReview({ ...(item as Review), postKit: freshKit, updatedAt: new Date().toISOString() });
      } else if (!isReview && onSaveGuide) {
        await onSaveGuide({ ...(item as ComparisonGuide), postKit: freshKit, updatedAt: new Date().toISOString() });
      }
      showToast('Kit para Postagem atualizado e salvo com sucesso!');
    } catch {
      // Mantém visível no modal
    } finally {
      setIsRegeneratingKit(false);
    }
  };

  const handleRegenerateReviewAI = async (review: Review) => {
    if (!onSaveReview) return;
    setRegeneratingReviewId(review.id);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      const res = await fetch('/api/enrich-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: review.title,
          category: review.category,
          affiliateUrl: review.affiliateUrl,
          categories: categories.map(c => c.name),
          priceCurrent: review.priceCurrent,
          priceOriginal: review.priceOriginal || '',
          partnerStore: review.partnerStore,
          slug: review.slug
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error('Falha ao regenerar análise técnica');
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error('Resposta inválida da IA');
      }

      const d = json.data;
      const updatedKit = sanitizePostKit(d.postKit) || buildClientPostKit({
        title: review.title,
        slug: review.slug,
        priceCurrent: review.priceCurrent,
        priceOriginal: review.priceOriginal,
        partnerStore: review.partnerStore,
        affiliateUrl: review.affiliateUrl,
        category: review.category,
        rating: review.rating,
        pros: d.pros || review.pros,
        verdict: d.verdict || review.verdict,
        type: 'review'
      });

      const updatedReview: Review = {
        ...review,
        subtitle: d.subtitle || review.subtitle,
        pros: Array.isArray(d.pros) && d.pros.length > 0 ? d.pros : review.pros,
        cons: Array.isArray(d.cons) && d.cons.length > 0 ? d.cons : review.cons,
        specifications: Array.isArray(d.specifications) && d.specifications.length > 0 ? d.specifications : review.specifications,
        content: d.content || review.content,
        verdict: d.verdict || review.verdict,
        faqs: Array.isArray(d.faqs) && d.faqs.length > 0 ? d.faqs : review.faqs,
        scoreBreakdown: {
          costBenefit: Number(d.scoreCostBenefit) || review.scoreBreakdown?.costBenefit || 4.8,
          performance: Number(d.scorePerformance) || review.scoreBreakdown?.performance || 4.8,
          buildQuality: Number(d.scoreBuild) || review.scoreBreakdown?.buildQuality || 4.7,
          usability: Number(d.scoreUsability) || review.scoreBreakdown?.usability || 4.9
        },
        postKit: updatedKit,
        updatedAt: new Date().toISOString()
      };

      await onSaveReview(updatedReview);
      showToast(`Review e Kit para Postagem de "${review.title}" atualizados com especificações reais!`);
    } catch (err) {
      console.error('Erro ao regenerar review:', err);
      showToast(`Não foi possível atualizar "${review.title}" agora. Tente novamente em instantes.`);
    } finally {
      setRegeneratingReviewId(null);
    }
  };

  const filteredReviews = reviews.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.partnerStore.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGuides = (guides || []).filter(g =>
    g.title.toLowerCase().includes(guideSearchTerm.toLowerCase()) ||
    g.category.toLowerCase().includes(guideSearchTerm.toLowerCase()) ||
    g.products?.some(p => p.title.toLowerCase().includes(guideSearchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      
      {/* Topo Administrativo */}
      <header className="bg-[#0B132B] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <button
              onClick={onExitToSite}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white py-1 px-2.5 rounded bg-slate-800/80 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ver Site Público</span>
            </button>
            <div className="h-4 w-px bg-slate-700 hidden sm:block" />
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">Painel do Gestor</span>
              <span className="text-3xs text-slate-400 font-mono hidden md:inline">({adminEmail})</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-rose-400 py-1.5 px-3 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair do Painel</span>
            </button>
          </div>

        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Painel de Indicadores (Métricas) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8">
          
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Avaliações</span>
              <FileText className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {stats.totalReviews}
            </div>
            <div className="text-3xs text-emerald-600 font-medium mt-1">Produtos únicos</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Guias &amp; Comparativos</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {guides.length}
            </div>
            <div className="text-3xs text-amber-600 font-medium mt-1">Artigos multi-produtos</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Visualizações Totais</span>
              <Eye className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {stats.totalViews.toLocaleString('pt-BR')}
            </div>
            <div className="text-3xs text-slate-400 mt-1">Leituras de artigos</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Cliques de Afiliados</span>
              <MousePointerClick className="w-4 h-4 text-[#FF6B00]" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#FF6B00]">
              {Math.max(stats.totalClicks, reviews.reduce((acc, r) => acc + (r.clicksCount || 0), 0)).toLocaleString('pt-BR')}
            </div>
            <div className="text-3xs text-emerald-600 font-medium mt-1">Tráfego de conversão</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Categorias Ativas</span>
              <Layers className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {categories.length}
            </div>
            <div className="text-3xs text-cyan-600 font-medium mt-1">100% configuráveis</div>
          </div>

        </div>

        {/* Abas de Navegação */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-2 px-4 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-[#0B132B] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Avaliações ({reviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('guides')}
            className={`py-2 px-4 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'guides'
                ? 'bg-[#0B132B] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Guias &amp; Comparativos ({guides.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-4 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-[#0B132B] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Categorias ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('banners')}
            className={`py-2 px-4 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'banners'
                ? 'bg-[#0B132B] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Anúncios &amp; Banners ({banners.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('clicks')}
            className={`py-2 px-4 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'clicks'
                ? 'bg-[#0B132B] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>Relatório de Cliques</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-4 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#0B132B] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>Configurações do Site</span>
          </button>
        </div>

        {/* ABA: REVIEWS CRUD */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <input
                type="text"
                placeholder="Filtrar por produto, loja parceira ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />

              <button
                onClick={onOpenCreateReview}
                className="py-2 px-4 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Nova Avaliação</span>
              </button>
            </div>

            {feedbackMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackMessage}</span>
              </div>
            )}

            {/* Tabela de Avaliações */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-3xs border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Produto Avaliado</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Preço Atual</th>
                      <th className="py-3 px-4">Loja Afiliada</th>
                      <th className="py-3 px-4 text-center">Cliques</th>
                      <th className="py-3 px-4 text-center">Visualizações</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReviews.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Nenhuma avaliação encontrada. Clique em &quot;Cadastrar Nova Avaliação&quot; para adicionar.
                        </td>
                      </tr>
                    ) : (
                      filteredReviews.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={r.coverImage}
                                alt={r.title}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                              <div className="max-w-xs space-y-0.5">
                                <h4 className="font-bold text-slate-900 line-clamp-1">{r.title}</h4>
                                <div className="text-3xs text-slate-400 font-mono">/{r.slug}</div>
                                {r.featured && (
                                  <span className="inline-block text-3xs text-cyan-600 font-bold bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200">
                                    Destaque do Topo
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-medium text-slate-700">
                            {r.category}
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {r.priceCurrent}
                          </td>

                          <td className="py-3 px-4 text-slate-700">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-2xs">
                              {r.partnerStore}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                              (r.clicksCount || 0) > 0
                                ? 'bg-orange-50 text-[#FF6B00] border border-orange-200 shadow-2xs'
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              <MousePointerClick className="w-3.5 h-3.5" />
                              <span>{(r.clicksCount || 0).toLocaleString('pt-BR')}</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center font-mono text-slate-600">
                            {r.viewsCount || 0}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenReviewPostKit(r)}
                                title="Abrir Kit para Postagem (WhatsApp, Instagram, Shorts e SEO)"
                                className="p-1.5 text-slate-400 hover:text-[#FF6B00] rounded-md hover:bg-orange-50 transition-colors cursor-pointer"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              {onSaveReview && (
                                <button
                                  type="button"
                                  disabled={regeneratingReviewId === r.id}
                                  onClick={() => handleRegenerateReviewAI(r)}
                                  title="Regenerar Ficha Técnica, Prós/Contras, FAQs e Kit com IA"
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {regeneratingReviewId === r.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                                  ) : (
                                    <Sparkles className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => onViewReview(r.slug)}
                                title="Ver no site público"
                                className="p-1.5 text-slate-400 hover:text-cyan-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onEditReview(r)}
                                title="Editar avaliação"
                                className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setReviewToDelete(r)}
                                title="Excluir avaliação"
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal de Confirmação de Exclusão (100% Funcional sem alert/confirm) */}
            {reviewToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Excluir Avaliação</h3>
                      <p className="text-xs text-slate-500">Esta ação não poderá ser desfeita.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
                    Tem certeza de que deseja excluir permanentemente o produto: <strong className="text-slate-900 block mt-1">"{reviewToDelete.title}"</strong>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setReviewToDelete(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = reviewToDelete.id;
                        const targetTitle = reviewToDelete.title;
                        setReviewToDelete(null);
                        onDeleteReview(targetId);
                        setFeedbackMessage(`Avaliação "${targetTitle}" excluída com sucesso!`);
                        setTimeout(() => setFeedbackMessage(null), 3500);
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
                    >
                      Sim, Excluir Avaliação
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA: GUIAS & COMPARATIVOS */}
        {activeTab === 'guides' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <input
                type="text"
                placeholder="Filtrar comparativo por título, categoria ou produto..."
                value={guideSearchTerm}
                onChange={(e) => setGuideSearchTerm(e.target.value)}
                className="w-full sm:max-w-md px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
              />

              <button
                onClick={onOpenCreateGuide}
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-xs hover:shadow cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Novo Guia Comparativo</span>
              </button>
            </div>

            {feedbackMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackMessage}</span>
              </div>
            )}

            {/* Tabela de Guias */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-3xs border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Comparativo / Título</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4 text-center">Modelos Analisados</th>
                      <th className="py-3 px-4 text-center">Visualizações</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGuides.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          {guideSearchTerm
                            ? 'Nenhum guia comparativo encontrado para este filtro.'
                            : 'Nenhum guia comparativo cadastrado. Clique no botão acima para criar o primeiro!'}
                        </td>
                      </tr>
                    ) : (
                      filteredGuides.map((g) => (
                        <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={g.coverImage || g.products?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=200&q=80'}
                                alt={g.title}
                                className="w-12 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0 max-w-md">
                                <div className="font-bold text-slate-900 line-clamp-1">{g.title}</div>
                                <div className="text-3xs text-slate-500 font-mono line-clamp-1 mt-0.5">
                                  /guias/{g.slug}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-3xs font-semibold">
                              {g.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md text-3xs font-bold">
                              {g.products?.length || 0} produtos no pódio
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700 whitespace-nowrap">
                            {(g.viewsCount || 0).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`px-2 py-0.5 rounded-full text-3xs font-bold ${
                                  g.published
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {g.published ? 'Publicado' : 'Rascunho'}
                              </span>
                              {g.featured && (
                                <span className="text-3xs text-amber-600 font-semibold flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" /> Destaque
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenGuidePostKit(g)}
                                className="p-1.5 text-slate-500 hover:text-[#FF6B00] hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                                title="Abrir Kit para Postagem (WhatsApp, Instagram, Shorts e SEO)"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onViewGuide(g.slug)}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Ver página do comparativo no site"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onEditGuide(g)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Editar guia comparativo"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setGuideToDelete(g)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Excluir guia comparativo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal de Confirmação de Exclusão de Guia */}
            {guideToDelete && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Excluir Guia Comparativo?</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Tem certeza que deseja excluir o guia <strong>"{guideToDelete.title}"</strong>?
                        Essa ação removerá o comparativo e a tabela de recomendações do site.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setGuideToDelete(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = guideToDelete.id;
                        const targetTitle = guideToDelete.title;
                        setGuideToDelete(null);
                        onDeleteGuide(targetId);
                        setFeedbackMessage(`Guia "${targetTitle}" excluído com sucesso!`);
                        setTimeout(() => setFeedbackMessage(null), 3500);
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm cursor-pointer"
                    >
                      Sim, Excluir Guia
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA: GERENCIADOR DE CATEGORIAS (Pedido pelo Usuário) */}
        {activeTab === 'categories' && (
          <CategoryManager 
            categories={categories}
            reviews={reviews}
            onSaveCategory={onSaveCategory}
            onDeleteCategory={onDeleteCategory}
          />
        )}

        {/* ABA: BANNERS */}
        {activeTab === 'banners' && (
          <BannerManager banners={banners} onSaveBanner={onSaveBanner} />
        )}

        {/* ABA: CONFIGURAÇÕES */}
        {activeTab === 'settings' && (
          <SiteSettingsManager settings={settings} onSaveSettings={onSaveSettings} />
        )}

        {/* ABA: RELATÓRIO DE CLIQUES DETALHADO POR PRODUTO */}
        {activeTab === 'clicks' && (() => {
          const sortedByClicks = [...reviews].sort((a, b) => (b.clicksCount || 0) - (a.clicksCount || 0));
          const totalReviewClicks = reviews.reduce((acc, r) => acc + (r.clicksCount || 0), 0);
          const maxClicks = Math.max(1, ...reviews.map(r => r.clicksCount || 0));
          const productsWithClicks = reviews.filter(r => (r.clicksCount || 0) > 0);
          const topProduct = sortedByClicks[0];
          const totalViews = reviews.reduce((acc, r) => acc + (r.viewsCount || 0), 0);
          const averageCtr = totalViews > 0 ? ((totalReviewClicks / totalViews) * 100).toFixed(1) : '0.0';

          return (
            <div className="space-y-6">
              {/* Header da Aba */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#FF6B00]" />
                      <span>Desempenho e Contagem Exata de Cliques por Produto</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Monitore com precisão a quantidade de cliques que cada produto anunciado recebeu para suas lojas parceiras.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-orange-50 text-[#FF6B00] border border-orange-200 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs">
                      <MousePointerClick className="w-4 h-4" />
                      <span>{Math.max(stats.totalClicks, totalReviewClicks).toLocaleString('pt-BR')} cliques no total</span>
                    </span>
                  </div>
                </div>

                {/* Micro KPIs de Cliques */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-3xs font-semibold text-slate-500 uppercase tracking-wider">Total de Cliques</div>
                    <div className="text-lg font-bold font-mono text-[#FF6B00] mt-0.5">
                      {Math.max(stats.totalClicks, totalReviewClicks).toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-3xs font-semibold text-slate-500 uppercase tracking-wider">Produtos com Cliques</div>
                    <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                      {productsWithClicks.length} <span className="text-xs font-normal text-slate-400">/ {reviews.length}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-3xs font-semibold text-slate-500 uppercase tracking-wider">Produto Mais Clicado</div>
                    <div className="text-xs font-bold text-slate-900 truncate mt-0.5" title={topProduct?.title}>
                      {topProduct && (topProduct.clicksCount || 0) > 0 ? topProduct.title : 'Aguardando cliques'}
                    </div>
                    {topProduct && (topProduct.clicksCount || 0) > 0 && (
                      <div className="text-3xs text-[#FF6B00] font-mono font-bold">
                        {topProduct.clicksCount} cliques
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-3xs font-semibold text-slate-500 uppercase tracking-wider">Taxa Média de Clique (CTR)</div>
                    <div className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
                      {averageCtr}%
                    </div>
                  </div>
                </div>
              </div>

              {/* TABELA DE RANKING E CONTAGEM POR PRODUTO */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Ranking de Cliques por Produto Avaliado
                    </h4>
                  </div>
                  <span className="text-3xs text-slate-400 font-medium">
                    Ordenado por volume decrescente de cliques
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-3xs border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3 text-center w-12">#</th>
                        <th className="py-3 px-4">Produto</th>
                        <th className="py-3 px-4">Loja Afiliada</th>
                        <th className="py-3 px-4">Preço Cadastrado</th>
                        <th className="py-3 px-4 text-center">Cliques Recebidos</th>
                        <th className="py-3 px-4 text-center">Visualizações</th>
                        <th className="py-3 px-4 text-center">CTR Estimado</th>
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedByClicks.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            Nenhum produto cadastrado no momento.
                          </td>
                        </tr>
                      ) : (
                        sortedByClicks.map((r, index) => {
                          const clicks = r.clicksCount || 0;
                          const views = r.viewsCount || 0;
                          const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0';
                          const percentageOfMax = Math.round((clicks / maxClicks) * 100);

                          return (
                            <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3 text-center">
                                {index === 0 && clicks > 0 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-xs shadow-2xs">
                                    🥇
                                  </span>
                                ) : index === 1 && clicks > 0 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs">
                                    🥈
                                  </span>
                                ) : index === 2 && clicks > 0 ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">
                                    🥉
                                  </span>
                                ) : (
                                  <span className="font-mono text-slate-400 font-semibold">
                                    #{index + 1}
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={r.coverImage}
                                    alt={r.title}
                                    referrerPolicy="no-referrer"
                                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                                  />
                                  <div className="max-w-xs space-y-0.5">
                                    <h5 className="font-bold text-slate-900 line-clamp-1" title={r.title}>
                                      {r.title}
                                    </h5>
                                    <div className="text-3xs text-slate-400">
                                      {r.category}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-2xs text-slate-700 font-medium">
                                  {r.partnerStore}
                                </span>
                              </td>

                              <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                                {r.priceCurrent}
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                                    clicks > 0
                                      ? 'bg-orange-100 text-[#FF6B00] border border-orange-200 shadow-2xs'
                                      : 'bg-slate-100 text-slate-400'
                                  }`}>
                                    <MousePointerClick className="w-3.5 h-3.5" />
                                    <span>{clicks.toLocaleString('pt-BR')} {clicks === 1 ? 'clique' : 'cliques'}</span>
                                  </span>
                                  {clicks > 0 && (
                                    <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="bg-[#FF6B00] h-full rounded-full transition-all"
                                        style={{ width: `${Math.max(8, percentageOfMax)}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-center font-mono text-slate-600">
                                {views.toLocaleString('pt-BR')}
                              </td>

                              <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                                <span className={clicks > 0 ? 'text-emerald-600' : 'text-slate-400'}>
                                  {ctr}%
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => onViewReview(r.slug)}
                                    title="Ver análise completa no site"
                                    className="p-1.5 text-slate-400 hover:text-cyan-600 rounded-md hover:bg-slate-100 transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </button>
                                  <a
                                    href={r.affiliateUrl}
                                    target="_blank"
                                    rel="sponsored nofollow noopener noreferrer"
                                    title={`Testar link de afiliado (${r.partnerStore})`}
                                    className="p-1.5 text-slate-400 hover:text-[#FF6B00] rounded-md hover:bg-orange-50 transition-colors"
                                  >
                                    <ShoppingBag className="w-4 h-4" />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FEED CRONOLÓGICO DE EVENTOS RECENTES DE CLIQUES */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-cyan-600" />
                      <span>Histórico Cronológico dos Últimos Cliques</span>
                    </h4>
                    <p className="text-3xs text-slate-500 mt-0.5">
                      Registro de conversões e redirecionamentos registrados em tempo real
                    </p>
                  </div>
                  <span className="text-3xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {stats.recentClicks.length} registros
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                  {stats.recentClicks.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      Nenhum clique registrado ainda. Os cliques são gravados instantaneamente quando os visitantes clicam nos botões de compra.
                    </div>
                  ) : (
                    stats.recentClicks.map((click) => (
                      <div key={click.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-900">{click.reviewTitle}</div>
                          <div className="text-3xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(click.timestamp).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-orange-50 text-[#FF6B00] border border-orange-200 rounded-md text-2xs font-bold flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" />
                            <span>{click.partnerStore}</span>
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      </div>

      {/* Modal Rápido: Kit para Postagem (1 Clique para Copiar ou Regenerar) */}
      {postKitModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold truncate">
                    Kit para Postagem: {postKitModalTarget.item.title}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {postKitModalTarget.type === 'guide' ? 'Guia Comparativo' : 'Análise de Produto'} — Copie e publique em segundos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPostKitModalTarget(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <span className="text-slate-700 font-medium">
                  Recursos SEO + Redes Sociais vinculados a este item:
                </span>
                <button
                  type="button"
                  disabled={isRegeneratingKit}
                  onClick={handleRegeneratePostKitInModal}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#FF6B00] hover:bg-[#e05e00] disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer shrink-0"
                >
                  {isRegeneratingKit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Atualizando com IA...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Regenerar Kit com IA &amp; Salvar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Título SEO</span>
                    <button
                      type="button"
                      onClick={() => handleCopyKitText('seoTitle', postKitModalTarget.kit.seoTitle)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 hover:text-cyan-900 cursor-pointer"
                    >
                      {copiedKitField === 'seoTitle' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKitField === 'seoTitle' ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <p className="text-slate-800">{postKitModalTarget.kit.seoTitle}</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Selo de Destaque</span>
                    <button
                      type="button"
                      onClick={() => handleCopyKitText('highlightsBadge', postKitModalTarget.kit.highlightsBadge)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 hover:text-cyan-900 cursor-pointer"
                    >
                      {copiedKitField === 'highlightsBadge' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKitField === 'highlightsBadge' ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <p className="text-slate-800">{postKitModalTarget.kit.highlightsBadge}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Meta Description (Google)</span>
                  <button
                    type="button"
                    onClick={() => handleCopyKitText('metaDescription', postKitModalTarget.kit.metaDescription)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 hover:text-cyan-900 cursor-pointer"
                  >
                    {copiedKitField === 'metaDescription' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKitField === 'metaDescription' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-slate-800">{postKitModalTarget.kit.metaDescription}</p>
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">Copy para Grupos (WhatsApp / Telegram)</span>
                  <button
                    type="button"
                    onClick={() => handleCopyKitText('whatsappCopy', postKitModalTarget.kit.whatsappCopy)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold cursor-pointer"
                  >
                    {copiedKitField === 'whatsappCopy' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKitField === 'whatsappCopy' ? 'Copiado!' : 'Copiar WhatsApp'}</span>
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-[11px] text-slate-800 leading-relaxed">
                  {postKitModalTarget.kit.whatsappCopy}
                </pre>
              </div>

              <div className="p-3 bg-fuchsia-50/40 border border-fuchsia-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-fuchsia-900">Legenda para Instagram / Facebook</span>
                  <button
                    type="button"
                    onClick={() => handleCopyKitText('instagramCaption', postKitModalTarget.kit.instagramCaption)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-md text-[11px] font-bold cursor-pointer"
                  >
                    {copiedKitField === 'instagramCaption' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKitField === 'instagramCaption' ? 'Copiado!' : 'Copiar Instagram'}</span>
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">
                  {postKitModalTarget.kit.instagramCaption}
                </pre>
              </div>

              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Roteiro de Vídeo Curto (Reels / TikTok / Shorts)</span>
                  <button
                    type="button"
                    onClick={() => handleCopyKitText('shortVideoScript', postKitModalTarget.kit.shortVideoScript)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-[11px] font-bold cursor-pointer"
                  >
                    {copiedKitField === 'shortVideoScript' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKitField === 'shortVideoScript' ? 'Copiado!' : 'Copiar Roteiro'}</span>
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">
                  {postKitModalTarget.kit.shortVideoScript}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setPostKitModalTarget(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
