import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchAllGalleryItems,
  updateGalleryImage,
  updateGalleryOrder,
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
  const [savingOrder, setSavingOrder] = useState(false);
  const [saveOrderSuccess, setSaveOrderSuccess] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [activeDragIndex, setActiveDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const saveTimeoutRef = useRef(null);
  const pointerDragRef = useRef({
    startIndex: null,
    currentTargetIndex: null,
    pointerId: null,
    isDragging: false,
  });

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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

  const filteredItems = items
    .filter((item) => item.category === activeCategory)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  const categoryCounts = CATEGORIES.map((cat) => ({
    ...cat,
    label: catLabels[cat.id] || cat.label,
    count: items.filter((i) => i.category === cat.id).length,
    activeCount: items.filter((i) => i.category === cat.id && i.active).length,
    enabled: catVisibility[cat.id] === undefined ? true : catVisibility[cat.id],
  }));

  const scheduleSaveOrder = useCallback((orderedItems) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setSavingOrder(true);
    setSaveOrderSuccess(false);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateGalleryOrder(orderedItems);
        setSavingOrder(false);
        setSaveOrderSuccess(true);
        setTimeout(() => setSaveOrderSuccess(false), 2500);
      } catch (err) {
        setSavingOrder(false);
        setError(err.message || 'Error al guardar el nuevo orden');
      }
    }, 600);
  }, []);

  const moveItem = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= filteredItems.length) {
      return;
    }

    const reorderedList = [...filteredItems];
    const [movedItem] = reorderedList.splice(fromIndex, 1);
    reorderedList.splice(toIndex, 0, movedItem);

    // Normalize order index
    const updatedWithOrder = reorderedList.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setItems((prevItems) => {
      const orderMap = new Map(updatedWithOrder.map((it) => [it.id, it.order]));
      return prevItems.map((it) =>
        orderMap.has(it.id) ? { ...it, order: orderMap.get(it.id) } : it
      );
    });

    scheduleSaveOrder(updatedWithOrder);
  };

  const handlePointerDown = (e, index) => {
    if (e.button !== undefined && e.button !== 0) return;

    const pointerId = e.pointerId;
    const handleEl = e.currentTarget;

    try {
      handleEl.setPointerCapture(pointerId);
    } catch (_) {}

    pointerDragRef.current = {
      startIndex: index,
      currentTargetIndex: index,
      pointerId,
      isDragging: true,
    };

    setActiveDragIndex(index);
    setOverIndex(index);

    const onPointerMove = (moveEvent) => {
      if (!pointerDragRef.current.isDragging) return;
      const element = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      if (!element) return;
      const card = element.closest('[data-gallery-index]');
      if (card) {
        const targetIdx = Number(card.getAttribute('data-gallery-index'));
        if (!isNaN(targetIdx)) {
          pointerDragRef.current.currentTargetIndex = targetIdx;
          setOverIndex(targetIdx);
        }
      }
    };

    const onPointerUp = () => {
      try {
        handleEl.releasePointerCapture(pointerId);
      } catch (_) {}

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      const { startIndex, currentTargetIndex, isDragging } = pointerDragRef.current;
      pointerDragRef.current = {
        startIndex: null,
        currentTargetIndex: null,
        pointerId: null,
        isDragging: false,
      };

      setActiveDragIndex(null);
      setOverIndex(null);

      if (
        isDragging &&
        startIndex !== null &&
        currentTargetIndex !== null &&
        startIndex !== currentTargetIndex
      ) {
        moveItem(startIndex, currentTargetIndex);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const handleDragStart = (e, index) => {
    if (isTouchDevice) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    if (isTouchDevice) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    if (isTouchDevice) return;
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      moveItem(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

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
        <div className="gallery-header-info">
          <h2>Galería</h2>
          {savingOrder && (
            <span className="gallery-order-status saving">Guardando orden...</span>
          )}
          {saveOrderSuccess && (
            <span className="gallery-order-status saved">✓ Orden guardado</span>
          )}
        </div>
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
      <p className="gallery-hint">
        Usa el icono ⠿ para arrastrar o las flechas para mover • Doble clic en un título para editarlo
      </p>

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
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              data-gallery-index={index}
              className={`gallery-manager-item ${!item.active ? 'inactive' : ''} ${
                activeDragIndex === index || draggedIndex === index ? 'dragging' : ''
              } ${
                (overIndex === index && activeDragIndex !== null && activeDragIndex !== index) ||
                (dragOverIndex === index && draggedIndex !== null && draggedIndex !== index)
                  ? 'drag-over'
                  : ''
              }`}
              draggable={!isTouchDevice}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="gallery-manager-thumb">
                <div className={`gallery-position-badge ${index === 0 ? 'is-cover' : ''}`}>
                  #{index + 1} {index === 0 && <span className="cover-text">Portada</span>}
                </div>
                <div
                  className="gallery-drag-handle"
                  onPointerDown={(e) => handlePointerDown(e, index)}
                  title="Arrastrar para mover posición"
                  aria-label="Arrastrar"
                >
                  ⠿
                </div>
                {item.isVideo ? (
                  <video src={item.url} muted preload="metadata" />
                ) : (
                  <img src={item.url} alt="" loading="lazy" />
                )}
                {!item.active && (
                  <div className="gallery-manager-overlay">OCULTA</div>
                )}
              </div>

              {/* Touch-first Reordering Toolbar (Ideal for iPhone & Mobile) */}
              <div className="gallery-manager-order-bar">
                <button
                  type="button"
                  className="order-btn"
                  onClick={() => moveItem(index, 0)}
                  disabled={index === 0}
                  title="Mover al inicio (portada)"
                  aria-label="Mover al inicio"
                >
                  ⏮
                </button>
                <button
                  type="button"
                  className="order-btn"
                  onClick={() => moveItem(index, index - 1)}
                  disabled={index === 0}
                  title="Mover una posición atrás"
                  aria-label="Mover una posición atrás"
                >
                  ◀
                </button>
                <span className="order-indicator" title="Posición actual">
                  {index + 1} / {filteredItems.length}
                </span>
                <button
                  type="button"
                  className="order-btn"
                  onClick={() => moveItem(index, index + 1)}
                  disabled={index === filteredItems.length - 1}
                  title="Mover una posición adelante"
                  aria-label="Mover una posición adelante"
                >
                  ▶
                </button>
                <button
                  type="button"
                  className="order-btn"
                  onClick={() => moveItem(index, filteredItems.length - 1)}
                  disabled={index === filteredItems.length - 1}
                  title="Mover al final"
                  aria-label="Mover al final"
                >
                  ⏭
                </button>
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
