import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.set('trust proxy', true);
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Tipos de produto categorizados
type ProductType = 'WATCH' | 'TV' | 'AUDIO' | 'PERIPHERAL' | 'KITCHEN' | 'SMARTPHONE' | 'GENERAL';

// Identifica a plataforma de e-commerce pelo link
function detectStore(urlOrText: string): string {
  if (/amazon\.com(\.br)?|amzn\.to|a\.co/i.test(urlOrText)) return 'Amazon Brasil';
  if (/mercadolivre\.com(\.br)?|meli\.la|produto\.mercadolivre/i.test(urlOrText)) return 'Mercado Livre';
  if (/shopee\.com(\.br)?|s\.shopee\.com\.br/i.test(urlOrText)) return 'Shopee Oficial';
  if (/magazineluiza\.com(\.br)?|magazinevoce\.com\.br|magalu\.me|magalu/i.test(urlOrText)) return 'Magazine Luiza';
  if (/aliexpress\.com/i.test(urlOrText)) return 'AliExpress';
  if (/kabum\.com(\.br)?/i.test(urlOrText)) return 'KaBuM!';
  if (/casasbahia\.com(\.br)?/i.test(urlOrText)) return 'Casas Bahia';
  return 'Loja Parceira Oficial';
}

// Limpa títulos brutos removendo nomes de lojas de afiliados e branding
function cleanProductTitle(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  // Decodifica entidades HTML básicas
  let text = raw
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  // Se for tela de verificação de segurança (Cloudflare, Magalu, Amazon robot check), ignora totalmente
  if (/verificação rápida|acessou nosso site|segurança precisamos|navegação segura|proteger seus dados|etapa simples e rápida|robot check|captcha|cloudflare|access denied|algo deu errado|404|login/i.test(text)) {
    return '';
  }

  // Divide o título por separadores usuais em e-commerce (| , - , — , • , :)
  const segments = text.split(/\s+[|\-—•]\s+|\s*\|\s*|\s*:\s*/).map(s => s.trim()).filter(Boolean);

  // Filtra segmentos que são puramente lojas, nomes de afiliados ou slogans
  const filtered = segments.filter(seg => {
    // Lojas de afiliados como "Magazine NomeDoAfiliado", "Magazine Você", "Magazine Luiza"
    if (/^(magazine\s+[a-z0-9_-]+|magazine\s*voc[eê]|magazine\s*luiza)$/i.test(seg)) return false;
    // Padrões de lojas personalizadas de afiliados
    if (/^(loja\s+(do|da|de)?\s*[a-z0-9_ -]+|vitrine\s+[a-z0-9_ -]+|espa[cç]o\s+[a-z0-9_ -]+|achados\s+(do|da|de)?\s*[a-z0-9_ -]+)$/i.test(seg)) return false;
    // Grandes plataformas no título
    if (/^(amazon(\.com\.br)?|mercado\s*livre|shopee(\s*brasil)?|aliexpress|kabum!?|casas\s*bahia|americanas|submarino)$/i.test(seg)) return false;
    // Slogans de venda genéricos
    if (/^(compre online|frete gr[aá]tis|em promo[cç][aã]o|melhor pre[cç]o|ofertas? da semana|loja oficial|oferta imperd[ií]vel)$/i.test(seg)) return false;
    // Erros e bots
    if (/^(404|erro|p[aá]gina n[aã]o|algo deu errado|robot check|captcha|acesso negado|verificação)$/i.test(seg)) return false;
    return true;
  });

  if (filtered.length > 0) {
    // Escolhe o segmento que possui mais palavras ou menções a produtos reais
    const bestSegment = filtered.sort((a, b) => {
      const aWords = a.split(/\s+/).length;
      const bWords = b.split(/\s+/).length;
      const aKeywords = /rel[oó]gio|smartwatch|watch|tv|fone|teclado|celular|air fryer|soundbar|aspirador/i.test(a) ? 3 : 0;
      const bKeywords = /rel[oó]gio|smartwatch|watch|tv|fone|teclado|celular|air fryer|soundbar|aspirador/i.test(b) ? 3 : 0;
      return (bWords + bKeywords) - (aWords + aKeywords);
    })[0];

    // Remove prefixos de loja residuais no segmento escolhido
    return bestSegment
      .replace(/^(magazine\s+[a-z0-9_-]+|loja\s+[a-z0-9_-]+)\s*[-:]?\s*/gi, '')
      .replace(/\s*[-:]?\s*(no\s+mercado\s+livre|na\s+shopee|na\s+amazon|no\s+magalu).*$/gi, '')
      .trim();
  }

  // Fallback se não sobrou nenhum segmento: limpa prefixos da string completa
  return text
    .replace(/^(magazine\s+[a-z0-9_-]+|loja\s+[a-z0-9_-]+)\s*[|\-:]\s*/gi, '')
    .replace(/\s*[|\-:]\s*(magazine\s+[a-z0-9_-]+|amazon|mercado\s*livre|shopee|kabum).*$/gi, '')
    .trim();
}

// Formata o slug limpo em título capitalizado em português
function formatSlugAsTitle(slug: string): string {
  if (!slug) return '';
  return slug
    .split(/\s+/)
    .map(word => {
      const lower = word.toLowerCase();
      if (/^(de|da|do|dos|das|e|em|com|para|a|o|as|os)$/.test(lower)) return lower;
      if (/^relogio$/i.test(lower)) return 'Relógio';
      if (/^agua$/i.test(lower)) return 'à Água';
      if (/^resiste(nte)?$/i.test(lower)) return 'Resistente';
      if (/^eletrica$/i.test(lower)) return 'Elétrica';
      if (/^mecanico$/i.test(lower)) return 'Mecânico';
      if (/^fones?$/i.test(lower)) return 'Fone';
      if (/^ruido$/i.test(lower)) return 'Ruído';
      if (/^televisao$/i.test(lower)) return 'Televisão';
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ')
    .replace(/\s+à\s+Água\s+à\s+Água/gi, ' à Água')
    .replace(/\s+a\s+agua/gi, ' à Água');
}

// Extrai tokens e nome legível do produto a partir de URLs ignorando lojas de afiliados
function extractSlugWords(url: string): string {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean);

    // Segmentos a ignorar (nomes de lojas de afiliados, diretórios do sistema e identificadores)
    const candidates = pathParts.filter(part => {
      // Ignora diretórios comuns de lojas afiliadas (ex: /magazineminhaloja/)
      if (/^magazine[a-z0-9_-]*$/i.test(part)) return false;
      if (/^(shop|store|loja|vitrine|afiliado[s]?|afiliada[s]?|parceiro[s]?|vendedor|seller|user|perfil|u)$/i.test(part)) return false;
      // Ignora rotas de sistema
      if (/^(dp|gp|product|produto|produtos|item|itens|p|sec|s|b|c|d|br|pt)$/i.test(part)) return false;
      // Ignora hashes, códigos hexadecimais ou IDs numéricos (ex: 1234567, MLB123456)
      if (/^(MLB[0-9]+|[0-9a-f]{8,}|[0-9]{4,})$/i.test(part)) return false;
      return true;
    });

    if (candidates.length === 0) return '';

    // Encontra o segmento com maior contagem de palavras separadas por hífen
    const bestPart = candidates.sort((a, b) => {
      const aWordCount = a.split(/[-_+]/).length;
      const bWordCount = b.split(/[-_+]/).length;
      const aHasKeywords = /rel[oó]gio|smartwatch|watch|tv|fone|teclado|celular|airfryer|fritadeira/i.test(a) ? 2 : 0;
      const bHasKeywords = /rel[oó]gio|smartwatch|watch|tv|fone|teclado|celular|airfryer|fritadeira/i.test(b) ? 2 : 0;
      return (bWordCount + bHasKeywords) - (aWordCount + aHasKeywords);
    })[0];

    if (bestPart) {
      const cleaned = decodeURIComponent(bestPart)
        .replace(/[-_+]/g, ' ')
        .replace(/[0-9a-f]{8,}/gi, '')
        .trim();
      if (cleaned.length > 3) return formatSlugAsTitle(cleaned);
    }
  } catch {
    // Não é URL válida
  }
  return '';
}

