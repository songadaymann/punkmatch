import sharp from 'sharp';
import { mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);

const COMPOSITE_PATH = `${ROOT}/punks.png`;
const OUTPUT_DIR = `${ROOT}/punks`;
const PUNK_SIZE = 24;  // Each punk is 24x24 pixels
const GRID_SIZE = 100; // 100x100 grid
const TOTAL_PUNKS = 10000;

async function slicePunks() {
  if (!existsSync(COMPOSITE_PATH)) {
    console.error('Composite image not found. Run `npm run download` first.');
    process.exit(1);
  }

  // Create/clean output directory
  if (existsSync(OUTPUT_DIR)) {
    console.log('Cleaning existing punks directory...');
    await rm(OUTPUT_DIR, { recursive: true });
  }
  await mkdir(OUTPUT_DIR, { recursive: true });

  console.log('Loading composite image...');
  const composite = sharp(COMPOSITE_PATH);
  const metadata = await composite.metadata();
  console.log(`Composite size: ${metadata.width}x${metadata.height}`);

  console.log(`Slicing into ${TOTAL_PUNKS} individual punks...`);

  // Process in batches for better performance
  const BATCH_SIZE = 100;
  let processed = 0;

  for (let batch = 0; batch < TOTAL_PUNKS / BATCH_SIZE; batch++) {
    const promises = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const punkId = batch * BATCH_SIZE + i;
      const row = Math.floor(punkId / GRID_SIZE);
      const col = punkId % GRID_SIZE;

      const left = col * PUNK_SIZE;
      const top = row * PUNK_SIZE;

      const promise = sharp(COMPOSITE_PATH)
        .extract({
          left,
          top,
          width: PUNK_SIZE,
          height: PUNK_SIZE
        })
        .toFile(`${OUTPUT_DIR}/${punkId}.png`);

      promises.push(promise);
    }

    await Promise.all(promises);
    processed += BATCH_SIZE;

    // Progress update every 1000
    if (processed % 1000 === 0) {
      console.log(`Progress: ${processed}/${TOTAL_PUNKS} (${(processed / TOTAL_PUNKS * 100).toFixed(0)}%)`);
    }
  }

  console.log(`\nDone! ${TOTAL_PUNKS} punk images saved to ${OUTPUT_DIR}/`);
  console.log('Each image is 24x24 pixels, named 0.png through 9999.png');
}

slicePunks().catch(console.error);
