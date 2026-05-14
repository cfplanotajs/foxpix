import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('sample-input');
const nested = path.join(root, 'nested');
const optimized = path.join(root, 'optimized');

async function makeTransparentPng(file: string): Promise<void> {
  await sharp({ create: { width: 320, height: 220, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: Buffer.from('<svg width="320" height="220"><rect x="26" y="20" width="120" height="180" rx="20" fill="#00AEEF"/><circle cx="220" cy="110" r="68" fill="#F59E0B"/></svg>') }])
    .png()
    .toFile(file);
}

async function makePhotoJpeg(file: string): Promise<void> {
  await sharp({ create: { width: 1200, height: 800, channels: 3, background: { r: 212, g: 176, b: 142 } } })
    .jpeg({ quality: 90 })
    .toFile(file);
}

async function makeOpaquePng(file: string): Promise<void> {
  await sharp({ create: { width: 640, height: 640, channels: 3, background: { r: 35, g: 130, b: 95 } } }).png().toFile(file);
}

async function makeWebp(file: string): Promise<void> {
  await sharp({ create: { width: 520, height: 360, channels: 3, background: { r: 72, g: 90, b: 170 } } }).webp({ quality: 85 }).toFile(file);
}

async function main(): Promise<void> {
  await rm(root, { recursive: true, force: true });
  await mkdir(nested, { recursive: true });
  await mkdir(optimized, { recursive: true });

  const files = [
    path.join(root, 'transparent-sticker.png'),
    path.join(root, 'Product Shot.jpg'),
    path.join(root, 'flat-illustration.png'),
    path.join(root, 'already-webp.webp'),
    path.join(root, 'Cute Cat.png'),
    path.join(root, 'Cute_Cat.png'),
    path.join(root, 'Cute Cat!!.png'),
    path.join(root, '***.png'),
    path.join(root, '  Weird   Name!!!.png'),
    path.join(root, 'Animal+Name Test.png'),
    path.join(root, 'UPPER CASE FILE.JPG'),
    path.join(root, 'large-product-hero.png'),
    path.join(nested, 'nested-item.png'),
    path.join(nested, 'nested-photo.jpg')
  ];

  await makeTransparentPng(files[0]);
  await makePhotoJpeg(files[1]);
  await makeOpaquePng(files[2]);
  await makeWebp(files[3]);
  await makeOpaquePng(files[4]);
  await makeOpaquePng(files[5]);
  await makeOpaquePng(files[6]);
  await makeOpaquePng(files[7]);
  await makeOpaquePng(files[8]);
  await makeOpaquePng(files[9]);
  await makePhotoJpeg(files[10]);
  await sharp({ create: { width: 2000, height: 1200, channels: 3, background: { r: 110, g: 130, b: 160 } } }).png().toFile(files[11]);
  await makeOpaquePng(files[12]);
  await makePhotoJpeg(files[13]);

  await sharp({ create: { width: 300, height: 220, channels: 3, background: { r: 40, g: 80, b: 170 } } }).webp({ quality: 80 }).toFile(path.join(optimized, 'cute-cat.webp'));
  await sharp({ create: { width: 260, height: 180, channels: 3, background: { r: 70, g: 120, b: 60 } } }).webp({ quality: 82 }).toFile(path.join(optimized, 'weird-name.webp'));

  console.log('FoxPix local QA sample set created.');
  console.log(`Source files: ${files.length}`);
  console.log('Conflict files: 2');
  console.log(`Path: ${root}`);
  console.log('Next steps:');
  console.log('- npm run dev:gui');
  console.log('- Choose sample-input and click Preview');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
