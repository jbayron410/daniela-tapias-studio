import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { fetchHeadpieces } from '../api/headpieces';
import '../styles/headpieces.css';

const WHATSAPP_NUMBER = '573216646983';
const SITE_DOMAIN = 'https://www.danielatapias.com';

function formatPriceCOP(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(price || 0);
}

export default function Tocados() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [headpieces, setHeadpieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos'); // 'todos' | 'destacados' | 'disponibles'
  const [copiedSlug, setCopiedSlug] = useState(false);

  // Load headpieces catalog
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const items = await fetchHeadpieces();
        if (isMounted) {
          setHeadpieces(items);
        }
      } catch (err) {
        console.error('Failed to load headpieces:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync selected item with URL slug param
  useEffect(() => {
    if (slug && headpieces.length > 0) {
      const match = headpieces.find(
        (item) => item.slug === slug || item.id === slug
      );
      if (match) {
        setSelectedItem(match);
      }
    } else if (!slug) {
      setSelectedItem(null);
    }
  }, [slug, headpieces]);

  const handleOpenDetail = useCallback((item) => {
    setSelectedItem(item);
    navigate(`/tocados/${item.slug}`, { replace: false });
  }, [navigate]);

  const handleCloseDetail = useCallback(() => {
    setSelectedItem(null);
    setCopiedSlug(false);
    navigate('/tocados', { replace: true });
  }, [navigate]);

  const handleCopyLink = (item) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : SITE_DOMAIN;
    const itemUrl = `${origin}/tocados/${item.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(itemUrl).then(() => {
        setCopiedSlug(true);
        setTimeout(() => setCopiedSlug(false), 2500);
      });
    }
  };

  const buildWhatsAppLink = (item) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : SITE_DOMAIN;
    const itemUrl = `${origin}/tocados/${item.slug}`;
    const priceText = formatPriceCOP(item.price);

    const message =
      `Hola Daniela, me encantó este tocado del Catálogo de Tocados:\n\n` +
      `✨ *${item.name}*\n` +
      `💰 Valor: ${priceText} COP\n` +
      `🔗 Ver referencia: ${itemUrl}\n\n` +
      `¿Aún se encuentra disponible?`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const filteredItems = useMemo(() => {
    return headpieces.filter((item) => {
      // Status/Tag filters
      if (activeFilter === 'destacados' && !item.featured) return false;
      if (activeFilter === 'disponibles' && !item.active) return false;

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = (item.description || '').toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    });
  }, [headpieces, activeFilter, searchTerm]);

  // Dynamic SEO metadata
  const seoTitle = selectedItem
    ? `${selectedItem.name} | Catálogo de Tocados`
    : 'Catálogo de Tocados | Accesorios Exclusivos';
  const seoDesc = selectedItem
    ? selectedItem.description || `Tocado exclusivo ${selectedItem.name} en Daniela Tapias Studio.`
    : 'Descubre nuestra colección de tocados artesanales y accesorios para novias, quinceañeras y eventos especiales en Cartago, Valle del Cauca.';
  const seoImage = selectedItem?.url;
  const seoPath = selectedItem ? `/tocados/${selectedItem.slug}` : '/tocados';

  return (
    <div className="headpieces-page">
      <SEO
        title={seoTitle}
        description={seoDesc}
        path={seoPath}
        image={seoImage}
      />

      <Navbar />

      {/* Hero Header */}
      <header className="headpieces-hero">
        <div className="container">
          <span className="headpieces-badge">Colección Exclusiva</span>
          <h1>Catálogo de Tocados</h1>
          <p>
            Piezas artesanales cuidadosamente seleccionadas para complementar tu
            peinado. Diseños únicos para novias, quinceañeras y ocasiones
            inolvidables.
          </p>
        </div>
      </header>

      {/* Main Catalog Section */}
      <main className="container">
        {/* Controls: Search and Filters */}
        <div className="headpieces-controls">
          <div className="headpieces-search">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M10 2a8 8 0 015.292 13.998l4.854 4.855a1 1 0 01-1.414 1.414l-4.855-4.854A8 8 0 1110 2zm0 2a6 6 0 100 12 6 6 0 000-12z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por estilo o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="headpieces-filter-pills">
            <button
              className={`filter-pill ${activeFilter === 'todos' ? 'active' : ''}`}
              onClick={() => setActiveFilter('todos')}
            >
              Todos ({headpieces.length})
            </button>
            <button
              className={`filter-pill ${activeFilter === 'destacados' ? 'active' : ''}`}
              onClick={() => setActiveFilter('destacados')}
            >
              ⭐ Destacados
            </button>
            <button
              className={`filter-pill ${activeFilter === 'disponibles' ? 'active' : ''}`}
              onClick={() => setActiveFilter('disponibles')}
            >
              Disponibles
            </button>
          </div>
        </div>

        {/* Headpieces Grid */}
        {loading ? (
          <div className="headpieces-empty">
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p>Cargando catálogo de tocados...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="headpieces-empty">
            <p>No encontramos tocados que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          <div className="headpieces-grid">
            {filteredItems.map((item) => (
              <article key={item.id} className="headpiece-card">
                {/* Image Wrap */}
                <div
                  className="headpiece-image-wrap"
                  onClick={() => handleOpenDetail(item)}
                >
                  <img
                    src={item.url}
                    alt={item.name}
                    loading="lazy"
                  />
                  <div className="headpiece-badges">
                    {item.featured ? (
                      <span className="badge-featured">⭐ Destacado</span>
                    ) : <span />}
                    {!item.active && (
                      <span className="badge-status-out">Agotado</span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="headpiece-card-body">
                  <h3
                    className="headpiece-card-title"
                    onClick={() => handleOpenDetail(item)}
                  >
                    {item.name}
                  </h3>

                  <div className="headpiece-card-price">
                    {formatPriceCOP(item.price)}
                    <small>COP</small>
                  </div>

                  {item.description && (
                    <p className="headpiece-card-desc">{item.description}</p>
                  )}

                  <div className="headpiece-card-actions">
                    <a
                      href={buildWhatsAppLink(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp-order"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path
                          fill="currentColor"
                          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                        />
                      </svg>
                      Pedir por WhatsApp
                    </a>

                    <button
                      type="button"
                      className="btn-details"
                      onClick={() => handleOpenDetail(item)}
                      title="Ver detalles"
                    >
                      Detalle
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Headpiece Detail Lightbox / Modal */}
      {selectedItem && (
        <div
          className="headpiece-modal-overlay"
          onClick={handleCloseDetail}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="headpiece-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="headpiece-modal-close"
              onClick={handleCloseDetail}
              aria-label="Cerrar modal"
            >
              &times;
            </button>

            <div className="headpiece-modal-grid">
              <div className="headpiece-modal-media">
                <img
                  src={selectedItem.url}
                  alt={selectedItem.name}
                />
              </div>

              <div className="headpiece-modal-content">
                <span className="headpiece-modal-tag">
                  {selectedItem.featured ? '⭐ Tocado Destacado' : 'Tocado Exclusivo'}
                </span>

                <h2 className="headpiece-modal-title">{selectedItem.name}</h2>

                <div className="headpiece-modal-price">
                  {formatPriceCOP(selectedItem.price)} <span className="cop-label">COP</span>
                </div>

                <p className="headpiece-modal-desc">
                  {selectedItem.description ||
                    'Un tocado romántico y atemporal que destaca por sus delicados detalles. Su flexibilidad permite adaptarlo maravillosamente tanto a recogidos altos como a trenzas o peinados de lado. Transmite una elegancia pura y natural.'}
                </p>

                {/* Reference Link Box */}
                <div className="headpiece-ref-box">
                  <div className="headpiece-ref-title">
                    🔗 Referencia oficial:
                  </div>
                  <div className="headpiece-ref-link">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/tocados/${selectedItem.slug}`
                      : `${SITE_DOMAIN}/tocados/${selectedItem.slug}`}
                  </div>
                </div>

                <div className="headpiece-modal-actions">
                  <a
                    href={buildWhatsAppLink(selectedItem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp-order"
                    style={{ padding: '14px', fontSize: '1rem' }}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path
                        fill="currentColor"
                        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                      />
                    </svg>
                    Pedir este tocado por WhatsApp
                  </a>

                  <button
                    type="button"
                    className="btn-copy-link"
                    onClick={() => handleCopyLink(selectedItem)}
                  >
                    {copiedSlug ? '✓ ¡Enlace copiado al portapapeles!' : '📋 Copiar enlace del tocado'}
                  </button>
                </div>

                {/* Cross-selling hint */}
                <div className="headpiece-cross-sell">
                  <span>¿Deseas lucirlo con un peinado profesional?</span>
                  <Link to="/agendar">Agendar cita &rarr;</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
