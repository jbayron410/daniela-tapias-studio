import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllHeadpiecesAdmin,
  addHeadpiece,
  updateHeadpiece,
  deleteHeadpiece,
  uploadHeadpieceImage,
} from '../../api/headpieces';
import { slugify } from '../../utils/slugify';
import ConfirmModal from './ConfirmModal';
import '../../styles/admin.css';
import '../../styles/headpieces.css';

function formatPriceCOP(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(price || 0);
}

const emptyForm = {
  name: '',
  slug: '',
  price: '',
  description: '',
  cloudinaryUrl: '',
  active: true,
  featured: false,
};

export default function HeadpieceManager() {
  const [headpieces, setHeadpieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Uploading state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Delete confirmation
  const [itemToDelete, setItemToDelete] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllHeadpiecesAdmin();
      setHeadpieces(data);
    } catch (err) {
      setError(err.message || 'Error al cargar los tocados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      slug: item.slug,
      price: item.price,
      description: item.description,
      cloudinaryUrl: item.cloudinaryUrl || '',
      active: item.active !== false,
      featured: Boolean(item.featured),
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: newName,
      slug: prev.slug === slugify(prev.name) || !prev.slug ? slugify(newName) : prev.slug,
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setFormError(null);

    try {
      const result = await uploadHeadpieceImage(file, (percent) => {
        setUploadProgress(percent);
      });
      setFormData((prev) => ({
        ...prev,
        cloudinaryUrl: result.cloudinaryUrl,
      }));
    } catch (err) {
      setFormError(err.message || 'Error al subir la imagen a Cloudinary');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('El nombre del tocado es obligatorio');
      return;
    }
    if (!formData.cloudinaryUrl) {
      setFormError('Debes subir una fotografía para el tocado');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || slugify(formData.name),
        price: Number(formData.price) || 0,
        description: formData.description.trim(),
        cloudinaryUrl: formData.cloudinaryUrl,
        active: formData.active,
        featured: formData.featured,
      };

      if (editingItem) {
        await updateHeadpiece(editingItem.id, payload);
      } else {
        await addHeadpiece(payload);
      }

      setShowModal(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Error al guardar el tocado');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const newActive = !item.active;
      await updateHeadpiece(item.id, { active: newActive });
      setHeadpieces((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, active: newActive } : i))
      );
    } catch (err) {
      alert(`Error al actualizar estado: ${err.message}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteHeadpiece(itemToDelete.id);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const filteredItems = headpieces.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.slug.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term)
    );
  });

  const activeCount = headpieces.filter((i) => i.active).length;

  return (
    <div className="admin-headpieces-container">
      {/* Header Bar */}
      <div className="admin-headpieces-header">
        <div>
          <h2>Catálogo de Tocados ({headpieces.length})</h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: 4 }}>
            Gestiona los tocados que se muestran en la tienda pública (
            <span style={{ color: '#059669', fontWeight: 600 }}>{activeCount} disponibles</span>
            ).
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="admin-action-btn admin-action-primary"
            onClick={handleOpenCreate}
          >
            ➕ Nuevo Tocado
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Buscar tocado por nombre o referencia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: 400,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            fontSize: '0.92rem',
          }}
        />
      </div>

      {/* Error or Loading banner */}
      {error && (
        <div
          className="admin-error-banner"
          style={{
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 12,
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            padding: '16px 20px',
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>
              {error.toLowerCase().includes('permission')
                ? '⚠️ Permisos pendientes en Firebase Console'
                : `⚠️ ${error}`}
            </span>
            <button
              onClick={loadData}
              style={{
                background: '#d97706',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Reintentar
            </button>
          </div>

          {error.toLowerCase().includes('permission') && (
            <div style={{ fontSize: '0.88rem', lineHeight: 1.5, color: '#78350f', width: '100%' }}>
              <p style={{ marginBottom: 8 }}>
                La base de datos de Firebase no tiene habilitada la nueva colección <code>headpieces</code> en sus Reglas de Seguridad. Para activarla:
              </p>
              <ol style={{ paddingLeft: 20, marginBottom: 12 }}>
                <li>Abre tu <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#b45309', textDecoration: 'underline', fontWeight: 600 }}>Firebase Console</a> y selecciona tu proyecto.</li>
                <li>Ve a <strong>Firestore Database</strong> &rarr; pestaña <strong>Reglas (Rules)</strong>.</li>
                <li>Agrega esta regla junto a la de <code>gallery</code>:</li>
              </ol>
              <pre
                style={{
                  background: '#1e293b',
                  color: '#f8fafc',
                  padding: '12px 16px',
                  borderRadius: 6,
                  fontSize: '0.82rem',
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                }}
              >
{`match /headpieces/{document=**} {
  allow read: if true;
  allow write: if request.auth != null;
}`}
              </pre>
              <p style={{ marginTop: 8 }}>
                Luego haz clic en <strong>Publicar (Publish)</strong> y presiona el botón <strong>Reintentar</strong> arriba.
              </p>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280' }}>
          Cargando catálogo de tocados...
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280' }}>
          No se encontraron tocados en el catálogo. ¡Agrega el primero!
        </div>
      ) : (
        <div className="admin-headpieces-grid">
          {filteredItems.map((item) => (
            <div key={item.id} className="admin-headpiece-item">
              <div className="admin-headpiece-thumb">
                <img src={item.url} alt={item.name} loading="lazy" />
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 12,
                    background: item.active ? '#10b981' : '#ef4444',
                    color: '#fff',
                  }}
                >
                  {item.active ? 'Disponible' : 'Agotado'}
                </span>
                {item.featured && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 12,
                      background: '#d4af37',
                      color: '#fff',
                    }}
                  >
                    ⭐ Destacado
                  </span>
                )}
              </div>

              <div className="admin-headpiece-details">
                <div className="admin-headpiece-name">{item.name}</div>
                <div className="admin-headpiece-slug">/tocados/{item.slug}</div>
                <div className="admin-headpiece-price">{formatPriceCOP(item.price)}</div>

                <div className="admin-headpiece-actions">
                  <button
                    className="admin-btn-action"
                    onClick={() => handleOpenEdit(item)}
                  >
                    Editar
                  </button>
                  <button
                    className="admin-btn-action"
                    onClick={() => handleToggleActive(item)}
                    title={item.active ? 'Marcar como agotado' : 'Marcar como disponible'}
                  >
                    {item.active ? 'Ocultar' : 'Activar'}
                  </button>
                  <a
                    href={`/tocados/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn-action"
                    style={{ textDecoration: 'none' }}
                  >
                    Ver web
                  </a>
                  <button
                    className="admin-btn-action admin-btn-delete"
                    onClick={() => setItemToDelete(item)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{editingItem ? 'Editar Tocado' : 'Nuevo Tocado'}</h3>
              <button
                className="modal-close"
                onClick={() => !saving && setShowModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="modal-form">
              {formError && (
                <div className="login-error" style={{ marginBottom: 16 }}>
                  {formError}
                </div>
              )}

              <div className="modal-field">
                <label>Nombre del tocado *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Tiara Cristal Imperial"
                  value={formData.name}
                  onChange={handleNameChange}
                />
              </div>

              <div className="modal-field">
                <label>
                  Enlace de referencia (Slug) *
                  <small style={{ color: '#6b7280', display: 'block', fontSize: '0.8rem' }}>
                    Se usará en WhatsApp: <code>danielatapias.com/tocados/{formData.slug || 'nombre'}</code>
                  </small>
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                  }
                  placeholder="tiara-cristal-imperial"
                />
              </div>

              <div className="modal-field">
                <label>Precio de venta (COP) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  placeholder="Ej: 85000"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                />
              </div>

              <div className="modal-field">
                <label>Descripción y detalles</label>
                <textarea
                  rows="3"
                  placeholder="Materiales, para qué peinados combina, detalles especiales..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>

              {/* Imagen */}
              <div className="modal-field">
                <label>Fotografía del tocado *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>
                      Subiendo a Cloudinary: {uploadProgress}%
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {formData.cloudinaryUrl && (
                  <div className="image-upload-preview">
                    <img
                      src={
                        formData.cloudinaryUrl.startsWith('http')
                          ? formData.cloudinaryUrl
                          : `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}${formData.cloudinaryUrl}`
                      }
                      alt="Preview"
                    />
                  </div>
                )}
              </div>

              {/* Opciones */}
              <div style={{ display: 'flex', gap: 20, margin: '14px 0' }}>
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, active: e.target.checked }))
                    }
                  />
                  Disponible para venta
                </label>

                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, featured: e.target.checked }))
                    }
                  />
                  ⭐ Tocado destacado
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-secondary"
                  disabled={saving || uploading}
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-primary"
                  disabled={saving || uploading}
                >
                  {saving ? 'Guardando...' : editingItem ? 'Actualizar Tocado' : 'Crear Tocado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {itemToDelete && (
        <ConfirmModal
          title="Eliminar Tocado"
          message={`¿Estás segura de eliminar el tocado "${itemToDelete.name}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          confirmClass="btn-danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setItemToDelete(null)}
        />
      )}
    </div>
  );
}
