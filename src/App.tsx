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
import { AdBannerSlot } from './components/AdBannerSlot';
import { Footer } from './components/Footer';
import { SeoHead } from './components/SeoHead';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ReviewEditorModal } from './components/admin/ReviewEditorModal';
import { StoreService } from './services/store';
import { Review, Category, Banner, SiteSettings, AffiliateClick } from './types';
import { INITIAL_REVIEWS, INITIAL_CATEGORIES, INITIAL_BANNERS, INITIAL_SETTINGS } from './data/initialData';
import { testFirestoreConnection } from './lib/firebase';
import { Sparkles, ShieldCheck, LogOut } from 'lucide-react';

export default function App() {
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);
  const [stats, setStats] = useState({
    totalReviews: INITIAL_REVIEWS.length,
    totalCategories: INITIAL_CATEGORIES.length,
    totalBanners: INITIAL_BANNERS.length,
    totalViews: 10430,
    totalClicks: 1612,
    recentClicks: [] as AffiliateClick[]
  });

  const [currentView, setCurrentView] = useState<'home' | 'review' | 'admin'>('home');
  const [currentReviewSlug, setCurrentReviewSlug] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Admin Modals & Auth State (Totalmente oculto para visitantes)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isReviewEditorModalOpen, setIsReviewEditorModalOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState<Review | null>(null);

  // Initial Data Loading & Firestore synchronization
  const loadData = useCallback(async () => {
    try {
      await StoreService.initialize();
      const [revs, cats, bans, sets, currentStats] = await Promise.all([
        StoreService.getReviews(),
        StoreService.getCategories(),
        StoreService.getBanners(),
        StoreService.getSettings(),
        StoreService.getStats()
      ]);

      if (revs) setReviews(revs);
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

    // Roteamento dinâmico por URL (ex: /reviews/slug ou /admin)
    const path = window.location.pathname;
    if (path.startsWith('/reviews/')) {
      const slug = path.replace('/reviews/', '');
      if (slug) {
        setCurrentReviewSlug(slug);
        setCurrentView('review');
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
      } else if (currentPath === '/admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('home');
        setCurrentReviewSlug(null);
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
    setSelectedCategory('all');
    setSearchQuery('');
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    if (currentView !== 'home') {
      setCurrentView('home');
      setCurrentReviewSlug(null);
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

  const featuredReviews = reviews.filter(r => r.featured).length > 0 
    ? reviews.filter(r => r.featured) 
    : reviews.slice(0, 5);
  const featuredReview = featuredReviews[0] || reviews[0];
  const activeReview = currentReviewSlug
    ? reviews.find(r => r.slug === currentReviewSlug || r.id === currentReviewSlug) || null
    : null;

  const relatedReviews = activeReview
    ? reviews.filter(r => r.id !== activeReview.id && r.category === activeReview.category).slice(0, 3)
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-cyan-500 selection:text-white relative">
      
      {/* Meta Tags Dinâmicas e Schema.org JSON-LD para o Google */}
      <SeoHead
        title={activeReview ? activeReview.title : undefined}
        description={activeReview ? activeReview.subtitle : undefined}
        review={activeReview}
        settings={settings}
      />

      {/* Barra de Navegação Pública (Sem botão visível de admin para visitantes) */}
      <Navbar
        categories={categories}
        onGoHome={handleGoHome}
        onSelectCategory={handleSelectCategory}
        onOpenAdmin={handleOpenAdmin}
        activeCategory={selectedCategory}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* VISÃO: PAINEL ADMINISTRATIVO (Acessível via /admin ou atalho) */}
      {currentView === 'admin' ? (
        isAdminLoggedIn ? (
          <AdminDashboard
            adminEmail={adminEmail}
            reviews={reviews}
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
                className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
              >
                Digitar Senha de Acesso
              </button>
            </div>
          </div>
        )
      ) : currentView === 'review' && activeReview ? (
        /* VISÃO: PÁGINA DE ANÁLISE DETALHADA (Artigo de Vendas) */
        <main className="flex-1">
          <ReviewDetail
            review={activeReview}
            relatedReviews={relatedReviews}
            banners={banners}
            onBack={handleGoHome}
            onReadReview={handleReadReview}
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
            className="py-1 px-2.5 bg-cyan-500 text-slate-900 font-bold rounded hover:bg-cyan-400 transition-colors"
          >
            Abrir Painel
          </button>
          <button
            onClick={handleLogout}
            title="Sair da Sessão"
            className="text-slate-400 hover:text-rose-400 transition-colors p-1"
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

    </div>
  );
}
