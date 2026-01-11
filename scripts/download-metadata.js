import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);

const METADATA_URL = 'https://raw.githubusercontent.com/cryptopunksnotdead/punks.attributes/master/original/cryptopunks.csv';
const OUTPUT_PATH = `${ROOT}/punks-metadata.csv`;
const JSON_OUTPUT_PATH = `${ROOT}/punks-metadata.json`;

async function downloadMetadata() {
  if (existsSync(JSON_OUTPUT_PATH)) {
    console.log('Metadata already exists at punks-metadata.json');
    return;
  }

  console.log('Downloading CryptoPunks metadata...');
  console.log(`Source: ${METADATA_URL}`);

  try {
    const response = await fetch(METADATA_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();

    // Save raw CSV
    await writeFile(OUTPUT_PATH, csvText);
    console.log(`Saved CSV to ${OUTPUT_PATH}`);

    // Parse and convert to JSON for easier use in the game
    // Handle both \n and \r\n line endings
    const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
    const punks = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Parse: id, type, gender, skin tone, count, accessories
      // Note: skin tone can be empty for Alien/Ape/Zombie
      const match = line.match(/^(\d+),\s*(\w+),\s*(\w+),\s*(\w*),\s*(\d+),\s*(.*)$/);

      if (match) {
        const [, id, type, gender, skinTone, count, accessoriesStr] = match;
        const accessories = accessoriesStr.trim()
          ? accessoriesStr.split('/').map(a => a.trim())
          : [];

        punks.push({
          id: parseInt(id),
          type,
          gender,
          skinTone: skinTone || null,
          accessoryCount: parseInt(count),
          accessories
        });
      }
    }

    await writeFile(JSON_OUTPUT_PATH, JSON.stringify(punks, null, 2));
    console.log(`Saved JSON to ${JSON_OUTPUT_PATH}`);
    console.log(`Parsed ${punks.length} punks`);

    // Print some stats
    const types = {};
    const genders = {};
    punks.forEach(p => {
      types[p.type] = (types[p.type] || 0) + 1;
      genders[p.gender] = (genders[p.gender] || 0) + 1;
    });

    console.log('\nStats:');
    console.log('Types:', types);
    console.log('Genders:', genders);

  } catch (error) {
    console.error('Failed to download:', error.message);
    process.exit(1);
  }
}

downloadMetadata();
