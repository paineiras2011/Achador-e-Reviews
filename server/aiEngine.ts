import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

export type ProductNiche =
  | 'FITNESS_BIKE'
  | 'MOBILITY'
  | 'BICYCLE'
  | 'WATCH'
  | 'TV'
  | 'AUDIO'
  | 'NOTEBOOK'
  | 'PERIPHERAL'
  | 'KITCHEN_OVEN'
  | 'KITCHEN_APPLIANCE'
  | 'CLIMATE'
  | 'CONSOLE'
  | 'CONNECTIVITY'
  | 'SMARTPHONE'
  | 'UTILITY'
  | 'GENERAL';

export interface ScrapedMetadata {
  resolvedUrl: string;
  pageTitle: string;
  metaDescription: string;
  ogImage: string;
  slugTitle: string;
  extractedPrice: string;
  extractedOriginalPrice: string;
  extractedSnippet: string;
  scrapedSpecs: { label: string; value: string }[];
  brand: string;
  model: string;
  ratingHint: number | null;
}

export interface PostKitData {
  seoTitle: string;
  metaDescription: string;
  highlightsBadge: string;
  whatsappCopy: string;
  instagramCaption: string;
  shortVideoScript: string;
}

export interface GeneratedReviewPayload {
  title: string;
  slug: string;
  subtitle: string;
  category: string;
  coverImage: string;
  partnerStore: string;
  affiliateUrl: string;
  priceCurrent: string;
  priceOriginal: string;
  discountPercent: string;
  rating: number;
  pros: string[];
  cons: string[];
  specifications: { label: string; value: string }[];
  content: string;
  verdict: string;
  scoreCostBenefit: number;
  scorePerformance: number;
  scoreBuild: number;
  scoreUsability: number;
  faqs: { question: string; answer: string }[];
  postKit: PostKitData;
  generationSource?: 'gemini-search' | 'gemini' | 'scraped-synthesis';
}

export interface GuideInputProduct {
  id?: string;
  title: string;
  price?: string;
  originalPrice?: string;
  partnerStore?: string;
  affiliateUrl?: string;
  imageUrl?: string;
  rating?: number;
  pros?: string[];
  cons?: string[];
  specifications?: { label: string; value: string }[];
  verdict?: string;
  subtitle?: string;
  reviewSlug?: string;
}

export interface GeneratedGuidePayload {
  title: string;
  slug: string;
  subtitle: string;
  category: string;
  coverImage: string;
  introContent: string;
  buyingTipsContent: string;
  products: {
    id: string;
    title: string;
    badge: string;
    rating: number;
    price: string;
    originalPrice?: string;
    partnerStore: string;
    affiliateUrl: string;
    imageUrl: string;
    summary: string;
    pros: string[];
    cons: string[];
    keySpecs: { label: string; value: string }[];
    reviewSlug?: string;
  }[];
  faqs: { question: string; answer: string }[];
  postKit: PostKitData;
  generationSource?: 'gemini' | 'attribute-synthesis';
}

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function detectStore(urlOrText: string): string {
  if (/amazon\.com(\.br)?|amzn\.to|(^|https?:\/\/|\.)a\.co(\/|$)/i.test(urlOrText)) return 'Amazon Brasil';
  if (/mercadolivre\.com(\.br)?|meli\.la|produto\.mercadolivre/i.test(urlOrText)) return 'Mercado Livre';
  if (/shopee\.com(\.br)?|s\.shopee/i.test(urlOrText)) return 'Shopee Oficial';
  if (/magazineluiza\.com(\.br)?|magazinevoce\.com\.br|magalu\.me|magalu/i.test(urlOrText)) return 'Magazine Luiza';
  if (/aliexpress\.com/i.test(urlOrText)) return 'AliExpress';
  if (/kabum\.com(\.br)?/i.test(urlOrText)) return 'KaBuM!';
  if (/casasbahia\.com(\.br)?/i.test(urlOrText)) return 'Casas Bahia';
  return 'Loja Parceira Oficial';
}

