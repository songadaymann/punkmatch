import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);

// The composite image containing all 10,000 punks (100x100 grid, 24x24 each)
const COMPOSITE_URL = 'https://raw.githubusercontent.com/larvalabs/cryptopunks/master/punks.png';
const OUTPUT_PATH = `${ROOT}/punks.png`;

async function downloadComposite() {
  if (existsSync(OUTPUT_PATH)) {
    console.log('Composite image already exists at punks.png');
    return;
  }

  console.log('Downloading CryptoPunks composite image...');
  console.log(`Source: ${COMPOSITE_URL}`);

  try {
    const response = await fetch(COMPOSITE_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    await writeFile(OUTPUT_PATH, Buffer.from(buffer));

    console.log(`Downloaded successfully to ${OUTPUT_PATH}`);
    console.log(`Size: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
    console.log('Image dimensions: 2400x2400 (100x100 punks, 24x24 each)');
  } catch (error) {
    console.error('Failed to download:', error.message);
    process.exit(1);
  }
}

downloadComposite();