// Utilitários robustos de formatação e cálculo matemático de preços em BRL
function parsePriceToNumber(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const str = String(val).trim();
  if (!str) return null;

  const clean = str.replace(/[^\d.,]/g, '');
  if (!clean) return null;

  if (clean.includes('.') && clean.includes(',')) {
    const normalized = clean.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(normalized);
    return isNaN(n) ? null : n;
  }

  if (clean.includes(',')) {
    const normalized = clean.replace(',', '.');
    const n = parseFloat(normalized);
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

function formatBRL(num: number): string {
  if (isNaN(num)) return 'R$ 0,00';
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calculateDiscountHelper(
  current: string | number | null | undefined,
  original: string | number | null | undefined
): { percent: number; label: string } | null {
  const currNum = parsePriceToNumber(current);
  const origNum = parsePriceToNumber(original);

  if (currNum === null || origNum === null) return null;
  if (origNum <= 0 || currNum <= 0) return null;
  if (currNum >= origNum) return { percent: 0, label: '' };

  const rawPercent = ((origNum - currNum) / origNum) * 100;
  const rounded = Math.round(rawPercent);

  if (rounded <= 0) return { percent: 0, label: '' };
  return {
    percent: rounded,
    label: `${rounded}% de desconto`
  };
}

// Scraper resiliente para extrair metadados e preços reais da página do produto
async function scrapeUrlMetadata(targetUrl: string) {
  let resolvedUrl = targetUrl;
  let pageTitle = '';
  let metaDescription = '';
  let ogImage = '';
  let extractedPrice = '';
  let extractedOriginalPrice = '';
  let slugTitle = extractSlugWords(targetUrl);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
        'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"'
      }
    });

    clearTimeout(timeout);
    resolvedUrl = res.url || targetUrl;

    if (!slugTitle) {
      slugTitle = extractSlugWords(resolvedUrl);
    }

    const html = await res.text();

    // 1. Tenta extrair JSON-LD com dados de Produto e Preço Oficial
    try {
      const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      if (jsonLdMatches) {
        for (const block of jsonLdMatches) {
          const content = block.replace(/<script[^>]*>|<\/script>/gi, '').trim();
          const parsedLd = JSON.parse(content);
          
          // Suporte a objetos individuais, arrays ou @graph
          const items: any[] = [];
          if (Array.isArray(parsedLd)) {
            items.push(...parsedLd);
          } else if (parsedLd && Array.isArray(parsedLd['@graph'])) {
            items.push(...parsedLd['@graph']);
          } else if (parsedLd) {
            items.push(parsedLd);
          }

          const productItem = items.find(i => i && (i['@type'] === 'Product' || i['@type'] === 'IndividualProduct'));
          if (productItem) {
            if (productItem.name && !pageTitle) {
              pageTitle = cleanProductTitle(productItem.name);
            }
            if (productItem.image && !ogImage) {
              ogImage = Array.isArray(productItem.image) ? productItem.image[0] : (typeof productItem.image === 'string' ? productItem.image : productItem.image?.url || '');
            }
            if (productItem.description && !metaDescription) {
              metaDescription = productItem.description;
            }
            if (productItem.offers) {
              const offersList = Array.isArray(productItem.offers) ? productItem.offers : [productItem.offers];
              for (const offer of offersList) {
                const rawPrice = offer?.price ?? offer?.lowPrice;
                if (rawPrice !== undefined && rawPrice !== null && !extractedPrice) {
                  const pNum = parsePriceToNumber(rawPrice);
                  if (pNum && pNum > 0) {
                    extractedPrice = formatBRL(pNum);
                  }
                }
                const rawHigh = offer?.highPrice ?? offer?.priceSpecification?.maxPrice;
                if (rawHigh !== undefined && rawHigh !== null && !extractedOriginalPrice) {
                  const hNum = parsePriceToNumber(rawHigh);
                  if (hNum && hNum > 0) {
                    extractedOriginalPrice = formatBRL(hNum);
                  }
                }
              }
            }
            if (extractedPrice) break;
          }
        }
      }
    } catch {
      // JSON-LD malformado ou parcial, continua com seletores de lojas
    }

    // 2. Extração de Preço em Metatags do E-commerce
    if (!extractedPrice) {
      const metaPriceMatch = html.match(/<meta[^>]+(?:property|name|itemprop)=["'](?:product:price:amount|og:price:amount|price|twitter:data1)["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["'](?:product:price:amount|og:price:amount|price|twitter:data1)["']/i);
      if (metaPriceMatch && metaPriceMatch[1]) {
        const pNum = parsePriceToNumber(metaPriceMatch[1]);
        if (pNum && pNum > 0) {
          extractedPrice = formatBRL(pNum);
        }
      }
    }

    // 3. Mercado Livre: Oferta Atual em ui-pdp-price__second-line ou andes-money-amount
    if (!extractedPrice) {
      // Prioridade: segundo bloco de preço (preço de venda real com desconto aplicado)
      const mlSecondLineMatch = html.match(/ui-pdp-price__second-line[\s\S]*?andes-money-amount__fraction[^"']*["']>([\d.,]+)<\/span>/i);
      if (mlSecondLineMatch && mlSecondLineMatch[1]) {
        const frac = mlSecondLineMatch[1].replace(/\./g, '');
        const centsMatch = mlSecondLineMatch[0].match(/andes-money-amount__cents[^"']*["']>(\d{2})<\/span>/i);
        const cents = centsMatch ? centsMatch[1] : '00';
        const num = parseFloat(`${frac}.${cents}`);
        if (!isNaN(num) && num > 0) {
          extractedPrice = formatBRL(num);
        }
      }
    }

    if (!extractedPrice) {
      const mlFractionMatch = html.match(/class=["'][^"']*andes-money-amount__fraction[^"']*["']>([\d.,]+)<\/span>/i);
      if (mlFractionMatch && mlFractionMatch[1]) {
        const frac = mlFractionMatch[1].replace(/\./g, '');
        const mlCentsMatch = html.match(/class=["'][^"']*andes-money-amount__cents[^"']*["']>(\d{2})<\/span>/i);
        const cents = mlCentsMatch ? mlCentsMatch[1] : '00';
        const num = parseFloat(`${frac}.${cents}`);
        if (!isNaN(num) && num > 0) {
          extractedPrice = formatBRL(num);
        }
      }
    }

    // Mercado Livre: Preço Original anterior (andes-money-amount--previous)
    if (!extractedOriginalPrice) {
      const mlPrevMatch = html.match(/andes-money-amount--previous[\s\S]*?andes-money-amount__fraction[^"']*["']>([\d.,]+)<\/span>/i);
      if (mlPrevMatch && mlPrevMatch[1]) {
        const frac = mlPrevMatch[1].replace(/\./g, '');
        const num = parseFloat(frac);
        if (!isNaN(num) && num > 0) {
          extractedOriginalPrice = formatBRL(num);
        }
      }
    }

    // 4. Amazon: .priceToPay ou #corePrice_feature_div ou .a-offscreen
    if (!extractedPrice) {
      const amzPriceMatch = html.match(/class=["'][^"']*(?:priceToPay|apexPriceToPay)[^"']*["'][\s\S]*?class=["'][^"']*a-offscreen[^"']*["']>\s*R\$\s*([\d.,]+)\s*<\/span>/i)
        || html.match(/class=["'][^"']*a-offscreen[^"']*["']>\s*R\$\s*([\d.,]+)\s*<\/span>/i);
      if (amzPriceMatch && amzPriceMatch[1]) {
        const pNum = parsePriceToNumber(amzPriceMatch[1]);
        if (pNum && pNum > 0) {
          extractedPrice = formatBRL(pNum);
        }
      }
    }

    // Amazon: Preço Original (.basisPrice ou .a-text-price)
    if (!extractedOriginalPrice) {
      const amzOrigMatch = html.match(/class=["'][^"']*(?:basisPrice|a-text-price)[^"']*["'][\s\S]*?class=["'][^"']*a-offscreen[^"']*["']>\s*R\$\s*([\d.,]+)\s*<\/span>/i);
      if (amzOrigMatch && amzOrigMatch[1]) {
        const hNum = parsePriceToNumber(amzOrigMatch[1]);
        if (hNum && hNum > 0) {
          extractedOriginalPrice = formatBRL(hNum);
        }
      }
    }

    // 5. Shopee: price em centavos ou JSON da página
    if (!extractedPrice) {
      const shopeeJsonPrice = html.match(/["']price["']\s*:\s*(\d{7,10})\b/);
      if (shopeeJsonPrice && shopeeJsonPrice[1]) {
        const inUnits = parseInt(shopeeJsonPrice[1], 10) / 100000;
        if (!isNaN(inUnits) && inUnits > 0) {
          extractedPrice = formatBRL(inUnits);
        }
      }
    }

    // 6. Magalu e Genéricos: data-testid="price-value" ou regex R$
    if (!extractedPrice) {
      const generalRMatch = html.match(/data-testid=["'](?:price-value|price-default|heading-price)["'][^>]*>\s*R\$\s*([\d.,]+)/i)
        || html.match(/["'](?:price|salePrice|currentPrice|offerPrice)["']\s*:\s*["']?(\d+(?:\.\d{1,2})?)["']?/i);
      if (generalRMatch && generalRMatch[1]) {
        const pNum = parsePriceToNumber(generalRMatch[1]);
        if (pNum && pNum > 0) {
          extractedPrice = formatBRL(pNum);
        }
      }
    }

    // Magalu: Preço Original
    if (!extractedOriginalPrice) {
      const magaluOrig = html.match(/data-testid=["'](?:price-original|original-price)["'][^>]*>\s*R\$\s*([\d.,]+)/i);
      if (magaluOrig && magaluOrig[1]) {
        const hNum = parsePriceToNumber(magaluOrig[1]);
        if (hNum && hNum > 0) {
          extractedOriginalPrice = formatBRL(hNum);
        }
      }
    }

    // 7. Regex de Fallback em Descrições (ex: "de R$ 598 por apenas R$ 197,22")
    if (!extractedPrice) {
      const descPriceMatch = html.match(/(?:por|apenas|oferta)\s*:?\s*R\$\s*([\d]{1,3}(?:\.[\d]{3})*,\d{2}|\d+,\d{2})/i);
      if (descPriceMatch && descPriceMatch[1]) {
        const pNum = parsePriceToNumber(descPriceMatch[1]);
        if (pNum && pNum > 0) {
          extractedPrice = formatBRL(pNum);
        }
      }
    }

    // Extrai tag <h1> do produto
    if (!pageTitle) {
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1Match && h1Match[1]) {
        const rawH1 = h1Match[1].replace(/<[^>]+>/g, '').trim();
        const cleanedH1 = cleanProductTitle(rawH1);
        if (cleanedH1 && cleanedH1.length > 5 && !/algo deu errado|n[aã]o encontrado|404|login/i.test(cleanedH1)) {
          pageTitle = cleanedH1;
        }
      }
    }

    // Extrai og:title
    if (!pageTitle) {
      const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) 
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
      if (ogTitleMatch && ogTitleMatch[1]) {
        const cleanedOg = cleanProductTitle(ogTitleMatch[1]);
        if (cleanedOg && cleanedOg.length > 5 && !/algo deu errado|n[aã]o encontrado|robot check/i.test(cleanedOg)) {
          pageTitle = cleanedOg;
        }
      }
    }

    // Extrai <title>
    if (!pageTitle) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        const cleanedTitle = cleanProductTitle(titleMatch[1]);
        if (cleanedTitle && cleanedTitle.length > 5 && !/algo deu errado|n[aã]o encontrado|robot check|404/i.test(cleanedTitle)) {
          pageTitle = cleanedTitle;
        }
      }
    }

    // Extrai og:description
    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    if (ogDescMatch && ogDescMatch[1] && !metaDescription) {
      metaDescription = ogDescMatch[1].trim();
    }

    // Extrai og:image
    if (!ogImage) {
      const ogImgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
      if (ogImgMatch && ogImgMatch[1] && /^https?:\/\//i.test(ogImgMatch[1])) {
        ogImage = ogImgMatch[1];
      }
    }
  } catch (scrapeErr) {
    // Timeout ou erro de conexão tolerado
  }

  return {
    resolvedUrl,
    pageTitle,
    metaDescription,
    ogImage,
    slugTitle,
    extractedPrice,
    extractedOriginalPrice
  };
}

// Classificador inteligente de nicho do produto
function classifyProduct(allText: string): ProductType {
  const t = allText.toLowerCase();

  // Relógios e Smartwatches (prioridade máxima se contiver palavras de relógio)
  if (/\b(rel[oó]gio|smartwatch|smart[ -]?band|watch|pulso|cron[oó]grafo|inviolavel|technos|casio|amazfit|galaxy watch|apple watch|g-shock|invicta|mormaii|mi band|garmin|fitbit|smart watch)\b/i.test(t)) {
    return 'WATCH';
  }

  // Fones e Áudio
  if (/\b(fone|fones|headphone|headset|earphone|airpods|caixa de som|bluetooth speaker|jbl|som port[aá]til|earbuds|caixinha de som)\b/i.test(t)) {
    return 'AUDIO';
  }

  // Periféricos e Informática
  if (/\b(teclado|mouse|monitor|gabinete|switch mec[aâ]nico|mousepad|webcam|computador|notebook|ssd|placa de v[ií]deo)\b/i.test(t)) {
    return 'PERIPHERAL';
  }

  // Cozinha e Casa Inteligente
  if (/\b(fritadeira|air[ -]?fryer|cafeteira|liquidificador|panela el[eé]trica|rob[oô] aspirador|aspirador|l[aâ]mpada inteligente)\b/i.test(t)) {
    return 'KITCHEN';
  }

  // Televisores / Smart TVs
  if (/\b(smart[ -]?tv|televis[aã]o|televisor|\btv\b|oled|qled|roku tv|ambilight|neo qled)\b/i.test(t)) {
    return 'TV';
  }

  // Smartphones e Celulares
  if (/\b(celular|smartphone|iphone|galaxy s|redmi|poco|motorola edge|xiaomi)\b/i.test(t)) {
    return 'SMARTPHONE';
  }

  return 'GENERAL';
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Geradores Especializados por Nicho
function buildWatchData(titleHint: string, store: string, ogImage?: string, priceHint?: string, originalPriceHint?: string) {
  const cleanTitle = (titleHint && titleHint.length > 5 && !/^(magazine|loja|afiliad)/i.test(titleHint))
    ? titleHint.charAt(0).toUpperCase() + titleHint.slice(1)
    : 'Relógio Inteligente Smartwatch com Tela AMOLED e Monitor Cardíaco';

  const slug = generateSlug(cleanTitle) || 'relogio-smartwatch-inteligente';
  const priceCurrent = priceHint || 'R$ 197,22';
  const priceOriginal = originalPriceHint || 'R$ 299,00';
  const autoDiscount = calculateDiscountHelper(priceCurrent, priceOriginal);

  return {
    title: cleanTitle,
    slug,
    subtitle: 'Análise detalhada de precisão de sensores cardíacos, resistência à água 5 ATM e bateria de até 14 dias.',
    category: 'Relógios & Smartwatches',
    coverImage: ogImage || '/src/assets/images/review_smartwatch_1792358371097.jpg',
    partnerStore: store,
    priceCurrent,
    priceOriginal,
    discountPercent: autoDiscount?.label || '',
    pros: [
      'Bateria com autonomia duradoura de até 14 dias em uso diário moderado',
      'Tela AMOLED nítida com ótima legibilidade mesmo sob luz solar forte',
      'Monitoramento contínuo de frequência cardíaca, oxímetro SpO2 e qualidade do sono',
      'Resistência à água com certificação para uso em treinos, chuva e natação'
    ],
    cons: [
      'Histórico completo de métricas corporais exige manter o aplicativo sincronizado diariamente',
      'Modelos de entrada realizam controle de músicas mas não armazenam faixas para reprodução offline'
    ],
    specifications: [
      { label: 'Tela', value: '1.43 polegadas AMOLED tátil de alta definição (466x466 pixels)' },
      { label: 'Resistência à Água', value: '5 ATM / 50 metros (próprio para natação e chuva)' },
      { label: 'Autonomia da Bateria', value: 'Até 14 dias em uso típico ou 7 dias em uso intenso' },
      { label: 'Sensores de Saúde', value: 'Monitor cardíaco contínuo, oxímetro SpO2, acelerômetro e sono' },
      { label: 'Conectividade', value: 'Bluetooth 5.3 com notificações inteligentes de WhatsApp e chamadas' },
      { label: 'Pulseira', value: 'Silicone esportivo hipoalergênico e substituível de 22 mm' },
      { label: 'Compatibilidade', value: 'Celulares Android e iPhone com aplicativo totalmente em português' },
      { label: 'Garantia', value: '12 meses oficial de fábrica com nota fiscal' }
    ],
    content: `### Design Ergonômico e Conforto no Pulso\n\nO relógio se destaca pelo acabamento sofisticado e caixa leve, que se ajusta com naturalidade ao contorno do braço. A pulseira macia não acumula suor durante treinos intensos e garante conforto até mesmo na hora de dormir para o rastreamento do sono.\n\n### Recursos de Notificações e Saúde\n\nAo ser pareado com o celular via Bluetooth, ele exibe mensagens do WhatsApp, identificação de chamadas e lembretes com vibração silenciosa. Os sensores monitoram batimentos cardíacos e níveis de oxigênio no sangue de maneira estável e constante.\n\n### Autonomia de Bateria e Veredito\n\nA bateria surpreende pela longevidade, dispensando recargas diárias e suportando até duas semanas de uso regular. É uma escolha certeira para quem busca praticidade e vida saudável sem pagar preços inflacionados.`,
    verdict: 'Uma recomendação excelente de compra. Reúne beleza estética, ótima visibilidade de tela e sensores de saúde precisos por uma fração do preço dos relógios tradicionais.',
    scoreCostBenefit: 4.9,
    scorePerformance: 4.8,
    scoreBuild: 4.8,
    scoreUsability: 4.9,
    faqs: [
      { question: 'O relógio é compatível com celulares Android e iPhone?', answer: 'Sim, funciona perfeitamente em aparelhos Android e iOS através de aplicativo gratuito disponível na loja oficial em português.' },
      { question: 'Posso tomar banho e nadar usando o relógio?', answer: 'Sim, a vedação e certificação à prova d água protegem contra suor, respingos, chuva e natação rasa.' },
      { question: 'O produto acompanha nota fiscal e garantia?', answer: 'Sim, as compras realizadas pelos links das lojas oficiais parceiras acompanham nota fiscal eletrônica e garantia oficial de fábrica.' }
    ]
  };
}

function buildTvData(titleHint: string, store: string, ogImage?: string, priceHint?: string, originalPriceHint?: string) {
  const cleanTitle = (titleHint && titleHint.length > 5 && !/^(magazine|loja|afiliad)/i.test(titleHint))
    ? titleHint.charAt(0).toUpperCase() + titleHint.slice(1)
    : 'Smart TV 50 Polegadas 4K UHD com HDR10+ e Comando de Voz';

  const slug = generateSlug(cleanTitle) || 'smart-tv-50-polegadas-4k';
  const priceCurrent = priceHint || 'R$ 2.199,00';
  const priceOriginal = originalPriceHint || 'R$ 2.899,00';
  const autoDiscount = calculateDiscountHelper(priceCurrent, priceOriginal);

  return {
    title: cleanTitle,
    slug,
    subtitle: 'Painel 4K com cores vibrantes, sistema rápido para streaming e som imersivo.',
    category: 'Tecnologia & Dispositivos',
    coverImage: ogImage || '/src/assets/images/review_smart_tv_1792358384274.jpg',
    partnerStore: store,
    priceCurrent,
    priceOriginal,
    discountPercent: autoDiscount?.label || '',
    pros: [
      'Resolução 4K UHD nítida com suporte a HDR10+ para cores vivas e pretos profundos',
      'Sistema operacional rápido com inicialização instantânea dos principais aplicativos',
      'Controle remoto inteligente com botões de atalho dedicados e comando de voz',
      'Bordas ultrafinas que ampliam a sensação de imersão visual na sala'
    ],
    cons: [
      'Áudio integrado atende bem no dia a dia, mas uma soundbar eleva a experiência para filmes de ação',
      'Base de apoio exige rack com largura adequada'
    ],
    specifications: [
      { label: 'Tamanho da Tela', value: '50 polegadas (Diagonal visual de 127 cm)' },
      { label: 'Resolução', value: '4K Ultra HD (3840 x 2160 pixels)' },
      { label: 'HDR', value: 'HDR10+ e HLG para alto alcance dinâmico' },
      { label: 'Conexões', value: '3x HDMI 2.1, 2x USB, Wi-Fi 5GHz e Bluetooth' },
      { label: 'Áudio', value: '20W RMS com decodificador Dolby Digital' },
      { label: 'Garantia', value: '12 meses oficial com atendimento em domicílio' }
    ],
    content: `### Qualidade de Imagem e Cores\n\nO painel entrega excelente fidelidade visual com nitidez apurada até mesmo em transmissões de esportes ou cenas escuras de cinema. O processador faz um trabalho exemplar no dimensionamento de conteúdos mais antigos.\n\n### Sistema Operacional e Navegação\n\nA interface responde com velocidade aos comandos, sem travamentos entre Netflix, YouTube, Prime Video e canais ao vivo. O controle remoto simplifica a vida de toda a família.\n\n### Design e Acabamento\n\nCom perfil fino e acabamento traseiro limpo com canaletas para organização dos cabos, a televisão se integra harmonicamente a qualquer ambiente.`,
    verdict: 'Uma das melhores opções do mercado para renovar a sala com qualidade de cinema sem comprometer o orçamento.',
    scoreCostBenefit: 4.8,
    scorePerformance: 4.8,
    scoreBuild: 4.7,
    scoreUsability: 4.9,
    faqs: [
      { question: 'A televisão é bivolt?', answer: 'Sim, alimentação automática bivolt (110V - 220V).' },
      { question: 'Permite fixação em suporte de parede articulado?', answer: 'Sim, possui furação com padrão universal VESA.' }
    ]
  };
}

function buildAudioData(titleHint: string, store: string, ogImage?: string, priceHint?: string, originalPriceHint?: string) {
  const cleanTitle = (titleHint && titleHint.length > 5 && !/^(magazine|loja|afiliad)/i.test(titleHint))
    ? titleHint.charAt(0).toUpperCase() + titleHint.slice(1)
    : 'Fone de Ouvido Sem Fio com Cancelamento Ativo de Ruído e Alta Definição';

  const slug = generateSlug(cleanTitle) || 'fone-sem-fio-cancelamento-ruido';
  const priceCurrent = priceHint || 'R$ 29,90';
  const priceOriginal = originalPriceHint || 'R$ 59,90';
  const autoDiscount = calculateDiscountHelper(priceCurrent, priceOriginal);

  return {
    title: cleanTitle,
    slug,
    subtitle: 'Isolamento acústico avançado, drivers dinâmicos com graves potentes e até 60h de bateria.',
    category: 'Áudio & Fones',
    coverImage: ogImage || '/src/assets/images/review_anc_headphones_1792355762654.jpg',
    partnerStore: store,
    priceCurrent,
    priceOriginal,
    discountPercent: autoDiscount?.label || '',
    pros: [
      'Cancelamento ativo de ruído híbrido que atenua zumbidos de trânsito e escritório',
      'Bateria com autonomia excepcional de até 60 horas de reprodução contínua',
      'Almofadas com espuma com memória que abraçam a orelha com maciez',
      'Conexão multiponto para alternar entre o computador e o smartphone automaticamente'
    ],
    cons: [
      'Microfone externo em locais abertos pode captar sopros de vento forte',
      'Estojo de transporte rígido ocupa volume considerável na mochila'
    ],
    specifications: [
      { label: 'Drivers de Áudio', value: '40 mm de alta resolução acústica' },
      { label: 'Cancelamento de Ruído', value: 'ANC Híbrido com atenuação de até -35dB' },
      { label: 'Autonomia da Bateria', value: 'Até 60 horas (ANC desligado) ou 45 horas (ANC ligado)' },
      { label: 'Conectividade', value: 'Bluetooth 5.3 com pareamento rápido e cabo P2 3.5mm incluso' },
      { label: 'Recarga Rápida', value: '10 minutos de carga rápida rendem até 5 horas de reprodução' },
      { label: 'Garantia', value: '12 meses oficial do fabricante' }
    ],
    content: `### Isolamento e Qualidade Sonora\n\nO cancelamento ativo de ruído surpreende ao filtrar o burburinho de escritórios e ruídos constantes de transporte. O som entrega equilíbrio com agudos cristalinos e graves presentes sem distorção.\n\n### Conforto Durante Todo o Dia\n\nA tiara acolchoada distribui o peso de forma equilibrada, sem exercer pressão desconfortável sobre a cabeça mesmo durante turnos inteiros de trabalho.\n\n### Autonomia e Conectividade\n\nA bateria para 60 horas dispensa a necessidade de recargas semanais frequentes. A conexão dupla mantém o usuário conectado ao notebook e ao celular simultaneamente.`,
    verdict: 'Uma recomendação imbatível para quem busca foco, produtividade e som de alto nível com excelente relação custo-benefício.',
    scoreCostBenefit: 4.9,
    scorePerformance: 4.8,
    scoreBuild: 4.9,
    scoreUsability: 4.8,
    faqs: [
      { question: 'Funciona com fio se a bateria esgotar?', answer: 'Sim, acompanha cabo de áudio P2 de 3,5 mm para uso mesmo sem bateria.' },
      { question: 'É compatível com chamadas de WhatsApp e reuniões online?', answer: 'Sim, possui microfones integrados com cancelamento de eco perfeitos para videochamadas.' }
    ]
  };
}

function buildPeripheralData(titleHint: string, store: string, ogImage?: string, priceHint?: string, originalPriceHint?: string) {
  const cleanTitle = (titleHint && titleHint.length > 5 && !/^(magazine|loja|afiliad)/i.test(titleHint))
    ? titleHint.charAt(0).toUpperCase() + titleHint.slice(1)
    : 'Teclado Mecânico Sem Fio Conexão Tripla com Amortecimento Acústico';

  const slug = generateSlug(cleanTitle) || 'teclado-mecanico-sem-fio';
  const priceCurrent = priceHint || 'R$ 449,90';
  const priceOriginal = originalPriceHint || 'R$ 599,00';
  const autoDiscount = calculateDiscountHelper(priceCurrent, priceOriginal);

  return {
    title: cleanTitle,
    slug,
    subtitle: 'Switches silenciosos lubrificados, layout ergonômico e acabamento premium para produtividade.',
    category: 'Informática & Periféricos',
    coverImage: ogImage || '/src/assets/images/review_mechanical_keyboard_1792355762298.jpg',
    partnerStore: store,
    priceCurrent,
    priceOriginal,
    discountPercent: autoDiscount?.label || '',
    pros: [
      'Acionamento suave e silencioso perfeito para escritórios compartilhados e digitação prolongada',
      'Conexão tri-modo (Sem fio 2.4GHz, Bluetooth e Cabo Tipo-C) com alternância ágil',
      'Teclas em polímero resistente que não desgastam nem perdem a textura fosca',
      'Bateria interna recarregável que suporta semanas de produtividade sem cabo'
    ],
    cons: [
      'Peso robusto que favorece a estabilidade na mesa mas é menos portátil na mochila',
      'Software de customização de atalhos disponível principalmente para Windows'
    ],
    specifications: [
      { label: 'Tipo de Switch', value: 'Mecânico linear pré-lubrificado com amortecimento em silicone' },
      { label: 'Conexões', value: 'Sem fio 2.4GHz com adaptador USB, Bluetooth 5.0 e Cabo USB-C' },
      { label: 'Bateria', value: '4000 mAh recarregável com autonomia de até 200 horas' },
      { label: 'Layout', value: 'ABNT2 com teclas de perfil anatômico' },
      { label: 'Compatibilidade', value: 'Windows, macOS, Linux, Android e iPadOS' },
      { label: 'Garantia', value: '12 meses oficial com nota fiscal' }
    ],
    content: `### Experiência de Digitação e Ergonomia\n\nO toque nas teclas é macio e previsível, proporcionando conforto muscular após horas seguidas de trabalho ou estudo. As camadas de amortecimento interno absorvem o impacto das teclas, gerando um som suave e encorpado.\n\n### Conectividade Sem Fios e Produtividade\n\nA transição entre computador de trabalho e tablet pessoal se dá com um único atalho de tecla. A resposta via rádio 2.4GHz é imediata e sem atrasos.\n\n### Durabilidade e Construção\n\nA estrutura transmite firmeza sólida sobre a mesa, evitando qualquer flexão durante o uso intenso.`,
    verdict: 'O upgrade ideal para quem passa o dia trabalhando no computador e deseja maior precisão, conforto e estética no espaço de trabalho.',
    scoreCostBenefit: 4.9,
    scorePerformance: 4.8,
    scoreBuild: 4.9,
    scoreUsability: 4.9,
    faqs: [
      { question: 'Funciona perfeitamente em computadores Apple Mac?', answer: 'Sim, suporta macOS nativamente com teclas de comando dedicadas.' }
    ]
  };
}

function buildKitchenData(titleHint: string, store: string, ogImage?: string, priceHint?: string, originalPriceHint?: string) {
  const cleanTitle = (titleHint && titleHint.length > 5 && !/^(magazine|loja|afiliad)/i.test(titleHint))
    ? titleHint.charAt(0).toUpperCase() + titleHint.slice(1)
    : 'Fritadeira Elétrica Inteligente com Visor Frontal Transparente';

  const slug = generateSlug(cleanTitle) || 'fritadeira-eletrica-inteligente';
  const priceCurrent = priceHint || 'R$ 389,90';
  const priceOriginal = originalPriceHint || 'R$ 529,00';
  const autoDiscount = calculateDiscountHelper(priceCurrent, priceOriginal);

  return {
    title: cleanTitle,
    slug,
    subtitle: 'Capacidade ampla de 6 litros, circulação de ar 360° e cesto com iluminação interna.',
    category: 'Casa Inteligente',
    coverImage: ogImage || '/src/assets/images/review_smart_airfryer_1792355763307.jpg',
    partnerStore: store,
    priceCurrent,
    priceOriginal,
    discountPercent: autoDiscount?.label || '',
    pros: [
      'Visor transparente com lâmpada interna que permite ver o alimento sem abrir o cesto',
      'Cesto amplo de 6 litros que prepara porções familiares de uma única vez',
      'Revestimento cerâmico antiaderente de fácil limpeza',
      'Controle preciso de temperatura e receitas pré-programadas de um toque'
    ],
    cons: [
      'Dimensões generosas que exigem espaço dedicado na bancada da cozinha',
      'Cabo de energia padrão de 1 metro'
    ],
    specifications: [
      { label: 'Capacidade', value: '6 Litros de espaço útil' },
      { label: 'Potência', value: '1800W com aquecimento por convecção 360°' },
      { label: 'Temperatura', value: 'De 80°C a 200°C com controle digital' },
      { label: 'Timer', value: 'Temporizador sonoro de até 60 minutos com desligamento automático' },
      { label: 'Cesto', value: 'Antiaderente cerâmico lavável em lava-louças' },
      { label: 'Garantia', value: '12 meses oficial do fabricante' }
    ],
    content: `### Praticidade do Visor Transparente\n\nO grande trunfo é poder acompanhar o ponto de douramento dos alimentos sem interromper o fluxo de calor. Isso economiza energia e resulta em alimentos mais crocantes.\n\n### Desempenho e Capacidade na Cozinha\n\nCom 1800W de potência e capacidade espaçosa de 6 litros, assa batatas, carnes e legumes com rapidez e textura uniforme sem necessidade de óleo.\n\n### Facilidade de Limpeza\n\nO cesto com revestimento antiaderente cerâmico não gruda resíduos e pode ser lavado facilmente com esponja macia ou colocado diretamente na lava-louças.`,
    verdict: 'Uma das aquisições mais vantajosas para quem quer economizar tempo e ter uma rotina alimentar mais saudável e rápida.',
    scoreCostBenefit: 4.8,
    scorePerformance: 4.9,
    scoreBuild: 4.7,
    scoreUsability: 5.0,
    faqs: [
      { question: 'Pode ir na máquina de lavar louças?', answer: 'Sim, o cesto e a grelha interna são 100% compatíveis com lava-louças convencionais.' }
    ]
  };
}

function buildGeneralData(titleHint: string, store: string, categoryName: string, ogImage?: string, priceHint?: string, originalPriceHint?: string) {
  const cleanTitle = (titleHint && titleHint.length > 5 && !/^(magazine|loja|afiliad)/i.test(titleHint))
    ? titleHint.charAt(0).toUpperCase() + titleHint.slice(1)
    : 'Produto Selecionado com Alta Classificação e Custo-Benefício';

  const slug = generateSlug(cleanTitle) || 'produto-selecionado';
  const priceCurrent = priceHint || 'R$ 299,90';
  const priceOriginal = originalPriceHint || 'R$ 399,00';
  const autoDiscount = calculateDiscountHelper(priceCurrent, priceOriginal);

  return {
    title: cleanTitle,
    slug,
    subtitle: 'Análise aprofundada de custo-benefício, acabamento e principais recursos no uso diário.',
    category: categoryName || 'Tecnologia & Dispositivos',
    coverImage: ogImage || '/src/assets/images/hero_tech_showcase_1792355762010.jpg',
    partnerStore: store,
    priceCurrent,
    priceOriginal,
    discountPercent: autoDiscount?.label || '',
    pros: [
      'Excelente relação de custo-benefício em comparação com concorrentes diretos',
      'Construção robusta com materiais duráveis e acabamento refinado',
      'Fácil configuração e compatibilidade ampla sem necessidade de adaptadores',
      'Operação silenciosa e eficiente no uso prolongado'
    ],
    cons: [
      'Manual de instruções poderia ser mais detalhado em português',
      'Disponibilidade de cores adicionais pode variar conforme o estoque'
    ],
    specifications: [
      { label: 'Garantia', value: '12 meses oficial com suporte nacional' },
      { label: 'Conectividade', value: 'Padrão moderno de alta velocidade' },
      { label: 'Conteúdo da Embalagem', value: 'Aparelho principal, acessórios de conexão e guia rápido' }
    ],
    content: `### Primeiras Impressões e Acabamento\n\nLogo ao abrir a embalagem, o produto transmite solidez e cuidado no projeto. As conexões são firmes e o design combina perfeitamente com qualquer ambiente moderno.\n\n### Desempenho e Testes Práticos\n\nNos nossos testes diários, as funcionalidades atenderam com extrema estabilidade. A resposta aos comandos é rápida e não houve qualquer sinal de superaquecimento ou perda de sinal.\n\n### Relação Custo-Benefício\n\nPelo valor praticado na oferta atual, trata-se de uma das opções mais equilibradas da categoria.`,
    verdict: 'Uma recomendação sólida e segura de compra. Cumpre com maestria o que promete e apresenta excelente índice de satisfação entre os compradores.',
    scoreCostBenefit: 4.8,
    scorePerformance: 4.8,
    scoreBuild: 4.7,
    scoreUsability: 4.8,
    faqs: [
      { question: 'O produto é original e possui garantia?', answer: 'Sim, todos os links indicados levam a vendedores oficiais e autorizados com garantia total de 12 meses.' }
    ]
  };
}

// Endpoint para identificação e autopreenchimento inteligente de produtos
app.post('/api/analyze-product', async (req: Request, res: Response) => {
  try {
    const { input } = req.body;

    if (!input || typeof input !== 'string') {
      res.status(400).json({ error: 'O link ou nome do produto é obrigatório.' });
      return;
    }

    const trimmedInput = input.trim();
    const isUrl = /^https?:\/\//i.test(trimmedInput);

    // 1. Identifica loja
    const detectedStore = detectStore(trimmedInput);

    // 2. Se for URL, faz raspagem prévia de metadados reais livres de afiliados
    let pageTitle = '';
    let metaDescription = '';
    let ogImage = '';
    let slugTitle = '';
    let extractedPrice = '';
    let extractedOriginalPrice = '';
    let resolvedUrl = trimmedInput;

    if (isUrl) {
      const scraped = await scrapeUrlMetadata(trimmedInput);
      pageTitle = scraped.pageTitle;
      metaDescription = scraped.metaDescription;
      ogImage = scraped.ogImage;
      slugTitle = scraped.slugTitle;
      resolvedUrl = scraped.resolvedUrl;
      extractedPrice = scraped.extractedPrice;
      extractedOriginalPrice = scraped.extractedOriginalPrice;
    }

    // Compila sinais de texto limpos (sem repetição de links)
    const combinedSignals = [
      trimmedInput,
      slugTitle,
      pageTitle,
      metaDescription
    ].join(' ');

    // 3. Classifica o nicho com rigor para evitar confusão de categorias
    const productType = classifyProduct(combinedSignals);

    // Determina o nome mais limpo do produto (nunca nome de loja de afiliado)
    let titleHint = '';
    if (pageTitle && pageTitle.length > 4 && !/^(magazine|loja|vitrine|espa[cç]o)\s+[a-z0-9_-]+/i.test(pageTitle)) {
      titleHint = cleanProductTitle(pageTitle);
    } else if (slugTitle && slugTitle.length > 4) {
      titleHint = cleanProductTitle(slugTitle);
    } else if (!isUrl) {
      titleHint = cleanProductTitle(trimmedInput);
    }

    // Se o titleHint estiver vazio ou for nome de loja, usa padrão pelo nicho
    if (!titleHint || /^(magazine|loja|vitrine|espa[cç]o)\s+[a-z0-9_-]+/i.test(titleHint)) {
      if (productType === 'WATCH') titleHint = 'Relógio Inteligente Smartwatch com Tela AMOLED e Monitor Cardíaco';
      else if (productType === 'TV') titleHint = 'Smart TV 50 Polegadas 4K UHD com HDR10+';
      else if (productType === 'AUDIO') titleHint = 'Fone de Ouvido Sem Fio com Cancelamento Ativo de Ruído';
      else if (productType === 'PERIPHERAL') titleHint = 'Teclado Mecânico Sem Fio Conexão Tripla';
      else if (productType === 'KITCHEN') titleHint = 'Fritadeira Elétrica Inteligente com Visor';
      else titleHint = 'Produto Selecionado com Alta Classificação';
    }

    // 4. Se tiver chave Gemini, tenta enriquecer mantendo a categoria estrita e dados limpos
    if (apiKey) {
      try {
        const categoryInstruction = productType === 'WATCH' 
          ? 'ESTE PRODUTO É RIGOROSAMENTE UM RELÓGIO / SMARTWATCH. NUNCA classifique como TV, eletrodoméstico ou outro item. As especificações DEVEM ser de relógio (resistência à água 5 ATM, bateria em dias, tela AMOLED, sensores de batimento/SpO2 e pulseira).'
          : productType === 'TV'
          ? 'ESTE PRODUTO É UMA SMART TV / TELEVISÃO. Gere dados específicos de TV (resolução 4K, polegadas, HDR, HDMI).'
          : productType === 'AUDIO'
          ? 'ESTE PRODUTO É UM FONE DE OUVIDO / ÁUDIO. Gere dados de fones (ANC cancelamento de ruído, bateria em horas, drivers).'
          : productType === 'PERIPHERAL'
          ? 'ESTE PRODUTO É UM PERIFÉRICO / INFORMÁTICA (teclado, mouse ou monitor).'
          : productType === 'KITCHEN'
          ? 'ESTE PRODUTO É UM ELETRODOMÉSTICO / CASA (fritadeira, air fryer, cafeteira ou robô).'
          : 'Identifique o produto real com base no título e na loja.';

        const prompt = `
Você é um redator sênior especializado em e-commerce e resenhas de produtos no Brasil.
Analise os dados deste produto:
- Entrada do usuário: "${trimmedInput}"
- Título extraído do produto: "${titleHint}"
- Descrição da loja: "${metaDescription}"
- Loja parceira: "${detectedStore}"
${extractedPrice ? `- Preço real anunciado extraído: "${extractedPrice}"` : ''}
${extractedOriginalPrice ? `- Preço original sem desconto extraído: "${extractedOriginalPrice}"` : ''}

REGRAS OBRIGATÓRIAS:
1. ${categoryInstruction}
2. O "title" DEVE ser o NOME REAL DO PRODUTO (ex: "Relógio Smartwatch D20 Bluetooth"). NUNCA coloque nomes de lojas de afiliados como "Magazine Fulano", "Loja do João", "Vitrine Ofertas".
3. NUNCA use termos em inglês como "OFF", "Setup", "Gadgets", "Wireless", "Features". Use apenas termos naturais em português do Brasil.
4. O link de afiliado original informado pelo usuário DEVE ser mantido integralmente.
5. PREÇOS REAIS:
${extractedPrice ? `   - Use OBRIGATORIAMENTE "${extractedPrice}" no campo "priceCurrent".` : '   - Pesquise ou forneça o preço real atual de mercado no Brasil no formato "R$ XX,XX".'}
${extractedOriginalPrice ? `   - Use OBRIGATORIAMENTE "${extractedOriginalPrice}" no campo "priceOriginal".` : '   - Forneça o preço de tabela original sem desconto no formato "R$ XX,XX".'}
   - O campo "discountPercent" deve refletir com exatidão matemática o desconto percentual real: ((priceOriginal - priceCurrent) / priceOriginal) * 100.
6. NÃO inclua campos de cupons de desconto.

Retorne EXCLUSIVAMENTE um objeto JSON válido:
{
  "title": "Título comercial do produto em português (máx 80 caracteres)",
  "slug": "url-amigavel-do-produto-em-letras-minusculas",
  "subtitle": "Subtítulo explicativo com principal benefício (1 a 2 frases)",
  "category": "${
    productType === 'WATCH' ? 'Relógios & Smartwatches' :
    productType === 'TV' ? 'Tecnologia & Dispositivos' :
    productType === 'AUDIO' ? 'Áudio & Fones' :
    productType === 'PERIPHERAL' ? 'Informática & Periféricos' :
    productType === 'KITCHEN' ? 'Casa Inteligente' : 'Tecnologia & Dispositivos'
  }",
  "partnerStore": "${detectedStore}",
  "priceCurrent": "${extractedPrice || 'R$ 299,90'}",
  "priceOriginal": "${extractedOriginalPrice || 'R$ 399,00'}",
  "discountPercent": "Percentual calculado em português (ex: '25% de desconto')",
  "pros": ["Ponto positivo 1", "Ponto positivo 2", "Ponto positivo 3", "Ponto positivo 4"],
  "cons": ["Ponto de atenção 1", "Ponto de atenção 2"],
  "specifications": [
    {"label": "Especificação 1", "value": "Valor detalhado"},
    {"label": "Especificação 2", "value": "Valor detalhado"},
    {"label": "Especificação 3", "value": "Valor detalhado"},
    {"label": "Garantia", "value": "12 meses oficial de fábrica"}
  ],
  "content": "Artigo estruturado em seções '### Design e Conforto', '### Recursos e Desempenho' e '### Bateria e Usabilidade'. Escreva 3 parágrafos em português.",
  "verdict": "Veredito direto sobre o custo-benefício.",
  "scoreCostBenefit": 4.9,
  "scorePerformance": 4.8,
  "scoreBuild": 4.8,
  "scoreUsability": 4.9,
  "faqs": [
    {"question": "Pergunta comum 1?", "answer": "Resposta detalhada 1"},
    {"question": "Pergunta comum 2?", "answer": "Resposta detalhada 2"}
  ]
}
`;

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout Gemini')), 5000)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        const text = response.text || '';
        const parsed = JSON.parse(text);

        // Limpeza de segurança no título gerado pelo Gemini
        parsed.title = cleanProductTitle(parsed.title || titleHint);

        // Se extraímos preços reais do e-commerce, garanta a prioridade absoluta deles
        if (extractedPrice) {
          parsed.priceCurrent = extractedPrice;
        }
        if (extractedOriginalPrice) {
          parsed.priceOriginal = extractedOriginalPrice;
        }

        // Recalcula o desconto com precisão matemática estrita
        const calculatedDisc = calculateDiscountHelper(parsed.priceCurrent, parsed.priceOriginal);
        parsed.discountPercent = calculatedDisc?.label || '';

        // Remove quaisquer menções a cupons
        delete parsed.couponCode;
        delete parsed.couponDiscount;

        // Validação anti-alucinação: se o usuário cadastrou relógio, Gemini NUNCA pode ter devolvido TV!
        const parsedText = (parsed.title + ' ' + parsed.category + ' ' + (parsed.verdict || '')).toLowerCase();
        const isWatchInput = productType === 'WATCH';
        const hallucinatedTv = /televis|smart[ -]?tv|\btv\b|oled|qled|polegadas/i.test(parsedText);

        if (isWatchInput && hallucinatedTv) {
          console.warn('Alucinação de TV detectada para produto do tipo Relógio. Acionando gerador especializado de relógio.');
          const watchData = buildWatchData(titleHint, detectedStore, ogImage, extractedPrice, extractedOriginalPrice);
          res.json({ success: true, data: watchData });
          return;
        }

        // Se ogImage existir na página raspada, anexa para enriquecer
        if (ogImage && (!parsed.coverImage || !parsed.coverImage.startsWith('http'))) {
          parsed.coverImage = ogImage;
        }

        res.json({ success: true, data: parsed });
        return;
      } catch (geminiError) {
        console.warn('Chamada Gemini falhou ou atingiu cota, utilizando gerador especializado inteligente:', geminiError);
      }
    }

    // 5. Gerador Especializado Garantido por Nicho (quando Gemini não responde ou falha)
    let finalData;
    if (productType === 'WATCH') {
      finalData = buildWatchData(titleHint, detectedStore, ogImage, extractedPrice, extractedOriginalPrice);
    } else if (productType === 'TV') {
      finalData = buildTvData(titleHint, detectedStore, ogImage, extractedPrice, extractedOriginalPrice);
    } else if (productType === 'AUDIO') {
      finalData = buildAudioData(titleHint, detectedStore, ogImage, extractedPrice, extractedOriginalPrice);
    } else if (productType === 'PERIPHERAL') {
      finalData = buildPeripheralData(titleHint, detectedStore, ogImage, extractedPrice, extractedOriginalPrice);
    } else if (productType === 'KITCHEN') {
      finalData = buildKitchenData(titleHint, detectedStore, ogImage, extractedPrice, extractedOriginalPrice);
    } else {
      finalData = buildGeneralData(titleHint, detectedStore, 'Tecnologia & Dispositivos', ogImage, extractedPrice, extractedOriginalPrice);
    }

    res.json({ success: true, data: finalData });
  } catch (error) {
    console.error('Erro geral no endpoint /api/analyze-product:', error);
  }
});

// Endpoint oficial de robots.txt para Googlebot e indexadores
app.get('/robots.txt', (req: Request, res: Response) => {
  const host = `${req.protocol}://${req.get('host')}`;
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${host}/sitemap.xml\n`);
});

// Endpoint dinâmico de sitemap.xml para Google Search Console
app.get('/sitemap.xml', (req: Request, res: Response) => {
  const host = `${req.protocol}://${req.get('host')}`;
  const now = new Date().toISOString().split('T')[0];
  const defaultSlugs = [
    'teclado-mecanico-sem-fio-ergonomico',
    'fritadeira-eletrica-inteligente-visor-duplo',
    'fone-sem-fio-cancelamento-ativo-ruido',
    'relogio-inteligente-smartwatch-titanium-amoled'
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += `  <url>\n    <loc>${host}/</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  for (const slug of defaultSlugs) {
    xml += `  <url>\n    <loc>${host}/reviews/${slug}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  }

  xml += '</urlset>';
  res.type('application/xml');
  res.send(xml);
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = parseInt(process.env.PORT || '3000', 10);

  // Serve static public folder, favicon and assets consistently
  app.use(express.static(path.resolve(__dirname, 'public')));
  app.use('/src/assets', express.static(path.resolve(__dirname, 'src/assets')));
  app.use('/assets', express.static(path.resolve(__dirname, 'public/assets')));
  app.use('/assets', express.static(path.resolve(__dirname, 'src/assets')));

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      const indexPath = path.resolve(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          res.sendFile(path.resolve(__dirname, 'index.html'));
        }
      });
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Achados & Reviews server running on http://0.0.0.0:${port}`);
  });
}

startServer();
