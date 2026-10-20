/**
 * Google Tag Manager (GTM) Analytics Utility
 * Provides standardized methods to push events to the dataLayer.
 */

/**
 * Pushes raw event object into the global dataLayer array.
 * Safely guards against server-side rendering or missing window object.
 *
 * @param {Record<string, unknown>} payload
 */
export function pushToDataLayer(payload) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

/**
 * Tracks virtual page views for Single Page Application (SPA) route changes.
 *
 * @param {string} pagePath - e.g. "/tocados" or "/agendar"
 * @param {string} [pageTitle] - Optional title of the page
 */
export function trackPageView(pagePath, pageTitle = '') {
  pushToDataLayer({
    event: 'virtual_page_view',
    page_path: pagePath,
    page_title: pageTitle || (typeof document !== 'undefined' ? document.title : ''),
    page_location: typeof window !== 'undefined' ? window.location.href : ''
  });
}

/**
 * Tracks navigation and header link clicks.
 *
 * @param {string} linkName - e.g. "Inicio", "Galería", "Tocados"
 * @param {string} destination - Target URL or anchor
 * @param {'header' | 'footer' | 'mobile_menu'} [navType='header']
 */
export function trackNavClick(linkName, destination, navType = 'header') {
  pushToDataLayer({
    event: 'navigation_click',
    nav_link_name: linkName,
    nav_destination: destination,
    nav_type: navType
  });
}

/**
 * Tracks call-to-action (CTA) button clicks like "Agenda tu cita".
 *
 * @param {string} ctaName - Name or text of the CTA button
 * @param {string} location - Context or section where the button exists (e.g. "header_desktop", "hero", "about")
 * @param {string} [destination] - Destination anchor or URL
 */
export function trackCtaClick(ctaName, location, destination = '') {
  pushToDataLayer({
    event: 'cta_click',
    cta_name: ctaName,
    cta_location: location,
    cta_destination: destination
  });
}

/**
 * Tracks changes between portfolio/gallery categories ("secciones de los trabajos").
 *
 * @param {string} categoryId - e.g. "novias", "quinceaneras", "sociales"
 * @param {string} [categoryLabel] - Human-readable label
 */
export function trackPortfolioTabChange(categoryId, categoryLabel = '') {
  pushToDataLayer({
    event: 'portfolio_tab_change',
    portfolio_category_id: categoryId,
    portfolio_category_name: categoryLabel || categoryId
  });
}

/**
 * Tracks clicks on portfolio gallery items to view full-size media in the lightbox.
 *
 * @param {string} itemUrl - Image or video URL
 * @param {string} categoryId - Category of the item
 * @param {boolean} isVideo - Whether the item is a video
 */
export function trackPortfolioItemView(itemUrl, categoryId, isVideo = false) {
  pushToDataLayer({
    event: 'portfolio_item_view',
    media_url: itemUrl,
    portfolio_category_id: categoryId,
    media_type: isVideo ? 'video' : 'image'
  });
}

/**
 * Tracks service selection when browsing service cards.
 *
 * @param {string} serviceId
 * @param {string} serviceName
 * @param {number} [price]
 */
export function trackServiceSelect(serviceId, serviceName, price = 0) {
  pushToDataLayer({
    event: 'select_service',
    service_id: serviceId,
    service_name: serviceName,
    service_price: price
  });
}

/**
 * Tracks initiation of booking process.
 *
 * @param {string} source - Where the booking was initiated from ("navbar", "hero", "services", "about")
 */
export function trackBookingStart(source) {
  pushToDataLayer({
    event: 'begin_booking',
    booking_source: source
  });
}

/**
 * Tracks booking form submission and outcome.
 *
 * @param {object} params
 * @param {string} params.serviceName
 * @param {number} params.price
 * @param {boolean} params.isHomeService
 * @param {boolean} params.requiresMakeup
 * @param {boolean} params.requiresTrial
 * @param {boolean} params.success
 * @param {string} [params.errorMessage]
 */
export function trackBookingSubmit({
  serviceName,
  price,
  isHomeService,
  requiresMakeup,
  requiresTrial,
  success,
  errorMessage = ''
}) {
  pushToDataLayer({
    event: 'booking_submit',
    service_name: serviceName,
    service_price: price,
    is_home_service: isHomeService,
    requires_makeup: requiresMakeup,
    requires_trial: requiresTrial,
    booking_status: success ? 'success' : 'error',
    error_message: errorMessage || undefined
  });
}

/**
 * Tracks when a user opens or inspects a headpiece item detail ("cuando vean los tocados").
 *
 * @param {object} params
 * @param {string} params.id
 * @param {string} params.name
 * @param {string} params.slug
 * @param {boolean} [params.featured]
 * @param {boolean} [params.active]
 */
export function trackHeadpieceView({ id, name, slug, featured = false, active = true }) {
  pushToDataLayer({
    event: 'view_headpiece',
    headpiece_id: id,
    headpiece_name: name,
    headpiece_slug: slug,
    is_featured: featured,
    is_available: active
  });
}

/**
 * Tracks filtering actions in the headpieces catalog.
 *
 * @param {string} filterName - 'todos' | 'destacados' | 'disponibles'
 */
export function trackHeadpieceFilter(filterName) {
  pushToDataLayer({
    event: 'filter_headpieces',
    headpiece_filter: filterName
  });
}

/**
 * Tracks search query execution on the headpieces catalog.
 *
 * @param {string} searchTerm
 */
export function trackHeadpieceSearch(searchTerm) {
  if (!searchTerm || !searchTerm.trim()) return;
  pushToDataLayer({
    event: 'search_headpieces',
    search_term: searchTerm.trim()
  });
}

/**
 * Tracks WhatsApp order button click for a specific headpiece.
 *
 * @param {string} headpieceName
 * @param {string} headpieceSlug
 */
export function trackHeadpieceWhatsAppOrder(headpieceName, headpieceSlug) {
  pushToDataLayer({
    event: 'headpiece_whatsapp_order',
    headpiece_name: headpieceName,
    headpiece_slug: headpieceSlug
  });
}

/**
 * Tracks headpiece reference link copying.
 *
 * @param {string} headpieceSlug
 */
export function trackHeadpieceCopyLink(headpieceSlug) {
  pushToDataLayer({
    event: 'headpiece_copy_link',
    headpiece_slug: headpieceSlug
  });
}

/**
 * Tracks general WhatsApp direct contact button clicks across the site.
 *
 * @param {string} source - e.g. "navbar", "footer", "booking_info", "standalone_banner", "linktree"
 * @param {string} [contextLabel] - Optional additional context or message intent
 */
export function trackWhatsAppClick(source, contextLabel = '') {
  pushToDataLayer({
    event: 'whatsapp_click',
    whatsapp_source: source,
    whatsapp_context: contextLabel
  });
}
