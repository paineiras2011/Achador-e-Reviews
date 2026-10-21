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
