import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('src/assets/images');
const TARGETS = [
  'logo-cuisine.png',
  'hero/visual01.png',
  'hero/visual02.png',
  'hero/visual03.png',
  'img/result-img.png',
  'cookbook/italian.png',
  'cookbook/german.png',
  'cookbook/japan.png',
  'cookbook/gourmet.png',
  'cookbook/indian.png',
  'cookbook/fusion.png',
  'recipes/italian-food.png',
  'recipes/german-food.png',
  'recipes/japanese-food.png',
  'recipes/indian-food.png',
  'recipes/gourmet-food.png',
  'recipes/fusion-food.png',
  'mobile/recipe/italian-cuisine-mobile.png',
  'mobile/recipe/german-cuisine-mobile.png',
  'mobile/recipe/japanese-cuisine-mobile.png',
  'mobile/recipe/indian-cuisine-mobile.png',
  'mobile/recipe/gourmet-cuisine-mobile.png',
  'mobile/recipe/fusion-cuisine-mobile.png'
];

async function convert(relPath) {
  const input = path.join(ROOT, relPath);
  const output = input.replace(/\.png$/i, '.webp');
  await sharp(input).webp({ quality: 82 }).toFile(output);
  const [inStat, outStat] = await Promise.all([stat(input), stat(output)]);
  console.log(
    `${relPath}: ${Math.round(inStat.size / 1024)}kB → ${Math.round(outStat.size / 1024)}kB`
  );
}

for (const file of TARGETS) {
  await convert(file);
}

console.log('WebP conversion complete.');