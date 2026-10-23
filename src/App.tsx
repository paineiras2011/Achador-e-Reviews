/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategoryFilter } from './components/CategoryFilter';
import { ReviewCard } from './components/ReviewCard';
import { ReviewDetail } from './components/ReviewDetail';
import { GuideCard } from './components/GuideCard';
import { GuideDetail } from './components/GuideDetail';
import { AdBannerSlot } from './components/AdBannerSlot';
import { Footer } from './components/Footer';
import { SeoHead } from './components/SeoHead';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ReviewEditorModal } from './components/admin/ReviewEditorModal';
import { GuideEditorModal } from './components/admin/GuideEditorModal';
import { StoreService } from './services/store';
import { Review, Category, Banner, SiteSettings, AffiliateClick, ComparisonGuide } from './types';
import { INITIAL_REVIEWS, INITIAL_CATEGORIES, INITIAL_BANNERS, INITIAL_SETTINGS, INITIAL_GUIDES } from './data/initialData';
import { testFirestoreConnection } from './lib/firebase';
import { Sparkles, ShieldCheck, LogOut, Layers, Award } from 'lucide-react';

export default function App() {
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [guides, setGuides] = useState<ComparisonGuide[]>(INITIAL_GUIDES);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);
  const [stats, setStats] = useState({
    totalReviews: INITIAL_REVIEWS.length,
    totalGuides: INITIAL_GUIDES.length,
    totalCategories: INITIAL_CATEGORIES.length,
    totalBanners: INITIAL_BANNERS.length,
    totalViews: 10430,
    totalClicks: 1612,
    recentClicks: [] as AffiliateClick[]
  });

  const [currentView, setCurrentView] = useState<'home' | 'review' | 'guide' | 'admin'>('home');
  const [currentReviewSlug, setCurrentReviewSlug] = useState<string | null>(null);
  const [currentGuideSlug, setCurrentGuideSlug] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Admin Modals & Auth State (Totalmente oculto para visitantes)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isReviewEditorModalOpen, setIsReviewEditorModalOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState<Review | null>(null);
  const [isGuideEditorModalOpen, setIsGuideEditorModalOpen] = useState(false);
  const [guideToEdit, setGuideToEdit] = useState<ComparisonGuide | null>(null);

  // Initial Data Loading & Firestore synchronization
  const loadData = useCallback(async () => {
    try {
      await StoreService.initialize();
      const [revs, guis, cats, bans, sets, currentStats] = await Promise.all([
        StoreService.getReviews(),
        StoreService.getGuides(),
        StoreService.getCategories(),
        StoreService.getBanners(),
        StoreService.getSettings(),
        StoreService.getStats()
      ]);

      if (revs) setReviews(revs);
      if (guis && guis.length > 0) setGuides(guis);
      if (cats && cats.length > 0) setCategories(cats);
      if (bans && bans.length > 0) setBanners(bans);
      if (sets) setSettings(sets);
      if (currentStats) setStats(currentStats);
    } catch (err) {
      console.warn('Erro ao carregar dados remotos do Firestore, utilizando estado local:', err);
    }
  }, []);

  useEffect(() => {
    testFirestoreConnection();
    loadData();

    // Roteamento dinâmico por URL (ex: /reviews/slug, /guias/slug ou /admin)
    const path = window.location.pathname;
    if (path.startsWith('/reviews/')) {
      const slug = path.replace('/reviews/', '');
      if (slug) {
        setCurrentReviewSlug(slug);
        setCurrentView('review');
      }
    } else if (path.startsWith('/guias/')) {
      const slug = path.replace('/guias/', '');
      if (slug) {
        setCurrentGuideSlug(slug);
        setCurrentView('guide');
      }
    } else if (path === '/admin') {
      setCurrentView('admin');
      if (!isAdminLoggedIn) {
        setIsLoginModalOpen(true);
      }
    }

    // Suporte aos botões voltar/avançar do navegador
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/reviews/')) {
        const slug = currentPath.replace('/reviews/', '');
        setCurrentReviewSlug(slug);
        setCurrentView('review');
      } else if (currentPath.startsWith('/guias/')) {
        const slug = currentPath.replace('/guias/', '');
        setCurrentGuideSlug(slug);
        setCurrentView('guide');
      } else if (currentPath === '/admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('home');
        setCurrentReviewSlug(null);
        setCurrentGuideSlug(null);
      }
    };

    // Atalho secreto de teclado para abrir o painel de administrador: Ctrl + Shift + A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        handleOpenAdmin();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loadData, isAdminLoggedIn]);

  // Handlers de Navegação
  const handleGoHome = () => {
    setCurrentView('home');
    setCurrentReviewSlug(null);
    setCurrentGuideSlug(null);
    setSelectedCategory('all');
    setSearchQuery('');
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectGuide = (slug: string) => {
    const target = guides.find(g => g.slug === slug || g.id === slug);
    if (target) {
      StoreService.incrementGuideViews(target.id);
      setGuides(prev => prev.map(g => g.id === target.id ? { ...g, viewsCount: (g.viewsCount || 0) + 1 } : g));
    }
    setCurrentGuideSlug(slug);
    setCurrentView('guide');
    window.history.pushState({}, '', `/guias/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoGuidesSection = () => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setCurrentReviewSlug(null);
      setCurrentGuideSlug(null);
      window.history.pushState({}, '', '/');
    }
    setTimeout(() => {
      const el = document.getElementById('guias-comparativos');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSelectCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    if (currentView !== 'home') {
      setCurrentView('home');
      setCurrentReviewSlug(null);
      setCurrentGuideSlug(null);
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReadReview = (slug: string) => {
    const target = reviews.find(r => r.slug === slug || r.id === slug);
    if (target) {
      StoreService.incrementViews(target.id);
      setReviews(prev => prev.map(r => r.id === target.id ? { ...r, viewsCount: (r.viewsCount || 0) + 1 } : r));
    }
    setCurrentReviewSlug(slug);
    setCurrentView('review');
    window.history.pushState({}, '', `/reviews/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAffiliateClick = (review: Review, storeName?: string) => {
    const targetStore = storeName || review.partnerStore;
    StoreService.recordAffiliateClick(review.id, targetStore, review.title);

    // Atualiza estatísticas globais e log em tempo real
    setStats(prev => ({
      ...prev,
      totalClicks: prev.totalClicks + 1,
      recentClicks: [
        {
          id: `click_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          reviewId: review.id,
          reviewTitle: review.title,
          partnerStore: targetStore,
          timestamp: new Date().toISOString()
        },
        ...prev.recentClicks
      ].slice(0, 50)
    }));

    // Atualiza contagem de cliques na avaliação no estado React instantaneamente
    setReviews(prev => prev.map(r => (r.id === review.id || r.slug === review.slug) ? { ...r, clicksCount: (r.clicksCount || 0) + 1 } : r));
  };

  const handleOpenAdmin = () => {
    loadData();
    if (isAdminLoggedIn) {
      setCurrentView('admin');
      window.history.pushState({}, '', '/admin');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = (email: string) => {
    loadData();
    setIsAdminLoggedIn(true);
    setAdminEmail(email);
    setCurrentView('admin');
    window.history.pushState({}, '', '/admin');
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminEmail('');
    handleGoHome();
  };

  // CRUD de Avaliações
  const handleSaveReview = async (review: Review) => {
    await StoreService.saveReview(review);
    await loadData();
    if (currentReviewSlug === review.id || currentReviewSlug === review.slug) {
      setCurrentReviewSlug(review.slug);
    }
  };

  const handleDeleteReview = async (id: string) => {
    // 1. Atualização otimista imediata no estado para resposta visual instantânea
    setReviews(prev => prev.filter(r => r.id !== id && r.slug !== id));
    
    // 2. Persiste a exclusão no storage e Firestore
    await StoreService.deleteReview(id);
    
    // 3. Sincroniza dados com segurança
    const freshRevs = await StoreService.getReviews();
    setReviews(freshRevs);
    
    if (currentReviewSlug === id) {
      handleGoHome();
    }
  };

  // CRUD de Guias Comparativos
  const handleSaveGuide = async (guide: ComparisonGuide) => {
    await StoreService.saveGuide(guide);
    await loadData();
    if (currentGuideSlug === guide.id || currentGuideSlug === guide.slug) {
      setCurrentGuideSlug(guide.slug);
    }
  };

  const handleDeleteGuide = async (id: string) => {
    setGuides(prev => prev.filter(g => g.id !== id && g.slug !== id));
    await StoreService.deleteGuide(id);
    await loadData();
    if (currentGuideSlug === id) {
      handleGoHome();
    }
  };

  // CRUD de Categorias (Pedido pelo Usuário)
  const handleSaveCategory = async (category: Category) => {
    await StoreService.saveCategory(category);
    await loadData();
  };

  const handleDeleteCategory = async (id: string) => {
    await StoreService.deleteCategory(id);
    await loadData();
  };

  const handleSaveBanner = async (banner: Banner) => {
    await StoreService.saveBanner(banner);
    await loadData();
  };

  const handleSaveSettings = async (newSettings: SiteSettings) => {
    await StoreService.saveSettings(newSettings);
    await loadData();
  };

  // Filtro de avaliações por termo de busca e categoria selecionada
  const filteredReviews = reviews.filter((r) => {
    const matchesCategory = selectedCategory === 'all' || !selectedCategory || r.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.partnerStore.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Filtro de guias comparativos por categoria e busca
  const filteredGuides = guides.filter((g) => {
    if (!g.published && !isAdminLoggedIn) return false;
    const matchesCategory = selectedCategory === 'all' || !selectedCategory || g.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.products?.some(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const featuredReviews = reviews.filter(r => r.featured).length > 0 
    ? reviews.filter(r => r.featured) 
    : reviews.slice(0, 5);
  const featuredReview = featuredReviews[0] || reviews[0];

  const activeReview = currentReviewSlug
    ? reviews.find(r => r.slug === currentReviewSlug || r.id === currentReviewSlug) || null
    : null;

  const activeGuide = currentGuideSlug
    ? guides.find(g => g.slug === currentGuideSlug || g.id === currentGuideSlug) || null
    : null;

  const relatedReviews = activeReview
    ? reviews.filter(r => r.id !== activeReview.id && r.category === activeReview.category).slice(0, 3)
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-cyan-500 selection:text-white relative">
      
      {/* Meta Tags Dinâmicas e Schema.org JSON-LD para o Google */}
      <SeoHead
        title={activeReview ? activeReview.title : activeGuide ? activeGuide.title : undefined}
        description={activeReview ? activeReview.subtitle : activeGuide ? (activeGuide.subtitle || activeGuide.introContent.slice(0, 160)) : undefined}
        review={activeReview}
        settings={settings}
      />

      {/* Barra de Navegação Pública */}
      <Navbar
        categories={categories}
        onGoHome={handleGoHome}
        onGoGuides={handleGoGuidesSection}
        onSelectCategory={handleSelectCategory}
        onOpenAdmin={handleOpenAdmin}
        activeCategory={selectedCategory}
        isGuidesActive={currentView === 'guide'}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* VISÃO: PAINEL ADMINISTRATIVO (Acessível via /admin ou atalho) */}
      {currentView === 'admin' ? (
        isAdminLoggedIn ? (
          <AdminDashboard
            adminEmail={adminEmail}
            reviews={reviews}
            guides={guides}
            categories={categories}
            banners={banners}
            settings={settings}
            stats={stats}
            onOpenCreateReview={() => {
              setReviewToEdit(null);
              setIsReviewEditorModalOpen(true);
            }}
            onEditReview={(r) => {
              setReviewToEdit(r);
              setIsReviewEditorModalOpen(true);
            }}
            onDeleteReview={handleDeleteReview}
            onViewReview={handleReadReview}
            onOpenCreateGuide={() => {
              setGuideToEdit(null);
              setIsGuideEditorModalOpen(true);
            }}
            onEditGuide={(g) => {
              setGuideToEdit(g);
              setIsGuideEditorModalOpen(true);
            }}
            onDeleteGuide={handleDeleteGuide}
            onViewGuide={handleSelectGuide}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
            onSaveBanner={handleSaveBanner}
            onSaveSettings={handleSaveSettings}
            onLogout={handleLogout}
            onExitToSite={handleGoHome}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 bg-slate-900 text-white">
            <div className="text-center space-y-4 max-w-sm">
              <ShieldCheck className="w-12 h-12 text-[#FF6B00] mx-auto" />
              <h2 className="text-xl font-bold">Autenticação do Gestor</h2>
              <p className="text-xs text-slate-400">
                Página restrita para a administração do site. Por favor, autentique-se para continuar.
              </p>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Digitar Senha de Acesso
              </button>
            </div>
          </div>
        )
      ) : currentView === 'guide' && activeGuide ? (
        /* VISÃO: PÁGINA DE GUIA COMPARATIVO (Artigo Multi-Produtos) */
        <main className="flex-1">
          <GuideDetail
            guide={activeGuide}
            onBack={handleGoHome}
            onSelectReview={handleReadReview}
          />
        </main>
      ) : currentView === 'review' && activeReview ? (
        /* VISÃO: PÁGINA DE ANÁLISE DETALHADA (Artigo Individual com link para Comparativo) */
        <main className="flex-1">
          <ReviewDetail
            review={activeReview}
            relatedReviews={relatedReviews}
            relatedGuides={guides}
            banners={banners}
            onBack={handleGoHome}
            onReadReview={handleReadReview}
            onSelectGuide={handleSelectGuide}
            onAffiliateClick={handleAffiliateClick}
          />
        </main>
      ) : (
        /* VISÃO: VITRINE PRINCIPAL DO SITE */
        <main className="flex-1">
          {/* Banner Publicitário de Topo */}
          <AdBannerSlot position="header" banners={banners} />

          {/* Banner de Avaliações em Carrossel Rotativo */}
          <Hero
            featuredReview={featuredReview}
            featuredReviews={featuredReviews}
            reviews={reviews}
            onReadReview={handleReadReview}
            onAffiliateClick={handleAffiliateClick}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Seção de Guias Comparativos & Artigos */}
            {filteredGuides.length > 0 && (
              <section id="guias-comparativos" className="mb-14 scroll-mt-20">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 border-b border-slate-200/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
                      <Layers className="w-4 h-4" />
                      <span>Análises Comparativas &amp; Rankings</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      Guias de Compra &amp; Comparativos
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Comparações completas com pódio dos melhores modelos, especificações reais e links de afiliados oficiais.
                    </p>
                  </div>
                  {isAdminLoggedIn && (
                    <button
                      onClick={() => {
                        setGuideToEdit(null);
                        setIsGuideEditorModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
                    >
                      + Novo Comparativo
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {filteredGuides.map((guide) => (
                    <GuideCard
                      key={guide.id}
                      guide={guide}
                      onSelect={handleSelectGuide}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Cabeçalho da Seção de Avaliações Individuais */}
            <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Avaliações Individuais Recentes
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Análises aprofundadas com notas técnicas, prós e contras e melhor preço do dia
                </p>
              </div>
            </div>

            {/* Filtro de Categorias 100% Funcional e Busca Instantânea */}
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* Grade de Avaliações em Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredReviews.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                  <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-700">Nenhuma avaliação encontrada</h3>
                  <p className="text-xs text-slate-500">
                    Não encontramos resultados para &quot;{searchQuery}&quot;. Tente outros termos ou limpe o filtro.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="text-xs font-bold text-cyan-600 hover:text-cyan-700 underline"
                  >
                    Ver todas as avaliações
                  </button>
                </div>
              ) : (
                filteredReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onReadReview={handleReadReview}
                    onAffiliateClick={handleAffiliateClick}
                  />
                ))
              )}
            </div>

            {/* Banner Publicitário no Fim do Catálogo */}
            <div className="mt-12">
              <AdBannerSlot position="in_article" banners={banners} />
            </div>
          </div>
        </main>
      )}

      {/* Rodapé Limpo (Sem links sociais, sem telefone/e-mail e sem link de admin) */}
      <Footer
        settings={settings}
        categories={categories}
        onSelectCategory={handleSelectCategory}
      />

      {/* Floating Toolbar Discreta para o Gestor Logado (Invisível para visitantes) */}
      {isAdminLoggedIn && currentView !== 'admin' && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#0B132B] text-white p-2 px-3 rounded-xl border border-cyan-500/40 shadow-2xl flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Gestor Ativo</span>
          </div>
          <button
            onClick={() => {
              setCurrentView('admin');
              window.history.pushState({}, '', '/admin');
            }}
            className="py-1 px-2.5 bg-cyan-500 text-slate-900 font-bold rounded hover:bg-cyan-400 transition-colors cursor-pointer"
          >
            Abrir Painel
          </button>
          <button
            onClick={handleLogout}
            title="Sair da Sessão"
            className="text-slate-400 hover:text-rose-400 transition-colors p-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modal de Login de Administrador */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Modal de Criação / Edição de Avaliações com Autopreenchimento Inteligente */}
      <ReviewEditorModal
        isOpen={isReviewEditorModalOpen}
        reviewToEdit={reviewToEdit}
        categories={categories}
        onClose={() => setIsReviewEditorModalOpen(false)}
        onSave={handleSaveReview}
        onDelete={handleDeleteReview}
      />

      {/* Modal de Criação / Edição de Guias Comparativos */}
      <GuideEditorModal
        isOpen={isGuideEditorModalOpen}
        guide={guideToEdit}
        categories={categories}
        existingReviews={reviews}
        onClose={() => setIsGuideEditorModalOpen(false)}
        onSave={handleSaveGuide}
      />

    </div>
  );
}

