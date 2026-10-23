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
  BookOpen
} from 'lucide-react';
import { Review, Category, Banner, SiteSettings, AffiliateClick, ComparisonGuide } from '../../types';
import { BannerManager } from './BannerManager';
import { CategoryManager } from './CategoryManager';
import { SiteSettingsManager } from './SiteSettingsManager';

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
  onDeleteReview: (id: string) => void;
  onViewReview: (slug: string) => void;
  onOpenCreateGuide: () => void;
  onEditGuide: (guide: ComparisonGuide) => void;
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
  onDeleteReview,
  onViewReview,
  onOpenCreateGuide,
  onEditGuide,
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
                                onClick={() => onViewReview(r.slug)}
                                title="Ver no site público"
                                className="p-1.5 text-slate-400 hover:text-cyan-600 rounded-md hover:bg-slate-100 transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onEditReview(r)}
                                title="Editar avaliação"
                                className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-slate-100 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setReviewToDelete(r)}
                                title="Excluir avaliação"
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
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
    </div>
  );
};
