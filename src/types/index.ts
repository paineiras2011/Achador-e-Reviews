export interface Specification {
  label: string;
  value: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface PartnerOffer {
  storeName: string;
  price: string;
  url: string;
  badge?: string;
}

export interface Review {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  coverImage: string;
  rating: number; // 1.0 to 5.0
  priceCurrent: string;
  priceOriginal?: string;
  discountPercent?: string;
  affiliateUrl: string;
  partnerStore: string;
  couponCode?: string;
  couponDiscount?: string;
  otherStores?: PartnerOffer[];
  pros: string[];
  cons: string[];
  specifications: Specification[];
  content: string; // Markdown or rich HTML formatted text
  verdict: string;
  scoreBreakdown?: {
    costBenefit: number;
    performance: number;
    buildQuality: number;
    usability: number;
  };
  faqs: FAQItem[];
  featured?: boolean;
  viewsCount: number;
  clicksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description: string;
}

export interface Banner {
  id: string;
  position: 'header' | 'sidebar' | 'in_article';
  title: string;
  imageUrl: string;
  targetUrl: string;
  altText: string;
  active: boolean;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  logoUrl?: string;
  affiliateDisclosure: string;
  headerTrackingCode?: string;
  googleSiteVerification?: string;
  contactEmail?: string;
  telegramUrl?: string;
  whatsappUrl?: string;
}

export interface AffiliateClick {
  id: string;
  reviewId: string;
  reviewTitle: string;
  partnerStore: string;
  timestamp: string;
  referrer?: string;
}

export interface ComparisonProductItem {
  id: string;
  title: string;
  badge?: string; // Ex: 'Melhor Geral', 'Melhor Custo-Benefício', 'Melhor Desempenho', 'Mais Econômico'
  rating: number; // 1.0 to 5.0
  price: string;
  originalPrice?: string;
  partnerStore: string;
  affiliateUrl: string;
  imageUrl: string;
  summary: string;
  pros: string[];
  cons: string[];
  keySpecs: { label: string; value: string }[];
  reviewSlug?: string; // Slug do review individual no site, se existir
}

export interface ComparisonGuide {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  coverImage: string;
  introContent: string;
  buyingTipsContent?: string;
  products: ComparisonProductItem[];
  faqs?: FAQItem[];
  published: boolean;
  featured?: boolean;
  viewsCount?: number;
  createdAt: string;
  updatedAt: string;
}

