import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  generateFullProductReview,
  generateComparisonGuideWithAI,
  generatePostKitWithAI,
  GuideInputProduct,
} from './server/aiEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '2mb' }));

async function resolveAvailableCategories(passedCategories?: unknown): Promise<string[]> {
  if (Array.isArray(passedCategories)) {
    const cleaned = passedCategories
      .map((c) => (typeof c === 'string' ? c.trim() : typeof c?.name === 'string' ? c.name.trim() : ''))
      .filter(Boolean);
    if (cleaned.length > 0) return cleaned;
  }
  try {
    const catalog = await getSeoCatalog();
    const cats = (catalog.categories || []).map((c: any) => String(c?.name || '').trim()).filter(Boolean);
    if (cats.length > 0) return cats;
  } catch {
    // Fallback para lista padrão
  }
  return [
    'Áudio & Fones',
    'Informática & Periféricos',
    'Utilidades',
    'Casa Inteligente',
    'Relógios & Smartwatches',
    'Tecnologia & Dispositivos',
  ];
}

// Endpoint principal para identificação e criação automática completa (Review + SEO + Kit de Postagem)
app.post('/api/analyze-product', async (req: Request, res: Response) => {
  try {
    const { input, categories } = req.body || {};

    if (!input || typeof input !== 'string' || !input.trim()) {
      res.status(400).json({ error: 'O link ou nome do produto é obrigatório.' });
      return;
    }

    const availableCategories = await resolveAvailableCategories(categories);
    const data = await generateFullProductReview({
      input: input.trim(),
      availableCategories,
      baseUrl: getBaseUrl(req),
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro geral no endpoint /api/analyze-product:', error);
    res.status(500).json({ error: 'Erro ao processar produto.' });
  }
});

// Endpoint para enriquecer ou regenerar análise sem perder preço/loja/slug já definidos
app.post('/api/enrich-details', async (req: Request, res: Response) => {
  try {
    const {
      title,
      category,
      affiliateUrl,
      categories,
      priceCurrent,
      priceOriginal,
      partnerStore,
      slug,
    } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      res.status(400).json({ error: 'Título do produto é obrigatório para extrair informações reais.' });
      return;
    }

    const availableCategories = await resolveAvailableCategories(categories);
    const data = await generateFullProductReview({
      input: title.trim(),
      availableCategories,
      baseUrl: getBaseUrl(req),
      affiliateUrlHint: typeof affiliateUrl === 'string' ? affiliateUrl : '',
      priceCurrentHint: typeof priceCurrent === 'string' ? priceCurrent : '',
      priceOriginalHint: typeof priceOriginal === 'string' ? priceOriginal : '',
      partnerStoreHint: typeof partnerStore === 'string' ? partnerStore : '',
      slugHint: typeof slug === 'string' ? slug : '',
      categoryHint: typeof category === 'string' ? category : '',
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('Erro em /api/enrich-details:', err);
    res.status(500).json({ error: 'Erro ao extrair informações reais.' });
  }
});

// Endpoint dedicado para gerar/atualizar o Kit de Postagem (SEO + WhatsApp + Instagram + Shorts)
app.post('/api/generate-post-kit', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const title = String(body.title || '').trim();
    if (!title) {
      res.status(400).json({ error: 'Título é obrigatório para gerar o kit de postagem.' });
      return;
    }

    const postKit = await generatePostKitWithAI({
      title,
      slug: String(body.slug || '').trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      priceCurrent: String(body.priceCurrent || 'Oferta'),
      priceOriginal: body.priceOriginal ? String(body.priceOriginal) : '',
      partnerStore: String(body.partnerStore || 'Loja Oficial'),
      affiliateUrl: String(body.affiliateUrl || ''),
      category: String(body.category || 'Tecnologia & Dispositivos'),
      rating: Number(body.rating) || 4.8,
      pros: Array.isArray(body.pros) ? body.pros.filter(Boolean) : [],
      cons: Array.isArray(body.cons) ? body.cons.filter(Boolean) : [],
      verdict: String(body.verdict || ''),
      type: body.type === 'guide' ? 'guide' : 'review',
      baseUrl: getBaseUrl(req),
    });

    res.json({ success: true, data: postKit });
  } catch (err) {
    console.error('Erro em /api/generate-post-kit:', err);
    res.status(500).json({ error: 'Erro ao gerar kit de postagem.' });
  }
});

// Endpoint automático para criação completa de Guias Comparativos sem conteúdo genérico
app.post('/api/generate-guide', async (req: Request, res: Response) => {
  try {
    const {
      topic,
      category,
      selectedReviews,
      extraInputs,
      categories,
    } = req.body || {};

    const availableCategories = await resolveAvailableCategories(categories);
    const baseUrl = getBaseUrl(req);

    const existingList: GuideInputProduct[] = Array.isArray(selectedReviews)
      ? selectedReviews
          .filter((item: any) => item && typeof item.title === 'string' && item.title.trim().length > 0)
          .map((item: any) => ({
            id: item.id,
            title: String(item.title).trim(),
            price: item.priceCurrent || item.price || '',
            originalPrice: item.priceOriginal || item.originalPrice || '',
            partnerStore: item.partnerStore || '',
            affiliateUrl: item.affiliateUrl || '',
            imageUrl: item.coverImage || item.imageUrl || '',
            rating: Number(item.rating) || 4.8,
            pros: Array.isArray(item.pros) ? item.pros : [],
            cons: Array.isArray(item.cons) ? item.cons : [],
            specifications: Array.isArray(item.specifications)
              ? item.specifications
              : Array.isArray(item.keySpecs)
              ? item.keySpecs
              : [],
            verdict: item.verdict || item.summary || '',
            subtitle: item.subtitle || '',
            reviewSlug: item.slug || item.reviewSlug || undefined,
          }))
      : [];

    const rawExtras: string[] = Array.isArray(extraInputs)
      ? extraInputs.map((x: any) => String(x || '').trim()).filter((x: string) => x.length > 2)
      : [];

    const analyzedExtras: GuideInputProduct[] =
      rawExtras.length > 0
        ? await Promise.all(
            rawExtras.slice(0, 5).map(async (rawInput, idx) => {
              const rev = await generateFullProductReview({
                input: rawInput,
                availableCategories,
                baseUrl,
              });
              return {
                id: `prod-${Date.now()}-extra-${idx + 1}`,
                title: rev.title,
                price: rev.priceCurrent,
                originalPrice: rev.priceOriginal,
                partnerStore: rev.partnerStore,
                affiliateUrl: rev.affiliateUrl,
                imageUrl: rev.coverImage,
                rating: rev.rating,
                pros: rev.pros,
                cons: rev.cons,
                specifications: rev.specifications,
                verdict: rev.verdict,
                subtitle: rev.subtitle,
              };
            })
          )
        : [];

    const combinedProducts = [...existingList, ...analyzedExtras];

    if (combinedProducts.length === 0 && (!topic || !String(topic).trim())) {
      res.status(400).json({ error: 'Selecione ao menos 1 produto, adicione links/nomes extras ou informe um tema para gerar o comparativo.' });
      return;
    }

    const guide = await generateComparisonGuideWithAI({
      topic: String(topic || '').trim(),
      category: String(category || '').trim(),
      products: combinedProducts,
      availableCategories,
      baseUrl,
    });

    res.json({ success: true, data: guide });
  } catch (err) {
    console.error('Erro em /api/generate-guide:', err);
    res.status(500).json({ error: 'Erro ao gerar guia comparativo.' });
  }
});


// Cache e leitor público do Firestore para Sitemap dinâmico e SEO Server-Side (SSR-Lite)
interface SeoCatalog {
  reviews: any[];
  guides: any[];
  categories: any[];
  settings: Record<string, any> | null;
  fetchedAt: number;
}

let seoCatalogCache: SeoCatalog | null = null;
const SEO_CACHE_TTL_MS = 30_000;

function getFirebaseRestConfig(): { projectId: string; apiKey: string; firestoreDatabaseId: string } | null {
  try {
    const raw = fs.readFileSync(path.resolve(__dirname, 'firebase-applet-config.json'), 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed?.projectId && parsed?.apiKey) {
      return {
        projectId: parsed.projectId,
        apiKey: parsed.apiKey,
        firestoreDatabaseId: parsed.firestoreDatabaseId || '(default)'
      };
    }
  } catch {
    // Config ausente ou ilegível
  }
  return null;
}

function decodeFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return Array.isArray(val.arrayValue?.values) ? val.arrayValue.values.map(decodeFirestoreValue) : [];
  }
  if ('mapValue' in val) {
    const obj: Record<string, any> = {};
    const fields = val.mapValue?.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      obj[k] = decodeFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

function decodeFirestoreDoc(doc: any): Record<string, any> {
  const obj: Record<string, any> = {};
  const fields = doc?.fields || {};
  for (const [k, v] of Object.entries(fields)) {
    obj[k] = decodeFirestoreValue(v);
  }
  if (!obj.id && typeof doc?.name === 'string') {
    const parts = doc.name.split('/');
    obj.id = parts[parts.length - 1];
  }
  return obj;
}

async function fetchPublicCollection(cfg: { projectId: string; apiKey: string; firestoreDatabaseId: string }, collectionName: string): Promise<any[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const dbName = encodeURIComponent(cfg.firestoreDatabaseId);
    const url = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${dbName}/documents:runQuery?key=${cfg.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: collectionName }],
          limit: 300
        }
      }),
      signal: controller.signal
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((entry: any) => entry && entry.document)
      .map((entry: any) => decodeFirestoreDoc(entry.document));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function getSeoCatalog(): Promise<SeoCatalog> {
  if (seoCatalogCache && Date.now() - seoCatalogCache.fetchedAt < SEO_CACHE_TTL_MS) {
    return seoCatalogCache;
  }

  const cfg = getFirebaseRestConfig();
  if (!cfg) {
    return { reviews: [], guides: [], categories: [], settings: null, fetchedAt: Date.now() };
  }

  const [reviews, guides, categories, settingsDocs] = await Promise.all([
    fetchPublicCollection(cfg, 'reviews'),
    fetchPublicCollection(cfg, 'guides'),
    fetchPublicCollection(cfg, 'categories'),
    fetchPublicCollection(cfg, 'siteSettings')
  ]);

  reviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  guides.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const globalSettings = settingsDocs.find(d => d.id === 'global') || settingsDocs[0] || null;

  seoCatalogCache = {
    reviews,
    guides,
    categories,
    settings: globalSettings,
    fetchedAt: Date.now()
  };
  return seoCatalogCache;
}

