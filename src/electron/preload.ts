import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('foxpix', {
  selectInputFolder: () => ipcRenderer.invoke('foxpix:selectInputFolder') as Promise<string | null>,
  selectOutputFolder: () => ipcRenderer.invoke('foxpix:selectOutputFolder') as Promise<string | null>,
  preview: (options: unknown) => ipcRenderer.invoke('foxpix:preview', options),
  process: (options: unknown) => ipcRenderer.invoke('foxpix:process', options),
  openFolder: (folderPath: string) => ipcRenderer.invoke('foxpix:openFolder', folderPath) as Promise<{ ok: true } | { ok: false; error: string }>
});
