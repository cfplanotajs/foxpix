import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stat } from 'node:fs/promises';
import { estimateImages } from '../core/estimateImages.js';
import { generateImagePreview } from '../core/imagePreview.js';
import { discoverFiles, discoverFilesFromPaths } from '../core/fileDiscovery.js';
import { buildRenamePlan } from '../core/rename.js';
import { processImages } from '../core/processImages.js';
import { createManifest, writeManifest } from '../core/manifest.js';
import { writeManifestCsv } from '../core/manifestCsv.js';
import type { RenamePlanItem } from '../types/index.js';
import { normalizeOptions, type GuiOptionsLike } from './normalizeOptions.js';
import { resolveDroppedItems } from './droppedItems.js';

type GuiOptions = GuiOptionsLike;

interface StoredGuiSettings extends Partial<GuiOptions> {
  outputTouched?: boolean;
  selectedPreset?: string;
}

async function readSettings(): Promise<StoredGuiSettings | null> {
  const settingsPath = path.join(app.getPath('userData'), 'foxpix-settings.json');
  try {
    const raw = await readFile(settingsPath, 'utf8');
    return JSON.parse(raw) as StoredGuiSettings;
  } catch {
    return null;
  }
}

async function saveSettings(settings: StoredGuiSettings): Promise<void> {
  const settingsPath = path.join(app.getPath('userData'), 'foxpix-settings.json');
  await writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
}

function createWindow(): void {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const preloadPath = path.resolve(__dirname, 'preload.cjs');
  const preloadExists = existsSync(preloadPath);
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('[foxpix] preload path', preloadPath);
    console.log('[foxpix] preload exists', preloadExists);
  }
  if (!preloadExists) {
    console.error('[foxpix] preload script missing', preloadPath);
  }

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (isMainFrame) {
      console.error('[foxpix] renderer failed to load', { errorCode, errorDescription, validatedURL });
    }
  });

  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('[foxpix] renderer process gone', details);
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
      console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
    });
  }

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void win.loadURL(devUrl).catch((error) => {
      console.error('[foxpix] failed to load dev renderer URL', devUrl, error);
    });
  } else {
    const indexPath = path.resolve(__dirname, '../../dist-ui/index.html');
    void win.loadFile(indexPath).catch((error) => {
      console.error('[foxpix] failed to load renderer index file', indexPath, error);
    });
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

  ipcMain.handle('foxpix:selectImageFiles', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'tif', 'tiff', 'avif'] }]
    });
    return result.canceled ? [] : result.filePaths;
  });

  ipcMain.handle('foxpix:resolveDroppedItems', async (_event: unknown, paths: string[]) => resolveDroppedItems(paths));

  ipcMain.handle('foxpix:preview', async (_event: unknown, rawOptions: GuiOptions) => {
    const options = normalizeOptions(rawOptions);
    const discovered = rawOptions.filePaths && rawOptions.filePaths.length > 0
      ? await discoverFilesFromPaths(rawOptions.filePaths)
      : rawOptions.input
        ? await discoverFiles({ inputFolder: options.input, outputFolder: options.output, recursive: options.recursive })
        : [];
    const plan = await buildRenamePlan({
      files: discovered,
      outputFolder: options.output,
      pattern: options.pattern,
      prefix: options.prefix,
      custom: options.custom,
      outputFormat: options.outputFormat
    });

    const rows = await Promise.all(plan.map(async (item: RenamePlanItem) => {
      const info = await stat(item.source.absolutePath).catch(() => null);
      return {
        originalFilename: item.source.relativePath,
        outputFilename: item.outputFilename,
        originalSize: info?.size ?? 0,
        sourceFormat: item.source.extension.replace('.', '').toLowerCase(),
        targetFormat: options.outputFormat ?? 'webp',
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

  ipcMain.handle('foxpix:estimateSizes', async (_event: unknown, rawOptions: GuiOptions) => {
    const options = normalizeOptions(rawOptions);
    const discovered = rawOptions.filePaths && rawOptions.filePaths.length > 0
      ? await discoverFilesFromPaths(rawOptions.filePaths)
      : rawOptions.input
        ? await discoverFiles({ inputFolder: options.input, outputFolder: options.output, recursive: options.recursive })
        : [];
    const plan = await buildRenamePlan({ files: discovered, outputFolder: options.output, pattern: options.pattern, prefix: options.prefix, custom: options.custom, outputFormat: options.outputFormat });
    return estimateImages(plan, options);
  });

  ipcMain.handle('foxpix:generateImagePreview', async (_event: unknown, payload: { sourcePath: string; outputFilename?: string; options: GuiOptions }) => {
    const options = normalizeOptions(payload.options);
    return generateImagePreview(payload.sourcePath, options, payload.outputFilename);
  });

  ipcMain.handle('foxpix:process', async (_event: unknown, rawOptions: GuiOptions) => {
    const options = normalizeOptions(rawOptions);
    const discovered = rawOptions.filePaths && rawOptions.filePaths.length > 0
      ? await discoverFilesFromPaths(rawOptions.filePaths)
      : rawOptions.input
        ? await discoverFiles({ inputFolder: options.input, outputFolder: options.output, recursive: options.recursive })
        : [];
    const plan = await buildRenamePlan({
      files: discovered,
      outputFolder: options.output,
      pattern: options.pattern,
      prefix: options.prefix,
      custom: options.custom,
      outputFormat: options.outputFormat
    });
    const summary = await processImages(plan, options);
    const manifest = createManifest(options, summary);
    const manifestPath = await writeManifest(options.output, manifest);
    const manifestCsvPath = await writeManifestCsv(options.output, summary.files);

    return {
      summary,
      manifestPath,
      manifestCsvPath,
      outputFolder: options.output
    };
  });

  ipcMain.handle('foxpix:loadSettings', async () => readSettings());

  ipcMain.handle('foxpix:saveSettings', async (_event: unknown, settings: StoredGuiSettings) => {
    try {
      await saveSettings(settings);
      return { ok: true as const };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : String(error) };
    }
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

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
