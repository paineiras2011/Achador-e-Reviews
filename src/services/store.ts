import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  increment,
  updateDoc
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { Review, Category, Banner, SiteSettings, AffiliateClick, ComparisonGuide } from '../types';
import { 
  INITIAL_REVIEWS, 
  INITIAL_CATEGORIES, 
  INITIAL_BANNERS, 
  INITIAL_SETTINGS,
  INITIAL_GUIDES
} from '../data/initialData';
import { cleanOtherStores } from '../utils/storeHelpers';

const STORAGE_KEYS = {
  REVIEWS: 'achados_reviews_data',
  CATEGORIES: 'achados_categories_data',
  BANNERS: 'achados_banners_data',
  SETTINGS: 'achados_settings_data',
  CLICKS: 'achados_affiliate_clicks_data',
  GUIDES: 'achados_guides_data',
  SEEDED: 'achados_firestore_seeded'
};

// Safe localStorage helpers
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage write failed:', e);
  }
}

export const StoreService = {
  // Initialize seed data in Firestore and local storage if needed
  async initialize(): Promise<void> {
    // 1. Preservação Total e Limpeza de Cache Antigo:
    const existingReviews = getLocal<Review[] | null>(STORAGE_KEYS.REVIEWS, null);
    if (!existingReviews || existingReviews.length === 0) {
      setLocal(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    } else {
      // Limpa do cache do navegador qualquer imagem genérica residual para produtos que possuem foto real
      const initialMap = new Map(INITIAL_REVIEWS.map(r => [r.id, r]));
      let hasUpdates = false;
      const sanitized = existingReviews.map(rev => {
        const init = initialMap.get(rev.id) || INITIAL_REVIEWS.find(r => r.slug === rev.slug);
        if (init && init.coverImage && init.coverImage.startsWith('http')) {
          if (!rev.coverImage || rev.coverImage.includes('hero_tech_showcase') || rev.coverImage.startsWith('/src/assets/')) {
            hasUpdates = true;
            return { ...rev, coverImage: init.coverImage };
          }
        }
        return rev;
      });
      if (hasUpdates) {
        setLocal(STORAGE_KEYS.REVIEWS, sanitized);
      }
    }

    const existingCategories = getLocal<Category[] | null>(STORAGE_KEYS.CATEGORIES, null);
    if (!existingCategories || existingCategories.length === 0) {
      setLocal(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    }

    const existingBanners = getLocal<Banner[] | null>(STORAGE_KEYS.BANNERS, null);
    if (!existingBanners || existingBanners.length === 0) {
      setLocal(STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
    }

    const existingSettings = getLocal<SiteSettings | null>(STORAGE_KEYS.SETTINGS, null);
    if (!existingSettings) {
      setLocal(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    }

    const existingGuides = getLocal<ComparisonGuide[] | null>(STORAGE_KEYS.GUIDES, null);
    if (!existingGuides || existingGuides.length === 0) {
      setLocal(STORAGE_KEYS.GUIDES, INITIAL_GUIDES);
    }

    // 2. Seeding no Firestore: somente executa escrita remota se o admin estiver logado
    const seeded = localStorage.getItem(STORAGE_KEYS.SEEDED);
    if (!seeded) {
      if (auth.currentUser) {
        try {
          for (const rev of INITIAL_REVIEWS) {
            const docRef = doc(db, 'reviews', rev.id);
            const snap = await getDoc(docRef);
            if (!snap.exists()) {
              await setDoc(docRef, rev);
            }
          }
          for (const cat of INITIAL_CATEGORIES) {
            const docRef = doc(db, 'categories', cat.id);
            const snap = await getDoc(docRef);
            if (!snap.exists()) {
              await setDoc(docRef, cat);
            }
          }
          for (const ban of INITIAL_BANNERS) {
            const docRef = doc(db, 'banners', ban.id);
            const snap = await getDoc(docRef);
            if (!snap.exists()) {
              await setDoc(docRef, ban);
            }
          }
          for (const gui of INITIAL_GUIDES) {
            const docRef = doc(db, 'guides', gui.id);
            const snap = await getDoc(docRef);
            if (!snap.exists()) {
              await setDoc(docRef, gui);
            }
          }
          const settingsRef = doc(db, 'siteSettings', 'global');
          const settingsSnap = await getDoc(settingsRef);
          if (!settingsSnap.exists()) {
            await setDoc(settingsRef, INITIAL_SETTINGS);
          }
          localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
        } catch {
          // Seeding remoto postergado
        }
      } else {
        localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
      }
    }
  },

  // REVIEWS
  async getReviews(): Promise<Review[]> {
    const deletedList = getLocal<string[]>('achados_deleted_reviews', []);
    const local = getLocal<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS)
      .filter(r => r && !deletedList.includes(r.id) && !deletedList.includes(r.slug))
      .map(r => ({
        ...r,
        id: r.id || r.slug,
        otherStores: cleanOtherStores(r.otherStores, r.partnerStore, r.affiliateUrl)
      }));

    try {
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const remoteReviews = snapshot.docs
          .map(d => {
            const data = d.data() as Review;
            return {
              ...data,
              id: data.id || d.id
            };
          })
          .filter(r => r && !deletedList.includes(r.id) && !deletedList.includes(r.slug))
          .map(r => ({
            ...r,
            otherStores: cleanOtherStores(r.otherStores, r.partnerStore, r.affiliateUrl)
          }));

        // Fusão com autoridade prioritária do Firestore
        const mergedMap = new Map<string, Review>();

        // 1. Registra os remotos vindos do Firestore como base de verdade
        for (const rem of remoteReviews) {
          if (rem && rem.id && !deletedList.includes(rem.id) && !deletedList.includes(rem.slug)) {
            mergedMap.set(rem.id, rem);
          }
        }

        // 2. Mescla com os locais apenas para itens criados offline ou edições mais recentes
        for (const loc of local) {
          if (!loc || !loc.id || deletedList.includes(loc.id) || deletedList.includes(loc.slug)) {
            continue;
          }
          const existing = mergedMap.get(loc.id) || Array.from(mergedMap.values()).find(m => m.slug === loc.slug);
          if (!existing) {
            mergedMap.set(loc.id, loc);
          } else {
            const locHasRealImg = loc.coverImage && (loc.coverImage.startsWith('http') || loc.coverImage.startsWith('//'));
            const remHasRealImg = existing.coverImage && (existing.coverImage.startsWith('http') || existing.coverImage.startsWith('//'));

            const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
            const localTime = new Date(loc.updatedAt || loc.createdAt || 0).getTime();

            // Se local for mais recente, aplica atualização mantendo a imagem real
            if (localTime > existingTime) {
              mergedMap.set(loc.id, {
                ...loc,
                // Preserva a imagem real se o local por engano tiver imagem genérica
                coverImage: (!locHasRealImg && remHasRealImg) ? existing.coverImage : loc.coverImage
              });
            }
          }
        }

        // 3. Blindagem de imagem: garante que nenhum produto com imagem real fique com genérica
        const initialMap = new Map(INITIAL_REVIEWS.map(r => [r.id, r]));
        for (const [id, item] of mergedMap.entries()) {
          const init = initialMap.get(id) || INITIAL_REVIEWS.find(r => r.slug === item.slug);
          if (init && init.coverImage && init.coverImage.startsWith('http')) {
            if (!item.coverImage || item.coverImage.includes('hero_tech_showcase') || item.coverImage.startsWith('/src/assets/')) {
              item.coverImage = init.coverImage;
              mergedMap.set(id, item);
            }
          }
        }

        const mergedReviews = Array.from(new Set(Array.from(mergedMap.values())));
        mergedReviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        // Atualiza o localStorage local com os dados corretos
        setLocal(STORAGE_KEYS.REVIEWS, mergedReviews);
        return mergedReviews;
      }
    } catch (err) {
      console.warn('Using local fallback for reviews:', err);
    }
    return local;
  },

  async getReviewBySlug(slug: string): Promise<Review | null> {
    const reviews = await this.getReviews();
    return reviews.find(r => r.slug === slug || r.id === slug) || null;
  },

  async saveReview(review: Review): Promise<void> {
    // Limpa a lista negra caso o item esteja sendo recadastrado com o mesmo ID ou slug
    const deletedList = getLocal<string[]>('achados_deleted_reviews', []);
    if (deletedList.includes(review.id) || deletedList.includes(review.slug)) {
      setLocal('achados_deleted_reviews', deletedList.filter(i => i !== review.id && i !== review.slug));
    }

    // Sanitiza otherStores para não duplicar a loja parceira principal nem ter URLs idênticas
    const cleanReview: Review = {
      ...review,
      otherStores: cleanOtherStores(review.otherStores, review.partnerStore, review.affiliateUrl)
    };

    // Proteção de imagem: se o usuário salvar sem trocar a imagem, preserva a foto real do produto
    const initMatch = INITIAL_REVIEWS.find(r => r.id === cleanReview.id || r.slug === cleanReview.slug);
    const reviews = getLocal<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    const existingIndex = reviews.findIndex(r => r.id === cleanReview.id || r.slug === cleanReview.slug);
    const existing = existingIndex >= 0 ? reviews[existingIndex] : null;
    const isNewImgGeneric = !cleanReview.coverImage || cleanReview.coverImage.includes('hero_tech_showcase') || cleanReview.coverImage.startsWith('/src/assets/');
    if (isNewImgGeneric) {
      if (existing?.coverImage && (existing.coverImage.startsWith('http') || existing.coverImage.startsWith('//'))) {
        cleanReview.coverImage = existing.coverImage;
      } else if (initMatch?.coverImage && initMatch.coverImage.startsWith('http')) {
        cleanReview.coverImage = initMatch.coverImage;
      }
    }
    let updated: Review[];
    if (existingIndex >= 0) {
      const existing = reviews[existingIndex];
      const mergedReview: Review = {
        ...existing,
        ...cleanReview,
        createdAt: existing.createdAt || cleanReview.createdAt,
        viewsCount: Math.max(existing.viewsCount || 0, cleanReview.viewsCount || 0),
        clicksCount: Math.max(existing.clicksCount || 0, cleanReview.clicksCount || 0),
        updatedAt: new Date().toISOString()
      };
      updated = reviews.map((r, i) => i === existingIndex ? mergedReview : r);
    } else {
      updated = [cleanReview, ...reviews];
    }
    setLocal(STORAGE_KEYS.REVIEWS, updated);

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'reviews', cleanReview.id), cleanReview, { merge: true });
    } catch (err) {
      console.warn(`Firestore save deferred for reviews/${cleanReview.id}:`, err);
    }
  },

  async deleteReview(id: string): Promise<void> {
    // 1. Remove do armazenamento local
    const reviews = getLocal<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    const target = reviews.find(r => r.id === id || r.slug === id);
    const targetId = target ? target.id : id;
    const targetSlug = target ? target.slug : '';

    const remaining = reviews.filter(r => r.id !== targetId && r.slug !== targetId && (targetSlug ? r.slug !== targetSlug : true));
    setLocal(STORAGE_KEYS.REVIEWS, remaining);

    // 2. Registra na lista permanente de itens excluídos para evitar ressurreição
    const deletedList = getLocal<string[]>('achados_deleted_reviews', []);
    const toAdd = [targetId];
    if (targetSlug && !toAdd.includes(targetSlug)) toAdd.push(targetSlug);
    if (id && !toAdd.includes(id)) toAdd.push(id);
    setLocal('achados_deleted_reviews', Array.from(new Set([...deletedList, ...toAdd])));

    // 3. Tenta excluir no Firestore sem bloquear caso esteja offline
    try {
      await deleteDoc(doc(db, 'reviews', targetId));
      if (id !== targetId) {
        await deleteDoc(doc(db, 'reviews', id));
      }
    } catch (err) {
      console.warn(`Firestore delete deferred/offline for reviews/${targetId}:`, err);
    }
  },

  async incrementViews(reviewId: string): Promise<void> {
    const reviews = getLocal<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    const updated = reviews.map(r => r.id === reviewId ? { ...r, viewsCount: (r.viewsCount || 0) + 1 } : r);
    setLocal(STORAGE_KEYS.REVIEWS, updated);

    try {
      const ref = doc(db, 'reviews', reviewId);
      await updateDoc(ref, { viewsCount: increment(1) });
    } catch {
      // Non-critical metric increment failure is tolerated
    }
  },

  async recordAffiliateClick(reviewId: string, partnerStore: string, reviewTitle: string): Promise<void> {
    const clickItem: AffiliateClick = {
      id: `click_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      reviewId,
      reviewTitle,
      partnerStore,
      timestamp: new Date().toISOString()
    };

    // Store in local clicks history
    const clicks = getLocal<AffiliateClick[]>(STORAGE_KEYS.CLICKS, []);
    setLocal(STORAGE_KEYS.CLICKS, [clickItem, ...clicks].slice(0, 500));

    // Increment click count on review (match either id or slug)
    const reviews = getLocal<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    const updated = reviews.map(r => (r.id === reviewId || r.slug === reviewId) ? { ...r, clicksCount: (r.clicksCount || 0) + 1 } : r);
    setLocal(STORAGE_KEYS.REVIEWS, updated);

    try {
      await setDoc(doc(db, 'affiliateClicks', clickItem.id), clickItem);
      const targetReview = reviews.find(r => r.id === reviewId || r.slug === reviewId);
      const docId = targetReview ? targetReview.id : reviewId;
      const ref = doc(db, 'reviews', docId);
      await updateDoc(ref, { clicksCount: increment(1) });
    } catch {
      // Ignored for non-blocking outbound user experience
    }
  },

  // CATEGORIES
  async getCategories(): Promise<Category[]> {
    const deletedCats = getLocal<string[]>('achados_deleted_categories', []);
    const local = getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES)
      .filter(c => !deletedCats.includes(c.id));
    try {
      const snapshot = await getDocs(collection(db, 'categories'));
      if (!snapshot.empty) {
        const remote = snapshot.docs
          .map(d => d.data() as Category)
          .filter(c => !deletedCats.includes(c.id));
        setLocal(STORAGE_KEYS.CATEGORIES, remote);
        return remote;
      }
    } catch (err) {
      console.warn('Using local fallback for categories:', err);
    }
    return local;
  },

  async saveCategory(cat: Category): Promise<void> {
    const deletedCats = getLocal<string[]>('achados_deleted_categories', []);
    if (deletedCats.includes(cat.id)) {
      setLocal('achados_deleted_categories', deletedCats.filter(i => i !== cat.id));
    }

    const cats = getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const index = cats.findIndex(c => c.id === cat.id);
    const updated = index >= 0 ? cats.map(c => c.id === cat.id ? cat : c) : [...cats, cat];
    setLocal(STORAGE_KEYS.CATEGORIES, updated);

    try {
      await setDoc(doc(db, 'categories', cat.id), cat);
    } catch (err) {
      console.warn(`Firestore save deferred for categories/${cat.id}:`, err);
    }
  },

  async deleteCategory(id: string): Promise<void> {
    const cats = getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    setLocal(STORAGE_KEYS.CATEGORIES, cats.filter(c => c.id !== id));

    const deletedCats = getLocal<string[]>('achados_deleted_categories', []);
    if (!deletedCats.includes(id)) {
      setLocal('achados_deleted_categories', [...deletedCats, id]);
    }

    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err) {
      console.warn(`Firestore delete deferred/offline for categories/${id}:`, err);
    }
  },

  // BANNERS
  async getBanners(): Promise<Banner[]> {
    const local = getLocal<Banner[]>(STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
    try {
      const snapshot = await getDocs(collection(db, 'banners'));
      if (!snapshot.empty) {
        const remote = snapshot.docs.map(d => d.data() as Banner);
        setLocal(STORAGE_KEYS.BANNERS, remote);
        return remote;
      }
    } catch (err) {
      console.warn('Using local fallback for banners:', err);
    }
    return local;
  },

  async saveBanner(banner: Banner): Promise<void> {
    const banners = getLocal<Banner[]>(STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
    const index = banners.findIndex(b => b.id === banner.id);
    const updated = index >= 0 ? banners.map(b => b.id === banner.id ? banner : b) : [...banners, banner];
    setLocal(STORAGE_KEYS.BANNERS, updated);

    try {
      await setDoc(doc(db, 'banners', banner.id), banner);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `banners/${banner.id}`);
    }
  },

  // SETTINGS
  async getSettings(): Promise<SiteSettings> {
    const local = getLocal<SiteSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    try {
      const snap = await getDoc(doc(db, 'siteSettings', 'global'));
      if (snap.exists()) {
        const data = snap.data() as SiteSettings;
        setLocal(STORAGE_KEYS.SETTINGS, data);
        return data;
      }
    } catch (err) {
      console.warn('Using local fallback for settings:', err);
    }
    return local;
  },

  async saveSettings(settings: SiteSettings): Promise<void> {
    setLocal(STORAGE_KEYS.SETTINGS, settings);
    try {
      await setDoc(doc(db, 'siteSettings', 'global'), settings);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'siteSettings/global');
    }
  },

  // GUIDES / COMPARATIVOS DE PRODUTOS
  async getGuides(): Promise<ComparisonGuide[]> {
    const deletedGuides = getLocal<string[]>('achados_deleted_guides', []);
    const local = getLocal<ComparisonGuide[]>(STORAGE_KEYS.GUIDES, INITIAL_GUIDES)
      .filter(g => g && !deletedGuides.includes(g.id) && !deletedGuides.includes(g.slug));

    try {
      const q = query(collection(db, 'guides'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const remoteGuides = snapshot.docs
          .map(d => {
            const data = d.data() as ComparisonGuide;
            return {
              ...data,
              id: data.id || d.id
            };
          })
          .filter(g => g && !deletedGuides.includes(g.id) && !deletedGuides.includes(g.slug));

        // Merge remote and local
        const guideMap = new Map<string, ComparisonGuide>();
        remoteGuides.forEach(g => guideMap.set(g.id, g));
        local.forEach(g => {
          if (!guideMap.has(g.id)) guideMap.set(g.id, g);
        });

        const merged = Array.from(guideMap.values());
        merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setLocal(STORAGE_KEYS.GUIDES, merged);
        return merged;
      }
    } catch (err) {
      console.warn('Using local fallback for guides:', err);
    }
    return local;
  },

  async getGuideBySlug(slug: string): Promise<ComparisonGuide | null> {
    const guides = await this.getGuides();
    return guides.find(g => g.slug === slug || g.id === slug) || null;
  },

  async saveGuide(guide: ComparisonGuide): Promise<void> {
    const deletedGuides = getLocal<string[]>('achados_deleted_guides', []);
    if (deletedGuides.includes(guide.id) || deletedGuides.includes(guide.slug)) {
      setLocal('achados_deleted_guides', deletedGuides.filter(i => i !== guide.id && i !== guide.slug));
    }

    const guides = getLocal<ComparisonGuide[]>(STORAGE_KEYS.GUIDES, INITIAL_GUIDES);
    const existingIndex = guides.findIndex(g => g.id === guide.id || g.slug === guide.slug);
    let updated: ComparisonGuide[];

    const cleanGuide: ComparisonGuide = {
      ...guide,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      const existing = guides[existingIndex];
      const mergedGuide: ComparisonGuide = {
        ...existing,
        ...cleanGuide,
        createdAt: existing.createdAt || cleanGuide.createdAt,
        viewsCount: Math.max(existing.viewsCount || 0, cleanGuide.viewsCount || 0)
      };
      updated = guides.map((g, i) => i === existingIndex ? mergedGuide : g);
    } else {
      updated = [cleanGuide, ...guides];
    }

    setLocal(STORAGE_KEYS.GUIDES, updated);

    try {
      await setDoc(doc(db, 'guides', cleanGuide.id), cleanGuide, { merge: true });
    } catch (err) {
      console.warn(`Firestore save deferred for guides/${cleanGuide.id}:`, err);
    }
  },

  async deleteGuide(id: string): Promise<void> {
    const guides = getLocal<ComparisonGuide[]>(STORAGE_KEYS.GUIDES, INITIAL_GUIDES);
    const target = guides.find(g => g.id === id || g.slug === id);
    const targetId = target ? target.id : id;
    const targetSlug = target ? target.slug : '';

    const remaining = guides.filter(g => g.id !== targetId && g.slug !== targetId && (targetSlug ? g.slug !== targetSlug : true));
    setLocal(STORAGE_KEYS.GUIDES, remaining);

    const deletedList = getLocal<string[]>('achados_deleted_guides', []);
    const toAdd = [targetId];
    if (targetSlug && !toAdd.includes(targetSlug)) toAdd.push(targetSlug);
    if (id && !toAdd.includes(id)) toAdd.push(id);
    setLocal('achados_deleted_guides', Array.from(new Set([...deletedList, ...toAdd])));

    try {
      await deleteDoc(doc(db, 'guides', targetId));
      if (id !== targetId) {
        await deleteDoc(doc(db, 'guides', id));
      }
    } catch (err) {
      console.warn(`Firestore delete deferred for guides/${targetId}:`, err);
    }
  },

  async incrementGuideViews(guideId: string): Promise<void> {
    const guides = getLocal<ComparisonGuide[]>(STORAGE_KEYS.GUIDES, INITIAL_GUIDES);
    const updated = guides.map(g => (g.id === guideId || g.slug === guideId) ? { ...g, viewsCount: (g.viewsCount || 0) + 1 } : g);
    setLocal(STORAGE_KEYS.GUIDES, updated);

    try {
      const target = guides.find(g => g.id === guideId || g.slug === guideId);
      const docId = target ? target.id : guideId;
      const ref = doc(db, 'guides', docId);
      await updateDoc(ref, { viewsCount: increment(1) });
    } catch {
      // Non-critical metric increment failure
    }
  },

  // STATS
  async getStats() {
    const reviews = await this.getReviews();
    const guides = await this.getGuides();
    const categories = await this.getCategories();
    const banners = await this.getBanners();
    const clicks = getLocal<AffiliateClick[]>(STORAGE_KEYS.CLICKS, []);

    const totalViews = reviews.reduce((acc, r) => acc + (r.viewsCount || 0), 0) +
                       guides.reduce((acc, g) => acc + (g.viewsCount || 0), 0);
    const sumReviewClicks = reviews.reduce((acc, r) => acc + (r.clicksCount || 0), 0);
    const totalClicks = Math.max(clicks.length, sumReviewClicks);

    return {
      totalReviews: reviews.length,
      totalGuides: guides.length,
      totalCategories: categories.length,
      totalBanners: banners.length,
      totalViews,
      totalClicks,
      recentClicks: clicks.slice(0, 50)
    };
  },

  // SINCRONIZAÇÃO EM MASSA & BACKUP
  async syncAllToFirestore(): Promise<{ reviewsCount: number; guidesCount: number; categoriesCount: number; bannersCount: number }> {
    const reviews = getLocal<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    const guides = getLocal<ComparisonGuide[]>(STORAGE_KEYS.GUIDES, INITIAL_GUIDES);
    const categories = getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    const banners = getLocal<Banner[]>(STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
    const settings = getLocal<SiteSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);

    for (const r of reviews) {
      await setDoc(doc(db, 'reviews', r.id), r, { merge: true });
    }
    for (const g of guides) {
      await setDoc(doc(db, 'guides', g.id), g, { merge: true });
    }
    for (const c of categories) {
      await setDoc(doc(db, 'categories', c.id), c, { merge: true });
    }
    for (const b of banners) {
      await setDoc(doc(db, 'banners', b.id), b, { merge: true });
    }
    await setDoc(doc(db, 'siteSettings', 'global'), settings, { merge: true });

    return {
      reviewsCount: reviews.length,
      guidesCount: guides.length,
      categoriesCount: categories.length,
      bannersCount: banners.length
    };
  },

  exportBackup(): string {
    const data = {
      reviews: getLocal<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS),
      guides: getLocal<ComparisonGuide[]>(STORAGE_KEYS.GUIDES, INITIAL_GUIDES),
      categories: getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES),
      banners: getLocal<Banner[]>(STORAGE_KEYS.BANNERS, INITIAL_BANNERS),
      settings: getLocal<SiteSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS),
      clicks: getLocal<AffiliateClick[]>(STORAGE_KEYS.CLICKS, []),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  },

  async importBackup(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (data.reviews && Array.isArray(data.reviews)) {
        setLocal(STORAGE_KEYS.REVIEWS, data.reviews);
        for (const r of data.reviews) {
          await setDoc(doc(db, 'reviews', r.id), r, { merge: true });
        }
      }
      if (data.guides && Array.isArray(data.guides)) {
        setLocal(STORAGE_KEYS.GUIDES, data.guides);
        for (const g of data.guides) {
          await setDoc(doc(db, 'guides', g.id), g, { merge: true });
        }
      }
      if (data.categories && Array.isArray(data.categories)) {
        setLocal(STORAGE_KEYS.CATEGORIES, data.categories);
        for (const c of data.categories) {
          await setDoc(doc(db, 'categories', c.id), c, { merge: true });
        }
      }
      if (data.banners && Array.isArray(data.banners)) {
        setLocal(STORAGE_KEYS.BANNERS, data.banners);
        for (const b of data.banners) {
          await setDoc(doc(db, 'banners', b.id), b, { merge: true });
        }
      }
      if (data.settings) {
        setLocal(STORAGE_KEYS.SETTINGS, data.settings);
        await setDoc(doc(db, 'siteSettings', 'global'), data.settings, { merge: true });
      }
      return true;
    } catch (err) {
      console.error('Import error:', err);
      return false;
    }
  }
};
