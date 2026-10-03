import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Resolve current directory and load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const TARGET_FOLDER_PREFIX = 'gallery/';

/**
 * Extracts a Cloudinary publicId starting with 'gallery/' from a URL or relative path.
 * Examples:
 *   "/image/upload/w_552,h_690,c_fill,f_auto,q_auto/gallery/abc123.jpg" -> "gallery/abc123"
 *   "gallery/abc123" -> "gallery/abc123"
 *   "https://res.cloudinary.com/.../gallery/sub/photo.png" -> "gallery/sub/photo"
 * @param {string} urlOrPath - The image path or URL
 * @returns {string|null} Normalized public_id or null
 */
function extractPublicId(urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;

  const galleryIndex = urlOrPath.indexOf(TARGET_FOLDER_PREFIX);
  if (galleryIndex === -1) return null;

  const relativePath = urlOrPath.slice(galleryIndex);
  // Strip query parameters and hashes
  const cleanPath = relativePath.split(/[?#]/)[0];
  // Strip standard image/video extensions
  return cleanPath.replace(/\.(jpg|jpeg|png|webp|gif|mp4|mov|webm)$/i, '');
}

/**
 * Formats byte count into human-readable size (KB, MB).
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size string
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Loads all in-use public IDs from Firestore gallery collection and static services data.
 * @returns {Promise<Set<string>>} Set of public IDs currently in use
 */
async function fetchInUsePublicIds() {
  const inUseIds = new Set();

  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Missing Firebase credentials in .env file (VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID).');
  }

  const app = initializeApp(firebaseConfig, 'cleanup-script-app');
  const db = getFirestore(app);

  console.log('Fetching documents from Firestore "gallery" collection...');
  const snapshot = await getDocs(collection(db, 'gallery'));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    // Direct publicId property
    if (data.publicId) {
      inUseIds.add(data.publicId);
    }

    // Extract from cloudinaryUrl fallback
    if (data.cloudinaryUrl) {
      const extractedId = extractPublicId(data.cloudinaryUrl);
      if (extractedId) inUseIds.add(extractedId);
    }
  });

  // Also scan static services.js file for any references to gallery/
  const servicesFilePath = path.join(projectRoot, 'src', 'data', 'services.js');
  if (fs.existsSync(servicesFilePath)) {
    const fileContent = fs.readFileSync(servicesFilePath, 'utf8');
    const regex = new RegExp(`(${TARGET_FOLDER_PREFIX}[^"'\`\\s]+)`, 'g');
    let match;
    while ((match = regex.exec(fileContent)) !== null) {
      const extracted = extractPublicId(match[1]);
      if (extracted) inUseIds.add(extracted);
    }
  }

  return inUseIds;
}

/**
 * Fetches all assets stored under TARGET_FOLDER_PREFIX ('gallery/') in Cloudinary.
 * Handles pagination and both image and video resource types.
 * @returns {Promise<Array<Object>>} List of Cloudinary asset metadata
 */
async function fetchCloudinaryGalleryAssets() {
  const resourceTypes = ['image', 'video'];
  const allAssets = [];

  for (const resourceType of resourceTypes) {
    let nextCursor = null;

    do {
      const response = await cloudinary.api.resources({
        type: 'upload',
        prefix: TARGET_FOLDER_PREFIX,
        resource_type: resourceType,
        max_results: 500,
        next_cursor: nextCursor,
      });

      if (response.resources && response.resources.length > 0) {
        allAssets.push(
          ...response.resources.map((res) => ({
            publicId: res.public_id,
            resourceType: res.resource_type,
            format: res.format,
            bytes: res.bytes || 0,
            createdAt: res.created_at,
            secureUrl: res.secure_url,
          }))
        );
      }

      nextCursor = response.next_cursor || null;
    } while (nextCursor);
  }

  return allAssets;
}

/**
 * Deletes an array of public IDs from Cloudinary in batches of up to 100.
 * @param {Array<Object>} orphanAssets - Array of orphan assets to delete
 */
