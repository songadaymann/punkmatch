import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);

const BASE_URL = 'https://raw.githubusercontent.com/cryptopunksnotdead/punks.starter/master/basic';
const OUTPUT_DIR = `${ROOT}/traits`;

// Base types
const BASE_TYPES = [
  'alien.png',
  'ape.png',
  'zombie.png',
  'male1.png',
  'male2.png',
  'male3.png',
  'male4.png',
  'female1.png',
  'female2.png',
  'female3.png',
  'female4.png',
];

// Male traits
const MALE_TRAITS = [
  '3dglasses', 'bandana', 'beanie', 'bearskin', 'beret', 'bigbeard', 'bigshades',
  'boater', 'buckteeth', 'cap', 'capforward', 'chinstrap', 'cigarette',
  'classicshades', 'clowneyesblue', 'clowneyesgreen', 'clownhairgreen', 'clownnose',
  'cowboyhat', 'crazyhair', 'dorag', 'earring', 'eyemask', 'eyepatch', 'fedora',
  'fez', 'frontbeard', 'frontbearddark', 'frown', 'frumpyhair', 'goat', 'goldchain',
  'handlebars', 'headband', 'hoodie', 'hornedrimglasses', 'knittedcap', 'lasereyes',
  'lasereyesgold', 'luxuriousbeard', 'medicalmask', 'messyhair', 'mohawk',
  'mohawkdark', 'mohawkthin', 'mole', 'mustache', 'muttonchops', 'nerdglasses',
  'normalbeard', 'normalbeardblack', 'peakspike', 'pipe', 'policecap', 'purplehair',
  'regularshades', 'rosycheeks', 'shadowbeard', 'shavedhead', 'silverchain',
  'smallshades', 'smile', 'spots', 'stringyhair', 'tophat', 'tuque', 'turban',
  'vampirehair', 'vape', 'vr', 'wildhair'
];

// Female traits
const FEMALE_TRAITS = [
  '3dglasses', 'bandana', 'beanie', 'bigshades', 'blacklipstick', 'blondebob',
  'blondeshort', 'blueeyeshadow', 'cap', 'capforward', 'choker', 'cigarette',
  'classicshades', 'clowneyesblue', 'clowneyesgreen', 'clownhairgreen', 'clownnose',
  'cowboyhat', 'crazyhair', 'darkhair', 'dorag', 'earring', 'eyemask', 'eyepatch',
  'fedora', 'flamencohat', 'flowercrown', 'frumpyhair', 'goldchain', 'greeneyeshadow',
  'halfshaved', 'headband', 'hoodie', 'hornedrimglasses', 'hotlipstick', 'knittedcap',
  'medicalmask', 'messyhair', 'mohawk', 'mohawkdark', 'mohawkthin', 'mole',
  'nerdglasses', 'orangeside', 'panamahat', 'pigtails', 'pilothelmet', 'pinkwithhat',
  'pipe', 'policecap', 'purpleeyeshadow', 'purplehair', 'purplelipstick', 'redmohawk',
  'regularshades', 'rosycheeks', 'royalcocktailhat', 'shavedhead', 'silverchain',
  'smallshades', 'sombrero', 'spots', 'straighthair', 'straighthairblonde',
  'straighthairdark', 'stringyhair', 'tasslehat', 'tiara', 'tophat', 'tyrolean',
  'vape', 'vr', 'weldinggoggles', 'wildblonde', 'wildhair', 'wildwhitehair'
];

async function downloadFile(url, outputPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    await writeFile(outputPath, Buffer.from(buffer));
    return true;
  } catch (e) {
    console.error(`  Failed: ${url} - ${e.message}`);
    return false;
  }
}

async function downloadTraits() {
  console.log('Downloading CryptoPunk trait layers...\n');

  // Create directories
  await mkdir(`${OUTPUT_DIR}/base`, { recursive: true });
  await mkdir(`${OUTPUT_DIR}/m`, { recursive: true });
  await mkdir(`${OUTPUT_DIR}/f`, { recursive: true });

  let downloaded = 0;
  let failed = 0;

  // Download base types
  console.log('Downloading base types...');
  for (const file of BASE_TYPES) {
    const url = `${BASE_URL}/${file}`;
    const output = `${OUTPUT_DIR}/base/${file}`;
    process.stdout.write(`  ${file}...`);
    if (await downloadFile(url, output)) {
      console.log(' done');
      downloaded++;
    } else {
      failed++;
    }
  }

  // Download male traits
  console.log('\nDownloading male traits...');
  for (const trait of MALE_TRAITS) {
    const url = `${BASE_URL}/m/${trait}.png`;
    const output = `${OUTPUT_DIR}/m/${trait}.png`;
    process.stdout.write(`  ${trait}.png...`);
    if (await downloadFile(url, output)) {
      console.log(' done');
      downloaded++;
    } else {
      failed++;
    }
  }

  // Download female traits
  console.log('\nDownloading female traits...');
  for (const trait of FEMALE_TRAITS) {
    const url = `${BASE_URL}/f/${trait}.png`;
    const output = `${OUTPUT_DIR}/f/${trait}.png`;
    process.stdout.write(`  ${trait}.png...`);
    if (await downloadFile(url, output)) {
      console.log(' done');
      downloaded++;
    } else {
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Downloaded: ${downloaded} files`);
  console.log(`Failed: ${failed} files`);
  console.log(`Output directory: ${OUTPUT_DIR}`);

  // Create a manifest
  const manifest = {
    base: BASE_TYPES.map(f => f.replace('.png', '')),
    male: MALE_TRAITS,
    female: FEMALE_TRAITS
  };
  await writeFile(`${OUTPUT_DIR}/manifest.json`, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest saved to ${OUTPUT_DIR}/manifest.json`);
}

downloadTraits().catch(console.error);
