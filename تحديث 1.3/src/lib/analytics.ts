// Google Analytics and Meta Pixel Integration for Etizan Platform
// Handles all tracking events for marketing and analytics

// Meta Pixel Configuration
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || 'YOUR_PIXEL_ID';

// Google Analytics Configuration
const GA_ID = import.meta.env.VITE_GA_ID || 'G-XXXXXXXXXX';

// Type declarations for global window object
declare global {
  interface Window {
    fbq: any;
    gtag: any;
    dataLayer: any[];
  }
}

// Initialize Meta Pixel
export function initMetaPixel() {
  if (typeof window === 'undefined') return;
  
  // Only initialize if not already done
  if (window.fbq) return;
  
  // Meta Pixel Base Code
  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
  `;
  document.head.appendChild(script);
  
  // Initialize with your Pixel ID
  if (META_PIXEL_ID && META_PIXEL_ID !== 'YOUR_PIXEL_ID') {
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }
}

// Initialize Google Analytics
export function initGoogleAnalytics() {
  if (typeof window === 'undefined') return;
  
  if (window.gtag) return;
  
  // Google Analytics Script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
  
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    page_title: document.title,
    page_location: window.location.href,
    send_page_view: true
  });
}

// Meta Pixel Event Tracking
export const metaPixel = {
  // Page View
  pageView: () => {
    if (window.fbq) window.fbq('track', 'PageView');
  },
  
  // View Content (Product Page)
  viewContent: (params: {
    content_ids: string[];
    content_type: string;
    value?: number;
    currency?: string;
  }) => {
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: params.content_ids,
        content_type: params.content_type,
        value: params.value,
        currency: params.currency || 'IQD'
      });
    }
  },
  
  // Add to Cart
  addToCart: (params: {
    content_ids: string[];
    content_type: string;
    value: number;
    currency?: string;
  }) => {
    if (window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_ids: params.content_ids,
        content_type: params.content_type,
        value: params.value,
        currency: params.currency || 'IQD'
      });
    }
  },
  
  // Initiate Checkout
  initiateCheckout: (params: {
    content_ids: string[];
    value: number;
    currency?: string;
  }) => {
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_ids: params.content_ids,
        value: params.value,
        currency: params.currency || 'IQD'
      });
    }
  },
  
  // Purchase
  purchase: (params: {
    content_ids: string[];
    content_type: string;
    value: number;
    currency?: string;
    order_id?: string;
  }) => {
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        content_ids: params.content_ids,
        content_type: params.content_type,
        value: params.value,
        currency: params.currency || 'IQD',
        order_id: params.order_id
      });
    }
  },
  
  // Custom Events
  custom: (eventName: string, params?: any) => {
    if (window.fbq) {
      window.fbq('trackCustom', eventName, params);
    }
  }
};

// Google Analytics Event Tracking
export const ga = {
  // Page View
  pageView: (pagePath?: string) => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: pagePath || window.location.pathname,
        page_location: window.location.href,
        page_title: document.title
      });
    }
  },
  
  // E-commerce Events
  viewItem: (item: any) => {
    if (window.gtag) {
      window.gtag('event', 'view_item', {
        items: [item]
      });
    }
  },
  
  addToCart: (item: any) => {
    if (window.gtag) {
      window.gtag('event', 'add_to_cart', {
        items: [item]
      });
    }
  },
  
  beginCheckout: (items: any[], value: number) => {
    if (window.gtag) {
      window.gtag('event', 'begin_checkout', {
        items,
        value
      });
    }
  },
  
  purchase: (transaction: any) => {
    if (window.gtag) {
      window.gtag('event', 'purchase', transaction);
    }
  },
  
  // Custom Event
  event: (eventName: string, params?: any) => {
    if (window.gtag) {
      window.gtag('event', eventName, params);
    }
  }
};

// Initialize all analytics on app start
export function initAnalytics() {
  initMetaPixel();
  initGoogleAnalytics();
}

// Track user interactions
export function trackInteraction(action: string, category: string, label?: string) {
  ga.event(action, {
    event_category: category,
    event_label: label
  });
  
  metaPixel.custom(action, {
    category,
    label
  });
}