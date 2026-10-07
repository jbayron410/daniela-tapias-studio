import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { toCloudinaryUrl } from './cloudinary';

const COLLECTION = 'gallery';
const CONFIG_DOC = 'settings/gallery_config';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Fetches all gallery items from Firestore, grouped by category and sorted by order.
 * @returns {Promise<Object>} { categoryId: [{id, url, isVideo, order, ...}], ... }
 */
export async function fetchGallery() {
  const q = query(collection(db, COLLECTION), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);

  const grouped = {};
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (!data.active) return;
    if (!grouped[data.category]) grouped[data.category] = [];
    grouped[data.category].push({
      id: docSnap.id,
      url: toCloudinaryUrl(data.cloudinaryUrl),
      cloudinaryUrl: data.cloudinaryUrl,
      publicId: data.publicId || null,
      isVideo: data.isVideo || false,
      order: data.order ?? 0,
    });
  });

  // Ensure deterministic ascending order for every category
  Object.keys(grouped).forEach((cat) => {
    grouped[cat].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  });

  return grouped;
}

/**
 * Fetches ALL items (both active and inactive) for the admin dashboard.
 * @returns {Promise<Array>} List of all items with id and properties
 */
export async function fetchAllGalleryItems() {
  const q = query(collection(db, COLLECTION), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);

  const items = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    items.push({
      id: docSnap.id,
      ...data,
      order: data.order ?? 0,
      url: toCloudinaryUrl(data.cloudinaryUrl),
    });
  });

  return items;
}

/**
 * Adds a new item to the gallery.
 * @param {Object} data - { cloudinaryUrl, category, isVideo, order }
 * @returns {Promise<string>} Created document ID
 */
export async function addGalleryImage(data) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    active: true,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Updates a single gallery item.
 * @param {string} id - Document ID
 * @param {Object} data - Fields to update
 */
export async function updateGalleryImage(id, data) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, data);
}

/**
 * Updates the display order for multiple gallery items in Firestore using batch write.
 * @param {Array<{id: string, order: number}>} orderedItems - Items with updated order indices
 */
export async function updateGalleryOrder(orderedItems) {
  if (!orderedItems || orderedItems.length === 0) return;

  const BATCH_SIZE = 450;
  for (let i = 0; i < orderedItems.length; i += BATCH_SIZE) {
    const chunk = orderedItems.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((item) => {
      const ref = doc(db, COLLECTION, item.id);
      batch.update(ref, { order: item.order });
    });
    await batch.commit();
  }
}

/**
 * Deletes a gallery item document from Firestore.
 * @param {string} id - Document ID
 */
export async function deleteGalleryImage(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

/**
 * Sube un archivo a Cloudinary usando unsigned upload.
 * @param {File} file - Archivo a subir
 * @param {Function} onProgress - Callback de progreso (opcional)
 * @returns {Object} { cloudinaryUrl, isVideo, publicId }
 */
export function uploadToCloudinary(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'gallery');

    const isVideo = file.type.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    const xhr = new XMLHttpRequest();
    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`
    );

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText);
        // Construir el path fragment con transforms para consistencia con datos existentes
        const transforms = isVideo
          ? ''
          : 'w_552,h_690,c_fill,f_auto,q_auto/';
        const cloudinaryUrl = `/${res.resource_type}/upload/${transforms}${res.public_id}.${res.format}`;
        resolve({
          cloudinaryUrl,
          isVideo,
          publicId: res.public_id,
          secureUrl: res.secure_url,
        });
      } else {
        reject(new Error(`Upload falló: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Error de red al subir')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelado')));

    xhr.send(formData);
  });
}

/**
 * Obtiene la visibilidad de categorías desde Firestore.
 * Si no existe el documento, todas las categorías están visibles.
 * @returns {Object} { sociales: true, novias: true, crespas: false, ... }
 */
export async function fetchCategoryVisibility() {
  try {
    const snap = await getDoc(doc(db, CONFIG_DOC));
    if (snap.exists()) {
      return snap.data().enabledCategories || {};
    }
  } catch {}
  return {};
}

/**
 * Actualiza la visibilidad de una categoría.
 * @param {string} categoryId - ID de la categoría
 * @param {boolean} enabled - Si está habilitada
 * @param {Object} currentState - Estado actual de visibilidad
 */
export async function updateCategoryVisibility(categoryId, enabled, currentState) {
  const updated = { ...currentState, [categoryId]: enabled };
  await setDoc(doc(db, CONFIG_DOC), { enabledCategories: updated }, { merge: true });
  return updated;
}

/**
 * Obtiene los labels personalizados de categorías desde Firestore.
 * Si no existe el documento o no hay labels, devuelve {}.
 * @returns {Object} { sociales: "Sociales", novias: "Mis Novias", ... }
 */
export async function fetchCategoryLabels() {
  try {
    const snap = await getDoc(doc(db, CONFIG_DOC));
    if (snap.exists()) {
      return snap.data().categoryLabels || {};
    }
  } catch {}
  return {};
}

/**
 * Actualiza el label de una categoría.
 * @param {string} categoryId - ID de la categoría
 * @param {string} label - Nuevo título
 * @param {Object} currentState - Estado actual de labels
 */
export async function updateCategoryLabel(categoryId, label, currentState) {
  const updated = { ...currentState, [categoryId]: label };
  await setDoc(doc(db, CONFIG_DOC), { categoryLabels: updated }, { merge: true });
  return updated;
}
