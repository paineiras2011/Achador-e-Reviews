import React, { useEffect } from 'react';
import { Review, SiteSettings } from '../types';

interface SeoHeadProps {
  title?: string;
  description?: string;
  review?: Review | null;
  settings?: SiteSettings;
  canonicalUrl?: string;
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  title,
  description,
  review,
  settings,
  canonicalUrl
}) => {
  useEffect(() => {
    const siteTitle = settings?.siteName || 'Achados & Reviews';
    const finalTitle = title 
      ? `${title} | ${siteTitle}`
      : `${siteTitle} – Melhores Compras, Análises e Ofertas Verificadas`;
    
    const finalDesc = description || review?.subtitle || 
      'Descubra análises imparciais, comparativos e as melhores ofertas com cupons de desconto exclusivos em tecnologia, periféricos e casa inteligente.';

    // Update document title
    document.title = finalTitle;

    // Update Meta description
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    updateMeta('description', finalDesc);
    updateMeta('og:title', finalTitle, true);
    updateMeta('og:description', finalDesc, true);
    updateMeta('og:type', review ? 'article' : 'website', true);
    updateMeta('og:site_name', siteTitle, true);
    updateMeta('twitter:title', finalTitle);
    updateMeta('twitter:description', finalDesc);

    if (review?.coverImage) {
      updateMeta('og:image', review.coverImage, true);
      updateMeta('twitter:image', review.coverImage);
    }

    // Google Search Console Site Verification
    if (settings?.googleSiteVerification) {
      let code = settings.googleSiteVerification.trim();
      const match = code.match(/content=["']([^"']+)["']/i);
      if (match) {
        code = match[1];
      }
      updateMeta('google-site-verification', code);
    }

    // Dynamic Canonical URL
    const finalCanonical = canonicalUrl || (window.location.origin + window.location.pathname);
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', finalCanonical);
    updateMeta('og:url', finalCanonical, true);

    // Dynamic Schema.org JSON-LD Script injection
    const scriptId = 'schema-org-jsonld';
    let schemaScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = scriptId;
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }

    if (review) {
      // Product & Review Schema
      const schemaData: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Product',
            name: review.title,
            image: review.coverImage,
            description: review.subtitle,
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: review.rating,
              bestRating: '5.0',
              worstRating: '1.0',
              ratingCount: review.viewsCount ? Math.max(12, Math.floor(review.viewsCount / 40)) : 25
            },
            offers: {
              '@type': 'Offer',
              price: review.priceCurrent.replace(/[^0-9,.]/g, '').replace(',', '.'),
              priceCurrency: 'BRL',
              availability: 'https://schema.org/InStock',
              url: review.affiliateUrl,
              seller: {
                '@type': 'Organization',
                name: review.partnerStore
              }
            }
          },
          {
            '@type': 'Review',
            itemReviewed: {
              '@type': 'Product',
              name: review.title
            },
            reviewRating: {
              '@type': 'Rating',
              ratingValue: review.rating,
              bestRating: '5.0'
            },
            author: {
              '@type': 'Organization',
              name: siteTitle
            },
            publisher: {
              '@type': 'Organization',
              name: siteTitle
            },
            reviewBody: review.verdict
          }
        ]
      };

      // Add FAQ Schema if exists
      if (review.faqs && review.faqs.length > 0) {
        (schemaData['@graph'] as Record<string, unknown>[]).push({
          '@type': 'FAQPage',
          mainEntity: review.faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer
            }
          }))
        });
      }

      schemaScript.textContent = JSON.stringify(schemaData, null, 2);
    } else {
      // Website Schema
      const webSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteTitle,
        url: window.location.origin,
        description: finalDesc,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${window.location.origin}/?search={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      };
      schemaScript.textContent = JSON.stringify(webSchema, null, 2);
    }

    return () => {
      // Cleanup if needed
    };
  }, [title, description, review, settings, canonicalUrl]);

  return null;
};
