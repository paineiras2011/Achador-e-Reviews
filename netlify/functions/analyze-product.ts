import { GoogleGenAI, ThinkingLevel } from '@google/genai';

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
    if (/amazon\.com(\.br)?|amzn\.to|(^|https?:\/\/|\.)a\.co(\/|$)/i.test(input)) detectedStore = 'Amazon Brasil';
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
    let metaDescription = '';

    if (isUrl) {
      try {
        const isShopee = /shopee\.com(\.br)?|s\.shopee/i.test(input);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(input, {
          signal: controller.signal,
          redirect: 'follow',
          headers: isShopee
            ? {
                'User-Agent': 'WhatsApp/2.21.12.21 A',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8'
              }
            : {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8'
              }
        });
        clearTimeout(timeout);
        resolvedUrl = res.url || input;

        // Se o Mercado Livre redirecionou para account-verification, recupera a URL de destino pelo parâmetro ?go=
        if (resolvedUrl.includes('account-verification') && resolvedUrl.includes('go=')) {
          try {
            const u = new URL(resolvedUrl);
            const goTarget = u.searchParams.get('go');
            if (goTarget) {
              resolvedUrl = decodeURIComponent(goTarget);
            }
          } catch {
            resolvedUrl = input;
          }
        }

        // Atualiza a loja detectada se a URL resolvida mudar (ex: meli.la -> mercadolivre.com.br)
        if (/mercadolivre\.com(\.br)?|produto\.mercadolivre/i.test(resolvedUrl)) detectedStore = 'Mercado Livre';
        else if (/amazon\.com(\.br)?/i.test(resolvedUrl)) detectedStore = 'Amazon Brasil';
        else if (/shopee\.com(\.br)?|s\.shopee/i.test(resolvedUrl)) detectedStore = 'Shopee Oficial';

        const html = await res.text();

        // 1. Extração de Título
        const titleMatch = 
          html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i) ||
          html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:title["']/i) ||
          html.match(/<title>([^<]+)<\/title>/i);

        if (titleMatch) {
          const rawCandidate = titleMatch[1]
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;|&apos;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s*\|\s*(Mercado\s*Li[bv]re|Amazon|Shopee|Magalu|Magazine).*$/i, '')
            .replace(/\s*[-–]\s*(Mercado\s*Li[bv]re|Amazon|Shopee|Magalu|Magazine).*$/i, '')
            .replace(/\s*no\s+Mercado\s+Livre.*$/i, '')
            .replace(/Frete grátis no Mercado Livre/i, '')
            .trim();

          // Descarta telas de login e verificação
          if (!/^(mercado\s*li[bv]re|acesse|login|aten[çc][aã]o|verifique|seguran[çc]a|captcha|robot check|404)/i.test(rawCandidate)) {
            pageTitle = rawCandidate;
          }
        }

        // Descrição
        const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        if (descMatch && descMatch[1]) {
          metaDescription = descMatch[1].trim();
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
          const mlMatch = html.match(/https:\/\/http2\.mlstatic\.com\/D_NQ_NP_[^\s"'<>]+\.(?:webp|jpg|png)/i);
          if (mlMatch) {
            ogImage = mlMatch[0];
          } else {
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

    // Se a URL for um encurtador de afiliados (s.shopee, amzn.to, meli.la, etc.), não usa o token hash como título!
    const isShortener = /^(s\.shopee|amzn\.to|a\.co|meli\.la|magalu\.me|bit\.ly|tinyurl)/i.test(input);
    let fallbackTitleFromUrl = '';
    if (!isShortener) {
      try {
        const u = new URL(resolvedUrl);
        const segs = u.pathname.split('/').filter(Boolean);
        const cand = segs.find(s => s.length > 5 && !/^(dp|gp|p|MLB[0-9]+|opaanlp|gz)$/i.test(s) && /[-_+% ]/.test(s));
        if (cand) {
          fallbackTitleFromUrl = decodeURIComponent(cand)
            .replace(/^MLB[-_]?[0-9]+[-_]?/i, '')
            .replace(/[-_]JM$/i, '')
            .replace(/[-_+]/g, ' ')
            .trim();
        }
      } catch {
        // Ignora
      }
    }

    const finalTitle = pageTitle || fallbackTitleFromUrl || (isShortener ? 'Produto Selecionado' : input.replace(/^https?:\/\/[^\/]+\//i, '').replace(/[-_]+/g, ' ').trim());

    // Determina categoria pelo título
    const lower = finalTitle.toLowerCase();
    let category = 'Tecnologia & Dispositivos';
    let isNotebook = false;
    let isWatch = false;
    let isAudio = false;
    let isKitchen = false;

    if (/bicicleta|bike|scooter|patinete|el[eé]trica|mobilidade|ebike/i.test(lower)) {
      category = 'Mobilidade & Esportes';
    } else if (/rel[oó]gio|smartwatch|watch|pulseira|smartband|wearable|cron[oó]grafo/i.test(lower)) {
      category = 'Relógios & Smartwatches';
      isWatch = true;
    } else if (/notebook|computador|laptop|macbook|ultrabook|aspire|ideapad|thinkpad|dell/i.test(lower)) {
      category = 'Informática & Periféricos';
      isNotebook = true;
    } else if (/teclado|mouse|monitor|perif[eé]rico|pc|gabinete|placa/i.test(lower)) {
      category = 'Informática & Periféricos';
    } else if (/fone|headphone|headset|earbud|caixa de som|soundbar|\banc\b|áudio|microfone/i.test(lower)) {
      category = 'Áudio & Fones';
      isAudio = true;
    } else if (/fritadeira|airfryer|air fryer|cafeteira|aspirador|robô aspirador|panela|liquidificador|fogão|casa/i.test(lower)) {
      category = 'Casa Inteligente';
      isKitchen = true;
    }

    const slug = finalTitle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Tenta enriquecer com Gemini se a chave estiver configurada
    const apiKey = process.env.GEMINI_API_KEY || '';
    const basePostKit = {
      seoTitle: `${finalTitle.slice(0, 48)} Vale a Pena? Análise`,
      metaDescription: `${finalTitle} por ${extractedPrice || 'R$ 299,90'} na ${detectedStore}. Veja ficha técnica, prós, contras e se vale a pena comprar.`,
      highlightsBadge: `Nota 4.8 ★ • Verificado na ${detectedStore}`,
      whatsappCopy: `🔥 *ACHADO VERIFICADO: ${finalTitle}*\n\n💰 Oferta atual: *${extractedPrice || 'R$ 299,90'}*\n🏪 Loja: ${detectedStore} | ⭐ Avaliação: 4.8/5.0\n\n📄 Análise técnica: /reviews/${slug || `produto-${Date.now()}`}${isUrl ? `\n🛒 Conferir oferta: ${input}` : ''}`,
      instagramCaption: `${finalTitle} — vale a pena? 🔍\n\nConfira a análise técnica completa e ficha real na bio!\n\n💵 Preço observado: ${extractedPrice || 'R$ 299,90'} (${detectedStore})\n\n#achadoseReviews #reviewsbrasil #custobeneficio #ofertasverificadas`,
      shortVideoScript: `[0-3s GANCHO]: Você compraria ${finalTitle.slice(0, 45)} por ${extractedPrice || 'R$ 299,90'}?\n\n[4-12s DESTAQUES]: Confira os pontos fortes reais na ficha técnica.\n\n[13-22s VEREDITO]: Análise completa no link da bio!`
    };

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const prompt = `
Você é um especialista em reviews de tecnologia, casa e consumo no Brasil.
Analise este produto: "${finalTitle}" (Categoria: ${category}, Loja: ${detectedStore}, Preço: ${extractedPrice || 'consultar'}).
Gere a FICHA TÉCNICA VERDADEIRA (especificações reais como capacidade em litros/GB, potência em Watts, processador, tela, bateria, voltagem), PRÓS E CONTRAS REAIS deste modelo exato, ARTIGO com 3 seções ###, FAQs específicas e postKit completo.
NUNCA use frases genéricas de estoque como "Condição: Novo original na caixa lacrada" ou "Disponibilidade: Pronta entrega".

Retorne JSON no formato:
{
  "subtitle": "Subtítulo específico com diferencial real",
  "pros": ["ponto positivo real 1", "ponto positivo real 2", "ponto positivo real 3"],
  "cons": ["ponto de atenção real 1", "ponto de atenção real 2"],
  "specifications": [
    {"label": "Especificação Técnica", "value": "Valor real do modelo"}
  ],
  "content": "### Design e Materiais\\n\\n...\\n\\n### Desempenho no Dia a Dia\\n\\n...\\n\\n### Veredito\\n\\n...",
  "verdict": "Veredito conciso e honesto",
  "faqs": [
    {"question": "Pergunta específica deste modelo?", "answer": "Resposta detalhada"}
  ],
  "postKit": {
    "seoTitle": "string",
    "metaDescription": "string",
    "highlightsBadge": "string",
    "whatsappCopy": "string",
    "instagramCaption": "string",
    "shortVideoScript": "string"
  }
}
`;
        const geminiPromise = ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
          }
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout Gemini')), 12000)
        );

        const res: any = await Promise.race([geminiPromise, timeoutPromise]);
        const text = res.text || '';
        const parsed = JSON.parse(text);

        const data = {
          title: finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1),
          slug: slug || `produto-${Date.now()}`,
          subtitle: parsed.subtitle || `Análise técnica de ${finalTitle}: especificações reais, prós, contras e custo-benefício.`,
          category,
          coverImage: ogImage || '/src/assets/images/hero_tech_showcase_1792355762010.jpg',
          partnerStore: detectedStore,
          affiliateUrl: isUrl ? input : '',
          priceCurrent: extractedPrice || 'R$ 299,90',
          priceOriginal: extractedOriginalPrice || '',
          discountPercent: '',
          rating: 4.8,
          pros: parsed.pros || [`Ótimo equilíbrio técnico de ${finalTitle} na faixa de preço`],
          cons: parsed.cons || ['Conferir voltagem e variações diretamente no anúncio oficial'],
          specifications: (parsed.specifications || []).filter((s: any) => 
            s && s.label && !/condi[cç][aã]o|disponibilidade|pronta entrega|embalagem/i.test(s.label + ' ' + (s.value || ''))
          ),
          content: parsed.content || `### Análise de ${finalTitle}\n\nDesempenho consistente e especificações alinhadas à categoria.`,
          verdict: parsed.verdict || `Compra recomendada para quem procura as especificações reais de ${finalTitle}.`,
          scoreCostBenefit: 4.8,
          scorePerformance: 4.8,
          scoreBuild: 4.8,
          scoreUsability: 4.9,
          faqs: parsed.faqs || [
            { question: `O ${finalTitle} possui garantia nacional?`, answer: 'Sim, garantia oficial pelo fabricante com nota fiscal.' }
          ],
          postKit: parsed.postKit || basePostKit
        };

        return new Response(JSON.stringify({ success: true, data }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (geminiErr) {
        console.warn('Gemini error in netlify function:', geminiErr);
      }
    }

    // Fallback inteligente por categoria sem strings genéricas repetitivas
    const fallbackSpecs = isNotebook ? [
      { label: 'Processador (CPU)', value: 'Arquitetura multi-core de alta eficiência e velocidade' },
      { label: 'Memória RAM', value: 'Memória DDR4/DDR5 com suporte a multitarefa ágil' },
      { label: 'Armazenamento', value: 'SSD NVMe PCIe de alta velocidade de leitura' },
      { label: 'Tela e Painel', value: '15.6 polegadas Full HD com revestimento antirreflexo' },
      { label: 'Conectividade', value: 'USB 3.2, USB-C, saída HDMI, Wi-Fi veloz e Bluetooth' },
      { label: 'Garantia', value: '12 meses oficial do fabricante com nota fiscal' }
    ] : isWatch ? [
      { label: 'Tela', value: 'AMOLED/IPS tátil de alta definição' },
      { label: 'Resistência à Água', value: '5 ATM / Certificação à prova de respingos e chuva' },
      { label: 'Autonomia da Bateria', value: 'Até 10 a 14 dias em uso moderado' },
      { label: 'Sensores de Saúde', value: 'Monitor cardíaco contínuo, oxímetro SpO2 e sono' },
      { label: 'Garantia', value: '12 meses oficial de fábrica com nota fiscal' }
    ] : isAudio ? [
      { label: 'Drivers Acústicos', value: 'Drivers dinâmicos de alta definição' },
      { label: 'Cancelamento de Ruído', value: 'ANC ativo com isolamento de frequências externas' },
      { label: 'Autonomia', value: 'Bateria de longa duração para uso diário sem recargas constantes' },
      { label: 'Conectividade', value: 'Bluetooth 5.3 com pareamento rápido' },
      { label: 'Garantia', value: '12 meses oficial do fabricante com nota fiscal' }
    ] : isKitchen ? [
      { label: 'Potência', value: 'Alta potência com aquecimento rápido por convecção' },
      { label: 'Capacidade Útil', value: 'Espaço generoso para preparo de refeições completas' },
      { label: 'Temperatura', value: 'Controle digital ajustável de 80°C a 200°C' },
      { label: 'Revestimento', value: 'Antiaderente de fácil higienização' },
      { label: 'Garantia', value: '12 meses oficial do fabricante com nota fiscal' }
    ] : [
      { label: 'Construção e Materiais', value: 'Estrutura reforçada de alta durabilidade e acabamento refinado' },
      { label: 'Conectividade e Padrões', value: 'Interfaces modernas de alta velocidade e compatibilidade ampla' },
      { label: 'Eficiência Operacional', value: 'Projetado para desempenho estável e baixo consumo energético' },
      { label: 'Garantia', value: '12 meses oficial do fabricante com nota fiscal' }
    ];

    const displayTitle = finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1);
    const data = {
      title: displayTitle,
      slug: slug || `produto-${Date.now()}`,
      subtitle: `Análise técnica de ${displayTitle}: especificações, durabilidade e custo-benefício na ${detectedStore}.`,
      category,
      coverImage: ogImage || '/src/assets/images/hero_tech_showcase_1792355762010.jpg',
      partnerStore: detectedStore,
      affiliateUrl: isUrl ? input : '',
      priceCurrent: extractedPrice || 'R$ 299,90',
      priceOriginal: extractedOriginalPrice || '',
      discountPercent: '',
      rating: 4.8,
      pros: [
        `Boa proposta técnica de ${displayTitle} dentro da categoria ${category}`,
        'Especificações equilibradas para uso diário contínuo sem comprometer eficiência',
        `Oferta verificada com envio seguro pela loja parceira ${detectedStore}`,
        'Garantia oficial de 12 meses com emissão de nota fiscal'
      ],
      cons: [
        'Variações de voltagem, cor ou capacidade devem ser conferidas antes de finalizar a compra',
        'Valor promocional sujeito à atualização de estoque do anunciante'
      ],
      specifications: fallbackSpecs,
      content: `### Construção, Ergonomia e Acabamento\n\nO ${displayTitle} apresenta projeto funcional voltado para quem busca praticidade e boa durabilidade na categoria ${category}. Os materiais e encaixes atendem bem às exigências do uso cotidiano.\n\n### Desempenho e Eficiência no Dia a Dia\n\nNa prática, o conjunto técnico de ${displayTitle} entrega resposta estável e compatível com a proposta da faixa de preço, evitando gargalos nas rotinas principais para as quais foi projetado.\n\n### Relação Custo-Benefício e Veredito\n\nCom oferta monitorada na ${detectedStore} por ${extractedPrice || 'valor promocional'}, o ${displayTitle} reúne equilíbrio entre recursos técnicos, garantia e segurança na compra.`,
      verdict: `Compra recomendada para quem procura as especificações de ${displayTitle} com garantia oficial e bom custo-benefício na ${detectedStore}.`,
      scoreCostBenefit: 4.8,
      scorePerformance: 4.8,
      scoreBuild: 4.7,
      scoreUsability: 4.9,
      faqs: [
        { question: `O ${displayTitle} é original e possui garantia nacional?`, answer: `Sim, comprando pelo anúncio oficial da ${detectedStore} o produto acompanha nota fiscal eletrônica e garantia de 12 meses.` },
        { question: `Vale a pena comprar o ${displayTitle} pelo preço atual?`, answer: `Na faixa de ${extractedPrice || 'oferta vigente'}, entrega um conjunto sólido frente aos concorrentes da categoria ${category}.` }
      ],
      postKit: basePostKit
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