function getBaseUrl(req: Request): string {
  const rawProto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
  const host = req.get('host') || 'localhost:3000';
  const proto = /localhost|127\.0\.0\.1/.test(host) ? rawProto : 'https';
  return `${proto}://${host}`;
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toAbsoluteUrl(baseUrl: string, maybeRelative: string | undefined): string {
  if (!maybeRelative) return '';
  if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative;
  if (maybeRelative.startsWith('//')) return `https:${maybeRelative}`;
  return `${baseUrl}${maybeRelative.startsWith('/') ? '' : '/'}${maybeRelative}`;
}

function injectSeoIntoHtml(baseHtml: string, req: Request, catalog: SeoCatalog): string {
  const baseUrl = getBaseUrl(req);
  const cleanPath = (req.path || '/').replace(/\/+$/, '') || '/';
  const siteName = catalog.settings?.siteName || 'Achados & Reviews';

  let title = `${siteName} – Melhores Compras, Análises e Ofertas Verificadas`;
  let description = 'Descubra análises imparciais, comparativos completos e as melhores ofertas verificadas na Amazon, Mercado Livre e Shopee em tecnologia, casa e mobilidade.';
  let ogType = 'website';
  let ogImage = `${baseUrl}/src/assets/images/hero_tech_showcase_1792355762010.jpg`;
  let canonical = `${baseUrl}${cleanPath === '/' ? '/' : cleanPath}`;
  let noIndex = false;
  let jsonLd: Record<string, unknown> | null = null;
  let ssrRootHtml = '';

  const reviews = catalog.reviews || [];
  const guides = (catalog.guides || []).filter(g => g.published !== false);
  const categories = catalog.categories || [];

  if (cleanPath === '/admin') {
    noIndex = true;
    title = `Painel Administrativo | ${siteName}`;
  } else if (cleanPath.startsWith('/reviews/')) {
    const slug = decodeURIComponent(cleanPath.replace('/reviews/', ''));
    const review = reviews.find(r => r.slug === slug || r.id === slug);
    if (review) {
      title = `${review.title} – Análise, Prós e Contras | ${siteName}`;
      description = (review.subtitle || review.verdict || description).replace(/\s+/g, ' ').trim().slice(0, 160);
      ogType = 'article';
      if (review.coverImage) ogImage = toAbsoluteUrl(baseUrl, review.coverImage);

      const cleanPrice = String(review.priceCurrent || '0')
        .replace(/R\$\s*/gi, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^0-9.]/g, '');

      const graph: Record<string, unknown>[] = [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Início', item: `${baseUrl}/` },
            { '@type': 'ListItem', position: 2, name: review.category || 'Avaliações', item: `${baseUrl}/` },
            { '@type': 'ListItem', position: 3, name: review.title, item: canonical }
          ]
        },
        {
          '@type': 'Product',
          name: review.title,
          image: ogImage,
          description,
          category: review.category,
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: review.rating || 4.8,
            bestRating: '5.0',
            worstRating: '1.0',
            ratingCount: review.viewsCount ? Math.max(12, Math.floor(review.viewsCount / 40)) : 25
          },
          offers: {
            '@type': 'Offer',
            price: cleanPrice || '0.00',
            priceCurrency: 'BRL',
            availability: 'https://schema.org/InStock',
            url: review.affiliateUrl,
            seller: { '@type': 'Organization', name: review.partnerStore || 'Loja Oficial' }
          }
        },
        {
          '@type': 'Review',
          itemReviewed: { '@type': 'Product', name: review.title },
          reviewRating: { '@type': 'Rating', ratingValue: review.rating || 4.8, bestRating: '5.0' },
          author: { '@type': 'Organization', name: siteName },
          publisher: { '@type': 'Organization', name: siteName },
          datePublished: review.createdAt,
          dateModified: review.updatedAt || review.createdAt,
          reviewBody: review.verdict || description
        }
      ];

      if (Array.isArray(review.faqs) && review.faqs.length > 0) {
        graph.push({
          '@type': 'FAQPage',
          mainEntity: review.faqs.map((f: any) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer }
          }))
        });
      }

      jsonLd = { '@context': 'https://schema.org', '@graph': graph };

      const prosList = Array.isArray(review.pros) ? review.pros.map((p: string) => `<li>${escapeHtml(p)}</li>`).join('') : '';
      const consList = Array.isArray(review.cons) ? review.cons.map((c: string) => `<li>${escapeHtml(c)}</li>`).join('') : '';
      const specsList = Array.isArray(review.specifications)
        ? review.specifications.map((s: any) => `<dt>${escapeHtml(s.label)}</dt><dd>${escapeHtml(s.value)}</dd>`).join('')
        : '';
      const faqsList = Array.isArray(review.faqs)
        ? review.faqs.map((f: any) => `<div><h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p></div>`).join('')
        : '';

      ssrRootHtml = `<main class="max-w-4xl mx-auto px-4 py-8">
        <nav aria-label="Breadcrumb"><a href="/">Início</a> / <span>${escapeHtml(review.category)}</span></nav>
        <article>
          <h1>${escapeHtml(review.title)}</h1>
          <p>${escapeHtml(review.subtitle)}</p>
          <p><strong>Preço:</strong> ${escapeHtml(review.priceCurrent)} — <strong>Loja:</strong> ${escapeHtml(review.partnerStore)}</p>
          ${prosList ? `<h2>Pontos Positivos</h2><ul>${prosList}</ul>` : ''}
          ${consList ? `<h2>Pontos de Atenção</h2><ul>${consList}</ul>` : ''}
          ${specsList ? `<h2>Ficha Técnica</h2><dl>${specsList}</dl>` : ''}
          <div>${escapeHtml(review.content)}</div>
          ${review.verdict ? `<h2>Veredito Final</h2><p>${escapeHtml(review.verdict)}</p>` : ''}
          ${faqsList ? `<h2>Perguntas Frequentes</h2>${faqsList}` : ''}
        </article>
      </main>`;
    }
  } else if (cleanPath.startsWith('/guias/')) {
    const slug = decodeURIComponent(cleanPath.replace('/guias/', ''));
    const guide = guides.find(g => g.slug === slug || g.id === slug);
    if (guide) {
      title = `${guide.title} | ${siteName}`;
      description = (guide.subtitle || guide.introContent || description).replace(/\s+/g, ' ').trim().slice(0, 160);
      ogType = 'article';
      if (guide.coverImage) ogImage = toAbsoluteUrl(baseUrl, guide.coverImage);

      const graph: Record<string, unknown>[] = [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Início', item: `${baseUrl}/` },
            { '@type': 'ListItem', position: 2, name: 'Guias Comparativos', item: `${baseUrl}/#guias-comparativos` },
            { '@type': 'ListItem', position: 3, name: guide.title, item: canonical }
          ]
        },
        {
          '@type': 'Article',
          headline: guide.title,
          description,
          image: ogImage,
          datePublished: guide.createdAt,
          dateModified: guide.updatedAt || guide.createdAt,
          author: { '@type': 'Organization', name: siteName },
          publisher: { '@type': 'Organization', name: siteName },
          mainEntityOfPage: canonical
        },
        {
          '@type': 'ItemList',
          name: guide.title,
          itemListElement: (guide.products || []).map((p: any, idx: number) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: p.title,
            description: p.summary,
            image: p.imageUrl
          }))
        }
      ];

      if (Array.isArray(guide.faqs) && guide.faqs.length > 0) {
        graph.push({
          '@type': 'FAQPage',
          mainEntity: guide.faqs.map((f: any) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer }
          }))
        });
      }

      jsonLd = { '@context': 'https://schema.org', '@graph': graph };

      const itemsHtml = (guide.products || []).map((p: any, i: number) => `
        <section>
          <h2>#${i + 1} ${escapeHtml(p.title)} (${escapeHtml(p.price)})</h2>
          <p>${escapeHtml(p.summary)}</p>
          ${p.reviewSlug ? `<a href="/reviews/${escapeHtml(p.reviewSlug)}">Ler análise completa</a>` : ''}
        </section>`).join('');

      ssrRootHtml = `<main class="max-w-4xl mx-auto px-4 py-8">
        <nav aria-label="Breadcrumb"><a href="/">Início</a> / <span>Guias Comparativos</span></nav>
        <article>
          <h1>${escapeHtml(guide.title)}</h1>
          <p>${escapeHtml(guide.subtitle)}</p>
          <p>${escapeHtml(guide.introContent)}</p>
          ${itemsHtml}
        </article>
      </main>`;
    }
  } else if (cleanPath.startsWith('/categoria/')) {
    const catSlug = decodeURIComponent(cleanPath.replace('/categoria/', '')).toLowerCase();
    const matchedCat = categories.find(c => String(c.slug || '').toLowerCase() === catSlug);
    if (matchedCat) {
      title = `${matchedCat.name}: Melhores Análises e Ofertas | ${siteName}`;
      description = `${matchedCat.description || matchedCat.name}. Compare fichas técnicas, prós e contras e melhores preços verificados.`;
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${matchedCat.name} – ${siteName}`,
        description,
        url: canonical
      };
      const catReviews = reviews.filter(r => r.category === matchedCat.name);
      const linksHtml = catReviews.map(r => `<li><a href="/reviews/${escapeHtml(r.slug)}">${escapeHtml(r.title)} - ${escapeHtml(r.priceCurrent)}</a></li>`).join('');
      ssrRootHtml = `<main class="max-w-5xl mx-auto px-4 py-8">
        <h1>${escapeHtml(matchedCat.name)}</h1>
        <p>${escapeHtml(matchedCat.description)}</p>
        <ul>${linksHtml}</ul>
      </main>`;
    }
  } else if (cleanPath === '/sobre' || cleanPath === '/metodologia' || cleanPath === '/privacidade' || cleanPath === '/termos') {
    const infoTitles: Record<string, { t: string; d: string }> = {
      '/sobre': {
        t: `Sobre Nós – Curadoria Independente | ${siteName}`,
        d: 'Conheça o Achados & Reviews, nossa missão editorial independente e como selecionamos ofertas verificadas.'
      },
      '/metodologia': {
        t: `Metodologia de Análise e Critérios | ${siteName}`,
        d: 'Entenda nossos critérios de avaliação técnica: custo-benefício, desempenho, construção e segurança das lojas parceiras.'
      },
      '/privacidade': {
        t: `Política de Privacidade e LGPD | ${siteName}`,
        d: 'Saiba como tratamos dados, cookies de afiliados e privacidade no Achados & Reviews conforme a LGPD.'
      },
      '/termos': {
        t: `Termos de Uso e Transparência | ${siteName}`,
        d: 'Termos de uso, preços dinâmicos e aviso de transparência editorial de afiliados.'
      }
    };
    title = infoTitles[cleanPath].t;
    description = infoTitles[cleanPath].d;
    ssrRootHtml = `<main class="max-w-4xl mx-auto px-4 py-8"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><a href="/">Voltar ao início</a></main>`;
  } else {
    // Home page SSR-lite link graph
    jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: siteName,
          url: baseUrl,
          description: catalog.settings?.tagline || description
        },
        {
          '@type': 'WebSite',
          name: siteName,
          url: baseUrl,
          description,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${baseUrl}/?search={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        }
      ]
    };

    const guideLinks = guides.map(g => `<li><a href="/guias/${escapeHtml(g.slug)}">${escapeHtml(g.title)}</a></li>`).join('');
    const reviewLinks = reviews.map(r => `<li><a href="/reviews/${escapeHtml(r.slug)}">${escapeHtml(r.title)} (${escapeHtml(r.priceCurrent)})</a></li>`).join('');
    const catLinks = categories.map(c => `<li><a href="/categoria/${escapeHtml(c.slug)}">${escapeHtml(c.name)}</a></li>`).join('');

    ssrRootHtml = `<main class="max-w-6xl mx-auto px-4 py-8">
      <h1>${escapeHtml(siteName)} – Análises Imparciais e Melhores Ofertas</h1>
      <p>${escapeHtml(description)}</p>
      ${catLinks ? `<nav aria-label="Categorias"><ul>${catLinks}</ul></nav>` : ''}
      ${guideLinks ? `<section><h2>Guias de Compra e Comparativos</h2><ul>${guideLinks}</ul></section>` : ''}
      ${reviewLinks ? `<section><h2>Avaliações Recentes de Produtos</h2><ul>${reviewLinks}</ul></section>` : ''}
      <footer>
        <a href="/sobre">Sobre Nós</a> · <a href="/metodologia">Metodologia</a> · <a href="/privacidade">Privacidade</a> · <a href="/termos">Termos</a>
      </footer>
    </main>`;
  }

  let out = baseHtml;
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  out = out.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeHtml(description)}" />`);
  out = out.replace(/<meta\s+name=["']robots["'][^>]*>/i, `<meta name="robots" content="${noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}" />`);
  out = out.replace(/<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  out = out.replace(/<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  out = out.replace(/<meta\s+property=["']og:type["'][^>]*>/i, `<meta property="og:type" content="${ogType}" />`);
  out = out.replace(/<meta\s+name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  out = out.replace(/<meta\s+name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);

  // Verificação Google Search Console dinâmica vinda do painel admin (se configurada)
  const rawVerif = String(catalog.settings?.googleSiteVerification || '');
  const verifMatch = rawVerif.match(/content=["']([^"']+)["']/i);
  const verifToken = verifMatch ? verifMatch[1] : (!rawVerif.includes('.html') && !rawVerif.includes(':') ? rawVerif.trim() : '');
  const extraVerifTag = verifToken && !out.includes(verifToken)
    ? `<meta name="google-site-verification" content="${escapeHtml(verifToken)}" />\n    `
    : '';

  const headAdditions = `${extraVerifTag}<link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />${
      jsonLd
        ? `\n    <script id="schema-org-jsonld" type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`
        : ''
    }`;

  out = out.replace('</head>', `    ${headAdditions}\n  </head>`);

  if (ssrRootHtml) {
    out = out.replace('<div id="root"></div>', `<div id="root">${ssrRootHtml}</div>`);
  }

  return out;
}

// Endpoint para limpar cache SEO imediatamente ao salvar novo produto/guia no admin
app.post('/api/seo-revalidate', (_req: Request, res: Response) => {
  seoCatalogCache = null;
  res.json({ success: true });
});

// Endpoint oficial de robots.txt para Googlebot e indexadores
app.get('/robots.txt', (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

// Endpoint para validação do Google Search Console via Arquivo HTML
app.get('/google:id.html', (req: Request, res: Response) => {
  res.type('text/html');
  res.send(`google-site-verification: google${req.params.id}.html\n`);
});

// Endpoint dinâmico de sitemap.xml lendo em tempo real do Firestore
app.get('/sitemap.xml', async (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);
  const now = new Date().toISOString().split('T')[0];
  const catalog = await getSeoCatalog();

  const seenUrls = new Set<string>();
  const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [];

  const pushUrl = (pathSuffix: string, lastmod: string, changefreq: string, priority: string) => {
    const loc = `${baseUrl}${pathSuffix.startsWith('/') ? pathSuffix : '/' + pathSuffix}`;
    if (!seenUrls.has(loc)) {
      seenUrls.add(loc);
      urls.push({ loc, lastmod, changefreq, priority });
    }
  };

  pushUrl('/', now, 'daily', '1.0');

  // Páginas institucionais E-E-A-T
  for (const staticPath of ['/sobre', '/metodologia', '/privacidade', '/termos']) {
    pushUrl(staticPath, now, 'monthly', '0.5');
  }

  // Categorias dinâmicas
  for (const cat of catalog.categories || []) {
    if (cat?.slug) {
      pushUrl(`/categoria/${encodeURIComponent(cat.slug)}`, now, 'weekly', '0.8');
    }
  }

  // Guias comparativos publicados no Firestore
  const publishedGuides = (catalog.guides || []).filter(g => g?.slug && g.published !== false);
  for (const guide of publishedGuides) {
    const mod = guide.updatedAt || guide.createdAt;
    const dateStr = mod ? new Date(mod).toISOString().split('T')[0] : now;
    pushUrl(`/guias/${encodeURIComponent(guide.slug)}`, dateStr, 'weekly', '0.95');
  }

  // Reviews individuais cadastrados no Firestore
  for (const review of catalog.reviews || []) {
    if (review?.slug) {
      const mod = review.updatedAt || review.createdAt;
      const dateStr = mod ? new Date(mod).toISOString().split('T')[0] : now;
      pushUrl(`/reviews/${encodeURIComponent(review.slug)}`, dateStr, 'weekly', '0.9');
    }
  }

  // Fallback seguro caso Firestore ainda não tenha sido populado
  if ((catalog.reviews || []).length === 0) {
    const fallbackSlugs = [
      'celular-samsung-galaxy-s26-fe-128gb-8gb-ram-tela-6-7-azul-cobalto',
      'notebook-dell-dc15-i51334u-a50-15-6-fhd-i5-8gb-512gb-win-11'
    ];
    for (const slug of fallbackSlugs) {
      pushUrl(`/reviews/${slug}`, now, 'weekly', '0.9');
    }
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const u of urls) {
    xml += `  <url>\n    <loc>${escapeHtml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
  }
  xml += '</urlset>';

  res.type('application/xml');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.send(xml);
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = parseInt(process.env.PORT || '3000', 10);

  // Serve static public folder, favicon and assets consistently
  app.use(express.static(path.resolve(__dirname, 'public'), { index: false }));
  app.use('/src/assets', express.static(path.resolve(__dirname, 'src/assets')));
  app.use('/assets', express.static(path.resolve(__dirname, 'public/assets')));
  app.use('/assets', express.static(path.resolve(__dirname, 'src/assets')));

  const isHtmlRoute = (req: Request): boolean => {
    if (req.method !== 'GET') return false;
    const p = req.path || '/';
    if (p.startsWith('/api/') || p.startsWith('/src/') || p.startsWith('/@') || p.startsWith('/node_modules/') || p.startsWith('/assets/')) {
      return false;
    }
    if (/\.[a-zA-Z0-9]{2,6}$/.test(p) && !p.endsWith('.html')) return false;
    return Boolean(req.accepts('html'));
  };

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });

    app.use(async (req: Request, res: Response, next: NextFunction) => {
      if (!isHtmlRoute(req)) return next();
      try {
        const template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, template);
        const catalog = await getSeoCatalog();
        const finalHtml = injectSeoIntoHtml(transformed, req, catalog);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
      } catch (e) {
        next(e);
      }
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', async (req: Request, res: Response) => {
      const distIndex = path.resolve(distPath, 'index.html');
      const rootIndex = path.resolve(__dirname, 'index.html');
      const targetIndex = fs.existsSync(distIndex) ? distIndex : rootIndex;
      try {
        const template = fs.readFileSync(targetIndex, 'utf8');
        const catalog = await getSeoCatalog();
        const finalHtml = injectSeoIntoHtml(template, req, catalog);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
      } catch {
        res.sendFile(targetIndex);
      }
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Achados & Reviews server running on http://0.0.0.0:${port}`);
  });
}

startServer();
