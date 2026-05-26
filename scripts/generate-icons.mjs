// Generate PWA PNG icons from the source SVGs.
// Run with `npm run icons` whenever public/icon*.svg changes.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public');

async function emit(srcSvg, size, name) {
  const svg = await readFile(join(out, srcSvg));
  await sharp(svg).resize(size, size).png().toFile(join(out, name));
  console.log(`✓ ${name} (${size}×${size})`);
}

await Promise.all([
  emit('icon.svg', 192, 'icon-192.png'),
  emit('icon.svg', 512, 'icon-512.png'),
  emit('icon-maskable.svg', 512, 'icon-maskable-512.png'),
  emit('icon.svg', 180, 'apple-touch-icon.png'),
]);
