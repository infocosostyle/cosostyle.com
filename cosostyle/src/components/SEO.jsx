import React, { useEffect } from 'react';

export default function SEO({ title, description, image, type = 'website', jsonLd }) {
  useEffect(() => {
    // 1. Update Title
    const formattedTitle = title ? `${title} | CosoStyle` : 'CosoStyle | Heavyweight Cotton Apparel';
    document.title = formattedTitle;

    // Helper to set meta tags
    const setMetaTag = (nameOrProperty, value, isProperty = false) => {
      if (!value) return;
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${nameOrProperty}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, nameOrProperty);
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    // 2. Set description meta tags
    const finalDesc = description || 'Premium 240 GSM heavyweight combed ringspun cotton tees in limited runs. Designed in our studio, built to outlast trends.';
    setMetaTag('description', finalDesc);
    setMetaTag('og:description', finalDesc, true);
    setMetaTag('twitter:description', finalDesc);

    // 3. Set Open Graph & Twitter Titles
    setMetaTag('og:title', formattedTitle, true);
    setMetaTag('twitter:title', formattedTitle);
    setMetaTag('og:type', type, true);

    // 4. Set Image meta tags
    const finalImage = image || '/src/assets/hero.png';
    setMetaTag('og:image', finalImage, true);
    setMetaTag('twitter:image', finalImage);
    setMetaTag('twitter:card', 'summary_large_image');

    // 5. Inject Structured JSON-LD Data
    let scriptElement = document.getElementById('seo-jsonld');
    if (scriptElement) {
      scriptElement.remove();
    }

    if (jsonLd) {
      scriptElement = document.createElement('script');
      scriptElement.id = 'seo-jsonld';
      scriptElement.type = 'application/ld+json';
      scriptElement.innerHTML = JSON.stringify(jsonLd);
      document.head.appendChild(scriptElement);
    }

    return () => {
      // Clean up dynamic JSON-LD on unmount
      const scriptToRemove = document.getElementById('seo-jsonld');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [title, description, image, type, jsonLd]);

  return null;
}
