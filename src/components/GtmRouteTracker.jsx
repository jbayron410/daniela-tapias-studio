import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/gtm';

/**
 * Listens to route changes and automatically reports virtual page views to Google Tag Manager.
 * Handles SPA navigation across client-side routes.
 */
export default function GtmRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    // Allow react-helmet-async / document.title to update before capturing the title
    const timer = setTimeout(() => {
      const fullPath = location.pathname + location.search + location.hash;
      const currentTitle = typeof document !== 'undefined' ? document.title : '';
      trackPageView(fullPath, currentTitle);
    }, 100);

    return () => clearTimeout(timer);
  }, [location]);

  return null;
}
