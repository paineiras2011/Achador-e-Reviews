// Netlify Serverless Function para Autopreenchimento Inteligente de Produtos
export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const input = (body?.input || '').trim();

    if (!input) {
      return new Response(JSON.stringify({ error: 'Link ou nome do produto obrigatório' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isUrl = /^https?:\/\//i.test(input);
    let detectedStore = 'Loja Parceira Oficial';
    if (/amazon\.com(\.br)?|amzn\.to|a\.co/i.test(input)) detectedStore = 'Amazon Brasil';
    else if (/mercadolivre\.com(\.br)?|meli\.la|produto\.mercadolivre/i.test(input)) detectedStore = 'Mercado Livre';
    else if (/shopee\.com(\.br)?|s\.shopee/i.test(input)) detectedStore = 'Shopee Oficial';
    else if (/magazineluiza|magazinevoce|magalu/i.test(input)) detectedStore = 'Magazine Luiza';
    else if (/kabum\.com(\.br)?/i.test(input)) detectedStore = 'KaBuM!';
    else if (/casasbahia\.com(\.br)?/i.test(input)) detectedStore = 'Casas Bahia';

    let pageTitle = '';
    let ogImage = '';
    let extractedPrice = '';
    let extractedOriginalPrice = '';
    let resolvedUrl = input;

    if (isUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(input, {
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8'
          }
        });
        clearTimeout(timeout);
        resolvedUrl = res.url || input;

        // Atualiza a loja detectada se a URL resolvida mudar (ex: meli.la -> mercadolivre.com.br)
        if (/mercadolivre\.com(\.br)?|produto\.mercadolivre/i.test(resolvedUrl)) detectedStore = 'Mercado Livre';
        else if (/amazon\.com(\.br)?/i.test(resolvedUrl)) detectedStore = 'Amazon Brasil';

        const html = await res.text();

        // 1. Extração de Título
        const titleMatch = 
          html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i) ||
          html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:title["']/i) ||
          html.match(/<title>([^<]+)<\/title>/i);

        if (titleMatch) {
          pageTitle = titleMatch[1]
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;|&apos;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s*\|\s*(Mercado\s*Livre|Amazon|Shopee|Magalu|Magazine).*$/i, '')
            .replace(/\s*[-–]\s*(Mercado\s*Livre|Amazon|Shopee|Magalu|Magazine).*$/i, '')
            .replace(/\s*no\s+Mercado\s+Livre.*$/i, '')
            .replace(/Frete grátis no Mercado Livre/i, '')
            .trim();
        }

        // 2. Extração de Imagem Real do Produto
        const imageMatch = 
          html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
          html.match(/<meta[^>]*property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);

        if (imageMatch) {
          ogImage = imageMatch[1].trim();
        }

        // Fallbacks específicos para imagens de alta resolução em marketplaces
        if (!ogImage || ogImage.includes('logo') || ogImage.includes('icon')) {
          // Mercado Livre CDN
          const mlMatch = html.match(/https:\/\/http2\.mlstatic\.com\/D_NQ_NP_[^\s"'<>]+\.(?:webp|jpg|png)/i);
          if (mlMatch) {
            ogImage = mlMatch[0];
          } else {
            // Amazon CDN
            const amzMatch = html.match(/https:\/\/m\.media-amazon\.com\/images\/I\/[a-zA-Z0-9+_.-]+\.(?:jpg|png)/i);
            if (amzMatch) {
              ogImage = amzMatch[0];
            }
          }
        }

        if (ogImage && ogImage.startsWith('http://')) {
          ogImage = ogImage.replace('http://', 'https://');
        }

        // 3. Extração de Preço
        const mlPriceMatch = html.match(/class=["'][^"']*andes-money-amount__fraction[^"']*["'][^>]*>([\d\.]+)</i);
        if (mlPriceMatch) {
          const centsMatch = html.match(/class=["'][^"']*andes-money-amount__cents[^"']*["'][^>]*>(\d{2})</i);
          const cents = centsMatch ? centsMatch[1] : '00';
          extractedPrice = `R$ ${mlPriceMatch[1]},${cents}`;
        } else {
          const generalPriceMatch = html.match(/R\$\s*([\d\.]+(?:,\d{2})?)/i);
          if (generalPriceMatch) {
            extractedPrice = generalPriceMatch[0].trim();
          }
        }
      } catch (scrapeErr) {
        console.warn('Scraping fallback on netlify function:', scrapeErr);
      }
    }

    const finalTitle = pageTitle || input
      .replace(/^https?:\/\/[^\/]+\//i, '')
      .replace(/[-_]+/g, ' ')
      .trim();

    // Determina categoria pelo título
    const lower = finalTitle.toLowerCase();
    let category = 'Tecnologia & Dispositivos';
    if (/rel[oó]gio|smartwatch|watch|pulseira|smartband|wearable|cron[oó]grafo/i.test(lower)) {
      category = 'Relógios & Smartwatches';
    } else if (/notebook|computador|laptop|teclado|mouse|monitor|perif[eé]rico|pc|gabinete|placa/i.test(lower)) {
      category = 'Informática & Periféricos';
    } else if (/fone|headphone|headset|earbud|caixa de som|soundbar|\banc\b|áudio|microfone/i.test(lower)) {
      category = 'Áudio & Fones';
    } else if (/fritadeira|airfryer|air fryer|cafeteira|aspirador|robô aspirador|panela|liquidificador|fogão|casa/i.test(lower)) {
      category = 'Casa Inteligente';
    }

    const slug = finalTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const data = {
      title: finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1),
      slug: slug || `produto-${Date.now()}`,
      subtitle: `Análise técnica de especificações, durabilidade e custo-benefício em compras online.`,
      category,
      coverImage: ogImage || '/src/assets/images/hero_tech_showcase_1792355762010.jpg',
      partnerStore: detectedStore,
      affiliateUrl: isUrl ? input : '',
      priceCurrent: extractedPrice || 'R$ 299,90',
      priceOriginal: extractedOriginalPrice || '',
      discountPercent: '',
      pros: [
        'Excelente custo-benefício e alto índice de aprovação dos usuários',
        'Construção resistente com materiais de boa durabilidade comprovada',
        'Fácil manuseio e configuração simplificada',
        'Compra protegida com entrega oficial e garantia'
      ],
      cons: [
        'Manual de instruções poderia ser mais detalhado',
        'Variações de cor e voltagem dependem do estoque disponível'
      ],
      specifications: [
        { label: 'Garantia', value: '12 meses oficial do fabricante' },
        { label: 'Condição', value: 'Novo original na caixa lacrada' },
        { label: 'Disponibilidade', value: 'Pronta entrega com garantia oficial' }
      ],
      content: `### Primeiras Impressões e Construção\n\nO produto se destaca pela qualidade no acabamento e facilidade de manuseio logo nos primeiros testes de uso diário.\n\n### Desempenho no Dia a Dia\n\nNos testes práticos, o equipamento entregou estabilidade, praticidade e cumpriu com eficiência todas as promessas da fabricante.\n\n### Vale a Pena Comprar?\n\nConsiderando a faixa de preço atual e a confiabilidade da loja parceira, trata-se de uma excelente recomendação de compra.`,
      verdict: 'Uma recomendação sólida e segura de compra com alto índice de satisfação entre usuários.',
      scoreCostBenefit: 4.8,
      scorePerformance: 4.8,
      scoreBuild: 4.7,
      scoreUsability: 4.9,
      faqs: [
        { question: 'O produto possui garantia nacional?', answer: 'Sim, todos os itens comprados pelas lojas oficiais indicadas contam com garantia de 12 meses.' }
      ]
    };

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
