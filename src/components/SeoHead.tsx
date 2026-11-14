import React, { useEffect } from 'react';
import { Review, ComparisonGuide, Category, SiteSettings } from '../types';

interface SeoHeadProps {
  title?: string;
  description?: string;
  review?: Review | null;
  guide?: ComparisonGuide | null;
  category?: Category | null;
  settings?: SiteSettings;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  title,
  description,
  review,
  guide,
  category,
  settings,
  canonicalUrl,
  noIndex = false
}) => {
  useEffect(() => {
    const siteTitle = settings?.siteName || 'Achados & Reviews';
    const origin = window.location.origin;

    const finalTitle = title
      ? `${title} | ${siteTitle}`
      : review
      ? `${review.title} – Análise, Prós e Contras | ${siteTitle}`
      : guide
      ? `${guide.title} | ${siteTitle}`
      : category
      ? `${category.name}: Melhores Análises e Ofertas | ${siteTitle}`
      : `${siteTitle} – Melhores Compras, Análises e Ofertas Verificadas`;

    const rawDesc =
      description ||
      review?.subtitle ||
      guide?.subtitle ||
      (guide?.introContent ? guide.introContent.slice(0, 155) : '') ||
      (category ? `${category.description}. Compare fichas técnicas, prós e contras e melhores ofertas verificadas.` : '') ||
      'Descubra análises imparciais, comparativos completos e as melhores ofertas verificadas na Amazon, Mercado Livre e Shopee.';

    const finalDesc = rawDesc.replace(/\s+/g, ' ').trim().slice(0, 160);

    document.title = finalTitle;

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

    updateMeta(
      'robots',
      noIndex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );
    updateMeta('description', finalDesc);
    updateMeta('og:title', finalTitle, true);
    updateMeta('og:description', finalDesc, true);
    updateMeta('og:type', review || guide ? 'article' : 'website', true);
    updateMeta('og:site_name', siteTitle, true);
    updateMeta('og:locale', 'pt_BR', true);
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', finalTitle);
    updateMeta('twitter:description', finalDesc);

    const activeImage = review?.coverImage || guide?.coverImage;
    if (activeImage) {
      const absImg = activeImage.startsWith('http') ? activeImage : `${origin}${activeImage.startsWith('/') ? '' : '/'}${activeImage}`;
      updateMeta('og:image', absImg, true);
      updateMeta('twitter:image', absImg);
    }

    // Google Search Console Site Verification
    const rawVerification = settings?.googleSiteVerification || '';
    const rawTracking = settings?.headerTrackingCode || '';
    let extractedVerificationToken = '';

    const tokenMatch = (rawVerification + ' ' + rawTracking).match(/content=["']([^"']+)["']/i);
    if (tokenMatch) {
      extractedVerificationToken = tokenMatch[1];
    } else if (rawVerification.trim() && !rawVerification.includes('.html') && !rawVerification.includes(':')) {
      extractedVerificationToken = rawVerification.trim();
    }

    if (extractedVerificationToken) {
      updateMeta('google-site-verification', extractedVerificationToken);
    }

    // Dynamic Canonical URL
    const finalCanonical = canonicalUrl || `${origin}${window.location.pathname}`;
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
      const cleanPrice = review.priceCurrent
        .replace(/R\$\s*/gi, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^0-9.]/g, '');

      const graph: Record<string, unknown>[] = [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Início', item: `${origin}/` },
            { '@type': 'ListItem', position: 2, name: review.category, item: `${origin}/` },
            { '@type': 'ListItem', position: 3, name: review.title, item: finalCanonical }
          ]
        },
        {
          '@type': 'Product',
          name: review.title,
          image: review.coverImage,
          description: finalDesc,
          category: review.category,
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: review.rating,
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
          datePublished: review.createdAt,
          dateModified: review.updatedAt || review.createdAt,
          reviewBody: review.verdict
        }
      ];

      if (review.faqs && review.faqs.length > 0) {
        graph.push({
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

      schemaScript.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    } else if (guide) {
      const graph: Record<string, unknown>[] = [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Início', item: `${origin}/` },
            { '@type': 'ListItem', position: 2, name: 'Guias Comparativos', item: `${origin}/#guias-comparativos` },
            { '@type': 'ListItem', position: 3, name: guide.title, item: finalCanonical }
          ]
        },
        {
          '@type': 'Article',
          headline: guide.title,
          description: finalDesc,
          image: guide.coverImage,
          datePublished: guide.createdAt,
          dateModified: guide.updatedAt || guide.createdAt,
          author: { '@type': 'Organization', name: siteTitle },
          publisher: { '@type': 'Organization', name: siteTitle },
          mainEntityOfPage: finalCanonical
        },
        {
          '@type': 'ItemList',
          name: guide.title,
          numberOfItems: guide.products?.length || 0,
          itemListElement: (guide.products || []).map((p, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: p.title,
            description: p.summary,
            image: p.imageUrl
          }))
        }
      ];

      if (guide.faqs && guide.faqs.length > 0) {
        graph.push({
          '@type': 'FAQPage',
          mainEntity: guide.faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer
            }
          }))
        });
      }

      schemaScript.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    } else if (category) {
      schemaScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Início', item: `${origin}/` },
              { '@type': 'ListItem', position: 2, name: category.name, item: finalCanonical }
            ]
          },
          {
            '@type': 'CollectionPage',
            name: `${category.name} – ${siteTitle}`,
            description: finalDesc,
            url: finalCanonical
          }
        ]
      });
    } else {
      schemaScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            name: siteTitle,
            url: origin,
            description: settings?.tagline || finalDesc
          },
          {
            '@type': 'WebSite',
            name: siteTitle,
            url: origin,
            description: finalDesc,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${origin}/?search={search_term_string}`,
              'query-input': 'required name=search_term_string'
            }
          }
        ]
      });
    }
  }, [title, description, review, guide, category, settings, canonicalUrl, noIndex]);

  return null;
};