async function deleteCloudinaryAssets(orphanAssets) {
  const BATCH_SIZE = 100;

  // Group by resourceType (image vs video)
  const byType = {
    image: orphanAssets.filter((a) => a.resourceType === 'image').map((a) => a.publicId),
    video: orphanAssets.filter((a) => a.resourceType === 'video').map((a) => a.publicId),
  };

  for (const [resType, publicIds] of Object.entries(byType)) {
    if (publicIds.length === 0) continue;

    console.log(`\nDeleting ${publicIds.length} ${resType}(s) in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < publicIds.length; i += BATCH_SIZE) {
      const chunk = publicIds.slice(i, i + BATCH_SIZE);
      const result = await cloudinary.api.delete_resources(chunk, {
        resource_type: resType,
      });

      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: processed ${chunk.length} items`);
      if (result.deleted) {
        for (const [id, status] of Object.entries(result.deleted)) {
          console.log(`  - [${status}] ${id}`);
        }
      }
    }
  }
}

/**
 * Main execution handler.
 */
async function main() {
  console.log('====================================================');
  console.log('   Daniela Tapias Studio - Cloudinary Cleanup Tool  ');
  console.log('====================================================\n');

  const isDeleteMode = process.argv.includes('--delete');

  // Verify Cloudinary credentials
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET;

  if (!cloudName) {
    console.error('Error: CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_CLOUD_NAME is not defined in .env.');
    process.exit(1);
  }

  if (!apiKey || !apiSecret) {
    console.error('Error: Cloudinary Admin credentials are missing.');
    console.error('To run this cleanup tool, please add the following keys to your .env file:');
    console.error('  CLOUDINARY_API_KEY=your_api_key_here');
    console.error('  CLOUDINARY_API_SECRET=your_api_secret_here\n');
    console.error('You can find your API Key and Secret in your Cloudinary Dashboard:');
    console.error('  https://console.cloudinary.com/settings/api-keys\n');
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  console.log(`Cloud Name: ${cloudName}`);
  console.log(`Target folder prefix: "${TARGET_FOLDER_PREFIX}" (ONLY files inside this folder will be checked)`);
  console.log('All other folders and assets in your Cloudinary account will remain completely untouched.\n');

  try {
    // 1. Get in-use public IDs from Firestore & codebase
    const inUseIds = await fetchInUsePublicIds();
    console.log(`Found ${inUseIds.size} active gallery items in Firestore and code.\n`);

    // 2. Fetch all assets in Cloudinary gallery/ folder
    console.log(`Scanning Cloudinary folder "${TARGET_FOLDER_PREFIX}"...`);
    const cloudinaryAssets = await fetchCloudinaryGalleryAssets();
    console.log(`Found ${cloudinaryAssets.length} total files inside Cloudinary "${TARGET_FOLDER_PREFIX}".\n`);

    // 3. Find orphan assets
    const orphanAssets = cloudinaryAssets.filter((asset) => !inUseIds.has(asset.publicId));
    const totalOrphanBytes = orphanAssets.reduce((sum, asset) => sum + asset.bytes, 0);

    console.log('----------------------------------------------------');
    console.log(`Total files in Cloudinary [${TARGET_FOLDER_PREFIX}]: ${cloudinaryAssets.length}`);
    console.log(`In-use files (Firestore / web):         ${inUseIds.size}`);
    console.log(`Orphan files (safe to delete):          ${orphanAssets.length} (${formatBytes(totalOrphanBytes)})`);
    console.log('----------------------------------------------------\n');

    if (orphanAssets.length === 0) {
      console.log('No orphan images found! Your Cloudinary gallery folder is 100% in sync with Firestore.');
      process.exit(0);
    }

    if (!isDeleteMode) {
      console.log('ORPHAN FILES FOUND (Not referenced in database):');
      orphanAssets.forEach((asset, index) => {
        console.log(
          `  ${index + 1}. [${asset.resourceType}] ${asset.publicId} (${formatBytes(asset.bytes)}, ${asset.format}, uploaded ${asset.createdAt})`
        );
      });

      console.log('\n[DRY RUN MODE] No files were deleted.');
      console.log('To permanently delete these orphan files from Cloudinary, run:');
      console.log('  npm run cleanup:images:delete\n');
      console.log('Or:');
      console.log('  node scripts/cleanup-cloudinary.js --delete\n');
    } else {
      console.log(`[DELETE MODE] Proceeding to delete ${orphanAssets.length} orphan files from Cloudinary...`);
      await deleteCloudinaryAssets(orphanAssets);
      console.log('\nCleanup completed successfully! Cloudinary is now clean.');
    }
  } catch (error) {
    console.error('\nError during cleanup process:', error.message);
    if (error.error && error.error.message) {
      console.error('Cloudinary API error details:', error.error.message);
    }
    process.exit(1);
  }
}

main();
