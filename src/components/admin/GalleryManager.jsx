import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllGalleryItems,
  updateGalleryImage,
  deleteGalleryImage,
  fetchCategoryVisibility,
  updateCategoryVisibility,
  fetchCategoryLabels,
  updateCategoryLabel,
} from '../../api/gallery';
import { CATEGORIES } from '../../data/services';
import ImageUploader from './ImageUploader';

export default function GalleryManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('sociales');
  const [showUploader, setShowUploader] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [catVisibility, setCatVisibility] = useState({});
  const [catLabels, setCatLabels] = useState({});
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [editingLabelValue, setEditingLabelValue] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, visibility, labels] = await Promise.all([
        fetchAllGalleryItems(),
        fetchCategoryVisibility(),
        fetchCategoryLabels(),
      ]);
      setItems(data);
      setCatVisibility(visibility);
      setCatLabels(labels);
    } catch (err) {
      setError(err.message || 'Error al cargar la galería');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = items.filter((item) => item.category === activeCategory);
  const categoryCounts = CATEGORIES.map((cat) => ({
    ...cat,
    label: catLabels[cat.id] || cat.label,
    count: items.filter((i) => i.category === cat.id).length,
    activeCount: items.filter((i) => i.category === cat.id && i.active).length,
    enabled: catVisibility[cat.id] === undefined ? true : catVisibility[cat.id],
  }));

  const handleStartEditLabel = (catId, currentLabel) => {
    setEditingLabelId(catId);
    setEditingLabelValue(currentLabel);
  };

  const handleSaveLabel = async (catId) => {
    const trimmed = editingLabelValue.trim();
    if (!trimmed) return;
    setCatLabels((prev) => ({ ...prev, [catId]: trimmed }));
    setEditingLabelId(null);
    try {
      await updateCategoryLabel(catId, trimmed, catLabels);
    } catch {
      setCatLabels((prev) => ({ ...prev, [catId]: catLabels[catId] || '' }));
    }
  };

  const handleToggleCategory = async (catId, currentlyEnabled) => {
    const newEnabled = !currentlyEnabled;
    setCatVisibility((prev) => ({ ...prev, [catId]: newEnabled }));
    try {
      const updated = await updateCategoryVisibility(catId, newEnabled, catVisibility);
      setCatVisibility(updated);
    } catch {
      setCatVisibility((prev) => ({ ...prev, [catId]: currentlyEnabled }));
    }
  };

  const handleToggleActive = async (item) => {
    const newActive = !item.active;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, active: newActive } : i))
    );
    try {
      await updateGalleryImage(item.id, { active: newActive });
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, active: item.active } : i))
      );
    }
  };

  const handleDelete = async (item) => {
    setDeletingId(item.id);
    try {
      await deleteGalleryImage(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      setError(err.message || 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploaded = () => {
    setShowUploader(false);
    loadItems();
  };

  if (showUploader) {
    return (
      <ImageUploader
        onUploaded={handleUploaded}
        onCancel={() => setShowUploader(false)}
        initialCategory={activeCategory}
      />
    );
  }

  return (
    <div className="gallery-manager">
      <div className="gallery-manager-header">
        <h2>Galería</h2>
        <button
          className="admin-action-btn admin-action-primary"
          onClick={() => setShowUploader(true)}
        >
          + Subir imagen
        </button>
      </div>

      {error && (
        <div className="admin-error-banner">
          <span>{error}</span>
          <button onClick={loadItems}>Reintentar</button>
        </div>
      )}

      <div className="gallery-manager-tabs">
        {categoryCounts.map((cat) => (
          <div key={cat.id} className="gallery-manager-tab-wrap">
            <button
              className={`gallery-manager-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {editingLabelId === cat.id ? (
                <input
                  className="tab-label-input"
                  value={editingLabelValue}
                  onChange={(e) => setEditingLabelValue(e.target.value)}
                  onBlur={() => handleSaveLabel(cat.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingLabelId(null); }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="tab-label-text"
                  onDoubleClick={(e) => { e.stopPropagation(); handleStartEditLabel(cat.id, cat.label); }}
                  title="Doble clic para editar el título"
                >
                  {cat.label}
                </span>
              )}
              <span className="tab-count">
                {cat.activeCount}/{cat.count}
              </span>
            </button>
            <button
              className={`cat-visibility-btn ${cat.enabled ? 'enabled' : 'disabled'}`}
              onClick={(e) => { e.stopPropagation(); handleToggleCategory(cat.id, cat.enabled); }}
              title={cat.enabled ? 'Ocultar categoría del sitio' : 'Mostrar categoría en el sitio'}
            >
              {cat.enabled ? '👁' : '👁‍🗨'}
            </button>
          </div>
        ))}
      </div>
      <p className="gallery-hint">Doble clic en un título para editarlo</p>

      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
          <p>Cargando galería...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="gallery-empty">
          <p>No hay imágenes en esta categoría.</p>
          <button
            className="admin-action-btn admin-action-primary"
            onClick={() => setShowUploader(true)}
          >
            Subir primera imagen
          </button>
        </div>
      ) : (
        <div className="gallery-manager-grid">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`gallery-manager-item ${!item.active ? 'inactive' : ''}`}
            >
              <div className="gallery-manager-thumb">
                {item.isVideo ? (
                  <video src={item.url} muted preload="metadata" />
                ) : (
                  <img src={item.url} alt="" loading="lazy" />
                )}
                {!item.active && (
                  <div className="gallery-manager-overlay">OCULTA</div>
                )}
              </div>

              <div className="gallery-manager-controls">
                <button
                  className={`toggle-btn ${item.active ? 'active' : ''}`}
                  onClick={() => handleToggleActive(item)}
                  title={item.active ? 'Ocultar del sitio' : 'Mostrar en el sitio'}
                >
                  <span className="toggle-track">
                    <span className="toggle-thumb" />
                  </span>
                </button>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(item)}
                  disabled={deletingId === item.id}
                  title="Eliminar"
                >
                  {deletingId === item.id ? '...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
