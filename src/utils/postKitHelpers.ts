import { PostKit } from '../types';

export interface PostKitBuildParams {
  title: string;
  slug?: string;
  priceCurrent?: string;
  priceOriginal?: string;
  partnerStore?: string;
  affiliateUrl?: string;
  category?: string;
  rating?: number;
  pros?: string[];
  verdict?: string;
  type?: 'review' | 'guide';
  siteOrigin?: string;
}

export function sanitizePostKit(kit?: Partial<PostKit> | null): PostKit | undefined {
  if (!kit) return undefined;
  const seoTitle = String(kit.seoTitle || '').trim();
  const metaDescription = String(kit.metaDescription || '').trim();
  const highlightsBadge = String(kit.highlightsBadge || '').trim();
  const whatsappCopy = String(kit.whatsappCopy || '').trim();
  const instagramCaption = String(kit.instagramCaption || '').trim();
  const shortVideoScript = String(kit.shortVideoScript || '').trim();

  if (!seoTitle && !metaDescription && !whatsappCopy && !instagramCaption && !shortVideoScript) {
    return undefined;
  }

  return {
    seoTitle,
    metaDescription,
    highlightsBadge,
    whatsappCopy,
    instagramCaption,
    shortVideoScript,
  };
}

export function buildClientPostKit(params: PostKitBuildParams): PostKit {
  const origin = (
    params.siteOrigin ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://achadosreviews.com.br')
  ).replace(/\/+$/, '');
  const title = (params.title || 'Produto Avaliado').trim();
  const slug =
    (params.slug || '').trim() ||
    title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  const isGuide = params.type === 'guide';
  const publicUrl = `${origin}/${isGuide ? 'guias' : 'reviews'}/${slug}`;
  const price = (params.priceCurrent || '').trim() || 'Ver oferta do dia';
  const original = (params.priceOriginal || '').trim();
  const store = (params.partnerStore || '').trim() || 'Loja Oficial';
  const rating = Number(params.rating) || 4.8;
  const topPros = (params.pros || []).filter(Boolean).slice(0, 3);
  const verdict = (params.verdict || '').trim();
  const category = (params.category || 'Tecnologia & Dispositivos').trim();

  const seoTitle = isGuide
    ? `${title.slice(0, 56)}${title.length > 56 ? '...' : ''} | Ranking`
    : `${title.slice(0, 44)} Vale a Pena? Análise e Ficha`;

  const metaDescription = isGuide
    ? `Comparativo completo: ${title}. Veja prós, contras, ficha técnica e melhor preço verificado em ${category}.`.slice(0, 158)
    : `${title} por ${price}${store ? ` na ${store}` : ''}. Confira ficha técnica real, prós, contras e se vale a pena comprar.`.slice(0, 158);

  const highlightsBadge = isGuide
    ? `Top ${category} • Guia Verificado`
    : `Nota ${rating.toFixed(1)} ★ • Verificado na ${store}`;

  const prosBlock =
    topPros.length > 0
      ? `\n\n✅ *Destaques reais:*\n${topPros.map((p) => `• ${p}`).join('\n')}`
      : '';

  const priceBlock = isGuide
    ? ''
    : `\n💰 Oferta observada: *${price}*${original ? ` (de ~${original}~)` : ''}\n🏪 Loja: ${store} | ⭐ Nota: ${rating.toFixed(1)}/5.0`;

  const whatsappCopy = isGuide
    ? `🏆 *GUIA COMPARATIVO: ${title}*${prosBlock}\n\n📊 Veja a tabela completa lado a lado, prós, contras e ofertas:\n👉 ${publicUrl}`
    : `🔥 *ACHADO VERIFICADO: ${title}*${priceBlock}${prosBlock}\n\n📄 Review completo e ficha técnica:\n👉 ${publicUrl}${params.affiliateUrl ? `\n🛒 Conferir oferta direta: ${params.affiliateUrl}` : ''}`;

  const categoryTag = category
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');

  const instagramCaption = isGuide
    ? `${title} — qual escolher sem errar? 🏆\n\nComparamos ficha técnica real, pontos fortes, pontos de atenção e custo-benefício atualizado.\n${verdict ? `\n💡 Resumo: ${verdict}\n` : ''}\n🔗 Tabela comparativa completa no link da bio!\n\n#guiadecompra #comparativo #${categoryTag || 'tecnologia'} #custobeneficio #achadosereviews`
    : `${title} — vale a pena em ${new Date().getFullYear()}? 🔍\n\n💵 Preço observado: ${price} (${store})\n⭐ Nossa nota técnica: ${rating.toFixed(1)}/5.0${topPros.length > 0 ? `\n\n✔️ ${topPros.slice(0, 2).join('\n✔️ ')}` : ''}\n\n🔗 Leia a ficha técnica e os pontos de atenção no link da bio!\n\n#review #${categoryTag || 'ofertas'} #custobeneficio #achadosereviews`;

  const shortVideoScript = isGuide
    ? `[0-3s GANCHO]: Vai comprar ${title.slice(0, 45)}? Olha esse comparativo antes!\n\n[4-14s DESTAQUES]: ${topPros[0] || 'Critérios técnicos de desempenho, construção e garantia lado a lado.'}\n\n[15-24s VEREDITO & CTA]: ${verdict || 'Confira o ranking atualizado e os links seguros na descrição/bio!'}`
    : `[0-3s GANCHO]: ${title.slice(0, 48)} por ${price} — vale o preço ou é cilada?\n\n[4-14s PROS REAIS]: ${topPros[0] || 'Desempenho e ficha técnica acima da média na categoria.'}\n\n[15-24s ATENÇÃO & CTA]: Confira nossa nota ${rating.toFixed(1)}/5 e a ficha técnica completa no link da bio!`;

  return {
    seoTitle,
    metaDescription,
    highlightsBadge,
    whatsappCopy,
    instagramCaption,
    shortVideoScript,
  };
}
