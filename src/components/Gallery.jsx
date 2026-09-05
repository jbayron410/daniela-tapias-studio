import { useState, useEffect } from 'react';
import { CATEGORIES } from '../data/services';
import { fetchGallery, fetchCategoryVisibility, fetchCategoryLabels } from '../api/gallery';

const MOBILE_BREAKPOINT = 767;
const TABLET_BREAKPOINT = 1024;
const ITEMS_PER_PAGE_MOBILE = 4;
const ITEMS_PER_PAGE_TABLET = 3;

function useViewport() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT
  );
  const [isTablet, setIsTablet] = useState(
    typeof window !== 'undefined' &&
      window.innerWidth > MOBILE_BREAKPOINT &&
      window.innerWidth <= TABLET_BREAKPOINT
  );

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w <= MOBILE_BREAKPOINT);
      setIsTablet(w > MOBILE_BREAKPOINT && w <= TABLET_BREAKPOINT);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile, isTablet };
}

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('sociales');
  const [lightboxItem, setLightboxItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [gallery, setGallery] = useState(null);
  const [categoryVisibility, setCategoryVisibility] = useState(null);
  const [categoryLabels, setCategoryLabels] = useState({});
  const [loading, setLoading] = useState(true);
  const { isMobile, isTablet } = useViewport();

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchGallery(), fetchCategoryVisibility(), fetchCategoryLabels()])
      .then(([galleryData, visibility, labels]) => {
        if (cancelled) return;
        setGallery(galleryData);
        setCategoryVisibility(visibility);
        setCategoryLabels(labels);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setGallery({});
          setCategoryVisibility({});
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const getCatLabel = (cat) => categoryLabels[cat.id] || cat.label;

  const enabledCategories = CATEGORIES.filter((cat) => {
    if (!categoryVisibility) return false;
    const val = categoryVisibility[cat.id];
    return val === undefined ? true : val;
  });

  const activeGallery = gallery || {};
  const items = (activeGallery[activeCategory] || []).map((item) => item.url);
  const shouldPaginate = isMobile || isTablet;
  const itemsPerPage = isMobile
    ? ITEMS_PER_PAGE_MOBILE
    : isTablet
      ? ITEMS_PER_PAGE_TABLET
      : items.length;

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const paginatedItems = shouldPaginate
    ? items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : items;

  // Si cambia el viewport y la página actual se pasa del total, ajustarla
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const isVideo = (src) => src.endsWith('.mp4');

  const handleClose = () => setLightboxItem(null);

  useEffect(() => {
    if (enabledCategories.length > 0 && !enabledCategories.find((c) => c.id === activeCategory)) {
      setActiveCategory(enabledCategories[0].id);
      setCurrentPage(1);
    }
  }, [enabledCategories, activeCategory]);

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
    // Scroll suave a la galería al cambiar de página
    document.getElementById('galeria')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <section id="galeria" className="section section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Portafolio</span>
            <h2>Nuestros trabajos</h2>
          </div>
          <div className="gallery-loading">
            <div className="spinner" />
          </div>
        </div>
      </section>
    );
  }

  if (enabledCategories.length === 0) return null;

  return (
    <section id="galeria" className="section section-alt">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Portafolio</span>
          <h2>Nuestros trabajos</h2>
          <p>
            Peinados reales realizados en nuestro estudio. Explora las
            diferentes categorías de servicios.
          </p>
        </div>

        {enabledCategories.length > 1 && (
          <div className="gallery-tabs">
            {enabledCategories.map((cat) => (
              <button
                key={cat.id}
                className={`gallery-tab ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat.id)}
              >
                {getCatLabel(cat)}
              </button>
            ))}
          </div>
        )}

        <div className="gallery-grid">
          {paginatedItems.map((src, index) => (
            <div
              key={src}
              className={`gallery-item ${isVideo(src) ? 'video' : ''}`}
              onClick={() => setLightboxItem({ src, index })}
            >
              {isVideo(src) ? (
                <>
                  <video src={src} muted playsInline preload="metadata" />
                  <span className="play-badge">▶</span>
                </>
              ) : (
                <img src={src} alt={`Peinado ${activeCategory}`} loading="lazy" />
              )}
            </div>
          ))}
        </div>

        {shouldPaginate && totalPages > 1 && (
          <div className="gallery-pagination">
            <button
              className="gallery-page-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Página anterior"
            >
              ←
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`gallery-page-btn ${page === currentPage ? 'active' : ''}`}
                onClick={() => goToPage(page)}
                aria-label={`Ir a página ${page}`}
              >
                {page}
              </button>
            ))}

            <button
              className="gallery-page-btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Página siguiente"
            >
              →
            </button>
          </div>
        )}
      </div>

      {lightboxItem && (
        <div className="lightbox" onClick={handleClose}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={handleClose}>
              ✕
            </button>
            {isVideo(lightboxItem.src) ? (
              <video
                src={lightboxItem.src}
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img src={lightboxItem.src} alt={`Peinado ${activeCategory}`} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}