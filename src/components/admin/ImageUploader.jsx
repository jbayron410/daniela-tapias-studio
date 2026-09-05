import { useState, useRef } from 'react';
import { uploadToCloudinary, addGalleryImage } from '../../api/gallery';
import { CATEGORIES } from '../../data/services';

export default function ImageUploader({ onUploaded, onCancel, initialCategory }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [category, setCategory] = useState(initialCategory || CATEGORIES[0].id);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const isImage = selected.type.startsWith('image/');
    const isVideo = selected.type === 'video/mp4';
    if (!isImage && !isVideo) {
      setError('Solo se permiten imágenes y videos MP4');
      return;
    }

    setFile(selected);
    setError(null);

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const result = await uploadToCloudinary(file, setProgress);

      await addGalleryImage({
        cloudinaryUrl: result.cloudinaryUrl,
        category,
        isVideo: result.isVideo,
        order: Date.now(),
      });

      setFile(null);
      setPreview(null);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
      onUploaded();
    } catch (err) {
      setError(err.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      const fakeEvent = { target: { files: [dropped] } };
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div className="image-uploader">
      <h3>Subir nueva imagen</h3>

      {error && <div className="uploader-error">{error}</div>}

      <div className="uploader-category">
        <label>Categoría</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={uploading}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div
        className="uploader-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/mp4"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={uploading}
        />
        {preview ? (
          <img src={preview} alt="Preview" className="uploader-preview" />
        ) : file ? (
          <div className="uploader-file-info">
            <span className="uploader-file-icon">🎬</span>
            <span>{file.name}</span>
          </div>
        ) : (
          <div className="uploader-placeholder">
            <span className="uploader-icon">+</span>
            <span>Arrastra una imagen aquí o haz clic para seleccionar</span>
          </div>
        )}
      </div>

      {uploading && (
        <div className="uploader-progress">
          <div
            className="uploader-progress-bar"
            style={{ width: `${progress}%` }}
          />
          <span className="uploader-progress-text">{progress}%</span>
        </div>
      )}

      <div className="uploader-actions">
        <button
          className="admin-action-btn admin-action-secondary"
          onClick={onCancel}
          disabled={uploading}
        >
          Cancelar
        </button>
        <button
          className="admin-action-btn admin-action-primary"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? 'Subiendo...' : 'Subir imagen'}
        </button>
      </div>
    </div>
  );
}
