import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { toCloudinaryUrl } from './cloudinary';
import { slugify } from '../utils/slugify';

const COLLECTION = 'headpieces';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Initial curated sample headpieces to display when the Firestore collection is empty.
 */
export const SAMPLE_HEADPIECES = [
  {
    id: 'sample-1',
    name: 'Tiara Cristal Imperial',
    slug: 'tiara-cristal-imperial',
    price: 95000,
    description: 'Elegante tiara con cristales facetados y aleación dorada. Ideal para novias y recogidos altos.',
    cloudinaryUrl: '/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2025-07-31_11-06-20_[DMxzvc5gC3E].jpg',
    active: true,
    featured: true,
    order: 1,
  },
  {
    id: 'sample-2',
    name: 'Tocado Perlas y Flores',
    slug: 'tocado-perlas-y-flores',
    price: 85000,
    description: 'Delicado tocado flexible elaborado con perlas de río y flores artesanales. Perfecto para semirecogidos.',
    cloudinaryUrl: '/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2025-09-02_09-50-01_[DOGpPnnDQMN].jpg',
    active: true,
    featured: true,
    order: 2,
  },
  {
    id: 'sample-3',
    name: 'Guía Flexible de Cristales',
    slug: 'guia-flexible-de-cristales',
    price: 75000,
    description: 'Guía moldeable que se adapta a trenzas, coletas o recogidos románticos. Brillo sutil y duradero.',
    cloudinaryUrl: '/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2026-01-26_09-59-13_[DT-mWjskcS-].jpg',
    active: true,
    featured: false,
    order: 3,
  },
  {
    id: 'sample-4',
    name: 'Peineta Floral Dorada',
    slug: 'peineta-floral-dorada',
    price: 70000,
    description: 'Peineta artesanal con hojas en oro rosa y cristales brillantes. Fácil fijación en cualquier estilo de peinado.',
    cloudinaryUrl: '/image/upload/w_552,h_690,c_fill,f_auto,q_auto/2026-06-10_12-40-54_[DZagK5_wh72].jpg',
    active: true,
    featured: false,
    order: 4,
  },
];

/**
 * Normalizes a headpiece document from Firestore into a consistent frontend object.
 *
 * @param {string} id - Firestore Document ID
 * @param {Object} data - Raw Document Data
 * @returns {Object} Normalized Headpiece Item
 */
function normalizeHeadpiece(id, data) {
  const rawUrl = data.cloudinaryUrl || data.imageUrl || '';
  const url = toCloudinaryUrl(rawUrl);
  return {
    id,
    name: data.name || 'Tocado Exclusivo',
    slug: data.slug || slugify(data.name || id),
    price: typeof data.price === 'number' ? data.price : Number(data.price) || 0,
    description: data.description || '',
    cloudinaryUrl: rawUrl,
    url,
    active: data.active !== false,
    featured: Boolean(data.featured),
    order: Number(data.order) || 0,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
  };
}

/**
 * Fetches all active headpieces for public catalog view.
 * If Firestore returns 0 items, falls back to SAMPLE_HEADPIECES.
 *
 * @returns {Promise<Array<Object>>} List of active headpieces
 */
export async function fetchHeadpieces() {
  try {
    const q = query(collection(db, COLLECTION), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return SAMPLE_HEADPIECES.map((item) => ({
        ...item,
        url: toCloudinaryUrl(item.cloudinaryUrl),
      }));
    }

    const items = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.active !== false) {
        items.push(normalizeHeadpiece(docSnap.id, data));
      }
    });

    return items;
  } catch (error) {
    console.error('Failed to fetch headpieces from Firestore:', error);
    return SAMPLE_HEADPIECES.map((item) => ({
      ...item,
      url: toCloudinaryUrl(item.cloudinaryUrl),
    }));
  }
}

/**
 * Fetches ALL headpieces (both active and inactive) for admin management.
 *
 * @returns {Promise<Array<Object>>} All headpieces in database
 */
export async function fetchAllHeadpiecesAdmin() {
  const q = query(collection(db, COLLECTION), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);

  const items = [];
  snapshot.forEach((docSnap) => {
    items.push(normalizeHeadpiece(docSnap.id, docSnap.data()));
  });

  return items;
}

/**
 * Fetches a single headpiece by slug.
 *
 * @param {string} slug - Target slug
 * @returns {Promise<Object|null>} Headpiece object or null
 */
export async function fetchHeadpieceBySlug(slug) {
  if (!slug) return null;
  const normalizedSlug = slug.toLowerCase().trim();

  // Try fetching all active items and finding matching slug
  const allItems = await fetchHeadpieces();
  const match = allItems.find(
    (item) => item.slug === normalizedSlug || item.id === normalizedSlug
  );
  return match || null;
}

/**
 * Creates a new headpiece in Firestore.
 *
 * @param {Object} data - Headpiece payload
 * @returns {Promise<string>} Created document ID
 */
export async function addHeadpiece(data) {
  const generatedSlug = data.slug ? slugify(data.slug) : slugify(data.name || 'tocado');
  const payload = {
    name: data.name.trim(),
    slug: generatedSlug,
    price: Number(data.price) || 0,
    description: (data.description || '').trim(),
    cloudinaryUrl: data.cloudinaryUrl || '',
    publicId: data.publicId || null,
    active: data.active !== false,
    featured: Boolean(data.featured),
    order: Number(data.order) || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), payload);
  return docRef.id;
}

/**
 * Updates an existing headpiece document.
 *
 * @param {string} id - Document ID
 * @param {Object} data - Partial update payload
 */
export async function updateHeadpiece(id, data) {
  const ref = doc(db, COLLECTION, id);
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (payload.name && !payload.slug) {
    payload.slug = slugify(payload.name);
  } else if (payload.slug) {
    payload.slug = slugify(payload.slug);
  }
  if (payload.price !== undefined) {
    payload.price = Number(payload.price) || 0;
  }
  await updateDoc(ref, payload);
}

/**
 * Deletes a headpiece document.
 *
 * @param {string} id - Document ID
 */
export async function deleteHeadpiece(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}

/**
 * Uploads an image to Cloudinary in the "tocados" folder.
 *
 * @param {File} file - Selected file
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} { cloudinaryUrl, publicId, secureUrl }
 */
export function uploadHeadpieceImage(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'tocados');

    const xhr = new XMLHttpRequest();
    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
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
        const transforms = 'w_700,h_850,c_fill,f_auto,q_auto/';
        const cloudinaryUrl = `/image/upload/${transforms}${res.public_id}.${res.format}`;
        resolve({
          cloudinaryUrl,
          publicId: res.public_id,
          secureUrl: res.secure_url,
        });
      } else {
        reject(new Error(`Error al subir imagen (${xhr.status})`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Error de red al subir imagen')));
    xhr.addEventListener('abort', () => reject(new Error('Subida cancelada')));

    xhr.send(formData);
  });
}
