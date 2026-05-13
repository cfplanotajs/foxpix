import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

async function main(): Promise<void> {
  const outputDir = path.resolve('sample-input');
  await mkdir(outputDir, { recursive: true });

  await sharp({
    create: {
      width: 120,
      height: 120,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: Buffer.from('<svg><circle cx="60" cy="60" r="40" fill="#00AEEF"/></svg>') }])
    .png()
    .toFile(path.join(outputDir, 'transparent-sticker.png'));

  await sharp({
    create: {
      width: 160,
      height: 100,
      channels: 3,
      background: { r: 240, g: 200, b: 120 }
    }
  })
    .jpeg({ quality: 90 })
    .toFile(path.join(outputDir, 'Product Shot.jpg'));

  await sharp({
    create: {
      width: 140,
      height: 140,
      channels: 4,
      background: { r: 20, g: 160, b: 80, alpha: 0.8 }
    }
  })
    .png()
    .toFile(path.join(outputDir, 'My Cute Animal!!!.png'));

  console.log(`Sample images created in: ${outputDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
