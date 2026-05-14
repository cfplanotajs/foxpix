import { constants } from 'node:fs';
import { access, stat } from 'node:fs/promises';

export type OutputFolderStatus =
  | { status: 'exists'; path: string }
  | { status: 'will-create'; path: string }
  | { status: 'not-directory'; path: string; error: string }
  | { status: 'not-accessible'; path: string; error: string };

export async function getOutputFolderStatus(outputPath: string): Promise<OutputFolderStatus> {
  try {
    const s = await stat(outputPath);
    if (!s.isDirectory()) return { status: 'not-directory', path: outputPath, error: 'Output path is not a folder.' };
    try {
      await access(outputPath, constants.W_OK);
      return { status: 'exists', path: outputPath };
    } catch {
      return { status: 'not-accessible', path: outputPath, error: 'Output folder cannot be accessed.' };
    }
  } catch (error: any) {
    if (error?.code === 'ENOENT') return { status: 'will-create', path: outputPath };
    return { status: 'not-accessible', path: outputPath, error: 'Output folder cannot be accessed.' };
  }
}
