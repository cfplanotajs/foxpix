import { contextBridge, ipcRenderer, webUtils } from 'electron';

contextBridge.exposeInMainWorld('foxpix', {
  selectInputFolder: () => ipcRenderer.invoke('foxpix:selectInputFolder') as Promise<string | null>,
  selectOutputFolder: () => ipcRenderer.invoke('foxpix:selectOutputFolder') as Promise<string | null>,
  selectImageFiles: () => ipcRenderer.invoke('foxpix:selectImageFiles') as Promise<string[]>,
  preview: (options: unknown) => ipcRenderer.invoke('foxpix:preview', options),
  process: (options: unknown) => ipcRenderer.invoke('foxpix:process', options),
  estimateSizes: (options: unknown) => ipcRenderer.invoke('foxpix:estimateSizes', options),
  generateImagePreview: (payload: unknown) => ipcRenderer.invoke('foxpix:generateImagePreview', payload),
  getThumbnails: (payload: unknown) => ipcRenderer.invoke('foxpix:getThumbnails', payload),
  openFolder: (folderPath: string) => ipcRenderer.invoke('foxpix:openFolder', folderPath) as Promise<{ ok: true } | { ok: false; error: string }>,
  loadSettings: () => ipcRenderer.invoke('foxpix:loadSettings'),
  saveSettings: (settings: unknown) => ipcRenderer.invoke('foxpix:saveSettings', settings),
  resolveDroppedItems: async (files: File[] | FileList) => {
    const paths = Array.from(files)
      .map((file) => webUtils.getPathForFile(file))
      .filter((v): v is string => Boolean(v));
    return ipcRenderer.invoke('foxpix:resolveDroppedItems', paths);
  }
});

if (process.env.VITE_DEV_SERVER_URL) {
  console.log('FoxPix preload loaded');
}
