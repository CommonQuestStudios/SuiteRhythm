/**
 * Upload all sound files from the local "Saved sounds" folder to Cloudflare R2.
 * Files are uploaded under the "sounds/" prefix to match the Supabase `file` column.
 *
 * Usage: node scripts/upload-sounds-to-r2.js [--dry-run] [--dir <folder>]
 *
 * Requires .env.local to be loaded (uses dotenv). The source folder defaults to
 * SOUNDS_SOURCE_DIR from the environment.
 */

import 'dotenv/config';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { readdir, readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const dirFlag = process.argv.indexOf('--dir');
const SOUNDS_DIR = dirFlag !== -1 ? process.argv[dirFlag + 1] : process.env.SOUNDS_SOURCE_DIR;
if (!SOUNDS_DIR) {
  console.error('Set SOUNDS_SOURCE_DIR in .env.local or pass --dir <folder>.');
  process.exit(1);
}
const BUCKET = process.env.R2_BUCKET_NAME || 'cueai-media';
const PREFIX = 'sounds/';

const MIME_TYPES = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.webm': 'audio/webm',
};

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function alreadyExists(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadAll() {
  const files = await readdir(SOUNDS_DIR);
  const audioFiles = files.filter(f => Object.keys(MIME_TYPES).includes(extname(f).toLowerCase()));

  console.log(`Found ${audioFiles.length} audio files to upload to R2 bucket "${BUCKET}"${DRY_RUN ? ' (dry run, nothing will be written)' : ''}`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of audioFiles) {
    const key = `${PREFIX}${file}`;
    const ext = extname(file).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Skip if already uploaded
    if (await alreadyExists(key)) {
      skipped++;
      process.stdout.write(`  [skip] ${file}\r\n`);
      continue;
    }

    try {
      const filePath = join(SOUNDS_DIR, file);
      const fileStats = await stat(filePath);
      const sizeMB = (fileStats.size / 1024 / 1024).toFixed(1);
      if (DRY_RUN) {
        uploaded++;
        process.stdout.write(`  [would upload] ${key} (${sizeMB} MB)\r\n`);
        continue;
      }
      const body = await readFile(filePath);

      await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }));

      uploaded++;
      process.stdout.write(`  [${uploaded}/${audioFiles.length}] ${file} (${sizeMB} MB)\r\n`);
    } catch (err) {
      failed++;
      console.error(`  [FAIL] ${file}: ${err.message}`);
    }
  }

  console.log(`\nDone! Uploaded: ${uploaded}, Skipped: ${skipped}, Failed: ${failed}`);
}

uploadAll().catch(err => { console.error(err); process.exit(1); });
