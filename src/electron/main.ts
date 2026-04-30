import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stat } from 'node:fs/promises';
import { discoverFiles } from '../core/fileDiscovery.js';
import { buildRenamePlan } from '../core/rename.js';
import { processImages } from '../core/processImages.js';
import { createManifest, writeManifest } from '../core/manifest.js';
import type { CliOptions, RenamePlanItem } from '../types/index.js';

interface GuiOptions {
  input: string;
  output?: string;
  prefix?: string;
  pattern: string;
  custom?: string;
  quality: number;
  alphaQuality: number;
  lossless: boolean;
  maxWidth?: number;
  maxHeight?: number;
  recursive: boolean;
  keepMetadata: boolean;
}

function normalizeOptions(options: GuiOptions): CliOptions {
  const inputFolder = path.resolve(options.input);
  const resolvedOutput = options.output ? path.resolve(options.output) : path.join(inputFolder, 'optimized');
  const output = resolvedOutput === inputFolder ? path.join(inputFolder, 'optimized') : resolvedOutput;

  return {
    input: inputFolder,
    output,
    prefix: options.prefix,
    pattern: options.pattern,
    custom: options.custom,
    quality: options.quality,
    alphaQuality: options.alphaQuality,
    lossless: options.lossless,
    maxWidth: options.maxWidth,
    maxHeight: options.maxHeight,
    recursive: options.recursive,
    dryRun: false,
    keepMetadata: options.keepMetadata
  };
}

function createWindow(): void {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void win.loadURL(devUrl);
  } else {
    void win.loadFile(path.resolve(__dirname, '../../dist-ui/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('foxpix:selectInputFolder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0] ?? null;
  });

  ipcMain.handle('foxpix:selectOutputFolder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
    return result.canceled ? null : result.filePaths[0] ?? null;
  });

  ipcMain.handle('foxpix:preview', async (_event: unknown, rawOptions: GuiOptions) => {
    const options = normalizeOptions(rawOptions);
    const discovered = await discoverFiles({ inputFolder: options.input, outputFolder: options.output, recursive: options.recursive });
    const plan = await buildRenamePlan({
      files: discovered,
      outputFolder: options.output,
      pattern: options.pattern,
      prefix: options.prefix,
      custom: options.custom
    });

    const rows = await Promise.all(plan.map(async (item: RenamePlanItem) => {
      const info = await stat(item.source.absolutePath).catch(() => null);
      return {
        originalFilename: item.source.relativePath,
        outputFilename: item.outputFilename,
        originalSize: info?.size ?? 0,
        status: 'planned'
      };
    }));

    return {
      inputFolder: options.input,
      outputFolder: options.output,
      total: rows.length,
      rows
    };
  });

  ipcMain.handle('foxpix:process', async (_event: unknown, rawOptions: GuiOptions) => {
    const options = normalizeOptions(rawOptions);
    const discovered = await discoverFiles({ inputFolder: options.input, outputFolder: options.output, recursive: options.recursive });
    const plan = await buildRenamePlan({
      files: discovered,
      outputFolder: options.output,
      pattern: options.pattern,
      prefix: options.prefix,
      custom: options.custom
    });
    const summary = await processImages(plan, options);
    const manifest = createManifest(options, summary);
    const manifestPath = await writeManifest(options.output, manifest);

    return {
      summary,
      manifestPath
    };
  });

  ipcMain.handle('foxpix:openFolder', async (_event: unknown, folderPath: string) => {
    try {
      const result = await shell.openPath(folderPath);
      if (result === '') {
        return { ok: true as const };
      }
      return { ok: false as const, error: result };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : String(error) };
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
