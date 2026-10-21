import { PartnerOffer } from '../types';

/**
 * Normaliza o nome da loja para comparação precisa sem ruídos como espaços,
 * pontuações, sufixos 'Brasil', 'Oficial', etc.
 */
export function normalizeStoreName(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .replace(/brasil|oficial|br|loja|store|online|marketplace|app/g, '')
    .trim();
}

/**
 * Determina se duas lojas são a mesma plataforma (ex: 'Mercado Livre' e 'MercadoLivre',
 * ou 'Magalu' e 'Magazine Luiza', ou 'Amazon Brasil' e 'Amazon').
 */
export function isSameStore(storeA?: string, storeB?: string): boolean {
  if (!storeA || !storeB) return false;
  const a = normalizeStoreName(storeA);
  const b = normalizeStoreName(storeB);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  // Reconhecimento de apelidos consagrados no e-commerce brasileiro
  const isML = (s: string) => /mercadolivre|mercado|meli|mercadopago/i.test(s);
  const isMagalu = (s: string) => /magalu|magazineluiza|magazinevoce|magazine/i.test(s);
  const isAmazon = (s: string) => /amazon|amzn/i.test(s);
  const isShopee = (s: string) => /shopee/i.test(s);
  const isAliExpress = (s: string) => /aliexpress|aliex|ali/i.test(s);
  const isKabum = (s: string) => /kabum/i.test(s);
  const isCasasBahia = (s: string) => /casasbahia|bahia/i.test(s);

  if (isML(a) && isML(b)) return true;
  if (isMagalu(a) && isMagalu(b)) return true;
  if (isAmazon(a) && isAmazon(b)) return true;
  if (isShopee(a) && isShopee(b)) return true;
  if (isAliExpress(a) && isAliExpress(b)) return true;
  if (isKabum(a) && isKabum(b)) return true;
  if (isCasasBahia(a) && isCasasBahia(b)) return true;

  return false;
}

/**
 * Remove qualquer loja concorrente que:
 * 1. Seja a mesma loja parceira principal (ex: oferta principal no Mercado Livre e botão de comparação também no Mercado Livre)
 * 2. Tenha exatamente o mesmo link de afiliado da oferta principal
 * 3. Não possua nome, URL ou preço válidos
 */
export function cleanOtherStores(
  otherStores: PartnerOffer[] | undefined,
  mainStore: string,
  mainAffiliateUrl?: string
): PartnerOffer[] {
  if (!Array.isArray(otherStores) || otherStores.length === 0) return [];
  const cleanMainUrl = (mainAffiliateUrl || '').trim().toLowerCase();

  return otherStores.filter((store) => {
    if (!store) return false;
    const sName = (store.storeName || '').trim();
    const sUrl = (store.url || '').trim().toLowerCase();
    const sPrice = (store.price || '').trim();

    if (!sName || !sUrl || !sPrice) return false;
    if (isSameStore(sName, mainStore)) return false;
    if (cleanMainUrl && sUrl === cleanMainUrl) return false;

    return true;
  });
}
