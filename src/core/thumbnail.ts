import sharp from 'sharp';

export interface ThumbnailResult {
  sourcePath: string;
  dataUrl?: string;
  width?: number;
  height?: number;
  hasAlpha?: boolean;
  error?: string;
}

export async function createThumbnail(sourcePath: string, maxSize = 72): Promise<ThumbnailResult> {
  try {
    const out = await sharp(sourcePath, { failOn: 'none' })
      .rotate()
      .resize({ width: maxSize, height: maxSize, fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer({ resolveWithObject: true });
    return {
      sourcePath,
      dataUrl: `data:image/png;base64,${out.data.toString('base64')}`,
      width: out.info.width,
      height: out.info.height,
      hasAlpha: Boolean(out.info.channels && out.info.channels >= 4)
    };
  } catch (error) {
    return { sourcePath, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function createThumbnails(sourcePaths: string[], maxSize = 72): Promise<ThumbnailResult[]> {
  const results: ThumbnailResult[] = [];
  for (const p of sourcePaths) results.push(await createThumbnail(p, maxSize));
  return results;
}