export function decodeHtmlEntities(input: string): string {
  return String(input || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanProductTitle(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let text = decodeHtmlEntities(raw)
    .replace(/\s*[-–|]\s*R\$\s*[\d.,]+\s*$/i, '')
    .replace(/\.{2,}\s*$/g, '')
    .trim();

  if (
    /verificação|acessou nosso site|segurança|navegação segura|proteger seus dados|etapa simples e rápida|robot check|captcha|cloudflare|access denied|algo deu errado|404|login|^mercado\s*li[bv]re|^shopee(\s*brasil)?$|^amazon(\.com\.br)?|serviço indisponível|não é possível acessar/i.test(
      text.trim()
    )
  ) {
    return '';
  }

  const segments = text
    .split(/\s+[|\-—•]\s+|\s*\|\s*|\s*:\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  const filtered = segments.filter((seg) => {
    if (/^R\$\s*[\d.,]+$/i.test(seg)) return false;
    if (/^(magazine\s+[a-z0-9_-]+|magazine\s*voc[eê]|magazine\s*luiza)$/i.test(seg)) return false;
    if (/^(loja\s+(do|da|de)?\s*[a-z0-9_ -]+|vitrine\s+[a-z0-9_ -]+|espa[cç]o\s+[a-z0-9_ -]+|achados\s+(do|da|de)?\s*[a-z0-9_ -]+)$/i.test(seg))
      return false;
    if (/^(amazon(\.com\.br)?|mercado\s*li[bv]re|shopee(\s*brasil)?|aliexpress|kabum!?|casas\s*bahia|americanas|submarino)$/i.test(seg))
      return false;
    if (/^(compre online|frete gr[aá]tis|em promo[cç][aã]o|melhor pre[cç]o|ofertas? da semana|loja oficial|oferta imperd[ií]vel)$/i.test(seg))
      return false;
    if (/^(404|erro|p[aá]gina n[aã]o|algo deu errado|robot check|captcha|acesso negado|verificação)$/i.test(seg)) return false;
    return true;
  });

  const normalizeBrokenAccentedCaps = (str: string) =>
    str
      .replace(/([áéíóúâêôãõç])([A-Z])/g, (_m, acc, upper) => `${acc}${upper.toLowerCase()}`)
      .replace(/[\s,;:\-–—]+$/g, '')
      .trim();

  if (filtered.length > 0) {
    const bestSegment = filtered.sort((a, b) => {
      const aWords = a.split(/\s+/).length;
      const bWords = b.split(/\s+/).length;
      const aKeywords = /rel[oó]gio|smartwatch|watch|tv|fone|headset|teclado|celular|smartphone|notebook|air\s*fryer|fritadeira|bicicleta|bike|scooter|soundbar|aspirador|starlink|playstation|console|ar\s*condicionado|fatiador|ralo|suporte/i.test(a)
        ? 4
        : 0;
      const bKeywords = /rel[oó]gio|smartwatch|watch|tv|fone|headset|teclado|celular|smartphone|notebook|air\s*fryer|fritadeira|bicicleta|bike|scooter|soundbar|aspirador|starlink|playstation|console|ar\s*condicionado|fatiador|ralo|suporte/i.test(b)
        ? 4
        : 0;
      return bWords + bKeywords - (aWords + aKeywords);
    })[0];

    return normalizeBrokenAccentedCaps(
      bestSegment
        .replace(/^(magazine\s+[a-z0-9_-]+|loja\s+[a-z0-9_-]+)\s*[-:]?\s*/gi, '')
        .replace(/\s*[-:]?\s*(no\s+mercado\s+livre|na\s+shopee|na\s+amazon|no\s+magalu).*$/gi, '')
        .replace(/\s*[-–|]\s*R\$\s*[\d.,]+\s*$/i, '')
        .trim()
    );
  }

  const cleanedFull = normalizeBrokenAccentedCaps(
    text
      .replace(/^(magazine\s+[a-z0-9_-]+|loja\s+[a-z0-9_-]+)\s*[|\-:]\s*/gi, '')
      .replace(/\s*[|\-:]\s*(magazine\s+[a-z0-9_-]+|amazon|mercado\s*li[bv]re|shopee|kabum).*$/gi, '')
      .replace(/\s*[-–|]\s*R\$\s*[\d.,]+\s*$/i, '')
      .trim()
  );

  if (/^(mercado\s*li[bv]re|shopee(\s*brasil)?|amazon|magalu|magazine\s*luiza)$/i.test(cleanedFull)) {
    return '';
  }
  return cleanedFull;
}

export function generateSlug(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 110);
}

function formatSlugAsTitle(slug: string): string {
  if (!slug) return '';
  return slug
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (/^(de|da|do|dos|das|e|em|com|para|a|o|as|os)$/.test(lower)) return lower;
      if (/^relogio$/i.test(lower)) return 'Relógio';
      if (/^agua$/i.test(lower)) return 'à Água';
      if (/^eletrica$/i.test(lower)) return 'Elétrica';
      if (/^mecanico$/i.test(lower)) return 'Mecânico';
      if (/^fones?$/i.test(lower)) return 'Fone';
      if (/^ruido$/i.test(lower)) return 'Ruído';
      if (/^televisao$/i.test(lower)) return 'Televisão';
      if (/^bicicleta$/i.test(lower)) return 'Bicicleta';
      if (/^dobravel$/i.test(lower)) return 'Dobrável';
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ')
    .trim();
}

export function extractSlugWords(url: string): string {
  try {
    const parsed = new URL(url);
    if (/^(s\.shopee|amzn\.to|a\.co|meli\.la|magalu\.me|bit\.ly|tinyurl\.com|t\.co|goo\.gl|cutt\.ly|linktr\.ee)$/i.test(parsed.hostname)) {
      return '';
    }
    if (parsed.searchParams.has('go')) {
      const goParam = decodeURIComponent(parsed.searchParams.get('go') || '');
      if (/^https?:\/\//i.test(goParam)) return extractSlugWords(goParam);
    }

    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const candidates = pathParts.filter((part) => {
      if (/^magazine[a-z0-9_-]*$/i.test(part)) return false;
      if (/^(shop|store|loja|vitrine|afiliado[s]?|afiliada[s]?|parceiro[s]?|vendedor|seller|user|perfil|u)$/i.test(part)) return false;
      if (/^(dp|gp|product|produto|produtos|item|itens|p|sec|s|b|c|d|br|pt|opaanlp|gz|account-verification|verify)$/i.test(part)) return false;
      if (/^(MLB[0-9]+|[0-9a-f]{8,}|[0-9]{4,})$/i.test(part)) return false;
      if (!/[-_+% ]/.test(part) && part.length < 18) return false;
      return true;
    });

    if (candidates.length === 0) return '';

    const bestPart = candidates.sort((a, b) => b.split(/[-_+]/).length - a.split(/[-_+]/).length)[0];
    if (bestPart) {
      const cleaned = decodeURIComponent(bestPart)
        .replace(/^MLB[-_]?[0-9]+[-_]?/i, '')
        .replace(/[-_]JM$/i, '')
        .replace(/[-_+]/g, ' ')
        .replace(/[0-9a-f]{8,}/gi, '')
        .trim();
      if (cleaned.length > 3) return formatSlugAsTitle(cleaned);
    }
  } catch {
    // URL inválida
  }
  return '';
}

export function parsePriceToNumber(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const str = String(val).trim();
  if (!str) return null;

  const clean = str.replace(/[^\d.,]/g, '');
  if (!clean) return null;

  if (clean.includes('.') && clean.includes(',')) {
    const n = parseFloat(clean.replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? null : n;
  }
  if (clean.includes(',')) {
    const n = parseFloat(clean.replace(',', '.'));
    return isNaN(n) ? null : n;
  }
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3) {
      const n = parseFloat(clean.replace(/\./g, ''));
      return isNaN(n) ? null : n;
    }
    const n = parseFloat(clean);
    return isNaN(n) ? null : n;
  }
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

export function formatBRL(num: number): string {
  if (isNaN(num)) return 'R$ 0,00';
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function calculateDiscountHelper(
  current: string | number | null | undefined,
  original: string | number | null | undefined
): { percent: number; label: string; savings: string; savingsValue: number } | null {
  const currNum = parsePriceToNumber(current);
  const origNum = parsePriceToNumber(original);

  if (currNum === null || origNum === null) return null;
  if (origNum <= 0 || currNum <= 0) return null;
  if (currNum >= origNum) return { percent: 0, label: '', savings: 'R$ 0,00', savingsValue: 0 };

  const savingsValue = origNum - currNum;
  const rawPercent = (savingsValue / origNum) * 100;
  const rounded = Math.round(rawPercent);

  if (rounded <= 0) return { percent: 0, label: '', savings: 'R$ 0,00', savingsValue: 0 };
  return {
    percent: rounded,
    label: `${rounded}% de desconto`,
    savings: formatBRL(savingsValue),
    savingsValue,
  };
}

function isInventoryBoilerplate(label: string, value: string): boolean {
  const combined = `${label} ${value}`.toLowerCase();
  return /condi[cç][aã]o\s*:?\s*novo|disponibilidade\s*:?\s*pronta entrega|embalagem\s*:?\s*caixa|estoque imediato|envio imediato|produto novo na caixa/i.test(
    combined
  );
}

function extractHtmlSpecRows(html: string): { label: string; value: string }[] {
  const specs: { label: string; value: string }[] = [];
  const seen = new Set<string>();

  const pushSpec = (rawLabel: string, rawVal: string) => {
    const label = decodeHtmlEntities(rawLabel.replace(/<[^>]+>/g, ' ').replace(/[:\s]+$/, '').trim());
    const value = decodeHtmlEntities(rawVal.replace(/<[^>]+>/g, ' ').trim());
    if (!label || !value || label.length < 2 || label.length > 60 || value.length > 180) return;
    if (/^(pre[çc]o|frete|vendedor|avalia[çc][ãa]o|quantidade|parcela)/i.test(label)) return;
    if (isInventoryBoilerplate(label, value)) return;
    const key = label.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      specs.push({ label, value });
    }
  };

  // Mercado Livre / Amazon / tabelas padrão <tr><th>label</th><td>value</td></tr>
  const thTdRegex = /<tr[^>]*>[\s\S]*?<th[^>]*>([\s\S]*?)<\/th>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi;
  let match: RegExpExecArray | null;
  while ((match = thTdRegex.exec(html)) !== null && specs.length < 18) {
    pushSpec(match[1], match[2]);
  }

  // Tabelas 2 colunas <tr><td>label</td><td>value</td></tr> dentro de blocos de ficha técnica
  if (specs.length < 4) {
    const tdTdRegex = /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
    while ((match = tdTdRegex.exec(html)) !== null && specs.length < 18) {
      pushSpec(match[1], match[2]);
    }
  }

  // Definition lists <dt>label</dt><dd>value</dd>
  const dtDdRegex = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  while ((match = dtDdRegex.exec(html)) !== null && specs.length < 18) {
    pushSpec(match[1], match[2]);
  }

  // Amazon detailBullets / feature bullets "Marca : Philco"
  const colonBulletRegex = /<li[^>]*>\s*<span[^>]*class=["'][^"']*a-list-item[^"']*["'][^>]*>([\s\S]*?)<\/span>\s*<\/li>/gi;
  while ((match = colonBulletRegex.exec(html)) !== null && specs.length < 18) {
    const text = decodeHtmlEntities(match[1].replace(/<[^>]+>/g, ' '));
    const parts = text.split(/\s*:\s*/);
    if (parts.length === 2 && parts[0].length <= 40) {
      pushSpec(parts[0], parts[1]);
    }
  }

  return specs;
}

export async function scrapeProductData(targetUrl: string): Promise<ScrapedMetadata> {
  let resolvedUrl = targetUrl;
  let pageTitle = '';
  let metaDescription = '';
  let ogImage = '';
  let extractedPrice = '';
  let extractedOriginalPrice = '';
  let slugTitle = extractSlugWords(targetUrl);
  let extractedSnippet = '';
  let scrapedSpecs: { label: string; value: string }[] = [];
  let brand = '';
  let model = '';
  let ratingHint: number | null = null;

  const isShopee = /shopee\.com(\.br)?|s\.shopee/i.test(targetUrl);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5500);

    const headers: Record<string, string> = isShopee
      ? {
          'User-Agent': 'WhatsApp/2.21.12.21 A',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
        }
      : {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
          'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        };

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers,
    });

    clearTimeout(timeout);
    resolvedUrl = res.url || targetUrl;

    if (resolvedUrl.includes('account-verification') && resolvedUrl.includes('go=')) {
      try {
        const u = new URL(resolvedUrl);
        const goTarget = u.searchParams.get('go');
        if (goTarget) {
          resolvedUrl = decodeURIComponent(goTarget);
          if (!slugTitle) slugTitle = extractSlugWords(resolvedUrl);
        }
      } catch {
        resolvedUrl = targetUrl;
      }
    }

    if (!slugTitle) {
      slugTitle = extractSlugWords(resolvedUrl);
    }

    const html = await res.text();

    // 1. JSON-LD estruturado (Product / IndividualProduct)
    try {
      const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (jsonLdMatches) {
        for (const block of jsonLdMatches) {
          const content = block.replace(/<script[^>]*>|<\/script>/gi, '').trim();
          const parsedLd = JSON.parse(content);
          const items: any[] = [];
          if (Array.isArray(parsedLd)) items.push(...parsedLd);
          else if (parsedLd && Array.isArray(parsedLd['@graph'])) items.push(...parsedLd['@graph']);
          else if (parsedLd) items.push(parsedLd);

          const productItem = items.find((i) => i && (i['@type'] === 'Product' || i['@type'] === 'IndividualProduct'));
          if (productItem) {
            if (productItem.name && !pageTitle) pageTitle = cleanProductTitle(productItem.name);
            if (productItem.brand) {
              brand = typeof productItem.brand === 'string' ? productItem.brand : productItem.brand?.name || '';
            }
            if (productItem.model) model = String(productItem.model);
            if (productItem.aggregateRating?.ratingValue) {
              const r = parseFloat(String(productItem.aggregateRating.ratingValue));
              if (!isNaN(r) && r >= 1 && r <= 5) ratingHint = Number(r.toFixed(1));
            }
            if (Array.isArray(productItem.additionalProperty)) {
              for (const prop of productItem.additionalProperty) {
                if (prop?.name && prop?.value && !isInventoryBoilerplate(prop.name, String(prop.value))) {
                  scrapedSpecs.push({ label: decodeHtmlEntities(String(prop.name)), value: decodeHtmlEntities(String(prop.value)) });
                }
              }
            }
            if (productItem.image && !ogImage) {
              ogImage = Array.isArray(productItem.image)
                ? productItem.image[0]
                : typeof productItem.image === 'string'
                ? productItem.image
                : productItem.image?.url || '';
            }
            if (productItem.description && !metaDescription) {
              metaDescription = decodeHtmlEntities(String(productItem.description));
            }
            if (productItem.offers) {
              const offersList = Array.isArray(productItem.offers) ? productItem.offers : [productItem.offers];
              for (const offer of offersList) {
                const rawPrice = offer?.price ?? offer?.lowPrice;
                if (rawPrice !== undefined && rawPrice !== null && !extractedPrice) {
                  const pNum = parsePriceToNumber(rawPrice);
                  if (pNum && pNum > 0) extractedPrice = formatBRL(pNum);
                }
                const rawHigh = offer?.highPrice ?? offer?.priceSpecification?.maxPrice;
                if (rawHigh !== undefined && rawHigh !== null && !extractedOriginalPrice) {
                  const hNum = parsePriceToNumber(rawHigh);
                  if (hNum && hNum > 0) extractedOriginalPrice = formatBRL(hNum);
                }
              }
            }
            if (extractedPrice && pageTitle) break;
          }
        }
      }
    } catch {
      // Ignora JSON-LD parcial
    }

    // 2. Extração de Preço em Metatags e seletores
    if (!extractedPrice) {
      const metaPriceMatch =
        html.match(/<meta[^>]+(?:property|name|itemprop)=["'](?:product:price:amount|og:price:amount|price|twitter:data1)["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["'](?:product:price:amount|og:price:amount|price|twitter:data1)["']/i);
      if (metaPriceMatch?.[1]) {
        const pNum = parsePriceToNumber(metaPriceMatch[1]);
        if (pNum && pNum > 0) extractedPrice = formatBRL(pNum);
      }
    }

    if (!extractedPrice) {
      const mlSecondLineMatch = html.match(/ui-pdp-price__second-line[\s\S]*?andes-money-amount__fraction[^"']*["']>([\d.,]+)<\/span>/i);
      if (mlSecondLineMatch?.[1]) {
        const frac = mlSecondLineMatch[1].replace(/\./g, '');
        const centsMatch = mlSecondLineMatch[0].match(/andes-money-amount__cents[^"']*["']>(\d{2})<\/span>/i);
        const num = parseFloat(`${frac}.${centsMatch ? centsMatch[1] : '00'}`);
        if (!isNaN(num) && num > 0) extractedPrice = formatBRL(num);
      }
    }

    if (!extractedPrice) {
      const mlFractionMatch = html.match(/class=["'][^"']*andes-money-amount__fraction[^"']*["']>([\d.,]+)<\/span>/i);
      if (mlFractionMatch?.[1]) {
        const frac = mlFractionMatch[1].replace(/\./g, '');
        const mlCentsMatch = html.match(/class=["'][^"']*andes-money-amount__cents[^"']*["']>(\d{2})<\/span>/i);
        const num = parseFloat(`${frac}.${mlCentsMatch ? mlCentsMatch[1] : '00'}`);
        if (!isNaN(num) && num > 0) extractedPrice = formatBRL(num);
      }
    }

    if (!extractedOriginalPrice) {
      const mlPrevMatch = html.match(/andes-money-amount--previous[\s\S]*?andes-money-amount__fraction[^"']*["']>([\d.,]+)<\/span>/i);
      if (mlPrevMatch?.[1]) {
        const num = parseFloat(mlPrevMatch[1].replace(/\./g, ''));
        if (!isNaN(num) && num > 0) extractedOriginalPrice = formatBRL(num);
      }
    }

    if (!extractedPrice) {
      const amzPriceMatch =
        html.match(/class=["'][^"']*(?:priceToPay|apexPriceToPay)[^"']*["'][\s\S]*?class=["'][^"']*a-offscreen[^"']*["']>\s*R\$\s*([\d.,]+)\s*<\/span>/i) ||
        html.match(/class=["'][^"']*a-offscreen[^"']*["']>\s*R\$\s*([\d.,]+)\s*<\/span>/i);
      if (amzPriceMatch?.[1]) {
        const pNum = parsePriceToNumber(amzPriceMatch[1]);
        if (pNum && pNum > 0) extractedPrice = formatBRL(pNum);
      }
    }

    if (!extractedOriginalPrice) {
      const amzOrigMatch = html.match(/class=["'][^"']*(?:basisPrice|a-text-price)[^"']*["'][\s\S]*?class=["'][^"']*a-offscreen[^"']*["']>\s*R\$\s*([\d.,]+)\s*<\/span>/i);
      if (amzOrigMatch?.[1]) {
        const hNum = parsePriceToNumber(amzOrigMatch[1]);
        if (hNum && hNum > 0) extractedOriginalPrice = formatBRL(hNum);
      }
    }

    if (!extractedPrice) {
      const shopeeJsonPrice = html.match(/["']price["']\s*:\s*(\d{7,10})\b/);
      if (shopeeJsonPrice?.[1]) {
        const inUnits = parseInt(shopeeJsonPrice[1], 10) / 100000;
        if (!isNaN(inUnits) && inUnits > 0) extractedPrice = formatBRL(inUnits);
      }
    }

    if (!extractedPrice) {
      const generalRMatch =
        html.match(/data-testid=["'](?:price-value|price-default|heading-price)["'][^>]*>\s*R\$\s*([\d.,]+)/i) ||
        html.match(/["'](?:price|salePrice|currentPrice|offerPrice)["']\s*:\s*["']?(\d+(?:\.\d{1,2})?)["']?/i);
      if (generalRMatch?.[1]) {
        const pNum = parsePriceToNumber(generalRMatch[1]);
        if (pNum && pNum > 0) extractedPrice = formatBRL(pNum);
      }
    }

    if (!extractedOriginalPrice) {
      const magaluOrig = html.match(/data-testid=["'](?:price-original|original-price)["'][^>]*>\s*R\$\s*([\d.,]+)/i);
      if (magaluOrig?.[1]) {
        const hNum = parsePriceToNumber(magaluOrig[1]);
        if (hNum && hNum > 0) extractedOriginalPrice = formatBRL(hNum);
      }
    }

    // 3. Título & Descrição
    if (!pageTitle) {
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1Match?.[1]) {
        const cleanedH1 = cleanProductTitle(h1Match[1].replace(/<[^>]+>/g, ''));
        if (cleanedH1.length > 5) pageTitle = cleanedH1;
      }
    }

    if (!pageTitle) {
      const ogTitleMatch =
        html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
      if (ogTitleMatch?.[1]) {
        const cleanedOg = cleanProductTitle(ogTitleMatch[1]);
        if (cleanedOg.length > 5) pageTitle = cleanedOg;
      }
    }

    if (!pageTitle) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch?.[1]) {
        const cleanedTitle = cleanProductTitle(titleMatch[1]);
        if (cleanedTitle.length > 5) pageTitle = cleanedTitle;
      }
    }

    if (resolvedUrl.includes('account-verification') || resolvedUrl.includes('/login') || /^(mercado\s*li[bv]re|acesse sua conta)/i.test(pageTitle)) {
      pageTitle = '';
    }

    const ogDescMatch =
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (ogDescMatch?.[1] && !metaDescription) {
      metaDescription = decodeHtmlEntities(ogDescMatch[1]);
    }

    // 4. Imagem real
    if (!ogImage || /logo|icon|placeholder/i.test(ogImage)) {
      const ogImgMatch =
        html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
        html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
      if (ogImgMatch?.[1] && /^https?:\/\//i.test(ogImgMatch[1])) {
        ogImage = ogImgMatch[1];
      }
    }
    if (!ogImage || /logo|icon/i.test(ogImage)) {
      const mlImg = html.match(/https:\/\/http2\.mlstatic\.com\/D_NQ_NP_[^\s"'<>]+\.(?:webp|jpg|png)/i);
      const amzImg = html.match(/https:\/\/m\.media-amazon\.com\/images\/I\/[a-zA-Z0-9+_.-]+\.(?:jpg|png)/i);
      if (mlImg) ogImage = mlImg[0];
      else if (amzImg) ogImage = amzImg[0];
    }
    if (ogImage.startsWith('http://')) ogImage = ogImage.replace('http://', 'https://');

    // 5. Extração rica de tabelas de especificações & descrição do anúncio
    const htmlSpecs = extractHtmlSpecRows(html);
    for (const s of htmlSpecs) {
      if (!scrapedSpecs.some((existing) => existing.label.toLowerCase() === s.label.toLowerCase())) {
        scrapedSpecs.push(s);
      }
    }

    const cleanBody = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

    const descBlockMatch =
      cleanBody.match(/class=["'][^"']*ui-pdp-description__content[^"']*["'][^>]*>([\s\S]{50,3000}?)<\/p>/i) ||
      cleanBody.match(/id=["'](?:feature-bullets|productDescription)["'][^>]*>([\s\S]{50,3000}?)<\/div>/i) ||
      cleanBody.match(/(?:caracter[íi]sticas|especifica[çc][õo]es|ficha t[ée]cnica|detalhes t[ée]cnicos|descri[çc][ãa]o do produto)[\s\S]{60,2800}/i);

    if (descBlockMatch) {
      extractedSnippet = decodeHtmlEntities(descBlockMatch[0].replace(/<[^>]+>/g, ' ')).slice(0, 2200);
    } else if (metaDescription) {
      extractedSnippet = metaDescription.slice(0, 2200);
    }
  } catch {
    // Timeout ou proteção anti-bot tolerados
  }

  return {
    resolvedUrl,
    pageTitle,
    metaDescription,
    ogImage,
    slugTitle,
    extractedPrice,
    extractedOriginalPrice,
    extractedSnippet,
    scrapedSpecs: scrapedSpecs.slice(0, 12),
    brand,
    model,
    ratingHint,
  };
}

export function classifyProduct(allText: string): ProductNiche {
  const t = allText.toLowerCase();

  if (/\b(bicicleta\s*ergom[eé]trica|bike\s*ergom[eé]trica|ergom[eé]trica|bicicleta\s*spinning|bike\s*spinning|spinning|roda\s*de\s*in[eé]rcia|volante\s*de\s*in[eé]rcia|disco\s*de\s*in[eé]rcia|bicicleta\s*horizontal|bicicleta\s*vertical|el[ií]ptico|simulador\s*de\s*caminhada)\b/i.test(t)) {
    return 'FITNESS_BIKE';
  }
  if (
    /\b(bicicleta\s*el[eé]trica|bike\s*el[eé]trica|e-?bike|patinete(\s*el[eé]trico)?|scooter(\s*el[eé]trica)?|monociclo(\s*el[eé]trico)?|hoverboard|moto\s*el[eé]trica|autopropelid[oa]|9cavalo)\b/i.test(t) ||
    (/\b(bicicleta|bike|bici)\b/i.test(t) && /\b(el[eé]tric[ao]|bateria\s*de\s*l[ií]tio|motor\s*\d{3,4}w|350w|500w|800w|1000w|48v|36v|60v|acelerador|pedal\s*assistido)\b/i.test(t))
  ) {
    return 'MOBILITY';
  }
  if (/\b(bicicleta|bike|mountain\s*bike|\bmtb\b|caloi|oggi|ksw|sense)\b/i.test(t)) {
    return 'BICYCLE';
  }
  if (/\b(rel[oó]gio|smartwatch|smart[ -]?band|watch|cron[oó]grafo|technos|casio|amazfit|galaxy watch|apple watch|g-shock|invicta|mormaii|mi band|garmin|fitbit)\b/i.test(t)) {
    return 'WATCH';
  }
  if (/\b(playstation|ps5|ps4|xbox|nintendo switch|console de videogame|videogame|dualsense)\b/i.test(t)) {
    return 'CONSOLE';
  }
  if (/\b(starlink|roteador|mesh|antena sat[eé]lite|modem|repetidor wi-fi|switch de rede)\b/i.test(t)) {
    return 'CONNECTIVITY';
  }
  if (/\b(ar[- ]?condicionado|split inverter|btus|climatizador|umidificador|ventilador)\b/i.test(t)) {
    return 'CLIMATE';
  }
  if (/\b(air\s*fryer\s*oven|fritadeira\s*(?:sem\s*[óo]leo\s*)?oven|forno\s*(?:e\s*)?air\s*fryer|paf16|afon-12)\b/i.test(t)) {
    return 'KITCHEN_OVEN';
  }
  if (/\b(fritadeira|air[ -]?fryer|cafeteira|liquidificador|panela el[eé]trica|rob[oô] aspirador|aspirador|batedeira|micro-ondas|geladeira|cooktop|sanduicheira|processador de alimentos)\b/i.test(t)) {
    return 'KITCHEN_APPLIANCE';
  }
  if (/\b(ralo|fatiador|suporte|organizador|cabide|prateleira|dispensador|jogo de panelas|frigideira|marmita|garrafa t[eé]rmica|mop|rodo|escova|ferramenta|parafusadeira|kit cozinha)\b/i.test(t)) {
    return 'UTILITY';
  }
  if (/\b(fone|fones|headphone|headset|earphone|airpods|caixa de som|bluetooth speaker|jbl|som port[aá]til|earbuds|caixinha de som|soundbar|microfone)\b/i.test(t)) {
    return 'AUDIO';
  }
  if (/\b(notebook|laptop|macbook|ultrabook|chromebook|aspire|ideapad|thinkpad|dell inspiron|nitro\s*5|vivobook|galaxy book)\b/i.test(t)) {
    return 'NOTEBOOK';
  }
  if (/\b(teclado|mouse|monitor|gabinete|switch mec[aâ]nico|mousepad|webcam|computador|pc gamer|ssd|placa de v[ií]deo|gpu|hd externo)\b/i.test(t)) {
    return 'PERIPHERAL';
  }
  if (/\b(smart[ -]?tv|televis[aã]o|televisor|\btv\b|oled|qled|roku tv|ambilight|neo qled)\b/i.test(t)) {
    return 'TV';
  }
  if (/\b(celular|smartphone|iphone|galaxy s|galaxy a|moto g|motorola|redmi|poco|xiaomi)\b/i.test(t)) {
    return 'SMARTPHONE';
  }

  return 'GENERAL';
}

export function resolveCategoryName(niche: ProductNiche, availableCategories?: string[]): string {
  const defaultMap: Record<ProductNiche, string> = {
    FITNESS_BIKE: 'Mobilidade & Esportes',
    MOBILITY: 'Mobilidade & Esportes',
    BICYCLE: 'Mobilidade & Esportes',
    WATCH: 'Relógios & Smartwatches',
    CONSOLE: 'Tecnologia & Dispositivos',
    CONNECTIVITY: 'Tecnologia & Dispositivos',
    CLIMATE: 'Casa Inteligente',
    KITCHEN_OVEN: 'Casa Inteligente',
    KITCHEN_APPLIANCE: 'Casa Inteligente',
    UTILITY: 'Utilidades',
    AUDIO: 'Áudio & Fones',
    NOTEBOOK: 'Informática & Periféricos',
    PERIPHERAL: 'Informática & Periféricos',
    TV: 'Tecnologia & Dispositivos',
    SMARTPHONE: 'Tecnologia & Dispositivos',
    GENERAL: 'Tecnologia & Dispositivos',
  };

  const preferred = defaultMap[niche];
  if (!availableCategories || availableCategories.length === 0) {
    return preferred;
  }

  const exact = availableCategories.find((c) => c.toLowerCase() === preferred.toLowerCase());
  if (exact) return exact;

  // Fallbacks aproximados caso uma categoria como Mobilidade & Esportes não exista no banco do usuário
  if (niche === 'UTILITY') {
    const util = availableCategories.find((c) => /utilidad|casa|achado/i.test(c));
    if (util) return util;
  }
  if (niche === 'FITNESS_BIKE') {
    const fit = availableCategories.find((c) => /esport|fitness|sa[uú]de|bem[- ]?estar|mobilidad|casa/i.test(c));
    if (fit) return fit;
  }
  if (niche === 'MOBILITY' || niche === 'BICYCLE') {
    const mob = availableCategories.find((c) => /mobilidad|esport|ve[ií]cul/i.test(c));
    if (mob) return mob;
    const tech = availableCategories.find((c) => /tecnolog/i.test(c));
    if (tech) return tech;
  }
  return availableCategories[0] || preferred;
}

export function buildPostKit(params: {
  title: string;
  slug: string;
  priceCurrent: string;
  priceOriginal?: string;
  partnerStore: string;
  affiliateUrl: string;
  category: string;
  rating: number;
  pros: string[];
  cons?: string[];
  verdict: string;
  type: 'review' | 'guide';
  baseUrl?: string;
}): PostKitData {
  const {
    title,
    slug,
    priceCurrent,
    priceOriginal,
    partnerStore,
    affiliateUrl,
    category,
    rating,
    pros,
    cons = [],
    verdict,
    type,
    baseUrl = '',
  } = params;

  const discount = calculateDiscountHelper(priceCurrent, priceOriginal);
  const cleanShortTitle = title.length > 52 ? `${title.slice(0, 49).trim()}...` : title;
  const seoTitle =
    type === 'guide'
      ? `${cleanShortTitle} | Comparativo`
      : `${cleanShortTitle} Vale a Pena? Análise`;

  const savingsText = discount && discount.savingsValue > 0 ? ` Economia de ${discount.savings} (${discount.percent}% OFF).` : '';
  const metaDescription = `${title} por ${priceCurrent} na ${partnerStore}.${savingsText} Veja ficha técnica real, prós, contras e se vale a pena comprar.`.slice(0, 158);

  const highlightsBadge =
    discount && discount.savingsValue > 0
      ? `Nota ${rating.toFixed(1)} ★ • Economize ${discount.savings}`
      : `Nota ${rating.toFixed(1)} ★ • Verificado na ${partnerStore}`;

  const sitePath = type === 'guide' ? `/guias/${slug}` : `/reviews/${slug}`;
  const reviewLink = baseUrl ? `${baseUrl}${sitePath}` : sitePath;

  const topPros = (pros || []).slice(0, 3).map((p) => `✅ ${p}`).join('\n');
  const priceLine =
    priceOriginal && discount && discount.savingsValue > 0
      ? `💸 De ~${priceOriginal}~ por *${priceCurrent}* (${discount.percent}% OFF • Economia de ${discount.savings})`
      : `💰 Oferta atual: *${priceCurrent}*`;

  const whatsappCopy = [
    `🔥 *ACHADO VERIFICADO: ${title}*`,
    '',
    priceLine,
    `🏪 Loja: ${partnerStore} | ⭐ Avaliação: ${rating.toFixed(1)}/5.0`,
    '',
    topPros,
    '',
    `📄 Análise técnica completa: ${reviewLink}`,
    affiliateUrl ? `🛒 Conferir oferta direta: ${affiliateUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const tagSlug = generateSlug(category || 'achados').replace(/-/g, '');
  const cleanProsList = (pros || []).filter(Boolean).slice(0, 3);
  const instagramLines: string[] = [
    `${title} — vale a pena? 🔍`,
  ];
  if (verdict && verdict.trim()) {
    instagramLines.push('', verdict.trim());
  }
  if (cleanProsList.length > 0) {
    instagramLines.push('', 'Destaques principais:', ...cleanProsList.map((p) => `• ${p}`));
  }
  if (cons.length > 0 && cons[0]?.trim()) {
    instagramLines.push(`⚠️ Atenção: ${cons[0].trim()}`);
  }
  instagramLines.push(
    '',
    `💵 Preço observado: ${priceCurrent} (${partnerStore})`,
    `👉 Leia o review completo com ficha técnica e tire suas dúvidas pelo link da bio!`,
    '',
    `#achadoseReviews #reviewsbrasil #custobeneficio #ofertasverificadas #${tagSlug || 'compras'}`
  );
  const instagramCaption = instagramLines.join('\n');

  const shortVideoScript = [
    `[0-3s GANCHO]: Você compraria ${cleanShortTitle} por ${priceCurrent}? Antes de fechar o carrinho, veja 3 pontos reais que quase ninguém te conta.`,
    `[4-12s PONTOS FORTES]: Primeiro, o grande destaque desse modelo é: ${pros[0] || 'desempenho acima da média na categoria'}. Além disso, ${pros[1] || 'entrega ótimo custo-benefício'}.`,
    `[13-20s SINCERIDADE]: Mas atenção ao ponto de cautela: ${cons[0] || 'sempre confira voltagem, especificações e vendedor oficial antes de finalizar'}.`,
    `[21-28s VEREDITO + CTA]: Nossa nota técnica foi ${rating.toFixed(1)} de 5. O review completo com ficha técnica, FAQ e link oficial na ${partnerStore} está na bio/descrição!`,
  ].join('\n\n');

  return {
    seoTitle: seoTitle.slice(0, 68),
    metaDescription,
    highlightsBadge,
    whatsappCopy,
    instagramCaption,
    shortVideoScript,
  };
}

function extractFactTokens(combinedText: string, scraped: ScrapedMetadata) {
  const brandList = [
    'Philco', 'Mondial', 'Britânia', 'Oster', 'Electrolux', 'Brastemp', 'Consul', 'Midea',
    'Samsung', 'LG', 'Motorola', 'Xiaomi', 'Redmi', 'Poco', 'Apple', 'Dell', 'Lenovo',
    'Acer', 'Asus', 'HP', 'Sony', 'PlayStation', 'Xbox', 'Nintendo', 'Starlink', 'JBL',
    'Redragon', 'Logitech', 'HyperX', 'Amazfit', 'Garmin', 'Casio', 'Technos', '9Cavalo',
    'Caloi', 'Gallant', 'Kikos', 'Dream Fitness', 'Polimet', 'Acte Sports', 'PodiumFit', 'Odin Fit',
    'WCT Fitness', 'ZiYou', 'Oggi', 'KSW', 'Sense', 'Houston',
    'Tramontina', 'WAP', 'Kärcher', 'Makita', 'Bosch', 'Black+Decker',
  ];
  const detectedBrand =
    scraped.brand ||
    brandList.find((b) => new RegExp(`\\b${b.replace('+', '\\+')}\\b`, 'i').test(combinedText)) ||
    '';

  const litersMatch = combinedText.match(/\b(\d{1,3}(?:[.,]\d)?\s*(?:L|litros?))\b/i);
  const wattsMatch = combinedText.match(/\b(\d{3,4}\s*W)\b/i);
  const voltMatch = combinedText.match(/\b(110V|127V|220V|Bivolt|\d{2}V)\b/i);
  const btuMatch = combinedText.match(/\b(\d{4,5}\s*BTUs?)\b/i);
  const ramMatch = combinedText.match(/\b(\d{1,2}\s*GB\s*(?:de\s*)?(?:RAM|DDR[45])?)\b/i);
  const storageMatch = combinedText.match(/\b((?:128|256|512)\s*GB|825\s*GB|1\s*TB|2\s*TB)\b/i);
  const screenInchMatch = combinedText.match(/\b(\d{2}(?:[.,]\d)?\s*(?:polegadas|"|''))\b/i);
  const hzMatch = combinedText.match(/\b(60\s*Hz|90\s*Hz|120\s*Hz|144\s*Hz|165\s*Hz)\b/i);
  const cpuMatch = combinedText.match(/\b((?:Intel\s*)?Core\s*i[3579](?:-\d+\w*)?|(?:AMD\s*)?Ryzen\s*[3579](?:\s*\d+\w*)?|Celeron\s*\w*|Snapdragon\s*\w*|Exynos\s*\w*|M[1234])\b/i);
  const mahMatch = combinedText.match(/\b(\d{4,5}\s*mAh)\b/i);
  const autoMatch = combinedText.match(/\b(\d{2}(?:\s*a\s*|\s*-\s*\d{2})?\s*km)\b/i);
  const speedMatch = combinedText.match(/\b(\d{2}\s*km\/h)\b/i);
  const mpMatch = combinedText.match(/\b(\d{2,3}\s*MP)\b/i);
  const maxWeightMatch = combinedText.match(/(?:suporta(?:\s*at[eé])?|peso\s*m[aá]x(?:imo)?(?:\s*suportado)?|at[eé])\s*[:\-]?\s*((?:1\d{2}|2\d{2}|[7-9]\d)\s*kg)/i);
  const flywheelMatch =
    combinedText.match(/(?:roda|volante|disco)\s*(?:de\s*)?in[eé]rcia\s*(?:de\s*)?(\d{1,2}(?:[.,]\d)?\s*kg)/i) ||
    combinedText.match(/\b(?:spinning|ergom[eé]tric[ao])\b[^.\n]{0,35}\b([1-2]?\d(?:[.,]\d)?\s*kg)\b/i);
  const wheelAroMatch = combinedText.match(/\b(aro\s*(?:12|14|16|20|24|26|27\.5|29))\b/i);
  const gearsMatch = combinedText.match(/\b(\d{1,2}\s*(?:marchas|velocidades))\b/i);
  const modelCodeMatch = scraped.model || (combinedText.match(/\b([A-Z]{2,5}[-]?\d{2,5}[A-Z0-9-]*)\b/)?.[1] ?? '');

  return {
    brand: detectedBrand,
    modelCode: modelCodeMatch,
    liters: litersMatch?.[1] || '',
    watts: wattsMatch?.[1] || '',
    voltage: voltMatch?.[1] || '',
    btus: btuMatch?.[1] || '',
    ram: ramMatch?.[1] || '',
    storage: storageMatch?.[1] || '',
    screen: screenInchMatch?.[1] || '',
    hz: hzMatch?.[1] || '',
    cpu: cpuMatch?.[1] || '',
    mah: mahMatch?.[1] || '',
    autonomy: autoMatch?.[1] || '',
    speed: speedMatch?.[1] || '',
    mp: mpMatch?.[1] || '',
    maxWeight: maxWeightMatch?.[1] || '',
    flywheel: flywheelMatch?.[1] || '',
    wheelAro: wheelAroMatch?.[1] || '',
    gears: gearsMatch?.[1] || '',
  };
}

export function synthesizeRichFallbackReview(params: {
  titleHint: string;
  store: string;
  affiliateUrl: string;
  scraped: ScrapedMetadata;
  niche: ProductNiche;
  category: string;
  baseUrl?: string;
}): GeneratedReviewPayload {
  const { titleHint, store, affiliateUrl, scraped, niche, category, baseUrl } = params;
  const cleanTitle = cleanProductTitle(titleHint) || titleHint || 'Produto Selecionado';
  const slug = generateSlug(cleanTitle) || `produto-${Date.now()}`;
  const priceCurrent = scraped.extractedPrice || 'R$ 299,90';
  const priceOriginal = scraped.extractedOriginalPrice || '';
  const discount = calculateDiscountHelper(priceCurrent, priceOriginal);
  const combinedText = `${cleanTitle} ${scraped.metaDescription} ${scraped.extractedSnippet} ${scraped.scrapedSpecs.map((s) => `${s.label} ${s.value}`).join(' ')}`;
  const facts = extractFactTokens(combinedText, scraped);

  const specs: { label: string; value: string }[] = [...scraped.scrapedSpecs];
  const addSpec = (label: string, value: string) => {
    if (!value) return;
    if (!specs.some((s) => s.label.toLowerCase().includes(label.toLowerCase().split(' ')[0]))) {
      specs.push({ label, value });
    }
  };

  if (facts.brand) addSpec('Marca', facts.brand);
  if (facts.modelCode) addSpec('Modelo / Referência', facts.modelCode);

  let subtitle = `Análise técnica completa de ${cleanTitle}: especificações reais, prós, contras e custo-benefício.`;
  let pros: string[] = [];
  let cons: string[] = [];
  let content = '';
  let verdict = '';
  let faqs: { question: string; answer: string }[] = [];
  let rating = scraped.ratingHint || 4.7;
  let scoreCostBenefit = 4.7;
  let scorePerformance = 4.7;
  let scoreBuild = 4.6;
  let scoreUsability = 4.8;

  if (niche === 'KITCHEN_OVEN') {
    const cap = facts.liters || '12L a 16L';
    const power = facts.watts || '1800W';
    const volt = facts.voltage || 'Verificar 127V ou 220V no anúncio';
    addSpec('Capacidade Interna', `${cap} (formato forno multifunção)`);
    addSpec('Potência Térmica', power);
    addSpec('Tensão Elétrica', volt);
    addSpec('Funções', 'Fritar sem óleo, assar, desidratar e reaquecer com circulação 360°');
    addSpec('Acessórios Típicos', 'Porta frontal com visor transparente, assadeiras/grelhas perfuradas e bandeja coletora');

    subtitle = `Análise da ${cleanTitle}: capacidade real de ${cap}, potência de ${power}, preparo em bandejas e economia na cozinha.`;
    pros = [
      `Capacidade ampliada de ${cap} em formato forno, permitindo assar porções familiares em múltiplos níveis simultaneamente`,
      `Porta frontal com visor iluminado para acompanhar o ponto dos alimentos sem abrir e perder calor`,
      `Substitui fritadeira a ar e mini forno elétrico para pizzas, assados, frango inteiro e petiscos com circulação 360°`,
      facts.brand ? `Boa disponibilidade de assistência técnica e peças de reposição da marca ${facts.brand} no Brasil` : 'Fácil limpeza interna com bandeja coletora de gordura removível',
    ];
    cons = [
      `Ocupa mais espaço de largura e altura na bancada do que uma Air Fryer tradicional de cesto`,
      `Modelos de alta potência (${power}) não são bivolt — atenção redobrada para escolher 127V ou 220V corretos na compra`,
    ];
    content = `### Capacidade Real de ${cap} e Formato Forno\n\nO grande diferencial da ${cleanTitle} frente às fritadeiras comuns está na arquitetura interna estilo forno (Oven) com ${cap} de volume útil. Em vez de empilhar alimentos em um único cesto estreito, você distribui batatas, legumes e carnes em prateleiras perfuradas, garantindo crocância mais uniforme.\n\n### Potência de ${power} e Versatilidade no Dia a Dia\n\nCom aquecimento rápido por convecção e ${power} de potência estimada, o fluxo de ar quente envolve toda a câmara interna. A porta com visor permite monitorar receitas delicadas sem interromper o cozimento.\n\n### Cuidados Antes da Compra e Custo-Benefício\n\nPor reunir funções de Air Fryer, mini forno e desidratador em um único equipamento, ${cleanTitle} entrega excelente retorno pelo espaço investido — desde que você meça a bancada e selecione a voltagem (${volt}) compatível com sua tomada.`;
    verdict = `Excelente escolha para famílias ou quem cozinha em maior quantidade e quer a versatilidade de ${cap} em múltiplos andares sem depender apenas de um cesto pequeno.`;
    faqs = [
      { question: `A ${cleanTitle} é bivolt?`, answer: `Não, fritadeiras oven de alta potência são fabricadas separadamente em versões 127V ou 220V. Selecione a voltagem exata da sua tomada antes de concluir o pedido na ${store}.` },
      { question: `Qual a vantagem dos ${cap} estilo Oven frente ao cesto comum?`, answer: `As prateleiras horizontais evitam que os alimentos fiquem amontoados, permitindo assar duas receitas ao mesmo tempo e acomodar assadeiras pequenas ou frango inteiro.` },
      { question: `Qual tomada devo usar na cozinha?`, answer: `Recomenda-se tomada dedicada padrão de 20A (pinos mais grossos) sem o uso de adaptadores ou benjamins devido à potência térmica do aparelho.` },
    ];
    rating = scraped.ratingHint || 4.8;
    scoreCostBenefit = 4.9;
    scorePerformance = 4.8;
    scoreBuild = 4.6;
    scoreUsability = 4.8;
  } else if (niche === 'KITCHEN_APPLIANCE') {
    const cap = facts.liters || 'capacidade familiar';
    const power = facts.watts || 'alta potência';
    addSpec('Capacidade / Volume', cap);
    addSpec('Potência', power);
    if (facts.voltage) addSpec('Voltagem', facts.voltage);
    addSpec('Controle', 'Seletor de temperatura ajustável e temporizador com desligamento automático');

    subtitle = `Avaliação prática de ${cleanTitle}: desempenho térmico, limpeza, consumo de energia e durabilidade.`;
    pros = [
      `${cleanTitle} agiliza o preparo diário com aquecimento rápido (${power}) e operação intuitiva`,
      facts.liters ? `Volume útil de ${facts.liters} bem aproveitado para refeições individuais ou em família` : 'Dimensões bem resolvidas para uso diário na bancada da cozinha',
      'Desligamento automático ao fim do timer trazendo segurança na rotina corrida',
    ];
    cons = [
      'Requer observação da voltagem (127V ou 220V) na escolha da variação antes de finalizar o pedido',
      'Peças antiaderentes devem ser higienizadas com esponja macia para preservar o revestimento',
    ];
    content = `### Praticidade e Construção de ${cleanTitle}\n\nProjetada para simplificar o preparo de refeições, ${cleanTitle} combina ${facts.brand ? `a confiabilidade da linha ${facts.brand}` : 'acabamento funcional'} com comandos diretos ao ponto.\n\n### Desempenho e Consumo no Uso Diário\n\nA eficiência no aquecimento reduz o tempo total de preparo em comparação ao forno a gás convencional, ajudando a economizar gás e tempo na cozinha.\n\n### Custo-Benefício na Oferta Atual\n\nPelo valor de ${priceCurrent} encontrado na ${store}, entrega um equilíbrio muito sólido entre capacidade, facilidade de limpeza e durabilidade.`;
    verdict = `Recomendada para quem busca praticidade real na rotina sem pagar caro por recursos supérfluos.`;
    faqs = [
      { question: `Como escolher a voltagem certa de ${cleanTitle}?`, answer: `Confira a opção 127V ou 220V na página do anúncio da ${store} conforme a rede elétrica da sua residência.` },
      { question: `Como conservar o revestimento por mais tempo?`, answer: `Evite choques térmicos com água fria logo após o uso, faça a pré-cura se indicado no manual e lave apenas com detergente neutro e lado macio da esponja.` },
    ];
  } else if (niche === 'FITNESS_BIKE') {
    const isSpinning = /spinning|in[eé]rcia/i.test(cleanTitle);
    const isHorizontal = /horizontal/i.test(cleanTitle);
    const resistanceLabel = /magn[eé]tic[ao]/i.test(combinedText)
      ? 'Sistema magnético silencioso com seletor de níveis'
      : /feltro|atrito|mec[aâ]nic[ao]/i.test(combinedText)
      ? 'Resistência mecânica por atrito/feltro com ajuste contínuo'
      : 'Sistema de ajuste progressivo de intensidade de carga';
    const flywheelText = facts.flywheel ? `Roda de inércia de ${facts.flywheel}` : isSpinning ? 'Volante/roda de inércia equilibrado para cadência contínua' : 'Transmissão leve para cardio residencial';
    const maxWeight = facts.maxWeight || '100 kg a 120 kg (confirmar versão no anúncio)';
    const modalidade = isSpinning ? 'Bike Spinning Residencial / Indoor' : isHorizontal ? 'Bicicleta Ergométrica Horizontal (encosto lombar)' : 'Bicicleta Ergométrica Vertical Residencial';

    addSpec('Modalidade', modalidade);
    addSpec('Sistema de Resistência', resistanceLabel);
    addSpec('Inércia / Transmissão', flywheelText);
    addSpec('Peso Máximo Suportado', maxWeight);
    addSpec('Painel Monitor (LCD)', 'Tempo, velocidade, distância, calorias gastas e odômetro (funciona a pilhas)');
    addSpec('Ergonomia e Ajustes', 'Banco com regulagem de altura e pedais com cinta firma-pé antiderrapante');

    subtitle = `Análise da ${cleanTitle}: tipo de resistência, ergonomia, painel monitor, peso suportado e silêncio no treino em casa.`;
    pros = [
      `Permite treinos aeróbicos e cardiovasculares completos em casa sem depender de clima ou mensalidade de academia`,
      `Funcionamento silencioso sem consumo de energia elétrica da rede — ideal para uso em quartos, salas e apartamentos`,
      facts.maxWeight ? `Estrutura metálica projetada para suportar até ${facts.maxWeight} com estabilidade` : 'Banco ajustável em altura e pedais com alça firma-pé para pedalada firme',
      'Painel digital integrado para acompanhar tempo, distância, velocidade média e calorias durante a sessão',
    ];
    cons = [
      'Requer montagem inicial simples em casa (fixação da base, pedais, selim e guidão seguindo o manual)',
      `Verifique a altura máxima recomendada e o limite real de peso (${facts.maxWeight || 'geralmente 100–120 kg'}) antes de fechar a compra`,
    ];
    content = `### Sistema de Resistência, Estabilidade e Ruído\n\nA ${cleanTitle} foi desenvolvida para quem busca regularidade no condicionamento físico e queima calórica dentro de casa. Seu conjunto combina ${resistanceLabel.toLowerCase()} com ${isSpinning ? 'pegada esportiva para variação de cadência e treinos em pé ou sentado' : 'postura confortável para sessões diárias de baixo impacto nos joelhos e articulações'}.\n\n### Painel Monitor, Regulagens e Capacidade de Peso\n\nO computador de bordo em LCD exibe em tempo real dados essenciais como duração, velocidade, quilometragem simulada e gasto calórico estimado (alimentado por pilhas, dispensando tomada próxima). As regulagens do selim e das alças de pedal permitem adaptar o equipamento a diferentes estaturas da família.\n\n### Custo-Benefício Para Treinar em Casa\n\nNa faixa de ${priceCurrent} pela ${store}, representa um investimento prático que substitui deslocamentos e mensalidades recorrentes, ocupando pouco espaço no ambiente doméstico.`;
    verdict = `Excelente escolha para quem quer praticar exercícios aeróbicos em casa com conforto, baixo ruído e ótima relação custo-benefício sem depender de academia.`;
    faqs = [
      { question: `A ${cleanTitle} precisa ser ligada na tomada?`, answer: `Não! A resistência e a pedalada são mecânicas/magnéticas e funcionam sem energia elétrica. Apenas o visor digital de tempo e calorias utiliza pilhas comuns (AA/AAA).` },
      { question: `Qual o peso máximo suportado e serve para pessoas altas?`, answer: `${facts.maxWeight ? `A capacidade de referência informada é de até ${facts.maxWeight}` : 'Bicicletas ergométricas desta categoria costumam suportar entre 100 kg e 120 kg'}. Confira as medidas máximas do selim na ficha do anúncio na ${store} caso o usuário tenha mais de 1,85 m.` },
      { question: `Ela faz muito barulho para usar em apartamento?`, answer: `Não, o sistema de transmissão foi projetado para operação silenciosa, permitindo pedalar enquanto assiste TV ou em horários noturnos sem incomodar vizinhos.` },
    ];
    rating = scraped.ratingHint || 4.7;
    scoreCostBenefit = 4.9;
    scorePerformance = 4.7;
    scoreBuild = 4.6;
    scoreUsability = 4.9;
  } else if (niche === 'BICYCLE') {
    const aro = facts.wheelAro ? facts.wheelAro.toUpperCase() : 'Aro 29 / Conforme versão';
    const gears = facts.gears || 'Múltiplas velocidades (conferir câmbio no anúncio)';
    addSpec('Tamanho das Rodas', aro);
    addSpec('Relação / Marchas', gears);
    addSpec('Quadro', /alum[ií]nio/i.test(combinedText) ? 'Liga de Alumínio leve e resistente à oxidação' : 'Estrutura em Aço Carbono ou Alumínio conforme anúncio');
    addSpec('Sistema de Freios', /hidr[aá]ulico/i.test(combinedText) ? 'Freio a disco hidráulico' : /disco/i.test(combinedText) ? 'Freio a disco mecânico dianteiro e traseiro' : 'Freio V-Brake / Disco conforme versão');
    addSpec('Modalidade', /mtb|mountain|trilha/i.test(combinedText) ? 'Mountain Bike (asfalto, parques e trilhas leves)' : 'Passeio urbano e lazer');

    subtitle = `Análise da ${cleanTitle}: especificações de ${aro}, sistema de marchas, freios e recomendações antes da montagem.`;
    pros = [
      `Conjunto com ${aro} e ${gears} adequado para passeios urbanos, parques e deslocamentos sem combustível`,
      /alum[ií]nio/i.test(combinedText) ? 'Quadro em alumínio traz menos peso ao pedalar e maior durabilidade contra ferrugem' : 'Geometria versátil para uso recreativo e trajetos diários',
      `Ótimo posicionamento de preço na faixa de ${priceCurrent} pela ${store}`,
    ];
    cons = [
      'Enviada pré-montada na caixa: recomenda-se ajuste fino de câmbio e freios em oficina local após a entrega',
      'Confira o tamanho exato do quadro (15", 17", 19" ou 21") de acordo com a sua altura antes da compra',
    ];
    content = `### Quadro, ${aro} e Conjunto de Transmissão\n\nA ${cleanTitle} entrega uma configuração equilibrada para quem busca lazer ativo, mobilidade leve ou pedaladas em ciclovias e parques. A combinação de ${aro} com ${gears} facilita vencer pequenas subidas e manter boa rolagem no plano.\n\n### Freios, Conforto e Segurança\n\nPara maior segurança, verifique a calibragem dos pneus e o alinhamento dos freios antes das primeiras voltas, garantindo respostas precisas em frenagens urbanas.\n\n### Cuidados na Compra Online\n\nComo toda bicicleta comprada pela internet chega parcialmente desmontada para proteção no transporte, vale separar um pequeno orçamento para revisão e aperto final em bicicletaria especializada.`;
    verdict = `Boa opção de bicicleta convencional para lazer e mobilidade diária, destacando a relação entre componentes e preço na ${store}.`;
    faqs = [
      { question: `A ${cleanTitle} já vem montada e regulada?`, answer: `Ela é enviada pré-montada na caixa para caber no frete (com roda dianteira, guidão e pedais soltos). Recomenda-se revisão e regulagem final de freios e marchas em uma bicicletaria antes do uso.` },
      { question: `Como escolher o tamanho ideal do quadro?`, answer: `Para estaturas entre 1,65 m e 1,75 m costuma-se usar quadro 17"; entre 1,75 m e 1,85 m o quadro 19". Confira a tabela do fabricante na página da ${store}.` },
    ];
    rating = scraped.ratingHint || 4.7;
    scoreCostBenefit = 4.8;
    scorePerformance = 4.7;
    scoreBuild = 4.6;
    scoreUsability = 4.8;
  } else if (niche === 'MOBILITY') {
    const motor = facts.watts || '350W a 500W';
    const volt = facts.voltage || '48V';
    const auto = facts.autonomy || '25 a 35 km';
    const spd = facts.speed || '25 a 32 km/h';
    addSpec('Motor Elétrico', motor);
    addSpec('Bateria', `${volt} Lítio (carregador bivolt)`);
    addSpec('Autonomia Média', `${auto} por carga (varia com peso e inclinação)`);
    addSpec('Velocidade Máxima', spd);
    addSpec('Frenagem', 'Freios a disco mecânico dianteiro e traseiro');

    subtitle = `Análise de ${cleanTitle}: potência de ${motor}, bateria ${volt}, autonomia real urbana e regras de circulação.`;
    pros = [
      `Motor de ${motor} aliado à bateria de ${volt}, oferecendo economia drástica frente a combustível ou transporte por aplicativo`,
      'Sistema de pedal assistido permite continuar o trajeto mesmo se a carga da bateria chegar ao fim',
      'Estrutura pensada para trajetos urbanos curtos e médios, com facilidade para guardar em casa ou apartamento',
    ];
    cons = [
      'Autonomia real cai em ladeiras íngremes ou com piloto acima de 90 kg, exigindo auxílio dos pedais',
      'Requer conferência das normas do CONTRAN (Resolução 996) para uso em ciclovias e vias urbanas',
    ];
    content = `### Motorização de ${motor} e Desempenho Urbano\n\nA ${cleanTitle} atende quem busca abandonar o trânsito pesado e reduzir gastos mensais com deslocamento. Seu conjunto elétrico (${motor} / ${volt}) proporciona arrancadas suaves no plano e boa agilidade em ciclovias.\n\n### Autonomia, Carregamento e Portabilidade\n\nCom autonomia estimada em ${auto}, cobre perfeitamente idas e vindas ao trabalho ou faculdade. A recarga pode ser feita em tomada residencial comum em cerca de 4 a 6 horas.\n\n### Segurança, Manutenção e Veredito\n\nO uso de capacete, calibragem periódica dos pneus e inspeção dos freios a disco garantem rodagem segura. Na faixa de ${priceCurrent}, o retorno financeiro frente ao transporte diário costuma se pagar em poucos meses.`;
    verdict = `Ótima alternativa econômica de mobilidade urbana para trajetos diários de até 20-30 km, especialmente para evitar trânsito e economizar com combustível.`;
    faqs = [
      { question: `Precisa de CNH ou emplacamento para rodar com ${cleanTitle}?`, answer: `Equipamentos autopropelidos com motor até 1000W e velocidade limitada a 32 km/h não exigem CNH nem emplacamento pela Resolução 996 do CONTRAN, devendo respeitar ciclovias e equipamentos obrigatórios (farol, buzina e retrovisor).` },
      { question: `Posso carregar em tomada comum 110V/220V?`, answer: `Sim, o carregador que acompanha o conjunto elétrico costuma ser bivolt automático para recarga direta em tomada doméstica.` },
    ];
    rating = scraped.ratingHint || 4.7;
    scoreCostBenefit = 4.9;
    scorePerformance = 4.7;
    scoreBuild = 4.6;
    scoreUsability = 4.8;
  } else if (niche === 'NOTEBOOK') {
    const cpu = facts.cpu || 'Processador Multi-Core Atual';
    const ram = facts.ram || '8 GB RAM';
    const ssd = facts.storage || '256 GB / 512 GB SSD NVMe';
    const screen = facts.screen || '15.6" Full HD';
    addSpec('Processador', cpu);
    addSpec('Memória RAM', ram);
    addSpec('Armazenamento', ssd);
    addSpec('Tela', `${screen} ${facts.hz || ''}`.trim());
    addSpec('Conectividade', 'Wi-Fi, Bluetooth, HDMI e portas USB / USB-C');

    subtitle = `Review completo de ${cleanTitle}: desempenho do ${cpu}, ${ram}, ${ssd} e para quem realmente vale a pena.`;
    pros = [
      `Conjunto equilibrado com ${cpu} e ${ssd}, garantindo abertura rápida de sistema e planilhas sem travamentos`,
      `Tela de ${screen} confortável para jornadas longas de estudo, home office e reuniões em vídeo`,
      facts.brand ? `Suporte nacional e garantia oficial ${facts.brand} com facilidade de peças no mercado brasileiro` : 'Construção portátil ideal para levar na mochila entre casa, trabalho e faculdade',
    ];
    cons = [
      ram.includes('8') ? 'Com 8 GB de RAM, quem trabalha com edição pesada ou dezenas de abas deve avaliar upgrade futuro para 16 GB' : 'Não é voltado para jogos AAA pesados em qualidade ultra (foco em produtividade e uso geral)',
      'Confira se a versão do anúncio vem com Windows 11 ou Linux antes de comprar para não ter surpresas na configuração inicial',
    ];
    content = `### Hardware (${cpu} + ${ram}) e Desempenho Real\n\nO ${cleanTitle} foi projetado para quem precisa de fluidez em navegação intensa, pacote Office, sistemas web e videochamadas. A presença de armazenamento rápido (${ssd}) elimina a lentidão clássica de notebooks antigos com HD mecânico.\n\n### Tela de ${screen}, Teclado e Conectividade\n\nA área útil de ${screen} facilita dividir duas janelas lado a lado ao estudar ou preencher relatórios. As portas USB e saída HDMI dispensam adaptadores para conectar monitor externo ou projetor.\n\n### Custo-Benefício e Para Quem Recomendamos\n\nPor ${priceCurrent} na ${store}, entrega o pacote ideal para estudantes, profissionais em home office e uso doméstico exigente.`;
    verdict = `Compra segura para trabalho, estudos e produtividade diária, destacando-se pela velocidade do SSD e equilíbrio do conjunto pelo preço atual.`;
    faqs = [
      { question: `O ${cleanTitle} permite upgrade de memória RAM ou SSD?`, answer: `A maioria dos modelos ${facts.brand || 'atuais'} oferece slot para expansão de SSD ou RAM, mas alguns possuem parte da RAM soldada — confirme a ficha exata da subversão na loja antes da compra.` },
      { question: `Serve para edição de vídeo leve e jogos casuais?`, answer: `Sim, com ${cpu} e ${ram}, lida bem com edições leves no CapCut/Canva e jogos populares leves, embora não substitua um notebook gamer com placa de vídeo dedicada.` },
    ];
    rating = scraped.ratingHint || 4.8;
    scoreCostBenefit = 4.9;
    scorePerformance = 4.7;
    scoreBuild = 4.6;
    scoreUsability = 4.8;
  } else if (niche === 'CONSOLE') {
    const storage = facts.storage || '825 GB / 1 TB SSD NVMe';
    addSpec('Armazenamento', `${storage} de alta velocidade`);
    addSpec('Saída de Vídeo', 'Até 4K / 120Hz via HDMI 2.1 com HDR e Ray Tracing');
    addSpec('Conectividade', 'Wi-Fi 6, Bluetooth, Ethernet Gigabit e USB-C frontal');
    addSpec('Controle Incluso', 'Controle sem fio com gatilhos adaptáveis e resposta tátil');

    subtitle = `Análise do ${cleanTitle}: desempenho 4K, velocidade do SSD de ${storage}, vantagens da edição e custo real dos jogos.`;
    pros = [
      `Tempos de carregamento praticamente instantâneos graças ao SSD customizado de ${storage}`,
      'Qualidade gráfica de nova geração com suporte a Ray Tracing, HDR e até 120 quadros por segundo em TVs compatíveis',
      'Controle de altíssima imersão com feedback háptico e gatilhos adaptáveis',
    ];
    cons = [
      /digital/i.test(cleanTitle) ? 'Edição Digital não possui leitor de discos Blu-ray (todos os jogos são comprados na loja digital ou via assinatura)' : 'Console robusto que requer espaço ventilado no rack',
      'Jogos de lançamento e assinatura mensal possuem custo recorrente elevado sem promoções',
    ];
    content = `### Potência Gráfica e SSD de ${storage}\n\nO ${cleanTitle} oferece um salto notável em fluidez e tempos de carregamento. A transição entre menus e partidas ocorre em segundos, permitindo aproveitar jogos modernos em resolução 4K com taxa de quadros estável.\n\n### Edição, Armazenamento e Experiência na Sala\n\nO espaço de ${storage} comporta diversos títulos pesados instalados simultaneamente, com opção de expansão futura via SSD M.2 NVMe compatível.\n\n### Vale a Pena Comprar Agora?\n\nNa faixa de ${priceCurrent} pela ${store}, é a porta de entrada definitiva para a geração atual de jogos com longevidade garantida por anos.`;
    verdict = `Compra altamente recomendada para gamers que buscam gráficos 4K fluidos e carregamento instantâneo sem precisar montar um PC caro.`;
    faqs = [
      { question: `Qual a diferença se o ${cleanTitle} for Edição Digital?`, answer: `O poder de processamento e gráficos são idênticos ao modelo com disco, mas a Edição Digital não aceita mídias físicas — todos os jogos são baixados diretamente pela loja online.` },
      { question: `Funciona em TVs Full HD comuns ou precisa de TV 4K?`, answer: `Funciona perfeitamente em qualquer TV ou monitor com entrada HDMI, ajustando a resolução automaticamente, embora uma TV 4K 120Hz extraia o máximo do console.` },
    ];
    rating = 4.9;
    scoreCostBenefit = 4.8;
    scorePerformance = 5.0;
    scoreBuild = 4.9;
    scoreUsability = 4.9;
  } else if (niche === 'CONNECTIVITY') {
    addSpec('Tecnologia de Conexão', /starlink/i.test(cleanTitle) ? 'Internet via Satélite de Órbita Baixa (LEO) + Wi-Fi integrado' : 'Wi-Fi Dual Band / Tri-Band de longo alcance');
    addSpec('Instalação', 'Plug & Play com gerenciamento completo via aplicativo no celular');
    addSpec('Uso Recomendado', 'Casas rurais, viagens, motorhomes, home office e locais sem fibra óptica');
    addSpec('Alimentação', /mini/i.test(cleanTitle) ? 'Baixo consumo energético (compatível com fontes DC/inversores)' : 'Fonte bivolt 110V/220V inclusa');

    subtitle = `Análise da ${cleanTitle}: velocidade real, portabilidade, instalação passo a passo e custos envolvidos.`;
    pros = [
      /starlink/i.test(cleanTitle) ? 'Leva internet de alta velocidade e baixa latência para sítios, estradas e áreas onde operadoras comuns não chegam' : 'Estabilidade superior de sinal Wi-Fi eliminando zonas mortas dentro de casa',
      /mini/i.test(cleanTitle) ? 'Formato compacto de mochila com roteador Wi-Fi já embutido na antena, dispensando cabos excessivos' : 'Configuração rápida em poucos minutos diretamente pelo aplicativo no smartphone',
      'Estrutura projetada para suportar intempéries (chuva e vento) com confiabilidade contínua',
    ];
    cons = [
      /starlink/i.test(cleanTitle) ? 'Exige assinatura de plano mensal de dados separado e visão desobstruída para o céu sem árvores/telhados bloqueando' : 'Alcance máximo depende de barreiras físicas como paredes grossas de alvenaria',
      'Investimento inicial mais alto do que roteadores convencionais de entrada',
    ];
    content = `### O Que Torna a ${cleanTitle} Diferente\n\nPara quem precisa de internet confiável fora dos grandes centros ou enfrenta falhas constantes da fibra local, a ${cleanTitle} resolve um problema crítico de conectividade.\n\n### Instalação, Portabilidade e Consumo\n\nA configuração é guiada passo a passo pelo aplicativo oficial, indicando o melhor posicionamento em poucos minutos. O design integrado simplifica a montagem sem precisar de conhecimento técnico avançado.\n\n### Veredito de Custo-Benefício\n\nConsiderando o valor de ${priceCurrent} na ${store}, é uma solução insubstituível para trabalho remoto, viagens ou propriedades rurais que dependem de conexão estável.`;
    verdict = `Indispensável para quem precisa de conectividade de alta confiabilidade em áreas remotas, viagens ou backup profissional de internet.`;
    faqs = [
      {
        question: `A ${cleanTitle} funciona sem pagar mensalidade?`,
        answer: /starlink/i.test(cleanTitle)
          ? 'O equipamento é seu na compra, porém o acesso à rede de satélites exige ativação de um plano mensal (Residencial ou Viagem) diretamente no aplicativo da operadora.'
          : 'Sim, este equipamento apenas distribui seu link de internet atual sem cobrar mensalidade adicional.',
      },
      { question: `Aguenta chuva e sol ao ar livre?`, answer: `Sim, possui vedação apropriada contra poeira e chuva forte quando instalada conforme o manual do fabricante.` },
    ];
    rating = 4.9;
    scoreCostBenefit = 4.6;
    scorePerformance = 4.9;
    scoreBuild = 4.9;
    scoreUsability = 4.9;
  } else if (niche === 'CLIMATE') {
    const btu = facts.btus || '9.000 / 12.000 BTUs';
    addSpec('Capacidade Térmica', btu);
    addSpec('Tecnologia', /inverter/i.test(cleanTitle) ? 'Compressor Inverter de baixo consumo elétrico' : 'Climatização de alta vazão');
    addSpec('Voltagem', facts.voltage || '220V (confirmar no anúncio)');
    addSpec('Eficiência', 'Classificação energética voltada à economia na conta de luz');

    subtitle = `Avaliação do ${cleanTitle}: capacidade de ${btu}, nível de ruído, economia de energia e dicas de instalação.`;
    pros = [
      `Capacidade de ${btu} ideal para climatizar rapidamente quartos e salas pequenas/médias com conforto térmico`,
      /inverter/i.test(cleanTitle) ? 'Tecnologia Inverter evita picos de liga/desliga do compressor, economizando energia elétrica ao longo do mês' : 'Boa vazão de ar com distribuição uniforme pelo ambiente',
      'Funcionamento silencioso em modo noturno e controle prático de temperatura por controle remoto',
    ];
    cons = [
      'Instalação por técnico credenciado e kit de tubulação em cobre geram custo adicional fora do valor do aparelho',
      'Exige atenção à voltagem (geralmente 220V) e disjuntor exclusivo no quadro elétrico',
    ];
    content = `### Capacidade de ${btu} e Eficiência Energética\n\nDimensionar corretamente a potência em BTUs é o segredo para o ar-condicionado gelar rápido sem gastar energia à toa. O ${cleanTitle} entrega ${btu}, atendendo com folga dormitórios e escritórios residenciais bem vedados.\n\n### Conforto Acústico e Recursos\n\nOs modos de operação noturna (Sleep) e temporizador mantêm a temperatura agradável durante a madrugada sem ruído excessivo.\n\n### Recomendações Antes de Comprar\n\nPelo preço de ${priceCurrent} na ${store}, é uma ótima oportunidade — lembre-se apenas de conferir o material da serpentina (cobre é mais durável em regiões litorâneas) e contratar instalação adequada.`;
    verdict = `Excelente escolha para climatizar ambientes residenciais com eficiência, baixo ruído e bom custo operacional.`;
    faqs = [
      { question: `Para quantos metros quadrados ${btu} é indicado?`, answer: `Em média, 9.000 BTUs atendem até 12–15 m² e 12.000 BTUs até 18–20 m², considerando incidência moderada de sol e duas pessoas no cômodo.` },
      { question: `A serpentina é de cobre e já vem com gás?`, answer: `A unidade condensadora costuma vir com pré-carga de gás refrigerante de fábrica, mas confirme na ficha do vendedor na ${store} se a serpentina é 100% cobre.` },
    ];
  } else if (niche === 'UTILITY') {
    addSpec('Categoria de Uso', 'Utilidades Domésticas & Praticidade');
    addSpec('Instalação / Uso', 'Pronto para uso cotidiano doméstico sem ferramentas complexas');
    addSpec('Manutenção', 'Material lavável de fácil higienização');

    subtitle = `Análise prática de ${cleanTitle}: funcionalidade real no dia a dia, material, cuidados e custo-benefício.`;
    pros = [
      `${cleanTitle} resolve uma tarefa prática do dia a dia com baixo investimento (${priceCurrent})`,
      'Manuseio simples e compacto, ocupando pouco espaço de armazenamento quando não está em uso',
      'Excelente opção de "achado útil" com alto índice de aprovação prática entre compradores',
    ];
    cons = [
      'Confira atentamente as dimensões em centímetros e compatibilidade de medida descritas no anúncio antes de finalizar',
      'Por ser um item utilitário acessível, evite uso forçado além da capacidade recomendada pelo fabricante',
    ];
    content = `### Praticidade Real no Uso Doméstico\n\nProdutos da linha de utilidades só valem a pena quando economizam tempo ou organizam de verdade o ambiente. O ${cleanTitle} cumpre exatamente essa função sem exigir adaptações complicadas.\n\n### Materiais, Medidas e Durabilidade\n\nPara evitar trocas desnecessárias, observe sempre as medidas exatas informadas pelo vendedor na ${store} e siga as orientações básicas de limpeza para manter a vida útil do material.\n\n### Vale a Pena pelo Preço?\n\nPor ${priceCurrent}, entrega retorno prático imediato na rotina da casa.`;
    verdict = `Achado funcional e acessível que traz ganho real de organização e agilidade nas tarefas diárias da casa.`;
    faqs = [
      { question: `O ${cleanTitle} acompanha todos os itens para instalação ou uso?`, answer: `Verifique na descrição do anúncio na ${store} a lista exata de peças inclusas e as medidas compatíveis antes de fechar a compra.` },
      { question: `Qual o prazo de entrega e garantia?`, answer: `A compra pela ${store} garante proteção ao comprador, rastreamento completo e direito de devolução dentro do prazo legal caso não sirva.` },
    ];
    rating = scraped.ratingHint || 4.6;
    scoreCostBenefit = 4.9;
    scorePerformance = 4.5;
    scoreBuild = 4.4;
    scoreUsability = 4.8;
  } else if (niche === 'WATCH') {
    addSpec('Visor', 'Tela tátil de alta visibilidade sob luz solar');
    addSpec('Resistência à Água', 'Proteção contra chuva, suor e respingos (conferir ATM/IP)');
    addSpec('Sensores', 'Frequência cardíaca, passos, calorias e monitoramento de sono');
    addSpec('Conectividade', 'Bluetooth compatível com Android e iPhone');

    subtitle = `Análise de ${cleanTitle}: precisão dos sensores, autonomia real da bateria e compatibilidade com celular.`;
    pros = [
      `${cleanTitle} combina design versátil no pulso com monitoramento prático de saúde e notificações`,
      'Boa visibilidade de tela e leitura rápida de mensagens de WhatsApp e chamadas sem tirar o celular do bolso',
      'Compatível tanto com smartphones Android quanto iPhone via aplicativo',
    ];
    cons = [
      'Métricas de saúde têm finalidade esportiva/bem-estar e não substituem equipamentos médicos',
      'Modelos mais acessíveis exigem manter o Bluetooth conectado para receber alertas instantâneos',
    ];
    content = `### Design no Pulso e Visibilidade\n\nO ${cleanTitle} se adapta bem tanto à rotina de trabalho quanto à academia, oferecendo mostradores personalizáveis e pulseira confortável para uso contínuo.\n\n### Notificações, Saúde e Bateria\n\nOs alertas de chamadas e aplicativos chegam por vibração discreta no pulso. A autonomia de bateria evita a dependência de recargas todas as noites.\n\n### Veredito de Compra\n\nPor ${priceCurrent} na ${store}, entrega excelente conjunto para quem quer praticidade e acompanhamento diário de atividades.`;
    verdict = `Boa opção para acompanhar passos, treinos e notificações do celular com conforto e ótimo preço.`;
    faqs = [
      { question: `Funciona em Android e iPhone (iOS)?`, answer: `Sim, conecta via Bluetooth com ambos os sistemas usando o aplicativo indicado no manual.` },
      { question: `Posso molhar no banho quente ou piscina?`, answer: `Resiste a suor e chuva, porém recomenda-se evitar água quente/vapor de chuveiro para preservar a vedação dos anéis internos.` },
    ];
  } else if (niche === 'AUDIO') {
    addSpec('Áudio e Drivers', 'Drivers dinâmicos com foco em clareza de voz e graves equilibrados');
    addSpec('Conectividade', /bluetooth|sem fio|tws/i.test(cleanTitle) ? 'Bluetooth de baixa latência' : 'Conexão com cabo P2 / USB universal');
    addSpec('Microfone', 'Microfone integrado para chamadas e jogos online');

    subtitle = `Review de ${cleanTitle}: qualidade sonora, conforto nas orelhas, microfone e autonomia real.`;
    pros = [
      `Boa definição sonora de ${cleanTitle} para músicas, filmes, jogos e reuniões online`,
      'Conforto ergonômico projetado para reduzir fadiga em sessões longas de uso',
      `Excelente relação custo-benefício na faixa de ${priceCurrent}`,
    ];
    cons = [
      'Isolamento passivo/ativo varia conforme vedação das almofadas ou ponteiras',
      'Em ambientes com vento muito forte, o microfone pode captar ruído externo',
    ];
    content = `### Qualidade de Som e Equilíbrio Acústico\n\nO ${cleanTitle} entrega resposta limpa entre médios e graves, tornando diálogos em vídeos, passos em jogos e batidas musicais bem definidos sem distorção em volumes moderados a altos.\n\n### Conforto e Microfone no Uso Real\n\nO encaixe foi desenhado para longas horas de estudo, trabalho ou partidas online sem apertar excessivamente.\n\n### Custo-Benefício\n\nEncontrado por ${priceCurrent} na ${store}, supera opções genéricas sem marca nessa mesma faixa de preço.`;
    verdict = `Recomendado para quem busca áudio limpo, microfone funcional e conforto prolongado sem gastar uma fortuna.`;
    faqs = [
      { question: `O microfone funciona bem em reuniões (Meet/Teams/Discord)?`, answer: `Sim, capta a voz com boa clareza para chamadas de trabalho, aulas online e comunicação em jogos.` },
      { question: `É compatível com celular, notebook e videogame?`, answer: `Sim, desde que o dispositivo possua a mesma interface (Bluetooth, P2 3.5mm ou USB) informada no modelo.` },
    ];
  } else if (niche === 'SMARTPHONE') {
    const storage = facts.storage || '128 GB / 256 GB';
    const ram = facts.ram || '4 GB / 8 GB RAM';
    const bat = facts.mah || '5000 mAh';
    const cam = facts.mp || '50 MP';
    addSpec('Armazenamento', storage);
    addSpec('Memória RAM', ram);
    addSpec('Tela', `${facts.screen || '6.6" a 6.7"'} ${facts.hz || ''}`.trim());
    addSpec('Câmera Principal', cam);
    addSpec('Bateria', bat);

    subtitle = `Análise de ${cleanTitle}: câmera de ${cam}, bateria de ${bat}, fluidez com ${ram} e se vale o preço.`;
    pros = [
      `Armazenamento de ${storage} e ${ram} ideais para redes sociais, aplicativos bancários e fotos do dia a dia`,
      `Bateria de ${bat} projetada para atravessar o dia inteiro longe da tomada`,
      facts.brand ? `Garantia nacional ${facts.brand} e aparelho homologado pela Anatel` : 'Tela ampla e confortável para leitura e vídeos',
    ];
    cons = [
      'Verifique se o modelo selecionado possui NFC ou 5G caso esses recursos sejam indispensáveis para você',
      'Em jogos pesados 3D, recomenda-se reduzir os gráficos para manter boa fluidez e temperatura',
    ];
    content = `### Desempenho e Armazenamento de ${storage}\n\nO ${cleanTitle} atende muito bem às demandas reais de comunicação, streaming, fotos e aplicativos do cotidiano com ${ram} e ${storage} de espaço interno.\n\n### Câmeras, Tela e Bateria de ${bat}\n\nA autonomia de ${bat} traz tranquilidade para sair de casa sem carregar powerbank, enquanto a câmera de ${cam} registra boas fotos com iluminação favorável.\n\n### Veredito na Oferta de Hoje\n\nPor ${priceCurrent} na ${store}, entrega excelente equilíbrio para quem busca celular novo confiável e com nota fiscal.`;
    verdict = `Excelente custo-benefício para uso diário equilibrado, destacando a bateria duradoura e espaço interno confortável.`;
    faqs = [
      { question: `O ${cleanTitle} é nacional e homologado pela Anatel?`, answer: `Sim, optando por anúncios oficiais como o link verificado na ${store}, o aparelho acompanha nota fiscal e garantia de 12 meses no Brasil.` },
      { question: `Vem com carregador na caixa?`, answer: `A maioria dos modelos desta categoria inclui cabo e carregador padrão brasileiro na embalagem — confira a descrição do kit antes de finalizar.` },
    ];
  } else if (niche === 'TV') {
    const screen = facts.screen || '50 polegadas';
    addSpec('Tela', `${screen} (resolução HD/Full HD/4K conforme versão)`);
    addSpec('Sistema Smart', 'Acesso direto a Netflix, YouTube, Prime Video e Globoplay');
    addSpec('Conexões', 'Entradas HDMI, USB, Wi-Fi integrado e espelhamento');
    addSpec('Padrão VESA', 'Compatível com suporte fixo ou articulado de parede');

    subtitle = `Review da ${cleanTitle}: qualidade de imagem, sistema Smart, conexões e custo-benefício.`;
    pros = [
      `Tela de ${screen} com ótima imersão para filmes, séries e futebol na sala ou quarto`,
      'Interface Smart rápida com os principais aplicativos de streaming prontos para uso',
      'Conectividade completa com múltiplas portas HDMI e Wi-Fi integrado',
    ];
    cons = [
      'Alto-falantes integrados atendem ambientes normais, mas uma soundbar melhora bastante os graves em filmes',
      'Verifique a largura do rack ou padrão VESA antes de fixar na parede',
    ];
    content = `### Imagem, Brilho e Imersão de ${screen}\n\nA ${cleanTitle} entrega cores vivas e contraste equilibrado para sessões de cinema em casa e transmissões esportivas.\n\n### Sistema Smart e Conexões\n\nA navegação pelos menus é intuitiva, permitindo abrir YouTube, Netflix e Prime Video diretamente pelo controle remoto.\n\n### Vale a Pena?\n\nPor ${priceCurrent} na ${store}, é uma opção sólida para renovar a sala sem estourar o orçamento.`;
    verdict = `Ótima relação tamanho/preço para streaming, canais abertos e uso familiar diário.`;
    faqs = [
      { question: `A ${cleanTitle} é bivolt e aceita suporte de parede?`, answer: `Sim, possui fonte bivolt automática (110V/220V) e furação traseira no padrão universal VESA.` },
      { question: `Possui Bluetooth para conectar fones ou caixa de som?`, answer: `Verifique na ficha do anúncio da ${store} a versão do modelo, pois a maioria das Smart TVs atuais já traz Bluetooth integrado.` },
    ];
  } else {
    addSpec('Produto Analisado', cleanTitle);
    if (facts.watts) addSpec('Potência', facts.watts);
    if (facts.voltage) addSpec('Alimentação / Voltagem', facts.voltage);
    if (facts.storage) addSpec('Capacidade', facts.storage);
    addSpec('Origem Verificada', `Anúncio conferido na ${store}`);

    subtitle = `Análise completa de ${cleanTitle}: pontos fortes, limitações, ficha técnica e custo-benefício na ${store}.`;
    pros = [
      `${cleanTitle} apresenta ótimo alinhamento entre funcionalidade prática e preço de ${priceCurrent}`,
      facts.brand ? `Produto da marca ${facts.brand} com boa reputação e aceitação no mercado` : 'Especificações adequadas ao uso proposto sem custos inflados',
      `Oferta verificada diretamente na ${store} com proteção de compra garantida`,
    ];
    cons = [
      'Sempre confira variações de tamanho, cor ou voltagem antes de adicionar ao carrinho',
      'Avalie o prazo de entrega e frete calculados para o seu CEP na loja parceira',
    ];
    content = `### Visão Geral e O Que Esperar de ${cleanTitle}\n\nAo analisar ${cleanTitle}, o foco principal está na entrega prática e confiável para o perfil de uso a que se destina, evitando promessas exageradas.\n\n### Pontos Práticos no Dia a Dia\n\nCom preço observado de ${priceCurrent} na ${store}, o modelo se posiciona como alternativa competitiva frente a concorrentes diretos, sobretudo pela combinação de especificações e avaliações de compradores.\n\n### Recomendações Antes da Compra\n\nAntes de concluir o pedido, revise a ficha técnica acima e as medidas/voltagem compatíveis com a sua necessidade.`;
    verdict = `${cleanTitle} é uma compra acertada na faixa de ${priceCurrent} para quem busca exatamente esse perfil de funcionalidade com segurança na ${store}.`;
    faqs = [
      { question: `O produto ${cleanTitle} é original e vem com garantia?`, answer: `Sim, ao comprar pelo link oficial da ${store}, você conta com política de devolução, nota fiscal do vendedor e garantia legal.` },
      { question: `O preço de ${priceCurrent} pode mudar?`, answer: `Sim, os valores nos marketplaces são dinâmicos e podem sofrer ajustes ou encerramento de estoque promocional a qualquer momento.` },
    ];
  }

  // Garante garantia no final sem duplicar
  if (!specs.some((s) => /garantia/i.test(s.label))) {
    specs.push({ label: 'Garantia e Nota Fiscal', value: 'Garantia legal e emissão de NF pelo vendedor oficial' });
  }

  const finalCover =
    scraped.ogImage ||
    (niche === 'WATCH'
      ? '/src/assets/images/review_smartwatch_1792358371097.jpg'
      : niche === 'TV'
      ? '/src/assets/images/review_smart_tv_1792358384274.jpg'
      : niche === 'AUDIO'
      ? '/src/assets/images/review_anc_headphones_1792355762654.jpg'
      : niche === 'PERIPHERAL' || niche === 'NOTEBOOK'
      ? '/src/assets/images/review_mechanical_keyboard_1792355762298.jpg'
      : niche === 'KITCHEN_OVEN' || niche === 'KITCHEN_APPLIANCE'
      ? '/src/assets/images/review_smart_airfryer_1792355763307.jpg'
      : '/src/assets/images/hero_tech_showcase_1792355762010.jpg');

  const postKit = buildPostKit({
    title: cleanTitle,
    slug,
    priceCurrent,
    priceOriginal,
    partnerStore: store,
    affiliateUrl,
    category,
    rating,
    pros,
    cons,
    verdict,
    type: 'review',
    baseUrl,
  });

  return {
    title: cleanTitle,
    slug,
    subtitle,
    category,
    coverImage: finalCover,
    partnerStore: store,
    affiliateUrl,
    priceCurrent,
    priceOriginal,
    discountPercent: discount?.label || '',
    rating,
    pros,
    cons,
    specifications: specs.slice(0, 8),
    content,
    verdict,
    scoreCostBenefit,
    scorePerformance,
    scoreBuild,
    scoreUsability,
    faqs,
    postKit,
    generationSource: 'scraped-synthesis',
  };
}

const REVIEW_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Nome limpo, completo e pesquisável no Google em português do Brasil, sem nome de loja afiliada nem preço no título.' },
    slug: { type: Type.STRING, description: 'Slug URL amigável em letras minúsculas separadas por hífen.' },
    subtitle: { type: Type.STRING, description: 'Subtítulo atraente para SEO destacando o principal diferencial técnico deste modelo.' },
    category: { type: Type.STRING, description: 'Categoria exata dentre as disponíveis no portal.' },
    pros: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'De 3 a 5 pontos fortes técnicos e práticos específicos deste modelo exato.',
    },
    cons: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'De 2 a 3 limitações honestas e reais deste modelo exato.',
    },
    specifications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          value: { type: Type.STRING },
        },
        required: ['label', 'value'],
      },
      description: 'De 5 a 8 especificações técnicas reais do produto (jamais condição/estoque/caixa).',
    },
    content: {
      type: Type.STRING,
      description: 'Artigo review aprofundado em Markdown com 3 seções ### específicas para este modelo.',
    },
    verdict: {
      type: Type.STRING,
      description: 'Veredito final sincero dizendo exatamente para quem o produto vale a pena e para quem não vale.',
    },
    rating: { type: Type.NUMBER, description: 'Nota geral realista entre 4.0 e 5.0.' },
    scoreCostBenefit: { type: Type.NUMBER },
    scorePerformance: { type: Type.NUMBER },
    scoreBuild: { type: Type.NUMBER },
    scoreUsability: { type: Type.NUMBER },
    faqs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
        },
        required: ['question', 'answer'],
      },
      description: 'De 3 a 5 perguntas reais que compradores fazem antes de comprar este modelo específico.',
    },
    postKit: {
      type: Type.OBJECT,
      properties: {
        seoTitle: { type: Type.STRING, description: 'Título SEO para Google com até 60 caracteres.' },
        metaDescription: { type: Type.STRING, description: 'Meta descrição persuasiva para Google com até 155 caracteres.' },
        highlightsBadge: { type: Type.STRING, description: 'Frase curta de destaque para capa/story (ex: Nota 4.8 • Economia de R$ 200).' },
        whatsappCopy: { type: Type.STRING, description: 'Copy formatada para grupos de WhatsApp/Telegram com preço, 3 benefícios reais e chamada para link.' },
        instagramCaption: { type: Type.STRING, description: 'Legenda pronta para Instagram/Pinterest com gancho, resumo real e hashtags.' },
        shortVideoScript: { type: Type.STRING, description: 'Roteiro de 20-30s para Reels/TikTok/Shorts falando especificamente deste produto.' },
      },
      required: ['seoTitle', 'metaDescription', 'highlightsBadge', 'whatsappCopy', 'instagramCaption', 'shortVideoScript'],
    },
  },
  required: [
    'title',
    'slug',
    'subtitle',
    'category',
    'pros',
    'cons',
    'specifications',
    'content',
    'verdict',
    'rating',
    'scoreCostBenefit',
    'scorePerformance',
    'scoreBuild',
    'scoreUsability',
    'faqs',
    'postKit',
  ],
};

async function runWithTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout (${ms}ms) em ${label}`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function generateFullProductReview(params: {
  input: string;
  availableCategories?: string[];
  baseUrl?: string;
  affiliateUrlHint?: string;
  priceCurrentHint?: string;
  priceOriginalHint?: string;
  partnerStoreHint?: string;
  slugHint?: string;
  categoryHint?: string;
}): Promise<GeneratedReviewPayload> {
  const {
    input,
    availableCategories = [],
    baseUrl = '',
    affiliateUrlHint = '',
    priceCurrentHint = '',
    priceOriginalHint = '',
    partnerStoreHint = '',
    slugHint = '',
    categoryHint = '',
  } = params;
  const trimmedInput = input.trim();
  const isUrl = /^https?:\/\//i.test(trimmedInput);
  const urlToScrape = isUrl ? trimmedInput : /^https?:\/\//i.test(affiliateUrlHint) ? affiliateUrlHint.trim() : '';
  let detectedStore = partnerStoreHint.trim() || detectStore(urlToScrape || trimmedInput);

  let scraped: ScrapedMetadata = {
    resolvedUrl: urlToScrape || trimmedInput,
    pageTitle: '',
    metaDescription: '',
    ogImage: '',
    slugTitle: '',
    extractedPrice: '',
    extractedOriginalPrice: '',
    extractedSnippet: '',
    scrapedSpecs: [],
    brand: '',
    model: '',
    ratingHint: null,
  };

  if (urlToScrape) {
    scraped = await scrapeProductData(urlToScrape);
    const storeFromResolved = detectStore(scraped.resolvedUrl);
    if (!partnerStoreHint && storeFromResolved !== 'Loja Parceira Oficial') {
      detectedStore = storeFromResolved;
    }
  }

  if (priceCurrentHint && !scraped.extractedPrice) {
    scraped.extractedPrice = priceCurrentHint.trim();
  }
  if (priceOriginalHint && !scraped.extractedOriginalPrice) {
    scraped.extractedOriginalPrice = priceOriginalHint.trim();
  }

  const combinedSignals = [
    trimmedInput,
    categoryHint,
    scraped.slugTitle,
    scraped.pageTitle,
    scraped.metaDescription,
    scraped.extractedSnippet,
    scraped.scrapedSpecs.map((s) => `${s.label} ${s.value}`).join(' '),
  ].join(' ');

  const niche = classifyProduct(combinedSignals);
  const resolvedCategory =
    (categoryHint && availableCategories.find((c) => c.toLowerCase() === categoryHint.toLowerCase())) ||
    resolveCategoryName(niche, availableCategories);

  let titleHint = '';
  if (!isUrl) {
    titleHint = cleanProductTitle(trimmedInput) || trimmedInput;
  } else if (scraped.pageTitle && scraped.pageTitle.length > 4) {
    titleHint = cleanProductTitle(scraped.pageTitle);
  } else if (scraped.slugTitle && scraped.slugTitle.length > 4) {
    titleHint = cleanProductTitle(scraped.slugTitle);
  }

  const fallback = synthesizeRichFallbackReview({
    titleHint: titleHint || trimmedInput,
    store: detectedStore,
    affiliateUrl: urlToScrape || '',
    scraped,
    niche,
    category: resolvedCategory,
    baseUrl,
  });

  if (slugHint && slugHint.trim()) {
    fallback.slug = generateSlug(slugHint) || fallback.slug;
    fallback.postKit = buildPostKit({
      title: fallback.title,
      slug: fallback.slug,
      priceCurrent: fallback.priceCurrent,
      priceOriginal: fallback.priceOriginal,
      partnerStore: fallback.partnerStore,
      affiliateUrl: fallback.affiliateUrl,
      category: fallback.category,
      rating: fallback.rating,
      pros: fallback.pros,
      cons: fallback.cons,
      verdict: fallback.verdict,
      type: 'review',
      baseUrl,
    });
  }

  const ai = createGeminiClient();
  if (!ai) {
    return fallback;
  }

  // Se houver poucos dados raspados (ex.: link encurtado Shopee ou nome digitado), busca especificações reais via Google Search
  let webResearchNotes = '';
  let usedSearch = false;
  if (scraped.scrapedSpecs.length < 3) {
    try {
      const searchTarget = titleHint || scraped.resolvedUrl || trimmedInput;
      const searchResp = await runWithTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Pesquise a ficha técnica oficial, capacidade/potência/hardware exatos, opiniões de compradores (pontos positivos e reclamações comuns) e dúvidas frequentes no Brasil para o produto: "${searchTarget}". Se for uma URL curta (${trimmedInput}), identifique exatamente qual produto é. Responda em texto objetivo em português com dados técnicos reais.`,
          config: {
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        }),
        10000,
        'googleSearch grounding'
      );
      if (searchResp.text && searchResp.text.trim().length > 40) {
        webResearchNotes = searchResp.text.trim().slice(0, 3000);
        usedSearch = true;
      }
    } catch {
      // Continua normalmente para geração estruturada sem bloquear
    }
  }

  try {
    const categoriesPrompt = availableCategories.length > 0 ? availableCategories.join(' | ') : resolvedCategory;
    const scrapedSpecsText =
      scraped.scrapedSpecs.length > 0
        ? scraped.scrapedSpecs.map((s) => `- ${s.label}: ${s.value}`).join('\n')
        : 'Nenhuma tabela HTML direta; utilize os dados do título/pesquisa.';

    const nicheLabelMap: Record<ProductNiche, string> = {
      FITNESS_BIKE: 'Equipamento Fitness / Bicicleta Ergométrica ou Spinning (NÃO É bicicleta elétrica)',
      BICYCLE: 'Bicicleta Convencional sem motor elétrico (NÃO É bicicleta elétrica)',
      MOBILITY: 'Mobilidade Elétrica / Autopropelido (com motor e bateria)',
      WATCH: 'Relógio / Smartwatch',
      CONSOLE: 'Console de Videogame',
      CONNECTIVITY: 'Conectividade / Internet',
      CLIMATE: 'Climatização / Ar-condicionado',
      KITCHEN_OVEN: 'Fritadeira / Forno Air Fryer Oven',
      KITCHEN_APPLIANCE: 'Eletrodoméstico de Cozinha',
      UTILITY: 'Utilidades Domésticas',
      AUDIO: 'Áudio / Fones',
      NOTEBOOK: 'Notebook / Laptop',
      PERIPHERAL: 'Periférico / Informática',
      TV: 'Smart TV / Televisor',
      SMARTPHONE: 'Smartphone / Celular',
      GENERAL: 'Produto Geral',
    };

    const prompt = `Analise o produto abaixo e gere TODOS os recursos editoriais e de postagem em português do Brasil, de forma 100% ESPECÍFICA para este modelo exato.

DADOS COLETADOS DO PRODUTO:
- Entrada / URL: "${trimmedInput}"
- URL Resolvida: "${scraped.resolvedUrl}"
- Título extraído: "${titleHint || scraped.pageTitle || trimmedInput}"
- Natureza exata do produto: "${nicheLabelMap[niche]}"
- Marca detectada: "${scraped.brand || 'Extrair do título/pesquisa'}"
- Modelo detectado: "${scraped.model || 'Extrair do título/pesquisa'}"
- Loja Parceira: "${detectedStore}"
- Preço Atual: "${scraped.extractedPrice || 'Estimar ou usar ' + fallback.priceCurrent}"
- Preço Original: "${scraped.extractedOriginalPrice || 'Opcional'}"
- Categorias disponíveis no portal (escolha EXATAMENTE uma): [${categoriesPrompt}]
- Descrição extraída: "${scraped.metaDescription}"
- Ficha técnica extraída da página:
${scrapedSpecsText}
- Trecho extraído da página: "${scraped.extractedSnippet}"
${webResearchNotes ? `\nPESQUISA WEB EM TEMPO REAL DO MODELO:\n${webResearchNotes}` : ''}

REGRAS ANTI-GENÉRICO E ANTI-CONFUSÃO OBRIGATÓRIAS:
1. IDENTIDADE ESTRITA DO PRODUTO: Respeite exatamente a natureza do item informado no título e ficha ("${nicheLabelMap[niche]}"). Exemplo crítico: uma Bicicleta Ergométrica ou Spinning é equipamento de ginástica indoor (tem roda de inércia, resistência magnética/mecânica, peso máximo suportado, monitor LCD a pilha) e JAMAIS possui motor elétrico, bateria de lítio 48V, autonomia em km de rua ou regras do CONTRAN/CNH. Uma bicicleta convencional aro 29/26 também não é elétrica.
2. PROIBIDO texto genérico que sirva para qualquer produto (como "Construção reforçada com materiais de alta qualidade", "Condição: Novo na caixa", "Disponibilidade: Pronta entrega"). Cada prós, contra, especificação, parágrafo e FAQ DEVE citar características reais deste modelo exato.
3. O campo "title" deve ser limpo, natural e otimizado para pesquisa no Google (sem "- R$ XX,XX", sem "Frete Grátis", sem nome de loja afiliada).
4. Em "content", escreva um artigo profundo em Markdown com 3 seções ### específicas para este produto (400 a 650 palavras no total).
5. Em "postKit", crie cópias prontas para divulgação imediata no Google SEO, WhatsApp/Telegram, Instagram/Pinterest e roteiro de vídeo curto (Reels/TikTok/Shorts) já incluindo os benefícios reais e preço "${scraped.extractedPrice || fallback.priceCurrent}".
6. Inclua o link do review ("${baseUrl ? baseUrl + '/reviews/' : '/reviews/'}[slug]") e menção à loja "${detectedStore}" no whatsappCopy.`;

    const response = await runWithTimeout(
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Você é um especialista sênior em análise técnica de produtos e marketing de afiliados no Brasil. Escreva apenas fatos técnicos específicos e fiéis ao produto exato analisado, sem nunca confundir bicicleta ergométrica com bicicleta elétrica, sem clichês genéricos.',
          responseMimeType: 'application/json',
          responseSchema: REVIEW_RESPONSE_SCHEMA,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      }),
      20000,
      'gemini review generation'
    );

    const parsed = JSON.parse(response.text || '{}');

    // Guarda de consistência: impede vazamento de dados de bicicleta elétrica em ergométricas/bicicletas comuns
    if (niche === 'FITNESS_BIKE' || niche === 'BICYCLE') {
      const generatedBlob = JSON.stringify(parsed || {});
      const electricContamination = /\b(motor\s*el[eé]trico|bateria\s*de\s*l[ií]tio|48v|36v|contran|emplacamento|autopropelid|cnh|quil[oô]metros\s*por\s*carga|recarga\s*da\s*bateria)\b/i;
      if (electricContamination.test(generatedBlob)) {
        console.warn(`Descartando resposta contaminada por termos de bicicleta elétrica para ${niche}; usando síntese específica.`);
        return fallback;
      }
    }

    const cleanTitle = cleanProductTitle(parsed.title || titleHint) || fallback.title;
    const finalSlug = (slugHint ? generateSlug(slugHint) : '') || generateSlug(parsed.slug || cleanTitle) || fallback.slug;
    const finalPriceCurrent = scraped.extractedPrice || fallback.priceCurrent;
    const finalPriceOriginal = scraped.extractedOriginalPrice || fallback.priceOriginal;
    const disc = calculateDiscountHelper(finalPriceCurrent, finalPriceOriginal);

    const filteredSpecs = Array.isArray(parsed.specifications)
      ? parsed.specifications.filter((s: any) => s?.label && s?.value && !isInventoryBoilerplate(s.label, s.value))
      : [];

    const matchedCategory =
      availableCategories.find((c) => c.toLowerCase() === String(parsed.category || '').toLowerCase()) || resolvedCategory;

    const rating =
      typeof parsed.rating === 'number' && parsed.rating >= 1 && parsed.rating <= 5
        ? Number(parsed.rating.toFixed(1))
        : fallback.rating;

    const pros = Array.isArray(parsed.pros) && parsed.pros.length > 0 ? parsed.pros : fallback.pros;
    const cons = Array.isArray(parsed.cons) && parsed.cons.length > 0 ? parsed.cons : fallback.cons;

    const basePostKit = buildPostKit({
      title: cleanTitle,
      slug: finalSlug,
      priceCurrent: finalPriceCurrent,
      priceOriginal: finalPriceOriginal,
      partnerStore: detectedStore,
      affiliateUrl: urlToScrape || '',
      category: matchedCategory,
      rating,
      pros,
      cons,
      verdict: parsed.verdict || fallback.verdict,
      type: 'review',
      baseUrl,
    });

    const postKit: PostKitData = {
      seoTitle: parsed.postKit?.seoTitle || basePostKit.seoTitle,
      metaDescription: parsed.postKit?.metaDescription || basePostKit.metaDescription,
      highlightsBadge: parsed.postKit?.highlightsBadge || basePostKit.highlightsBadge,
      whatsappCopy: parsed.postKit?.whatsappCopy || basePostKit.whatsappCopy,
      instagramCaption: parsed.postKit?.instagramCaption || basePostKit.instagramCaption,
      shortVideoScript: parsed.postKit?.shortVideoScript || basePostKit.shortVideoScript,
    };

    return {
      title: cleanTitle,
      slug: finalSlug,
      subtitle: parsed.subtitle || fallback.subtitle,
      category: matchedCategory,
      coverImage: fallback.coverImage,
      partnerStore: detectedStore,
      affiliateUrl: urlToScrape || '',
      priceCurrent: finalPriceCurrent,
      priceOriginal: finalPriceOriginal,
      discountPercent: disc?.label || '',
      rating,
      pros,
      cons,
      specifications: filteredSpecs.length >= 3 ? filteredSpecs : fallback.specifications,
      content: parsed.content || fallback.content,
      verdict: parsed.verdict || fallback.verdict,
      scoreCostBenefit: Number(parsed.scoreCostBenefit) || fallback.scoreCostBenefit,
      scorePerformance: Number(parsed.scorePerformance) || fallback.scorePerformance,
      scoreBuild: Number(parsed.scoreBuild) || fallback.scoreBuild,
      scoreUsability: Number(parsed.scoreUsability) || fallback.scoreUsability,
      faqs: Array.isArray(parsed.faqs) && parsed.faqs.length > 0 ? parsed.faqs : fallback.faqs,
      postKit,
      generationSource: usedSearch ? 'gemini-search' : 'gemini',
    };
  } catch (err) {
    console.warn('Gemini generation fallback activated:', err instanceof Error ? err.message : err);
    return fallback;
  }
}

export async function generateComparisonGuideWithAI(params: {
  topic: string;
  category?: string;
  products: GuideInputProduct[];
  availableCategories?: string[];
  baseUrl?: string;
}): Promise<GeneratedGuidePayload> {
  const { topic, category, products: rawProducts, availableCategories = [], baseUrl = '' } = params;
  const cleanTopic = topic.trim() || `Melhores ${category || 'Produtos'} em ${new Date().getFullYear()}: Guia Comparativo`;
  const guideSlug = generateSlug(cleanTopic) || `guia-comparativo-${Date.now()}`;
  const combinedSignals = `${cleanTopic} ${category || ''} ${rawProducts.map((p) => p.title).join(' ')}`;
  const niche = classifyProduct(combinedSignals);
  const resolvedCategory =
    availableCategories.find((c) => c.toLowerCase() === (category || '').toLowerCase()) ||
    resolveCategoryName(niche, availableCategories);

  // Garante que qualquer produto passado sem especificações detalhadas receba enriquecimento factual por atributos reais
  const products: GuideInputProduct[] = rawProducts.map((p) => {
    if (p.specifications && p.specifications.length >= 3 && p.pros && p.pros.length >= 2) {
      return p;
    }
    const pNiche = classifyProduct(`${p.title} ${resolvedCategory}`);
    const synth = synthesizeRichFallbackReview({
      titleHint: p.title,
      store: p.partnerStore || detectStore(p.affiliateUrl || ''),
      affiliateUrl: p.affiliateUrl || '',
      scraped: {
        resolvedUrl: p.affiliateUrl || '',
        pageTitle: p.title,
        metaDescription: p.subtitle || '',
        ogImage: p.imageUrl || '',
        slugTitle: '',
        extractedPrice: p.price || '',
        extractedOriginalPrice: p.originalPrice || '',
        extractedSnippet: '',
        scrapedSpecs: p.specifications || [],
        brand: '',
        model: '',
        ratingHint: p.rating || null,
      },
      niche: pNiche,
      category: resolvedCategory,
      baseUrl,
    });
    return {
      ...p,
      price: p.price || synth.priceCurrent,
      originalPrice: p.originalPrice || synth.priceOriginal,
      partnerStore: p.partnerStore || synth.partnerStore,
      imageUrl: p.imageUrl || synth.coverImage,
      rating: p.rating || synth.rating,
      pros: p.pros && p.pros.length > 0 ? p.pros : synth.pros,
      cons: p.cons && p.cons.length > 0 ? p.cons : synth.cons,
      specifications: p.specifications && p.specifications.length > 0 ? p.specifications : synth.specifications,
      verdict: p.verdict || synth.verdict,
      subtitle: p.subtitle || synth.subtitle,
    };
  });

  // Fallback determinístico rico e específico aos produtos reais selecionados
  const buildFallbackGuide = (): GeneratedGuidePayload => {
    const badges = ['Melhor Geral', 'Melhor Custo-Benefício', 'Destaque Técnico', 'Mais Econômico', 'Alternativa Recomendada'];
    const sorted = [...products].sort((a, b) => (b.rating || 4.7) - (a.rating || 4.7));

    const mappedProducts = sorted.map((p, idx) => {
      const specs = (p.specifications || []).slice(0, 4);
      return {
        id: p.id || `prod-${Date.now()}-${idx + 1}`,
        title: p.title,
        badge: badges[idx] || `Top #${idx + 1}`,
        rating: Number(p.rating || 4.7),
        price: p.price || 'R$ 0,00',
        originalPrice: p.originalPrice || '',
        partnerStore: p.partnerStore || 'Loja Parceira',
        affiliateUrl: p.affiliateUrl || '',
        imageUrl: p.imageUrl || '/src/assets/images/hero_tech_showcase_1792355762010.jpg',
        summary:
          p.verdict ||
          p.subtitle ||
          `${p.title} ocupa a posição #${idx + 1} por entregar excelente equilíbrio entre especificações e valor de ${p.price || 'oferta atual'} na ${p.partnerStore || 'loja parceira'}.`,
        pros: (p.pros && p.pros.length > 0 ? p.pros : [`Excelente posicionamento de preço na faixa de ${p.price || 'mercado'}`]).slice(0, 4),
        cons: (p.cons && p.cons.length > 0 ? p.cons : ['Conferir voltagem, dimensões e variações no anúncio antes de fechar']).slice(0, 2),
        keySpecs:
          specs.length > 0
            ? specs.map((s) => ({ label: s.label, value: s.value }))
            : [
                { label: 'Loja Verificada', value: p.partnerStore || 'Parceiro Oficial' },
                { label: 'Preço Observado', value: p.price || 'Consultar' },
              ],
        reviewSlug: p.reviewSlug,
      };
    });

    const first = mappedProducts[0];
    const second = mappedProducts[1];
    const introContent = [
      `Escolher entre os modelos de ${resolvedCategory} exige comparar o que realmente muda no uso prático — e não apenas olhar para o menor preço da vitrine. Neste guia comparativo, colocamos lado a lado ${mappedProducts.map((m) => m.title).join(', ')}.`,
      `Analisamos ficha técnica, faixa de preço observada e pontos de atenção de cada modelo para indicar com precisão qual entrega o melhor retorno para o seu perfil de uso e orçamento.`,
    ].join('\n\n');

    const buyingTipsContent = [
      `### O Que Comparar Antes de Escolher`,
      `1. Especificação Principal vs Necessidade Real: Compare sempre os números reais de capacidade, desempenho ou autonomia entre ${first?.title || 'o líder do ranking'} e ${second?.title || 'as alternativas'}.`,
      `2. Custo Total de Uso e Compatibilidade: Confira voltagem, dimensões físicas e eventuais acessórios ou assinaturas exigidas após a compra.`,
      `3. Loja Oficial e Proteção ao Comprador: Dê preferência aos anúncios verificados listados na tabela acima para garantir nota fiscal e devolução descomplicada.`,
    ].join('\n\n');

    const guideFaqs = [
      {
        question: `Qual modelo vence em custo-benefício neste comparativo?`,
        answer: second
          ? `Para quem quer pagar menos mantendo ótima entrega, ${second.title} (${second.price}) se destaca em custo-benefício, enquanto ${first?.title} (${first?.price}) lidera na avaliação geral.`
          : `${first?.title} lidera o comparativo equilibrando recursos técnicos e preço de ${first?.price}.`,
      },
      {
        question: `Os links do comparativo levam a lojas confiáveis?`,
        answer: `Sim, todas as ofertas apontam diretamente para páginas verificadas em marketplaces parceiros como ${Array.from(new Set(mappedProducts.map((m) => m.partnerStore))).join(', ')}.`,
      },
      {
        question: `Posso ler o review completo de cada produto individualmente?`,
        answer: `Sim, nos modelos que possuem análise individual no portal há um botão "Ler Análise Individual" com ficha técnica estendida e FAQ próprio.`,
      },
    ];

    const guidePostKit = buildPostKit({
      title: cleanTopic,
      slug: guideSlug,
      priceCurrent: first?.price || 'Ofertas Verificadas',
      partnerStore: first?.partnerStore || 'Lojas Oficiais',
      affiliateUrl: first?.affiliateUrl || '',
      category: resolvedCategory,
      rating: first?.rating || 4.8,
      pros: mappedProducts.slice(0, 3).map((m, i) => `#${i + 1} ${m.title} (${m.price})`),
      verdict: `Comparamos ${mappedProducts.length} modelos reais para você acertar na compra sem jogar dinheiro fora.`,
      type: 'guide',
      baseUrl,
    });

    return {
      title: cleanTopic,
      slug: guideSlug,
      subtitle: `Comparamos ${mappedProducts.map((m) => m.title.split(' ').slice(0, 4).join(' ')).join(' vs ')} em ficha técnica, prós, contras e melhor preço.`,
      category: resolvedCategory,
      coverImage: first?.imageUrl || '/src/assets/images/hero_tech_showcase_1792355762010.jpg',
      introContent,
      buyingTipsContent,
      products: mappedProducts,
      faqs: guideFaqs,
      postKit: guidePostKit,
      generationSource: 'attribute-synthesis',
    };
  };

  const fallbackGuide = buildFallbackGuide();
  const ai = createGeminiClient();
  if (!ai || products.length === 0) {
    return fallbackGuide;
  }

  try {
    const productsContext = products
      .map(
        (p, idx) =>
          `PRODUTO ${idx + 1}:
- Título: ${p.title}
- Preço: ${p.price || 'Não informado'} (Original: ${p.originalPrice || 'N/A'})
- Loja: ${p.partnerStore || 'Parceira'}
- Nota: ${p.rating || 4.8}
- Especificações: ${(p.specifications || []).map((s) => `${s.label}: ${s.value}`).join(' | ') || 'Extrair do modelo real'}
- Prós existentes: ${(p.pros || []).join('; ') || 'Analisar'}
- Contras existentes: ${(p.cons || []).join('; ') || 'Analisar'}`
      )
      .join('\n\n');

    const guideSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        slug: { type: Type.STRING },
        subtitle: { type: Type.STRING },
        introContent: { type: Type.STRING, description: 'Introdução editorial de 2 a 3 parágrafos comparando diretamente os modelos listados.' },
        buyingTipsContent: { type: Type.STRING, description: 'Guia prático em Markdown (### e itens numerados) específico para escolher nessa categoria.' },
        productComparisons: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sourceIndex: { type: Type.INTEGER, description: 'Índice base 1 do produto correspondente na lista enviada.' },
              badge: { type: Type.STRING, description: 'Selo único de pódio (ex: Melhor Geral, Melhor Custo-Benefício, Maior Capacidade, Mais Econômico).' },
              summary: { type: Type.STRING, description: 'Resumo comparativo de 2 a 3 frases explicando por que este modelo ganhou este selo frente aos concorrentes.' },
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } },
              keySpecs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                  },
                  required: ['label', 'value'],
                },
                description: 'Exatamente 4 especificações chave padronizadas com os mesmos rótulos entre os produtos para comparação direta.',
              },
            },
            required: ['sourceIndex', 'badge', 'summary', 'pros', 'cons', 'keySpecs'],
          },
        },
        faqs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
            },
            required: ['question', 'answer'],
          },
        },
        postKit: {
          type: Type.OBJECT,
          properties: {
            seoTitle: { type: Type.STRING },
            metaDescription: { type: Type.STRING },
            highlightsBadge: { type: Type.STRING },
            whatsappCopy: { type: Type.STRING },
            instagramCaption: { type: Type.STRING },
            shortVideoScript: { type: Type.STRING },
          },
          required: ['seoTitle', 'metaDescription', 'highlightsBadge', 'whatsappCopy', 'instagramCaption', 'shortVideoScript'],
        },
      },
      required: ['title', 'slug', 'subtitle', 'introContent', 'buyingTipsContent', 'productComparisons', 'faqs', 'postKit'],
    };

    const prompt = `Crie um Guia Comparativo editorial COMPLETO e IMPARCIAL em português do Brasil sobre o tema: "${cleanTopic}" (Categoria: ${resolvedCategory}).

PRODUTOS REAIS SELECIONADOS PARA COMPARAÇÃO:
${productsContext}

DIRETRIZES CRÍTICAS:
1. Ordene o pódio do melhor para o mais específico, atribuindo selos ÚNICOS e JUSTIFICADOS ("Melhor Geral", "Melhor Custo-Benefício", "Mais Potente / Completo", "Mais Econômico").
2. Compare os modelos ENTRE SI nos resumos, especificações (use os mesmos 4 rótulos de comparação em keySpecs para todos os produtos para facilitar comparação direta!), dicas de compra e FAQs.
3. Jamais invente especificações falsas ou use frases vagas como "produto de ótima qualidade". Cite os nomes reais, capacidades, preços e diferenças reais entre eles.
4. Gere também o postKit completo para divulgação do guia comparativo (link do guia: ${baseUrl ? baseUrl + '/guias/' : '/guias/'}${guideSlug}).`;

    const response = await runWithTimeout(
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Você é editor-chefe de um portal brasileiro de comparações técnicas e compras inteligentes. Escreva análises comparativas claras, diretas e baseadas em fatos técnicos.',
          responseMimeType: 'application/json',
          responseSchema: guideSchema,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      }),
      22000,
      'gemini comparison guide generation'
    );

    const parsed = JSON.parse(response.text || '{}');
    const finalTitle = parsed.title || cleanTopic;
    const finalSlug = generateSlug(parsed.slug || finalTitle) || guideSlug;

    const comps: any[] = Array.isArray(parsed.productComparisons) ? parsed.productComparisons : [];
    const mappedProducts =
      comps.length > 0
        ? comps.map((c, idx) => {
            const orig = products[(Number(c.sourceIndex) || idx + 1) - 1] || products[idx] || products[0];
            return {
              id: orig.id || `prod-${Date.now()}-${idx + 1}`,
              title: orig.title,
              badge: c.badge || fallbackGuide.products[idx]?.badge || `Top #${idx + 1}`,
              rating: Number(orig.rating || 4.8),
              price: orig.price || 'R$ 0,00',
              originalPrice: orig.originalPrice || '',
              partnerStore: orig.partnerStore || 'Loja Parceira',
              affiliateUrl: orig.affiliateUrl || '',
              imageUrl: orig.imageUrl || '/src/assets/images/hero_tech_showcase_1792355762010.jpg',
              summary: c.summary || orig.verdict || orig.subtitle || '',
              pros: Array.isArray(c.pros) && c.pros.length > 0 ? c.pros : orig.pros || [],
              cons: Array.isArray(c.cons) && c.cons.length > 0 ? c.cons : orig.cons || [],
              keySpecs: Array.isArray(c.keySpecs) && c.keySpecs.length > 0 ? c.keySpecs : (orig.specifications || []).slice(0, 4),
              reviewSlug: orig.reviewSlug,
            };
          })
        : fallbackGuide.products;

    const fallbackPostKit = buildPostKit({
      title: finalTitle,
      slug: finalSlug,
      priceCurrent: mappedProducts[0]?.price || 'Ofertas',
      partnerStore: mappedProducts[0]?.partnerStore || 'Lojas Parceiras',
      affiliateUrl: mappedProducts[0]?.affiliateUrl || '',
      category: resolvedCategory,
      rating: mappedProducts[0]?.rating || 4.8,
      pros: mappedProducts.slice(0, 3).map((m, i) => `#${i + 1} ${m.title}`),
      verdict: parsed.subtitle || fallbackGuide.subtitle,
      type: 'guide',
      baseUrl,
    });

    return {
      title: finalTitle,
      slug: finalSlug,
      subtitle: parsed.subtitle || fallbackGuide.subtitle,
      category: resolvedCategory,
      coverImage: mappedProducts[0]?.imageUrl || fallbackGuide.coverImage,
      introContent: parsed.introContent || fallbackGuide.introContent,
      buyingTipsContent: parsed.buyingTipsContent || fallbackGuide.buyingTipsContent,
      products: mappedProducts,
      faqs: Array.isArray(parsed.faqs) && parsed.faqs.length > 0 ? parsed.faqs : fallbackGuide.faqs,
      postKit: {
        seoTitle: parsed.postKit?.seoTitle || fallbackPostKit.seoTitle,
        metaDescription: parsed.postKit?.metaDescription || fallbackPostKit.metaDescription,
        highlightsBadge: parsed.postKit?.highlightsBadge || fallbackPostKit.highlightsBadge,
        whatsappCopy: parsed.postKit?.whatsappCopy || fallbackPostKit.whatsappCopy,
        instagramCaption: parsed.postKit?.instagramCaption || fallbackPostKit.instagramCaption,
        shortVideoScript: parsed.postKit?.shortVideoScript || fallbackPostKit.shortVideoScript,
      },
      generationSource: 'gemini',
    };
  } catch (err) {
    console.warn('Gemini guide fallback activated:', err instanceof Error ? err.message : err);
    return fallbackGuide;
  }
}

export async function generatePostKitWithAI(params: {
  title: string;
  slug: string;
  priceCurrent: string;
  priceOriginal?: string;
  partnerStore: string;
  affiliateUrl: string;
  category: string;
  rating: number;
  pros: string[];
  cons?: string[];
  verdict: string;
  type: 'review' | 'guide';
  baseUrl?: string;
}): Promise<PostKitData> {
  const fallback = buildPostKit(params);
  const ai = createGeminiClient();
  if (!ai) {
    return fallback;
  }

  try {
    const schema = {
      type: Type.OBJECT,
      properties: {
        seoTitle: { type: Type.STRING },
        metaDescription: { type: Type.STRING },
        highlightsBadge: { type: Type.STRING },
        whatsappCopy: { type: Type.STRING },
        instagramCaption: { type: Type.STRING },
        shortVideoScript: { type: Type.STRING },
      },
      required: ['seoTitle', 'metaDescription', 'highlightsBadge', 'whatsappCopy', 'instagramCaption', 'shortVideoScript'],
    };

    const sitePath = params.type === 'guide' ? `/guias/${params.slug}` : `/reviews/${params.slug}`;
    const fullUrl = params.baseUrl ? `${params.baseUrl}${sitePath}` : sitePath;

    const prompt = `Gere o Kit Completo de Divulgação e SEO em português do Brasil para ${params.type === 'guide' ? 'este guia comparativo' : 'este produto'}:
- Título: ${params.title}
- Preço: ${params.priceCurrent} (Original: ${params.priceOriginal || 'N/A'})
- Loja: ${params.partnerStore}
- Nota: ${params.rating}/5.0
- Pontos positivos reais: ${(params.pros || []).join(' | ')}
- Pontos de atenção: ${(params.cons || []).join(' | ')}
- Veredito: ${params.verdict}
- Link da análise no site: ${fullUrl}
- Link de afiliado: ${params.affiliateUrl}

REGRAS: Nada genérico, inclua exatamente os benefícios reais listados acima, preço "${params.priceCurrent}" e o link da análise "${fullUrl}" no whatsappCopy.`;

    const response = await runWithTimeout(
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      }),
      12000,
      'gemini postKit generation'
    );

    const parsed = JSON.parse(response.text || '{}');
    return {
      seoTitle: parsed.seoTitle || fallback.seoTitle,
      metaDescription: parsed.metaDescription || fallback.metaDescription,
      highlightsBadge: parsed.highlightsBadge || fallback.highlightsBadge,
      whatsappCopy: parsed.whatsappCopy || fallback.whatsappCopy,
      instagramCaption: parsed.instagramCaption || fallback.instagramCaption,
      shortVideoScript: parsed.shortVideoScript || fallback.shortVideoScript,
    };
  } catch {
    return fallback;
  }
}
