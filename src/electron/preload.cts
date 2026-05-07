import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { stat } from 'node:fs/promises';
import { resolveDroppedItems as resolveDroppedItemsCore } from './droppedItems.js';

contextBridge.exposeInMainWorld('foxpix', {
  selectInputFolder: () => ipcRenderer.invoke('foxpix:selectInputFolder') as Promise<string | null>,
  selectOutputFolder: () => ipcRenderer.invoke('foxpix:selectOutputFolder') as Promise<string | null>,
  selectImageFiles: () => ipcRenderer.invoke('foxpix:selectImageFiles') as Promise<string[]>,
  preview: (options: unknown) => ipcRenderer.invoke('foxpix:preview', options),
  process: (options: unknown) => ipcRenderer.invoke('foxpix:process', options),
  openFolder: (folderPath: string) => ipcRenderer.invoke('foxpix:openFolder', folderPath) as Promise<{ ok: true } | { ok: false; error: string }>,
  loadSettings: () => ipcRenderer.invoke('foxpix:loadSettings'),
  saveSettings: (settings: unknown) => ipcRenderer.invoke('foxpix:saveSettings', settings),
  resolveDroppedPath: async (file: File) => {
    const resolved = webUtils.getPathForFile(file);
    if (!resolved) return null;
    try {
      const info = await stat(resolved);
      return info.isDirectory() ? resolved : null;
    } catch {
      return null;
    }
  },
  resolveDroppedItems: async (files: File[]) => {
    const paths = files.map((file) => webUtils.getPathForFile(file)).filter((v): v is string => Boolean(v));
    return resolveDroppedItemsCore(paths);
  },
  resolveDroppedFilePath: async (file: File) => {
    const resolved = webUtils.getPathForFile(file);
    if (!resolved) return null;
    try {
      const info = await stat(resolved);
      if (!info.isFile()) return null;
      const ext = resolved.split('.').pop()?.toLowerCase();
      return ext && ['png','jpg','jpeg','webp','tif','tiff','avif'].includes(ext) ? resolved : null;
    } catch {
      return null;
    }
  }
});

if (process.env.VITE_DEV_SERVER_URL) {
  console.log('FoxPix preload loaded');
}
