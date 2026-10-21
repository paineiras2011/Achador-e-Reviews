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
import { Review, Category, Banner, SiteSettings, AffiliateClick } from '../types';
import { 
  INITIAL_REVIEWS, 
  INITIAL_CATEGORIES, 
  INITIAL_BANNERS, 
  INITIAL_SETTINGS 
} from '../data/initialData';
import { cleanOtherStores } from '../utils/storeHelpers';

const STORAGE_KEYS = {
  REVIEWS: 'achados_reviews_data',
  CATEGORIES: 'achados_categories_data',
  BANNERS: 'achados_banners_data',
  SETTINGS: 'achados_settings_data',
  CLICKS: 'achados_affiliate_clicks_data',
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
    // 1. Preservação Total: Nunca sobrescreve dados já existentes salvos pelo usuário
    const existingReviews = getLocal<Review[] | null>(STORAGE_KEYS.REVIEWS, null);
    if (!existingReviews || existingReviews.length === 0) {
      setLocal(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
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
        // Dados locais já inicializados com segurança para visitantes
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

        // Fusão inteligente bidirecional: NUNCA perde itens cadastrados localmente
        const mergedMap = new Map<string, Review>();

        // 1. Registra os locais atuais (contém produtos cadastrados e edições do usuário)
        for (const loc of local) {
          if (loc && loc.id && !deletedList.includes(loc.id) && !deletedList.includes(loc.slug)) {
            mergedMap.set(loc.id, loc);
          }
        }

        // 2. Mescla com os remotos mantendo a versão mais recente e preservando itens exclusivos
        for (const rem of remoteReviews) {
          if (!rem || !rem.id || deletedList.includes(rem.id) || deletedList.includes(rem.slug)) {
            continue;
          }
          const existing = mergedMap.get(rem.id) || Array.from(mergedMap.values()).find(m => m.slug === rem.slug);
          if (!existing) {
            mergedMap.set(rem.id, rem);
          } else {
            // Se existir em ambos, compara timestamps para manter a alteração mais recente
            const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
            const remoteTime = new Date(rem.updatedAt || rem.createdAt || 0).getTime();
            if (remoteTime > existingTime) {
              mergedMap.set(rem.id, rem);
            }
          }
        }

        const mergedReviews = Array.from(new Set(Array.from(mergedMap.values())));
        mergedReviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        // Se houver itens locais que ainda não estão no Firestore, sincroniza-os em segundo plano
        for (const loc of local) {
          const inRemote = remoteReviews.some(r => r.id === loc.id || r.slug === loc.slug);
          if (!inRemote && !deletedList.includes(loc.id) && !deletedList.includes(loc.slug)) {
            try {
              setDoc(doc(db, 'reviews', loc.id), loc, { merge: true });
            } catch {
              // background sync deferred
            }
          }
        }

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

    // Atualização local com preservação de métricas existentes
    const reviews = getLocal<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    const existingIndex = reviews.findIndex(r => r.id === cleanReview.id || r.slug === cleanReview.slug);
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

  // STATS
  async getStats() {
    const reviews = await this.getReviews();
    const categories = await this.getCategories();
    const banners = await this.getBanners();
    const clicks = getLocal<AffiliateClick[]>(STORAGE_KEYS.CLICKS, []);

    const totalViews = reviews.reduce((acc, r) => acc + (r.viewsCount || 0), 0);
    const sumReviewClicks = reviews.reduce((acc, r) => acc + (r.clicksCount || 0), 0);
    const totalClicks = Math.max(clicks.length, sumReviewClicks);

    return {
      totalReviews: reviews.length,
      totalCategories: categories.length,
      totalBanners: banners.length,
      totalViews,
      totalClicks,
      recentClicks: clicks.slice(0, 50)
    };
  }
};
