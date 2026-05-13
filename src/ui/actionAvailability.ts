export interface ActionState { enabled: boolean; reason?: string }

export function getActionAvailability(args: { bridgeAvailable: boolean; busy: boolean; hasSource: boolean; hasPreviewRows: boolean; includedCount: number; hasInvalidSettings: boolean }): { preview: ActionState; estimate: ActionState; process: ActionState } {
  const blocked = (need: 'source' | 'preview' | 'included'): ActionState => {
    if (!args.bridgeAvailable) return { enabled: false, reason: 'Desktop bridge unavailable.' };
    if (args.busy) return { enabled: false, reason: 'Wait for the current task to finish.' };
    if (args.hasInvalidSettings) return { enabled: false, reason: 'Fix invalid settings before continuing.' };
    if (need === 'source' && !args.hasSource) return { enabled: false, reason: 'Choose a source first.' };
    if (need === 'preview' && !args.hasPreviewRows) return { enabled: false, reason: 'Preview the source before estimating.' };
    if (need === 'included' && args.includedCount <= 0) return { enabled: false, reason: 'Select at least one image to process.' };
    return { enabled: true };
  };
  return {
    preview: blocked('source'),
    estimate: args.hasPreviewRows ? blocked('included') : blocked('preview'),
    process: args.hasPreviewRows ? blocked('included') : blocked('preview')
  };
}
